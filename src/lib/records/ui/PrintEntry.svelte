<!--
	@component
	The body of a printed Vorgangsblatt, shown only on paper below the
	PrintDocument head: the state in words, the entry's result, its fields
	per section as a table with their legal basis, open checklist points
	with a box to tick, other empty fields named in one line, deadlines with their dates, linked entries and the history.
-->
<script lang="ts">
	import { formatShortDate } from '#lib/i18n/date.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { printSections } from '#lib/print/entry.js';
	import { cite, text } from '#lib/tools/i18n.js';
	import PrintResult from '#lib/tools/_shared/PrintResult.svelte';
	import type { QuestionnaireResult } from '#lib/tools/types.js';
	import { stateLabel, type Titles } from '../format.js';
	import type { Backlinks } from '../links.js';
	import type { Deadline, RecordEvent, RecordToolDefinition, StoredRecord } from '../types.js';
	import { fieldById } from '../validate.js';

	let {
		definition,
		record,
		assessment = null,
		deadlines = [],
		events = [],
		backlinks = [],
		titles = {},
		heading = undefined
	}: {
		definition: RecordToolDefinition;
		record: StoredRecord;
		assessment?: QuestionnaireResult | null;
		deadlines?: Deadline[];
		events?: RecordEvent[];
		backlinks?: Backlinks;
		titles?: Titles;
		/** the entry's own title, when several entries share one document head */
		heading?: string;
	} = $props();

	const locale = getLocale();
	const date = (iso: string) => formatShortDate(iso, locale);
	const sections = $derived(printSections(definition, record, locale, titles));

	const step = $derived.by(() => {
		const states = definition.workflow?.states ?? [];
		const index = states.findIndex((s) => s.id === record.state);
		return { index: index + 1, total: states.length };
	});

	const KIND: Record<RecordEvent['kind'], () => string> = {
		created: m.records_event_created,
		updated: m.records_event_updated,
		transition: m.records_event_transition,
		assessment: m.records_event_assessment,
		archived: m.records_event_archived,
		restored: m.records_event_restored
	};

	/** what an event did, in one line: the new state, or the fields it changed */
	function what(event: RecordEvent): string {
		if (event.kind === 'transition') {
			return `${KIND.transition()}: ${stateLabel(definition, event.toState, locale)}`;
		}
		const changed =
			event.kind === 'created' || !event.changes
				? []
				: Object.keys(event.changes).flatMap((id) => {
						const field = fieldById(definition, id);
						return field ? [text(field.label)] : [];
					});
		return changed.length > 0 ? `${KIND[event.kind]()}: ${changed.join(', ')}` : KIND[event.kind]();
	}
</script>

<section class="print-body print-only">
	{#if heading}<h2 class="heading">{heading}</h2>{/if}
	{#if definition.workflow}
		<p class="state">
			<strong>{m.records_state()}:</strong>
			{m.print_state_step({
				state: stateLabel(definition, record.state, locale),
				step: String(step.index),
				total: String(step.total)
			})}
		</p>
	{/if}

	{#if assessment}<PrintResult result={assessment} />{/if}

	<h2>{m.print_fields()}</h2>
	{#each sections as section (section.id)}
		<h3>{section.title}</h3>
		{#if section.rows.length > 0}
			<table class="print-table">
				<tbody>
					{#each section.rows as row (row.id)}
						<tr>
							<th scope="row" class="label">{row.label}</th>
							<td>{row.value}</td>
							<td class="basis">{row.basis}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
		{#if section.open.length > 0}
			<p class="open">{m.print_open()}</p>
			<ul class="print-checklist">
				{#each section.open as point (point)}<li>{point}</li>{/each}
			</ul>
		{/if}
		{#if section.empty.length > 0}
			<p class="empty">{m.print_empty({ fields: section.empty.join(', ') })}</p>
		{/if}
	{/each}

	{#if deadlines.length > 0}
		<h2>{m.deadlines_title()}</h2>
		<table class="print-table">
			<thead>
				<tr>
					<th class="due">{m.print_due()}</th>
					<th>{m.print_deadline()}</th>
					<th class="basis">{m.print_basis()}</th>
				</tr>
			</thead>
			<tbody>
				{#each deadlines as deadline (deadline.kind)}
					<tr>
						<td class="due">{date(deadline.dueAt)}</td>
						<td>{text(deadline.label)}</td>
						<td class="basis">{deadline.cite ? cite(deadline.cite) : ''}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}

	{#if backlinks.length > 0}
		<h2>{m.records_links()}</h2>
		<ul class="linked">
			{#each backlinks as group (group.tool.manifest.slug)}
				{#each group.records as linked (linked.id)}
					<li>
						{text(group.tool.manifest.name)}: {linked.title}{#if group.tool.definition.workflow}
							({stateLabel(group.tool.definition, linked.state, locale)}){/if}
					</li>
				{/each}
			{/each}
		</ul>
	{/if}

	{#if events.length > 0}
		<h2>{m.records_history()}</h2>
		<table class="print-table">
			<tbody>
				{#each events as event (event.id)}
					<tr>
						<td class="due">{date(event.at)}</td>
						<td
							>{what(event)}{#if event.author}, {event.author}{/if}</td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</section>

<style>
	.heading {
		margin-top: 0;
		font-size: 15pt;
	}

	.state {
		margin: 0;
	}

	.label {
		width: 52mm;
		font-weight: 600;
	}

	.due {
		width: 24mm;
		white-space: nowrap;
	}

	.open {
		margin: 2mm 0 1mm;
		font-size: 8.5pt;
		font-weight: 600;
	}

	.empty {
		margin: 1mm 0 0;
		font-size: 8.5pt;
		font-style: italic;
	}

	.linked {
		margin: 0;
		padding-left: 5mm;
	}
</style>
