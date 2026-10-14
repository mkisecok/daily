<!--
	@component
	The register as a table: title, the definition's list columns, status and
	last change. The title links to the record.
-->
<script lang="ts">
	import type { Path } from '$app/types';
	import { resolve } from '$app/paths';
	import { formatShortDate } from '#lib/i18n/date.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { m } from '#lib/paraglide/messages.js';
	import { text } from '#lib/tools/i18n.js';
	import { formatValue, stateLabel } from '../format.js';
	import type { RecordToolDefinition, StoredRecord } from '../types.js';
	import { allFields } from '../validate.js';

	let {
		definition,
		records,
		hrefFor
	}: {
		definition: RecordToolDefinition;
		records: StoredRecord[];
		/** Route path (e.g. from `localized()`); resolved here. */
		hrefFor: (record: StoredRecord) => Path;
	} = $props();

	const locale = getLocale();
	const columns = $derived(
		allFields(definition).filter((f) => f.listColumn && f.id !== definition.titleField)
	);
	const titleLabel = $derived(
		allFields(definition).find((f) => f.id === definition.titleField)?.label
	);
</script>

<div class="scroll">
	<table>
		<thead>
			<tr>
				<th scope="col">{titleLabel ? text(titleLabel) : ''}</th>
				{#each columns as column (column.id)}
					<th scope="col">{text(column.label)}</th>
				{/each}
				{#if definition.workflow}<th scope="col">{m.records_state()}</th>{/if}
				<th scope="col" class="date">{m.records_updated()}</th>
			</tr>
		</thead>
		<tbody>
			{#each records as record (record.id)}
				<tr>
					<th scope="row"><a href={resolve(hrefFor(record))}>{record.title}</a></th>
					{#each columns as column (column.id)}
						<td>{formatValue(column, record.data[column.id], locale) || '—'}</td>
					{/each}
					{#if definition.workflow}
						<td><span class="state">{stateLabel(definition, record.state, locale)}</span></td>
					{/if}
					<td class="date">{formatShortDate(record.updatedAt, locale)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.scroll {
		overflow-x: auto;
		margin-top: 1.5rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
	}

	th,
	td {
		padding: 0.65rem 1rem 0.65rem 0;
		text-align: left;
		vertical-align: baseline;
		border-bottom: 1px solid var(--rule2);
	}

	thead th {
		font-family: var(--mono);
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink3);
		border-bottom: 1px solid var(--ink);
		white-space: nowrap;
	}

	tbody th {
		font-family: var(--serif);
		font-size: 16px;
		font-weight: 400;
	}

	.state {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--navy);
		white-space: nowrap;
	}

	.date {
		white-space: nowrap;
		color: var(--ink2);
	}
</style>
