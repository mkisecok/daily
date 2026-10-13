<!--
	@component
	Site header: wordmark, primary navigation, language and theme switches.
	A hairline below, nothing else.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import type { ThemeSetting } from '#lib/theme.js';
	import Wordmark from './Wordmark.svelte';
	import LangSwitch from './LangSwitch.svelte';
	import ThemeSwitch from './ThemeSwitch.svelte';

	let { theme }: { theme: ThemeSetting } = $props();

	const items = $derived([
		{ href: resolve('/nachrichten'), label: m.nav_feed() },
		{ href: resolve('/werkzeuge'), label: m.nav_tools() },
		{ href: resolve('/normen'), label: m.nav_norms() },
		{ href: resolve('/notizen'), label: m.nav_notes() }
	]);

	function isCurrent(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<header class="masthead no-print">
	<div class="page inner">
		<a class="home" href={resolve('/')}>
			<Wordmark />
			<span class="tagline">{m.site_tagline()}</span>
		</a>
		<nav aria-label={m.nav_label()}>
			{#each items as item (item.href)}
				<a href={item.href} aria-current={isCurrent(item.href) ? 'page' : undefined}>
					{item.label}
				</a>
			{/each}
		</nav>
		<div class="tools">
			<LangSwitch />
			<ThemeSwitch initial={theme} />
		</div>
	</div>
</header>

<style>
	.masthead {
		border-bottom: 1px solid var(--rule);
		background: var(--paper);

		& .inner {
			display: flex;
			align-items: center;
			gap: 2rem;
			min-height: 64px;
			flex-wrap: wrap;
			padding-top: 0.75rem;
			padding-bottom: 0.75rem;
		}

		& .home {
			display: flex;
			align-items: baseline;
			gap: 0.75rem;
			color: inherit;

			&:hover {
				text-decoration: none;
			}
		}

		& .tagline {
			font-family: var(--mono);
			font-size: 11px;
			letter-spacing: 0.12em;
			text-transform: uppercase;
			color: var(--ink3);

			@media (max-width: 40rem) {
				display: none;
			}
		}

		& nav {
			display: flex;
			flex-wrap: wrap;
			gap: 1.5rem;
			margin-left: auto;

			@media (max-width: 40rem) {
				margin-left: 0;
				gap: 1rem;
			}

			& a {
				font-size: 14px;
				color: var(--ink2);
				padding: 0.25rem 0;
				border-bottom: 1px solid transparent;

				&:hover {
					color: var(--ink);
					text-decoration: none;
					border-bottom-color: var(--rule);
				}

				&[aria-current='page'] {
					color: var(--ink);
					border-bottom-color: var(--ink);
				}
			}
		}

		& .tools {
			display: flex;
			align-items: center;
			gap: 1rem;
		}
	}
</style>
