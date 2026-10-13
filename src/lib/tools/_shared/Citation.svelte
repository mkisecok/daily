<!--
	@component
	A legal citation set in mono: "Art. 35 Abs. 3 lit. a DSGVO". Later links
	into the Normen-Navigator.
-->
<script lang="ts">
	import { cite } from '../i18n.js';
	import type { LegalBasis } from '../types.js';

	let { basis }: { basis: LegalBasis } = $props();
</script>

<cite class="citation">{cite(basis)}</cite>

<style>
	.citation {
		font-family: var(--mono);
		font-style: normal;
		font-size: 12px;
		letter-spacing: 0.02em;
		color: var(--ink3);
		white-space: nowrap;
	}
</style>
