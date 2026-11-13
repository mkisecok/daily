<!--
	@component
	A serious incident on paper as a report under Art. 73 KI-VO: the timing
	with the period that applies, what happened and how it is classified, the
	investigation and corrective action, then lines to sign.
-->
<script lang="ts">
	import { getLocale } from '#lib/paraglide/runtime.js';
	import PrintParts from '#lib/print/PrintParts.svelte';
	import type { EntryPrintProps } from '#lib/tools/prints.js';
	import { incidentParts } from './print.js';

	let { record }: EntryPrintProps = $props();
</script>

<PrintParts parts={incidentParts(record.data, record.state, getLocale())} />
