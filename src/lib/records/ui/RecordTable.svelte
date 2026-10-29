<!--
	@component
	The register as a table: title, the definition's list columns, status and
	last change. The title links to the record; with `onsort`, the column
	headers sort the list.
-->
<script lang="ts">
	import type { RoutePath } from '#lib/i18n/links.js';
	import { resolve } from '$app/paths';
	import { formatShortDate } from '#lib/i18n/date.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { m } from '#lib/paraglide/messages.js';
	import { text } from '#lib/tools/i18n.js';
	import { formatValue, stateLabel, type Titles } from '../format.js';
	import type { RecordToolDefinition, StoredRecord } from '../types.js';
	import { allFields } from '../validate.js';

	let {
		definition,
		records,
		hrefFor,
		titles = {},
		caption,
		sort,
		descending = false,
		onsort
	}: {
		definition: RecordToolDefinition;
		records: StoredRecord[];
		/** titles of referenced records by id */
		titles?: Titles;
		/** route path (e.g. from `localized()`); resolved here */
		hrefFor: (record: StoredRecord) => RoutePath;
		/** names the table for screen readers */
		caption?: string;
		/** the key the list is sorted by: `title`, a column id, `state` or `updated` */
		sort?: string;
		descending?: boolean;
		onsort?: (key: string) => void;
	} = $props();

	const locale = getLocale();
	const columns = $derived(
		allFields(definition).filter((f) => f.listColumn && f.id !== definition.titleField)
	);
	const titleLabel = $derived(
		allFields(definition).find((f) => f.id === definition.titleField)?.label
	);

	function ariaSort(key: string) {
		if (sort !== key) return undefined;
		return descending ? 'descending' : 'ascending';
	}
</script>

{#snippet heading(key: string, label: string)}
	{#if onsort}
		<button
			type="button"
			class="sort"
			aria-label={m.records_sort_by({ column: label })}
			onclick={() => onsort(key)}
			>{label}<span class="arrow" aria-hidden="true"
				>{sort === key ? (descending ? '↓' : '↑') : ''}</span
			></button
		>
	{:else}
		{label}
	{/if}
{/snippet}

<div class="rows">
	<table>
		{#if caption}<caption class="visually-hidden">{caption}</caption>{/if}
		<thead>
			<tr>
				<th scope="col" aria-sort={ariaSort('title')}
					>{@render heading('title', titleLabel ? text(titleLabel) : '')}</th
				>
				{#each columns as column (column.id)}
					<th scope="col" aria-sort={ariaSort(column.id)}
						>{@render heading(column.id, text(column.label))}</th
					>
				{/each}
				{#if definition.workflow}
					<th scope="col" aria-sort={ariaSort('state')}
						>{@render heading('state', m.records_state())}</th
					>
				{/if}
				<th scope="col" class="date" aria-sort={ariaSort('updated')}
					>{@render heading('updated', m.records_updated())}</th
				>
			</tr>
		</thead>
		<tbody>
			{#each records as record (record.id)}
				<tr>
					<th scope="row"><a href={resolve(hrefFor(record))}>{record.title}</a></th>
					{#each columns as column (column.id)}
						<td data-label={text(column.label)}
							>{formatValue(column, record.data[column.id], locale, titles) || '—'}</td
						>
					{/each}
					{#if definition.workflow}
						<td data-label={m.records_state()}
							><span class="badge navy">{stateLabel(definition, record.state, locale)}</span></td
						>
					{/if}
					<td class="date" data-label={m.records_updated()}
						>{formatShortDate(record.updatedAt, locale)}</td
					>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	/* a raised list of rows; on phones each row stacks with the field names */
	.rows {
		margin-top: 1.5rem;
		overflow-x: auto;
		background: var(--sheet);
		border: 1px solid var(--rule2);
		border-radius: var(--radius-card);
		box-shadow: var(--shadow-raised);

		& table {
			width: 100%;
			border-collapse: collapse;
			font-size: 14px;
		}

		& .visually-hidden {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}

		& th,
		& td {
			padding: 0.85rem 1rem;
			text-align: left;
			vertical-align: middle;
		}

		& thead th {
			padding-top: 0.65rem;
			padding-bottom: 0.65rem;
			font-family: var(--mono);
			font-size: 11px;
			font-weight: 500;
			letter-spacing: 0.1em;
			text-transform: uppercase;
			white-space: nowrap;
			color: var(--ink3);
			background: var(--paper);
			border-bottom: 1px solid var(--rule2);

			/* the header text itself is the sort control */
			& .sort {
				all: unset;
				cursor: pointer;
				display: inline-flex;
				gap: 0.3em;
				align-items: center;

				&:hover {
					color: var(--ink);
				}

				&:focus-visible {
					outline: 2px solid var(--navy);
					outline-offset: 2px;
				}
			}

			& .arrow {
				min-width: 0.7em;
			}
		}

		& tbody tr {
			border-bottom: 1px solid var(--rule2);
			transition: background-color 0.12s ease;

			&:last-child {
				border-bottom: 0;
			}

			&:hover {
				background: var(--navy-soft);
			}
		}

		& tbody th {
			font-size: 15px;
			font-weight: 600;

			& a {
				color: var(--ink);
			}
		}

		& td {
			color: var(--ink2);
		}

		& .date {
			font-family: var(--mono);
			font-size: 12px;
			white-space: nowrap;
			color: var(--ink3);
		}

		@media (max-width: 40rem) {
			& thead {
				position: absolute;
				width: 1px;
				height: 1px;
				overflow: hidden;
				clip-path: inset(50%);
			}

			& tbody tr {
				display: grid;
				gap: 0.25rem;
				padding: 0.85rem 1rem;
			}

			& tbody th,
			& td {
				display: block;
				padding: 0;
			}

			& td::before {
				content: attr(data-label) ': ';
				font-family: var(--sans);
				color: var(--ink3);
			}
		}
	}
</style>
