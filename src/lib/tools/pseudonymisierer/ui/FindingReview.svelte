<!--
	@component
	Findings one at a time, for checking a long document quickly: the finding
	in its sentence, its page, kind and placeholder, a switch to send it in the
	clear or replace it again, and previous and next (also the keys J and K
	outside a field). A map under it marks where every finding sits in the
	text; a click on a mark goes there. Moving on also moves `page`.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { contextOf, pageAt, type Page } from '../pages.js';
	import { TOKEN_TIER } from '../rules.js';
	import type { Span, TokenType } from '../types.js';
	import './tiers.css';

	let {
		text,
		spans,
		pages,
		index = $bindable(0),
		onpage,
		typeLabel,
		ontoggle
	}: {
		text: string;
		spans: Span[];
		pages: Page[];
		index?: number;
		/** the page of the finding now shown, so the page view opens there */
		onpage?: (page: number) => void;
		typeLabel: (type: TokenType) => string;
		/** switches a finding off, or on again, by its value */
		ontoggle: (value: string) => void;
	} = $props();

	const current = $derived(Math.min(index, Math.max(0, spans.length - 1)));
	const span = $derived(spans[current]);
	const context = $derived(
		span ? contextOf(text, span, 90, pages[pageAt(pages, span.start)]) : null
	);
	const times = $derived(span ? spans.filter((other) => other.value === span.value).length : 0);

	function go(next: number) {
		if (spans.length === 0) return;
		index = Math.max(0, Math.min(spans.length - 1, next));
		onpage?.(pageAt(pages, spans[index]!.start));
	}

	/** J and K step through the findings, unless the user is typing */
	function keys(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null;
		if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		if (event.key === 'j') go(current + 1);
		else if (event.key === 'k') go(current - 1);
	}
</script>

<svelte:window onkeydown={keys} />

<div class="finding-review">
	{#if span && context}
		<div class="head">
			<span class="where" aria-live="polite"
				>{m.anon_review_of({ n: String(current + 1), total: String(spans.length) })} · {m.anon_review_page(
					{ n: String(pageAt(pages, span.start) + 1) }
				)}</span
			>
			<button
				type="button"
				class="button quiet"
				disabled={current === 0}
				onclick={() => go(current - 1)}>‹ {m.anon_review_prev()}</button
			>
			<button
				type="button"
				class="button quiet"
				disabled={current === spans.length - 1}
				onclick={() => go(current + 1)}>{m.anon_review_next()} ›</button
			>
		</div>

		<p class="context">
			{#if context.cutBefore}…{/if}{context.before}<span
				class="anon-mark"
				data-anon-tier={TOKEN_TIER[span.type]}
				aria-pressed={!span.muted}>{span.value}</span
			>{context.after}{#if context.cutAfter}…{/if}
		</p>

		<div class="facts" data-anon-tier={TOKEN_TIER[span.type]}>
			<span class="kind">{typeLabel(span.type)}</span>
			<code class="token">{span.muted ? '—' : span.replacement}</code>
			{#if times > 1}<span class="times">{m.anon_review_count({ count: String(times) })}</span>{/if}
			<button
				type="button"
				class="button"
				class:quiet={!span.muted}
				onclick={() => ontoggle(span.value)}
				>{span.muted ? m.anon_review_replace() : m.anon_review_keep()}</button
			>
		</div>

		<div class="map" role="group" aria-label={m.anon_review_map()}>
			{#each spans as other, at (other.id)}
				<button
					type="button"
					tabindex="-1"
					class="spot"
					data-anon-tier={TOKEN_TIER[other.type]}
					data-muted={other.muted || undefined}
					aria-current={at === current ? 'true' : undefined}
					aria-label={m.anon_review_of({ n: String(at + 1), total: String(spans.length) })}
					style:left="{(other.start / Math.max(1, text.length)) * 100}%"
					onclick={() => go(at)}
				></button>
			{/each}
		</div>
		<p class="hint">{m.anon_review_keys()}</p>
	{:else}
		<p class="hint">{m.anon_review_empty()}</p>
	{/if}
</div>

<style>
	.finding-review {
		& .head {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.5rem 0.75rem;

			& .where {
				margin-right: auto;
				font-size: 14px;
				font-weight: 500;
				font-variant-numeric: tabular-nums;
			}
		}

		& .context {
			margin: 1rem 0;
			max-width: var(--measure);
			font-size: 15px;
			line-height: 1.8;

			& .anon-mark {
				cursor: default;
			}
		}

		& .facts {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.5rem 0.75rem;

			& .kind {
				padding: 0.1rem 0.5rem;
				font-size: 12px;
				font-weight: 500;
				color: var(--tier);
				background: var(--tier-soft);
				border-radius: var(--radius-badge);
			}

			& .token {
				font-family: var(--mono);
				font-size: 12px;
				color: var(--tier);
			}

			& .times {
				font-size: 13px;
				color: var(--ink3);
			}

			& .button {
				margin-left: auto;
			}
		}

		/* where the findings sit, the whole text as one line */
		& .map {
			position: relative;
			height: 14px;
			margin: 1.25rem 0 0.4rem;
			background: var(--paper);
			border: 1px solid var(--rule2);
			border-radius: 7px;

			& .spot {
				position: absolute;
				top: 2px;
				width: 4px;
				height: 8px;
				padding: 0;
				margin-left: -2px;
				background: var(--tier);
				border: 0;
				border-radius: 1px;
				cursor: pointer;

				&[data-muted] {
					opacity: 0.35;
				}

				&[aria-current='true'] {
					top: -3px;
					height: 18px;
					outline: 2px solid var(--sheet);
				}
			}
		}

		& .hint {
			font-size: 13px;
			color: var(--ink3);
		}
	}
</style>
