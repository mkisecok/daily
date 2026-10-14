<!--
	@component
	Open deadlines, earliest first. Overdue ones in wax red, those due within
	24 hours marked; each links to its record.
-->
<script lang="ts">
	import type { Path } from '$app/types';
	import { resolve } from '$app/paths';
	import { formatShortDate, formatTime } from '#lib/i18n/date.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { m } from '#lib/paraglide/messages.js';
	import Citation from '#lib/tools/_shared/Citation.svelte';
	import { text } from '#lib/tools/i18n.js';
	import { getTool } from '#lib/tools/registry.js';
	import type { Deadline } from '../types.js';

	let {
		deadlines,
		hrefFor,
		now = new Date(),
		showTool = true
	}: {
		deadlines: Deadline[];
		/** Route path (e.g. from `localized()`); resolved here. */
		hrefFor: (deadline: Deadline) => Path;
		now?: Date;
		showTool?: boolean;
	} = $props();

	const locale = getLocale();
	const DAY = 24 * 60 * 60 * 1000;

	function urgency(deadline: Deadline): 'overdue' | 'soon' | undefined {
		const left = Date.parse(deadline.dueAt) - now.getTime();
		return left < 0 ? 'overdue' : left < DAY ? 'soon' : undefined;
	}
</script>

{#if deadlines.length === 0}
	<p class="empty">{m.deadlines_empty()}</p>
{:else}
	<ol class="deadlines">
		{#each deadlines as deadline (deadline.recordId + deadline.kind)}
			{@const level = urgency(deadline)}
			{@const tool = getTool(deadline.toolSlug)}
			<li data-urgency={level}>
				<span class="due">
					<span class="date">{formatShortDate(deadline.dueAt, locale)}</span>
					<span class="time">{formatTime(deadline.dueAt, locale)}</span>
				</span>
				<span class="body">
					{#if level}
						<span class="flag"
							>{level === 'overdue' ? m.deadlines_overdue() : m.deadlines_soon()}</span
						>
					{/if}
					<span class="label">{text(deadline.label)}</span>
					<a href={resolve(hrefFor(deadline))}>{deadline.recordTitle}</a>
					{#if showTool && tool}<span class="tool">{text(tool.name)}</span>{/if}
				</span>
				{#if deadline.cite}<Citation basis={deadline.cite} />{/if}
			</li>
		{/each}
	</ol>
{/if}

<style>
	.empty {
		margin-top: 1rem;
		font-size: 14px;
		color: var(--ink3);
	}

	.deadlines {
		list-style: none;
		margin-top: 0.75rem;

		& li {
			display: grid;
			grid-template-columns: 8rem 1fr auto;
			gap: 0.25rem 1rem;
			align-items: baseline;
			padding: 0.8rem 0;
			border-bottom: 1px solid var(--rule2);

			@media (max-width: 40rem) {
				grid-template-columns: 1fr;
			}
		}

		& li[data-urgency='overdue'] :is(.date, .time, .flag) {
			color: var(--wax);
		}

		& li[data-urgency='soon'] :is(.date, .time, .flag) {
			color: var(--navy);
		}
	}

	.due {
		display: grid;
		font-family: var(--mono);
		font-size: 13px;

		& .time {
			font-size: 12px;
			color: var(--ink3);
		}
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		font-size: 14px;

		& .label {
			font-family: var(--serif);
			font-size: 16px;
		}
	}

	.flag,
	.tool {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink3);
	}
</style>
