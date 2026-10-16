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
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales } from '#lib/paraglide/runtime.js';
	import { inLocale } from '#lib/i18n/links.js';
	import favicon from '#lib/assets/favicon.svg';
	import { PUBLIC_PREVIEW } from '$app/env/public';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import Footer from '#lib/ui/Footer.svelte';
	import CommandPalette from '#lib/ui/CommandPalette.svelte';
	import MenuSheet from '#lib/ui/MenuSheet.svelte';
	import Sidebar from '#lib/ui/Sidebar.svelte';
	import Topbar from '#lib/ui/Topbar.svelte';
	import { refreshDeadlineCount } from '#lib/ui/deadline-count.svelte.js';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	let menuOpen = $state(false);
	let paletteOpen = $state(false);

	afterNavigate(() => refreshDeadlineCount(!!data.user || PUBLIC_PREVIEW));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#each locales as locale (locale)}
		<link rel="alternate" hreflang={locale} href={resolve(inLocale(page.url.pathname, locale))} />
	{/each}
</svelte:head>

<a class="skip" href="#main">{m.nav_skip()}</a>
<div class="shell">
	<Sidebar theme={data.theme} user={data.user} organisation={data.organisation} />
	<div class="column">
		<Topbar onsearch={() => (paletteOpen = true)} onmenu={() => (menuOpen = true)} {menuOpen} />
		<main id="main" class="page" tabindex="-1">
			{@render children()}
		</main>
		<div class="phone-footer"><Footer /></div>
	</div>
</div>

<CommandPalette bind:open={paletteOpen} withRecords={!!data.user || PUBLIC_PREVIEW} />

<MenuSheet
	bind:open={menuOpen}
	id="phone-menu"
	theme={data.theme}
	user={data.user}
	organisation={data.organisation}
	loginPath={PUBLIC_PREVIEW
		? undefined
		: localized(`/auth/login?next=${encodeURIComponent(page.url.pathname)}`)}
/>

<style>
	.skip {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		z-index: 100;
		padding: 0.5rem 0.9rem;
		color: var(--on-khaki);
		background: var(--khaki);
		border-radius: var(--radius);
		transform: translateY(-200%);

		&:focus {
			transform: none;
		}
	}

	/* sidebar beside the content on desktop; phones get the top bar and the menu sheet */
	.shell {
		display: grid;
		grid-template-columns: 15rem minmax(0, 1fr);
		min-height: 100vh;

		@media (max-width: 56rem) {
			grid-template-columns: minmax(0, 1fr);
		}

		@media print {
			display: block;
		}

		& .column {
			display: flex;
			flex-direction: column;
			min-width: 0;

			& > main {
				flex: 1;
				width: 100%;
				padding-top: 2rem;
				padding-bottom: 4rem;

				&:focus {
					outline: none;
				}
			}
		}

		& .phone-footer {
			display: none;

			@media (max-width: 56rem) {
				display: block;
			}
		}
	}
</style>
