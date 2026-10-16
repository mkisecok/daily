<!--
	@component
	Open deadlines, earliest first, as raised rows. Each row says how far off
	the deadline is (wax when overdue, navy within 24 hours) and links to its
	record. `grouped` splits the rows into overdue, due soon and later under
	headings of the given level.
-->
<script lang="ts">
	import type { RoutePath } from '#lib/i18n/links.js';
	import { resolve } from '$app/paths';
	import { formatShortDate, formatTime } from '#lib/i18n/date.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { m } from '#lib/paraglide/messages.js';
	import Citation from '#lib/tools/_shared/Citation.svelte';
	import { text } from '#lib/tools/i18n.js';
	import { getTool } from '#lib/tools/registry.js';
	import type { Deadline } from '../types.js';

	type Urgency = 'overdue' | 'soon' | 'later';

	let {
		deadlines,
		hrefFor,
		now = new Date(),
		showTool = true,
		grouped = false,
		level = 2
	}: {
		deadlines: Deadline[];
		/** route path (e.g. from `localized()`); resolved here */
		hrefFor: (deadline: Deadline) => RoutePath;
		now?: Date;
		showTool?: boolean;
		/** split into overdue, due soon and later, each under a heading */
		grouped?: boolean;
		/** heading level of the group titles */
		level?: 2 | 3;
	} = $props();

	const locale = getLocale();
	const HOUR = 60 * 60 * 1000;
	const DAY = 24 * HOUR;
	const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

	const titles: Record<Urgency, () => string> = {
		overdue: m.deadlines_overdue,
		soon: m.deadlines_soon,
		later: m.records_ui_deadlines_later
	};
	const badges: Record<Urgency, string> = { overdue: 'wax', soon: 'navy', later: '' };

	function urgency(deadline: Deadline): Urgency {
		const left = Date.parse(deadline.dueAt) - now.getTime();
		return left < 0 ? 'overdue' : left < DAY ? 'soon' : 'later';
	}

	/** how far off the deadline is, e.g. "in 3 Tagen" or "vor 5 Stunden" */
	function distance(deadline: Deadline): string {
		const left = Date.parse(deadline.dueAt) - now.getTime();
		return Math.abs(left) < DAY
			? relative.format(Math.round(left / HOUR), 'hour')
			: relative.format(Math.round(left / DAY), 'day');
	}

	const groups = $derived(
		(['overdue', 'soon', 'later'] as const)
			.map((id) => ({ id, items: deadlines.filter((d) => urgency(d) === id) }))
			.filter((group) => group.items.length > 0)
	);
</script>

{#snippet rows(items: Deadline[])}
	<ol>
		{#each items as deadline (deadline.recordId + deadline.kind)}
			{@const when = urgency(deadline)}
			{@const tool = getTool(deadline.toolSlug)}
			<li data-urgency={when}>
				<span class="due">
					<span class="date">{formatShortDate(deadline.dueAt, locale)}</span>
					<span class="time">{formatTime(deadline.dueAt, locale)}</span>
				</span>
				<span class="body">
					<span class="label">{text(deadline.label)}</span>
					<span class="source">
						<a href={resolve(hrefFor(deadline))}>{deadline.recordTitle}</a>
						{#if showTool && tool}<span class="tool">{text(tool.name)}</span>{/if}
					</span>
				</span>
				<span class="side">
					<span class="badge {badges[when]}">{distance(deadline)}</span>
					{#if deadline.cite}<Citation basis={deadline.cite} />{/if}
				</span>
			</li>
		{/each}
	</ol>
{/snippet}

{#if deadlines.length === 0}
	<p class="empty">{m.deadlines_empty()}</p>
{:else}
	<div class="deadlines">
		{#if grouped}
			{#each groups as group (group.id)}
				<section class="group" data-urgency={group.id}>
					<svelte:element this={`h${level}`} class="group-title">
						{titles[group.id]()} <span class="count">{group.items.length}</span>
					</svelte:element>
					{@render rows(group.items)}
				</section>
			{/each}
		{:else}
			{@render rows(deadlines)}
		{/if}
	</div>
{/if}

<style>
	.empty {
		margin-top: 1rem;
		font-size: 14px;
		color: var(--ink3);
	}

	/* a raised list of rows, one per urgency when grouped */
	.deadlines {
		display: grid;
		gap: 1.5rem;
		margin-top: 1rem;

		& .group-title {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin-bottom: 0.6rem;
			font-family: var(--mono);
			font-size: 11px;
			font-weight: 500;
			letter-spacing: 0.12em;
			text-transform: uppercase;
			color: var(--ink3);

			& .count {
				padding: 0 0.4rem;
				font-size: 11px;
				letter-spacing: normal;
				background: var(--paper);
				border-radius: 999px;
			}
		}

		& .group[data-urgency='overdue'] .group-title {
			color: var(--wax);

			& .count {
				background: var(--wax-soft);
			}
		}

		& .group[data-urgency='soon'] .group-title {
			color: var(--navy);

			& .count {
				background: var(--navy-soft);
			}
		}

		& ol {
			list-style: none;
			background: var(--sheet);
			border: 1px solid var(--rule2);
			border-radius: var(--radius-card);
			box-shadow: var(--shadow-raised);

			@media print {
				box-shadow: none;
			}
		}

		& li {
			display: grid;
			grid-template-columns: 7rem minmax(0, 1fr) auto;
			gap: 0.35rem 1rem;
			align-items: center;
			min-height: 56px;
			padding: 0.8rem 1rem;
			border-bottom: 1px solid var(--rule2);
			transition: background-color 0.12s ease;

			&:last-child {
				border-bottom: 0;
			}

			&:hover {
				background: var(--navy-soft);
			}

			@media (max-width: 40rem) {
				grid-template-columns: minmax(0, 1fr);
				align-items: start;
			}

			& .due {
				display: grid;
				font-family: var(--mono);
				font-size: 13px;

				@media (max-width: 40rem) {
					display: flex;
					gap: 0.5rem;
				}

				& .time {
					font-size: 12px;
					color: var(--ink3);
				}
			}

			& .body {
				display: grid;
				gap: 0.15rem;
				min-width: 0;
				overflow-wrap: anywhere;

				& .label {
					font-size: 15px;
					font-weight: 600;
				}

				& .source {
					display: flex;
					flex-wrap: wrap;
					gap: 0.1rem 0.6rem;
					font-size: 13px;
					color: var(--ink3);
				}
			}

			& .side {
				display: flex;
				flex-wrap: wrap;
				align-items: center;
				justify-content: flex-end;
				gap: 0.4rem 0.75rem;

				@media (max-width: 40rem) {
					justify-content: flex-start;
				}
			}

			&[data-urgency='overdue'] .date {
				color: var(--wax);
			}

			&[data-urgency='soon'] .date {
				color: var(--navy);
			}
		}
	}
</style>
