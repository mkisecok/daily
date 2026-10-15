<!--
	@component
	German / English switch. Full reload on change so Paraglide re-resolves the
	locale on the server.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { getLocale, locales } from '#lib/paraglide/runtime.js';
	import { inLocale } from '#lib/i18n/links.js';

	/** `large` gives finger-sized targets, e.g. in the phone menu */
	let { size = 'default' }: { size?: 'default' | 'large' } = $props();

	const labels: Record<string, string> = { de: 'DE', en: 'EN' };
	const current = $derived(getLocale());
</script>

<nav class="lang" data-size={size} aria-label="Sprache / Language">
	{#each locales as locale, index (locale)}
		{#if index > 0}<span class="sep" aria-hidden="true">/</span>{/if}
		<a
			href={resolve(inLocale(page.url.pathname, locale))}
			hreflang={locale}
			lang={locale}
			aria-current={locale === current ? 'true' : undefined}
			data-sveltekit-reload
		>
			{labels[locale] ?? locale.toUpperCase()}
		</a>
	{/each}
</nav>

<style>
	.lang {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.08em;

		& a {
			color: var(--ink3);

			&[aria-current='true'] {
				color: var(--ink);
			}
		}

		&[data-size='large'] {
			gap: 0;
			font-size: 13px;

			& a {
				display: inline-grid;
				place-items: center;
				min-width: 44px;
				min-height: 44px;
			}
		}

		& .sep {
			color: var(--rule);
		}
	}
</style>
