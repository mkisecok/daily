<!--
	@component
	The highlighted text one page at a time: a PDF's own pages, or about a
	printed page of any other text. A pager steps through them, and a strip of
	one box per page shows where findings are (tinted) and where Art. 9 data
	is (wax); a click on a box opens that page. A click on a finding switches
	it off or on. `element` is the text, so a selection in it can be read.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { segmentsOf, type Page } from '../pages.js';
	import { TOKEN_TIER } from '../rules.js';
	import type { Span } from '../types.js';
	import './tiers.css';

	let {
		text,
		spans,
		pages,
		page = $bindable(0),
		element = $bindable(null),
		ontoggle,
		onrange,
		boxing = false,
		pending = null,
		sheet
	}: {
		text: string;
		spans: Span[];
		pages: Page[];
		page?: number;
		element?: HTMLElement | null;
		/** switches a finding off, or on again, by its value */
		ontoggle: (value: string) => void;
		/** a stretch of the text the user selected or boxed */
		onrange?: (start: number, end: number, via: 'selection' | 'box') => void;
		/** a drag draws a box instead of selecting text */
		boxing?: boolean;
		pending?: { start: number; end: number } | null;
		/** draws the page with this index instead of its text */
		sheet?: Snippet<[number]>;
	} = $props();

	/** plain text in words, so a box and a selection can be told apart word by word */
	const words = (value: string, start: number) =>
		[...value.matchAll(/\S+\s*|\s+/g)].map((match) => ({
			text: match[0],
			at: start + match.index
		}));
	const waiting = (at: number, length: number) =>
		pending !== null && at < pending.end && at + length > pending.start;

	/** the box being drawn, relative to the text */
	let box = $state<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

	function startBox(event: PointerEvent & { currentTarget: HTMLElement }) {
		if (!boxing || event.button !== 0) return;
		const frame = event.currentTarget.getBoundingClientRect();
		const x = event.clientX - frame.left;
		const y = event.clientY - frame.top;
		box = { x0: x, y0: y, x1: x, y1: y };
		event.currentTarget.setPointerCapture(event.pointerId);
		event.preventDefault();
	}

	function drawBox(event: PointerEvent & { currentTarget: HTMLElement }) {
		if (!box) return;
		const frame = event.currentTarget.getBoundingClientRect();
		box = { ...box, x1: event.clientX - frame.left, y1: event.clientY - frame.top };
	}

	/** every word the box touches, from the first to the last */
	function endBox(event: PointerEvent & { currentTarget: HTMLElement }) {
		if (!box) return;
		const drawn = box;
		box = null;
		if (Math.abs(drawn.x1 - drawn.x0) < 4 && Math.abs(drawn.y1 - drawn.y0) < 4) return;
		const frame = event.currentTarget.getBoundingClientRect();
		const left = frame.left + Math.min(drawn.x0, drawn.x1);
		const right = frame.left + Math.max(drawn.x0, drawn.x1);
		const top = frame.top + Math.min(drawn.y0, drawn.y1);
		const bottom = frame.top + Math.max(drawn.y0, drawn.y1);
		let start = Infinity;
		let end = -Infinity;
		for (const word of event.currentTarget.querySelectorAll<HTMLElement>('[data-at]')) {
			const hit = [...word.getClientRects()].some(
				(rect) => rect.left < right && rect.right > left && rect.top < bottom && rect.bottom > top
			);
			if (!hit) continue;
			const at = Number(word.dataset.at);
			start = Math.min(start, at);
			end = Math.max(end, at + (word.textContent ?? '').length);
		}
		if (end > start) onrange?.(start, end, 'box');
	}

	/** a text position in the document: the word's start plus the place in it */
	function offsetOf(node: Node, offset: number): number | null {
		const host = (
			node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element)
		)?.closest<HTMLElement>('[data-at]');
		if (!host) return null;
		const at = Number(host.dataset.at);
		return node.nodeType === Node.TEXT_NODE
			? at + offset
			: at + (offset > 0 ? (host.textContent ?? '').length : 0);
	}

	function takeSelection() {
		if (!onrange || boxing || !element) return;
		const selection = document.getSelection();
		if (!selection || selection.isCollapsed || !selection.anchorNode || !selection.focusNode)
			return;
		if (!element.contains(selection.anchorNode) || !element.contains(selection.focusNode)) return;
		const a = offsetOf(selection.anchorNode, selection.anchorOffset);
		const b = offsetOf(selection.focusNode, selection.focusOffset);
		if (a === null || b === null || a === b) return;
		onrange(Math.min(a, b), Math.max(a, b), 'selection');
	}

	const current = $derived(Math.min(page, Math.max(0, pages.length - 1)));
	const segments = $derived(pages[current] ? segmentsOf(text, spans, pages[current]) : []);

	/** per page: how many findings are replaced on it, and whether one is Art. 9 data */
	const stats = $derived(
		pages.map((range) => {
			const on = spans.filter(
				(span) => !span.muted && span.start < range.end && span.end > range.start
			);
			return { count: on.length, art9: on.some((span) => TOKEN_TIER[span.type] === 3) };
		})
	);
</script>

<svelte:document onkeyup={takeSelection} />

