<!--
	@component
	The record of processing activities on paper, as an authority asks for it
	under Art. 30 DSGVO: the controller's details (lit. a) with lines to fill
	in where Daily does not know them, then one table per processing with
	the letters of Art. 30(1), or of Art. 30(2) for a processor. A letter
	left empty prints as "fehlt". Shown only on paper.
-->
<script lang="ts">
	import { formatShortDate } from '#lib/i18n/date.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { printMeta } from '#lib/print/meta.js';
	import type { RegisterPrintProps } from '#lib/tools/prints.js';
	import { text } from '#lib/tools/i18n.js';
	import PrintDocument from '#lib/ui/PrintDocument.svelte';
	import { art30Rows } from './print.js';

	let { tool, definition, records, organisation = null }: RegisterPrintProps = $props();

	const locale = getLocale();
	/** role, department, contact and last change in one line under the title */
	const meta = (record: RegisterPrintProps['records'][number]) =>
		[
			record.data.rolle === 'auftragsverarbeiter'
				? m.print_vvt_processor()
				: m.print_vvt_controller(),
			record.data.fachbereich,
			record.data.ansprechpartner,
			`${m.print_changed()} ${formatShortDate(record.updatedAt, locale)}`
		]
			.filter((part) => typeof part === 'string' && part !== '')
			.join(' · ');
</script>

<div class="print-only print-body vvt-print">
	<PrintDocument
		kind={m.print_kind_vvt()}
		title={text(tool.name)}
		rows={[
			...printMeta(tool, { version: definition.version, organisation }),
			{ label: m.print_count(), value: String(records.length) }
		]}
	/>

	<h2>{m.print_vvt_controller_details()}</h2>
	<table class="print-table fill">
		<tbody>
			<tr>
				<th scope="row">{m.print_vvt_controller_name()}</th>
				<td>{organisation ?? ''}</td>
			</tr>
			<tr>
				<th scope="row">{m.print_vvt_representative()}</th>
				<td></td>
			</tr>
			<tr>
				<th scope="row">{m.print_vvt_dpo()}</th>
				<td></td>
			</tr>
		</tbody>
	</table>

	{#each records as record, index (record.id)}
		<section class="processing">
			<h2>{index + 1}. {record.title}</h2>
			<p class="meta">{meta(record)}</p>
			<table class="print-table">
				<tbody>
					{#each art30Rows(record.data, locale) as row, rowIndex (rowIndex)}
						<tr>
							<td class="letter">{row.letter ? `${row.letter})` : ''}</td>
							<th scope="row">{row.label}</th>
							<td class="value">
								{#if row.value}{row.value}{:else}<em>{m.print_missing()}</em>{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/each}
</div>

<style>
	.vvt-print {
		& .fill {
			& th {
				width: 70mm;
				font-weight: 600;
			}

			/* room to write by hand */
			& td {
				height: 9mm;
			}
		}

		& .processing {
			margin-top: 8mm;

			& h2 {
				margin-bottom: 1mm;
			}

			& .meta {
				margin: 0 0 2mm;
				font-size: 8.5pt;
			}

			& .letter {
				width: 6mm;
				font-family: var(--mono);
			}

			& th {
				width: 58mm;
				font-weight: 600;
			}

			& .value {
				white-space: pre-line;
			}
		}
	}
</style>
