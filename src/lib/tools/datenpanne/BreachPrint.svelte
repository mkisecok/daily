<!--
	@component
	A data breach on paper in the order of a notification under Art. 33
	DSGVO, ready to attach: the timing with the end of the 72 hours, the
	letters a to d of Art. 33(3), the communication to data subjects and
	further details, then lines to sign. An empty answer prints as "fehlt";
	the data protection officer's details are a line to fill in.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { EntryPrintProps } from '#lib/tools/prints.js';
	import { noticeParts } from './print.js';

	let { record, titles = {} }: EntryPrintProps = $props();

	const parts = $derived(noticeParts(record.data, record.state, getLocale(), titles));
</script>

<section class="print-body print-only breach-print">
	{#each parts as part (part.id)}
		<h2>{part.title}</h2>
		<table class="print-table">
			<tbody>
				{#each part.rows as row, index (index)}
					<tr>
						<td class="letter">{row.letter ? `${row.letter})` : ''}</td>
						<th scope="row">{row.label}</th>
						<td class="value" class:fill={row.fill}>
							{#if row.value}{row.value}{:else if !row.fill}<em>{m.print_missing()}</em>{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/each}

	<div class="signature">
		<div class="line">{m.print_sign_place()}</div>
		<div class="line">{m.print_sign_name()}</div>
	</div>
</section>

<style>
	.breach-print {
		/* the same columns in every part, so the answers line up down the page */
		& table {
			table-layout: fixed;
		}

		& .letter {
			width: 6mm;
			font-family: var(--mono);
		}

		& th {
			width: 62mm;
			font-weight: 600;
		}

		& .value {
			white-space: pre-line;

			/* room to write by hand */
			&.fill {
				height: 12mm;
			}
		}

		& .signature {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 12mm;
			margin-top: 16mm;
			break-inside: avoid;

			& .line {
				padding-top: 1.5mm;
				font-size: 8.5pt;
				border-top: 0.5pt solid #000;
			}
		}
	}
</style>
