<!--
	@component
	The DSFA on paper as a report in the order of Art. 35 Abs. 7 DSGVO and DSK
	Kurzpapier Nr. 5: subject, description, necessity, risks, measures, who
	was heard and the outcome, then lines to sign. The risk picture of the
	dashboard follows on its own landscape page.
-->
<script lang="ts">
	import { getLocale } from '#lib/paraglide/runtime.js';
	import PrintParts from '#lib/print/PrintParts.svelte';
	import type { EntryPrintProps } from '#lib/tools/prints.js';
	import { dsfaParts } from './print.js';

	let { record, titles = {} }: EntryPrintProps = $props();
</script>

<PrintParts parts={dsfaParts(record, getLocale(), titles)} />
