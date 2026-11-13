<!--
	@component
	"Heute" on the start page: what is overdue or due this week, the open
	cases (requests, breaches, findings) with the deadline that presses most,
	and a quick start for the tasks that come up most. Loads from the record
	store in the browser, so it shows in the preview and when signed in.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { distance } from '#lib/records/distance.js';
	import { stateLabel } from '#lib/records/format.js';
	import { getStore } from '#lib/records/store/index.js';
	import type { Deadline } from '#lib/records/types.js';
	import DeadlineList from '#lib/records/ui/DeadlineList.svelte';
	import { text } from '#lib/tools/i18n.js';
	import { toolIcon } from '#lib/tools/icons.js';
	import { getRecordTool, getTool } from '#lib/tools/registry.js';
	import Icon from '#lib/ui/Icon.svelte';
	import { CASE_TOOLS, QUICK_START, dueNow, openCases, sortCases, type OpenCase } from './today.js';

	const locale = getLocale();
	const now = new Date();

	let loaded = $state(false);
	let deadlines = $state<Deadline[]>([]);
	let cases = $state<OpenCase[]>([]);

	onMount(() => {
		(async () => {
			const store = getStore();
			const all = await store.deadlines();
			const lists = await Promise.all(
				CASE_TOOLS.map(async (slug) => {
					const tool = getRecordTool(slug);
					return tool ? openCases(tool.definition, await store.list(slug)) : [];
				})
			);
			deadlines = all;
			cases = sortCases(lists.flat(), all);
			loaded = true;
		})();
	});

	const due = $derived(dueNow(deadlines, now));
	const pressing = $derived([...due.overdue, ...due.soon]);
	const recordPath = (slug: string, id: string) =>
		localized(`/werkzeuge/${slug}/eintraege?eintrag=${id}`);
	const toolName = (slug: string) => {
		const tool = getTool(slug);
		return tool ? text(tool.name) : slug;
	};
	const stateOf = (item: OpenCase) => {
		const tool = getRecordTool(item.record.toolSlug);
		return tool ? stateLabel(tool.definition, item.record.state, locale) : '';
	};
</script>

<section class="today" aria-labelledby="today-title">
	<h2 id="today-title">{m.today_title()}</h2>

	<div class="columns">
		<section class="block" aria-labelledby="today-due">
			<h3 id="today-due"><Icon name="clock" size={18} />{m.today_due()}</h3>
			{#if !loaded}
				<p class="quiet">{m.today_loading()}</p>
			{:else if pressing.length === 0}
				<p class="quiet">{m.today_due_none()}</p>
			{:else}
				<DeadlineList
					deadlines={pressing}
					{now}
					hrefFor={(d) => recordPath(d.toolSlug, d.recordId)}
				/>
			{/if}
			{#if loaded && due.later > 0}
				<p class="more">
					<a href={resolve(localized('/fristen'))}>{m.today_due_later({ count: due.later })} →</a>
				</p>
			{/if}
		</section>

		<section class="card block" aria-labelledby="today-cases">
			<h3 id="today-cases"><Icon name="list-details" size={18} />{m.today_cases()}</h3>
			{#if !loaded}
				<p class="quiet">{m.today_loading()}</p>
			{:else if cases.length === 0}
				<p class="quiet">{m.today_cases_none()}</p>
			{:else}
				<ul class="cases">
					{#each cases.slice(0, 8) as item (item.record.id)}
						<li>
							<a href={resolve(recordPath(item.record.toolSlug, item.record.id))}
								>{item.record.title}</a
							>
							<span class="meta">
								<span>{toolName(item.record.toolSlug)} · {stateOf(item)}</span>
								{#if item.due}<strong>{distance(item.due, now, locale)}</strong>{/if}
							</span>
						</li>
					{/each}
				</ul>
				{#if cases.length > 8}
					<p class="more">{m.today_cases_more({ count: cases.length - 8 })}</p>
				{/if}
			{/if}
		</section>
	</div>

	<nav class="quick" aria-label={m.today_quick()}>
		<h3>{m.today_quick()}</h3>
		<ul>
			{#each QUICK_START as slug (slug)}
				<li>
					<a class="button quiet" href={resolve(localized(`/werkzeuge/${slug}/eintraege?neu=1`))}>
						<Icon name={toolIcon(slug)} size={16} />{toolName(slug)}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</section>

<style>
	.today {
		margin-bottom: 2.5rem;

		& h2 {
			margin-bottom: 0.9rem;
			font-size: 22px;
		}

		/* the deadline list is a raised sheet itself and needs the full width */
		& .columns {
			display: grid;
			gap: 1.25rem;
		}

		& .block {
			&.card {
				padding: 1.1rem 1.25rem 1.25rem;
			}

			& h3 {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				margin-bottom: 0.75rem;
				font-family: var(--sans);
				font-size: 15px;
				font-weight: 600;
			}
		}

		& .quiet {
			font-size: 14px;
			color: var(--ink2);
		}

		& .more {
			margin-top: 0.75rem;
			font-size: 14px;
			color: var(--ink2);
		}

		& .cases {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
			gap: 0.65rem 1.5rem;
			list-style: none;

			& li {
				display: grid;
				gap: 0.1rem;
			}

			& .meta {
				display: flex;
				flex-wrap: wrap;
				gap: 0 0.6rem;
				font-size: 13px;
				color: var(--ink2);
			}
		}

		& .quick {
			margin-top: 1.25rem;

			& h3 {
				margin-bottom: 0.6rem;
				font-family: var(--sans);
				font-size: 13px;
				font-weight: 600;
				letter-spacing: 0.02em;
				color: var(--ink3);
			}

			& ul {
				display: flex;
				flex-wrap: wrap;
				gap: 0.5rem;
				list-style: none;
			}

			& a {
				display: inline-flex;
				align-items: center;
				gap: 0.45rem;
			}
		}
	}
</style>
