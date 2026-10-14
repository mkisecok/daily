<!--
	@component
	The whole register on paper: one block per record with every field, so
	the printout can serve as documentation (e.g. towards the authority).
	Hidden on screen.
-->
<script lang="ts">
	import { formatLongDate } from '#lib/i18n/date.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { m } from '#lib/paraglide/messages.js';
	import { cite, text } from '#lib/tools/i18n.js';
	import type { Localized } from '#lib/tools/types.js';
	import { formatValue, stateLabel, type Titles } from '../format.js';
	import type { RecordToolDefinition, StoredRecord } from '../types.js';

	let {
		definition,
		records,
		title,
		organisation = null,
		titles = {},
		now = new Date()
	}: {
		definition: RecordToolDefinition;
		records: StoredRecord[];
		title: Localized;
		/** Whose register this is (Art. 30(1)(a)); unknown in the preview. */
		organisation?: string | null;
		/** Titles of referenced records by id. */
		titles?: Titles;
		now?: Date;
	} = $props();

	const locale = getLocale();
</script>

<div class="print-only print-register">
	<h1>{text(title)}</h1>
	{#if organisation}<p class="organisation">
			{m.records_print_organisation({ name: organisation })}
		</p>{/if}
	<p class="meta">
		{formatLongDate(now.toISOString(), locale)} · {m.records_count({ count: records.length })}
	</p>

	{#each records as record, index (record.id)}
		<section class="record">
			<h2>{index + 1}. {record.title}</h2>
			<dl>
				{#if definition.workflow}
					<dt>{m.records_state()}</dt>
					<dd>{stateLabel(definition, record.state, locale)}</dd>
				{/if}
				{#each definition.sections as section (section.id)}
					{#each section.fields as field (field.id)}
						<dt>
							{text(field.label)}{#if field.cite}<span class="cite">
									({cite(field.cite)})</span
								>{/if}
						</dt>
						<dd>{formatValue(field, record.data[field.id], locale, titles) || '—'}</dd>
					{/each}
				{/each}
			</dl>
		</section>
	{/each}
</div>

<style>
	.print-register {
		& h1 {
			font-size: 18pt;
		}

		& .organisation {
			margin-top: 2mm;
			font-size: 11pt;
		}

		& .cite {
			font-size: 8pt;
		}

		& .meta {
			margin-bottom: 8mm;
			font-size: 9pt;
		}

		& .record {
			break-inside: avoid;
			padding: 4mm 0;
			border-top: 1px solid #000;
		}

		& h2 {
			font-size: 12pt;
			margin-bottom: 2mm;
		}

		& dl {
			display: grid;
			grid-template-columns: 55mm 1fr;
			gap: 1mm 5mm;
			font-size: 9.5pt;
		}

		& dt {
			color: #444;
		}

		& dd {
			white-space: pre-line;
		}
	}
</style>
