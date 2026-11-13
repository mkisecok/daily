<!--
	@component
	A document that follows a form part by part, on paper only: one table per
	part with the letter, the question and the answer, the same columns in
	every part, "fehlt" for an empty answer, room to write where a line is to
	be filled in, and lines to sign at the end. Used by the breach
	notification and the AI incident report.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { PrintPart } from './parts.js';

	let { parts }: { parts: PrintPart[] } = $props();
</script>

<section class="print-body print-only print-parts">
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
	.print-parts {
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
