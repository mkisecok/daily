<script lang="ts">
	import '@fontsource-variable/dm-sans';
	import '@fontsource-variable/source-serif-4';
	import '@fontsource-variable/jetbrains-mono';
	import '../styles/tokens.css';
	import '../styles/base.css';
	import '../styles/primitives.css';
	import '../styles/forms.css';
	import '../styles/controls.css';
	import '../styles/print.css';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales } from '#lib/paraglide/runtime.js';
	import { inLocale } from '#lib/i18n/links.js';
	import favicon from '#lib/assets/favicon.svg';
	import { PUBLIC_PREVIEW } from '$app/env/public';
	import Masthead from '#lib/ui/Masthead.svelte';
	import PreviewNotice from '#lib/ui/PreviewNotice.svelte';
	import Footer from '#lib/ui/Footer.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#each locales as locale (locale)}
		<link rel="alternate" hreflang={locale} href={resolve(inLocale(page.url.pathname, locale))} />
	{/each}
</svelte:head>

<div class="frame">
	{#if PUBLIC_PREVIEW}<PreviewNotice />{/if}
	<Masthead theme={data.theme} user={data.user} organisation={data.organisation} />
	<main class="page">
		{@render children()}
	</main>
	<Footer />
</div>

<style>
	.frame {
		display: flex;
		flex-direction: column;
		min-height: 100vh;

		& > main {
			flex: 1;
			width: 100%;
			padding-top: 2.5rem;
			padding-bottom: 4rem;
		}
	}
</style>