<div class="page-view">
	{#if pages.length > 1}
		<nav class="pager" aria-label={m.anon_pages()}>
			<button
				type="button"
				class="button quiet"
				disabled={current === 0}
				onclick={() => (page = current - 1)}>‹ {m.anon_page_prev()}</button
			>
			<span class="where" aria-live="polite"
				>{m.anon_page_of({ n: String(current + 1), total: String(pages.length) })}</span
			>
			<button
				type="button"
				class="button quiet"
				disabled={current === pages.length - 1}
				onclick={() => (page = current + 1)}>{m.anon_page_next()} ›</button
			>
			<span class="count"
				>{stats[current]?.count === 1
					? m.anon_page_findings_one()
					: m.anon_page_findings({ count: String(stats[current]?.count ?? 0) })}</span
			>
		</nav>
	{/if}

	{#if sheet}
		{@render sheet(current)}
	{:else}
		<!-- a box is drawn with the pointer; the keyboard marks by selecting text, read on key up -->
		<p
			class="marked"
			class:boxing
			bind:this={element}
			onpointerdown={startBox}
			onpointermove={drawBox}
			onpointerup={(event) => {
				endBox(event);
				takeSelection();
			}}
		>
			{#each segments as segment, index (index)}
				{#if segment.span}
					<!-- a span, not a button: a button is a box of its own, so a boxed passage would leave the line -->
					<span
						role="button"
						tabindex="0"
						class="anon-mark"
						data-at={onrange ? segment.start : undefined}
						data-pending={waiting(segment.start, segment.text.length) || undefined}
						data-anon-tier={TOKEN_TIER[segment.span.type]}
						aria-pressed={!segment.span.muted}
						title={segment.span.muted ? undefined : segment.span.replacement}
						onclick={() => ontoggle(segment.span!.value)}
						onkeydown={(event) => {
							if (event.key !== 'Enter' && event.key !== ' ') return;
							event.preventDefault();
							ontoggle(segment.span!.value);
						}}>{segment.text}</span
					>
				{:else if onrange}{#each words(segment.text, segment.start) as word (word.at)}<span
							data-at={word.at}
							data-pending={waiting(word.at, word.text.length) || undefined}>{word.text}</span
						>{/each}{:else}{segment.text}{/if}
			{/each}
			{#if box}
				<span
					class="box"
					aria-hidden="true"
					style:left="{Math.min(box.x0, box.x1)}px"
					style:top="{Math.min(box.y0, box.y1)}px"
					style:width="{Math.abs(box.x1 - box.x0)}px"
					style:height="{Math.abs(box.y1 - box.y0)}px"
				></span>
			{/if}
		</p>
	{/if}

	{#if pages.length > 1}
		<ol class="strip" aria-label={m.anon_page_strip()}>
			{#each stats as stat, index (index)}
				<li>
					<button
						type="button"
						class="cell"
						data-found={stat.count > 0 || undefined}
						data-art9={stat.art9 || undefined}
						aria-current={index === current ? 'page' : undefined}
						aria-label={m.anon_page_go({ n: String(index + 1), count: String(stat.count) })}
						onclick={() => (page = index)}>{index + 1}</button
					>
				</li>
			{/each}
		</ol>
	{/if}
</div>

<style>
	.page-view {
		& .pager {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.5rem 0.75rem;
			margin-bottom: 0.75rem;

			& .where {
				font-size: 14px;
				font-weight: 500;
				font-variant-numeric: tabular-nums;
			}

			& .count {
				margin-left: auto;
				font-size: 13px;
				color: var(--ink3);
			}
		}

		& .marked {
			position: relative;
			margin: 0;
			font-size: 14px;
			line-height: 1.9;
			white-space: pre-wrap;
			overflow-wrap: anywhere;

			&.boxing {
				cursor: crosshair;
				user-select: none;
				touch-action: pinch-zoom;
			}

			& [data-pending] {
				background: var(--primary-soft);
				box-shadow: 0 2px 0 var(--primary);
			}

			& .box {
				position: absolute;
				background: color-mix(in srgb, var(--primary) 12%, transparent);
				border: 2px solid var(--primary);
				border-radius: 3px;
				pointer-events: none;
			}
		}

		/* one box per page, wrapping on long documents */
		& .strip {
			display: flex;
			flex-wrap: wrap;
			gap: 4px;
			margin: 1rem 0 0;
			padding: 0;
			list-style: none;

			& .cell {
				display: grid;
				place-items: end center;
				width: 1.6rem;
				height: 2rem;
				padding: 0 0 2px;
				font-family: var(--mono);
				font-size: 10px;
				color: var(--ink3);
				background: var(--sheet);
				border: 1px solid var(--rule2);
				border-radius: 4px;
				cursor: pointer;

				&[data-found] {
					color: var(--navy);
					background: var(--navy-soft);
				}

				&[data-art9] {
					color: var(--wax);
					background: var(--wax-soft);
				}

				&[aria-current='page'] {
					border: 2px solid var(--ink);
				}

				&:focus-visible {
					outline: 2px solid var(--navy);
					outline-offset: 1px;
				}
			}
		}
	}
</style>
