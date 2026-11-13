<!--
	@component
	The head of a printed document, shown only on paper: the Daily name, the
	kind of document ("Prüfbericht", "Vorgangsblatt"), its title and a meta
	table with tool, version, Rechtsstand, date and organisation. Its
	presence also hides the web page header on paper (see print.css). Page
	numbers come from the `@page` rules in print.css.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { PrintRow } from '#lib/print/meta.js';

	let { kind, title, rows }: { kind: string; title: string; rows: PrintRow[] } = $props();
</script>

<header class="print-document print-only" data-print-frame>
	<p class="brand">Daily <span class="kind">· {kind}</span></p>
	<h1>{title}</h1>
	<dl class="meta">
		{#each rows as row (row.label)}
			<div class="row">
				<dt>{row.label}</dt>
				<dd>{row.value}</dd>
			</div>
		{/each}
	</dl>
	<p class="disclaimer">{m.footer_disclaimer()}</p>
</header>

<style>
	.print-document {
		margin-bottom: 8mm;
		padding-bottom: 4mm;
		border-bottom: 0.5pt solid #000;

		& .brand {
			margin: 0;
			font-family: var(--serif);
			font-size: 10pt;
			font-weight: 700;
			letter-spacing: 0.04em;

			& .kind {
				font-weight: 400;
				letter-spacing: 0;
			}
		}

		& h1 {
			margin: 2mm 0 4mm;
			font-family: var(--serif);
			font-size: 18pt;
			line-height: 1.2;
		}

		& .meta {
			display: grid;
			grid-template-columns: max-content 1fr;
			gap: 1mm 6mm;
			margin: 0;
			font-size: 9pt;

			/* each row lays its term and value into the two columns */
			& .row {
				display: contents;
			}

			& dt {
				font-weight: 600;
			}

			& dd {
				margin: 0;
			}
		}

		& .disclaimer {
			margin: 3mm 0 0;
			font-size: 8pt;
			font-style: italic;
		}
	}
</style>
