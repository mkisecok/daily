<!--
	@component
	The reply to an access request on paper, in the four stages of Art. 15
	DSGVO: whether data is processed, the data itself, the details of
	paragraph 1 lit. a to h and paragraph 2, and the copy; then lines to sign.
-->
<script lang="ts">
	import { getLocale } from '#lib/paraglide/runtime.js';
	import PrintParts from '#lib/print/PrintParts.svelte';
	import type { EntryPrintProps } from '#lib/tools/prints.js';
	import { accessParts } from './print.js';

	let { record }: EntryPrintProps = $props();
</script>

<PrintParts parts={accessParts(record.data, getLocale())} />
