<!--
	@component
	The highlighted text one page at a time: a PDF's own pages, or about a
	printed page of any other text. A pager steps through them, and a strip of
	one box per page shows where findings are (tinted) and where Art. 9 data
	is (wax); a click on a box opens that page. A click on a finding switches
	it off or on. `element` is the text, so a selection in it can be read.
-->
<script lang="ts">
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
		ontoggle
	}: {
		text: string;
		spans: Span[];
		pages: Page[];
		page?: number;
		element?: HTMLElement | null;
		/** switches a finding off, or on again, by its value */
		ontoggle: (value: string) => void;
	} = $props();

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

	<p class="marked" bind:this={element}>
		{#each segments as segment, index (index)}
			{#if segment.span}
				<button
					type="button"
					class="anon-mark"
					data-anon-tier={TOKEN_TIER[segment.span.type]}
					aria-pressed={!segment.span.muted}
					title={segment.span.muted ? undefined : segment.span.replacement}
					onclick={() => ontoggle(segment.span!.value)}>{segment.text}</button
				>
			{:else}{segment.text}{/if}
		{/each}
	</p>

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
			margin: 0;
			font-size: 14px;
			line-height: 1.9;
			white-space: pre-wrap;
			overflow-wrap: anywhere;
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
