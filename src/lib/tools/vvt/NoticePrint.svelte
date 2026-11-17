<!--
	@component
	The privacy notice of one processing on paper, in the order of Art. 13
	DSGVO, filled from its VVT entry and the organisation's details; lines to
	fill in where the record holds nothing, no lines to sign.
-->
<script lang="ts">
	import { getLocale } from '#lib/paraglide/runtime.js';
	import PrintParts from '#lib/print/PrintParts.svelte';
	import type { EntryPrintProps } from '#lib/tools/prints.js';
	import { noticeParts } from './notice.js';

	let { record, organisation = null, details = {} }: EntryPrintProps = $props();
</script>

<PrintParts
	parts={noticeParts(record.data, getLocale(), organisation, details)}
	signature={false}
/>
