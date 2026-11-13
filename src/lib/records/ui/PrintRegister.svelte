<!--
	@component
	The whole register on paper, as a Registerauszug: the document head, an
	overview table of every entry (number, name, the list columns, state,
	last change), then one Vorgangsblatt per entry on its own page. Hidden on
	screen.
-->
<script lang="ts">
	import { formatShortDate } from '#lib/i18n/date.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { printMeta } from '#lib/print/meta.js';
	import { text } from '#lib/tools/i18n.js';
	import type { ToolManifest } from '#lib/tools/types.js';
	import PrintDocument from '#lib/ui/PrintDocument.svelte';
	import { formatValue, stateLabel, type Titles } from '../format.js';
	import type { RecordEngine, RecordToolDefinition, StoredRecord } from '../types.js';
	import { allFields } from '../validate.js';
	import PrintEntry from './PrintEntry.svelte';

	let {
		definition,
		tool,
		records,
		engine = undefined,
		organisation = null,
		titles = {}
	}: {
		definition: RecordToolDefinition;
		tool: ToolManifest;
		records: StoredRecord[];
		/** to show each entry's result on its sheet */
		engine?: RecordEngine;
		/** whose register this is (Art. 30(1)(a)); unknown in the preview */
		organisation?: string | null;
		/** titles of referenced records by id */
		titles?: Titles;
	} = $props();

	const locale = getLocale();
	const columns = $derived(
		allFields(definition).filter((f) => f.listColumn && f.id !== definition.titleField)
	);
</script>

<div class="print-only print-register">
	<PrintDocument
		kind={m.print_kind_register()}
		title={text(tool.name)}
		rows={[
			...printMeta(tool, { version: definition.version, organisation }),
			{ label: m.print_count(), value: String(records.length) }
		]}
	/>

	<table class="print-table overview">
		<thead>
			<tr>
				<th class="number">{m.print_number()}</th>
				<th>{m.print_name()}</th>
				{#each columns as column (column.id)}<th>{text(column.label)}</th>{/each}
				{#if definition.workflow}<th>{m.records_state()}</th>{/if}
				<th class="changed">{m.print_changed()}</th>
			</tr>
		</thead>
		<tbody>
			{#each records as record, index (record.id)}
				<tr>
					<td class="number">{index + 1}</td>
					<td>{record.title}</td>
					{#each columns as column (column.id)}
						<td>{formatValue(column, record.data[column.id], locale, titles) || '—'}</td>
					{/each}
					{#if definition.workflow}<td>{stateLabel(definition, record.state, locale)}</td>{/if}
					<td class="changed">{formatShortDate(record.updatedAt, locale)}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	{#each records as record, index (record.id)}
		<div class="sheet">
			<PrintEntry
				{definition}
				{record}
				assessment={engine?.assess?.(record) ?? null}
				{titles}
				heading={`${index + 1}. ${record.title}`}
			/>
		</div>
	{/each}
</div>

<style>
	.overview {
		font-size: 9pt;

		& .changed {
			width: 22mm;
			white-space: nowrap;
		}
	}

	/* one Vorgangsblatt per entry, each on its own page */
	.sheet {
		break-before: page;
	}
</style>
