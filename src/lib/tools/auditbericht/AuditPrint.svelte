<!--
	@component
	The audit report on paper in the order of ISO 19011, 6.5.1: objective,
	scope and criteria, team, conclusion, findings (the most serious first),
	checklists, strengths and recommendations, then lines to sign. The audit
	and its findings and checklists come composed from the report's audit.
-->
<script lang="ts">
	import { getLocale } from '#lib/paraglide/runtime.js';
	import PrintParts from '#lib/print/PrintParts.svelte';
	import type { EntryPrintProps } from '#lib/tools/prints.js';
	import { auditParts } from './print.js';

	let { record, composed = [] }: EntryPrintProps = $props();
</script>

<PrintParts parts={auditParts(record, composed, getLocale())} />
