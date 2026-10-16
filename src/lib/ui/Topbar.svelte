<!--
	@component
	Bar at the top of the main column. Desktop: a search field that opens the
	command palette, with its shortcut. Phones: wordmark, a search button and
	the menu button for the sheet. Sticky while the page scrolls.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { localized } from '#lib/i18n/links.js';
	import Icon from './Icon.svelte';
	import Wordmark from './Wordmark.svelte';

	let {
		onsearch,
		onmenu,
		menuOpen = false
	}: { onsearch: () => void; onmenu: () => void; menuOpen?: boolean } = $props();

	/** Apple keyboards show ⌘; the server renders Strg/Ctrl and this corrects it after hydration */
	function appleKey(node: HTMLElement) {
		if (/Mac|iPhone|iPad/.test(navigator.platform)) node.textContent = '⌘K';
	}
</script>

<header class="topbar no-print">
	<a class="home" href={resolve(localized('/'))}><Wordmark /></a>
	<button type="button" class="search" aria-label={m.search_open()} onclick={onsearch}>
		<Icon name="search" size={16} />
		<span class="text">{m.search_placeholder()}</span>
		<kbd {@attach appleKey}>{m.search_shortcut()}</kbd>
	</button>
	<button
		type="button"
		class="menu"
		aria-label={m.nav_menu()}
		aria-haspopup="dialog"
		aria-expanded={menuOpen}
		aria-controls="phone-menu"
		onclick={onmenu}
	>
		<Icon name="menu-2" size={24} />
	</button>
</header>

<style>
	.topbar {
		position: sticky;
		top: env(safe-area-inset-top, 0px);
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-height: 3.5rem;
		padding: 0.6rem var(--gutter);
		background: var(--canvas);
		border-bottom: 1px solid var(--rule2);

		& .home {
			display: none;
			color: inherit;

			&:hover {
				text-decoration: none;
			}

			@media (max-width: 56rem) {
				display: inline-flex;
				margin-right: auto;
			}
		}

		& .search {
			display: flex;
			align-items: center;
			gap: 0.55rem;
			width: min(28rem, 100%);
			min-height: 2.4rem;
			padding: 0 0.75rem;
			font-size: 14px;
			color: var(--ink3);
			background: var(--sheet);
			border: 1px solid var(--rule2);
			border-radius: var(--radius);
			cursor: text;

			&:hover {
				border-color: var(--ink3);
			}

			& .text {
				flex: 1;
				text-align: left;
			}

			& kbd {
				padding: 0.05rem 0.4rem;
				font-family: var(--mono);
				font-size: 11px;
				color: var(--ink3);
				border: 1px solid var(--rule);
				border-radius: var(--radius-badge);
			}

			/* phones: just the magnifier */
			@media (max-width: 56rem) {
				justify-content: center;
				width: 44px;
				height: 44px;
				padding: 0;
				background: none;
				border: 0;
				color: var(--ink);

				& .text,
				& kbd {
					display: none;
				}
			}
		}

		& .menu {
			display: none;
			place-items: center;
			width: 44px;
			height: 44px;
			margin-right: -0.5rem;
			color: var(--ink);
			border-radius: var(--radius);

			&:hover {
				background: var(--navy-soft);
			}

			@media (max-width: 56rem) {
				display: inline-grid;
			}
		}
	}
</style>
