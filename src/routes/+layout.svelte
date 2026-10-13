<script lang="ts">
	import '@fontsource-variable/dm-sans';
	import '@fontsource-variable/source-serif-4';
	import '@fontsource-variable/jetbrains-mono';
	import '../styles/tokens.css';
	import '../styles/base.css';
	import '../styles/primitives.css';
	import '../styles/print.css';
	import type { Path } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '#lib/paraglide/runtime.js';
	import favicon from '#lib/assets/favicon.svg';
	import Masthead from '#lib/ui/Masthead.svelte';
	import Footer from '#lib/ui/Footer.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#each locales as locale (locale)}
		<link
			rel="alternate"
			hreflang={locale}
			href={resolve(localizeHref(page.url.pathname, { locale }) as Path)}
		/>
	{/each}
</svelte:head>

<div class="frame">
	<Masthead theme={data.theme} user={data.user} />
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
