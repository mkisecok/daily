<!--
	@component
	A legal citation set in mono: "Art. 35 Abs. 3 lit. a DSGVO". Citations of
	laws in the Normen-Navigator link to the provision, in a new tab so a
	half-filled form is not lost.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { citationPath } from '#lib/normen/cite.js';
	import { cite } from '../i18n.js';
	import type { LegalBasis } from '../types.js';

	let { basis }: { basis: LegalBasis } = $props();

	const path = $derived(citationPath(basis));
</script>

{#if path}
	<a
		class="citation-link"
		href={resolve(localized(path))}
		target="_blank"
		rel="noopener"
		title={m.normen_open()}><cite class="citation">{cite(basis)}</cite></a
	>
{:else}
	<cite class="citation">{cite(basis)}</cite>
{/if}

<style>
	.citation {
		font-family: var(--mono);
		font-style: normal;
		font-size: 12px;
		letter-spacing: 0.02em;
		color: var(--ink3);
		white-space: nowrap;
	}

	.citation-link {
		text-decoration: none;

		&:hover .citation {
			color: var(--navy);
			text-decoration: underline;
		}
	}
</style>
