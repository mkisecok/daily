<script lang="ts">
	import { PUBLIC_PREVIEW } from '$app/env/public';
	import { OPERATOR, PRIVACY_VERSION, operatorMissing } from '#lib/legal/operator.js';
	import PrivacyDe from '#lib/legal/PrivacyDe.svelte';
	import PrivacyEn from '#lib/legal/PrivacyEn.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import PageHeader from '#lib/ui/PageHeader.svelte';

	const Privacy = getLocale() === 'en' ? PrivacyEn : PrivacyDe;
</script>

<svelte:head>
	<title>{m.footer_privacy()} — Daily</title>
</svelte:head>

<PageHeader title={m.footer_privacy()} />

{#if operatorMissing()}
	<p class="missing" role="note">{m.legal_operator_missing()}</p>
{/if}

<article class="legal card">
	<Privacy operator={OPERATOR} preview={PUBLIC_PREVIEW} version={PRIVACY_VERSION} />
</article>

<style>
	.legal {
		max-width: var(--measure);
		padding: 1.5rem 1.75rem;
		font-size: 15.5px;
		line-height: 1.7;

		& :global(h2) {
			font-size: 18px;
			margin: 2rem 0 0.5rem;
		}

		& :global(p + p),
		& :global(ul),
		& :global(address),
		& :global(.table) {
			margin-top: 0.75rem;
		}

		& :global(ul) {
			padding-left: 1.25rem;
		}

		& :global(address) {
			font-style: normal;
		}

		& :global(.lead) {
			font-size: 16.5px;
		}

		& :global(.notice) {
			padding: 0.75rem 1rem;
			background: var(--neutral-soft);
			border-radius: var(--radius-card);
		}

		& :global(.version) {
			margin-top: 2rem;
			font-size: 13px;
			color: var(--ink3);
		}

		& :global(.table) {
			overflow-x: auto;
		}

		& :global(table) {
			width: 100%;
			border-collapse: collapse;
			font-size: 14px;
			line-height: 1.5;
		}

		& :global(th),
		& :global(td) {
			padding: 0.5rem 0.75rem 0.5rem 0;
			text-align: left;
			vertical-align: top;
			border-bottom: 1px solid var(--rule);
		}

		& :global(code) {
			overflow-wrap: anywhere;
		}

		@media (max-width: 40rem) {
			padding: 1.25rem 1rem;
		}
	}

	.missing {
		max-width: var(--measure);
		margin-bottom: 1.25rem;
		padding: 0.75rem 1rem;
		font-size: 14px;
		color: var(--wax);
		background: var(--wax-soft);
		border-radius: var(--radius-card);
	}
</style>
