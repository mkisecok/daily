<!--
	@component
	A data breach on paper in the order of a notification under Art. 33
	DSGVO, ready to attach: the timing with the end of the 72 hours, the
	letters a to d of Art. 33(3) with the DPO's contact from the
	organisation's details, the communication to data subjects and
	further details, then lines to sign.
-->
<script lang="ts">
	import { getLocale } from '#lib/paraglide/runtime.js';
	import PrintParts from '#lib/print/PrintParts.svelte';
	import type { EntryPrintProps } from '#lib/tools/prints.js';
	import { noticeParts } from './print.js';

	let { record, titles = {}, details = {} }: EntryPrintProps = $props();
</script>

<PrintParts parts={noticeParts(record.data, record.state, getLocale(), titles, details.dsb)} />
