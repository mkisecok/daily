<!--
	@component
	Site header: wordmark, primary navigation, language and theme switches,
	sign-in state. A hairline below, nothing else.
-->
<script lang="ts">
	import { PUBLIC_PREVIEW } from '$app/env/public';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { localized } from '#lib/i18n/links.js';
	import type { ThemeSetting } from '#lib/theme.js';
	import Wordmark from './Wordmark.svelte';
	import LangSwitch from './LangSwitch.svelte';
	import ThemeSwitch from './ThemeSwitch.svelte';

	let {
		theme,
		user,
		organisation = null
	}: {
		theme: ThemeSetting;
		user: { displayName: string } | null;
		/** the workspace the signed-in user works in */
		organisation?: { name: string; kind: 'eigene' | 'mandant' } | null;
	} = $props();

	/** `route` is the route id prefix that marks the item as current */
	const items = $derived([
		{ href: resolve(localized('/nachrichten')), route: '/nachrichten', label: m.nav_feed() },
		{ href: resolve(localized('/werkzeuge')), route: '/werkzeuge', label: m.nav_tools() },
		{ href: resolve(localized('/normen')), route: '/normen', label: m.nav_norms() },
		{ href: resolve(localized('/notizen')), route: '/notizen', label: m.nav_notes() },
		// deadlines come from records: the organisation's when signed in, the browser's in the preview
		...(user || PUBLIC_PREVIEW
			? [
					{ href: resolve(localized('/fristen')), route: '/fristen', label: m.deadlines_title() },
					{ href: resolve(localized('/berichte')), route: '/berichte', label: m.nav_reports() }
				]
			: [])
	]);

	const loginHref = $derived(
		resolve(localized(`/auth/login?next=${encodeURIComponent(page.url.pathname)}`))
	);

	/** route ids are identical on server and client, unlike resolved hrefs */
	function isCurrent(route: string): boolean {
		const id = page.route.id ?? '';
		return id === route || id.startsWith(route + '/') || id.startsWith('/(app)' + route);
	}
</script>

<header class="masthead no-print">
	<div class="page inner">
		<a class="home" href={resolve(localized('/'))}>
			<Wordmark />
			<span class="tagline">{m.site_tagline()}</span>
		</a>
		<nav aria-label={m.nav_label()}>
			{#each items as item (item.route)}
				<a href={item.href} aria-current={isCurrent(item.route) ? 'page' : undefined}>
					{item.label}
				</a>
			{/each}
		</nav>
		<div class="tools">
			<LangSwitch />
			<ThemeSwitch initial={theme} />
			{#if user}
				<form class="account" method="post" action={resolve('/auth/logout')}>
					<span class="name">{user.displayName}</span>
					{#if organisation}
						<a
							class="org"
							href={resolve(localized('/mandanten'))}
							title={m.org_working_in({ name: organisation.name })}
							data-kind={organisation.kind}>{organisation.name}</a
						>
					{/if}
					<button type="submit">{m.nav_logout()}</button>
				</form>
			{:else if !PUBLIC_PREVIEW}
				<a class="login" href={loginHref} data-sveltekit-reload>{m.nav_login()}</a>
			{/if}
		</div>
	</div>
</header>

<style>
	/* stays at the top while scrolling, so the navigation is always at hand */
	.masthead {
		position: sticky;
		top: env(safe-area-inset-top, 0px);
		z-index: 20;
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

			/* narrow screens: wordmark and tools in one row, the navigation as one
			   scrollable line below, so the sticky bar stays low. */
			@media (max-width: 56rem) {
				gap: 0.4rem 1rem;
				min-height: 0;
				padding-top: 0.5rem;
				padding-bottom: 0.4rem;
			}

			& .home {
				display: flex;
				align-items: baseline;
				gap: 0.75rem;
				color: inherit;

				&:hover {
					text-decoration: none;
				}

				@media (max-width: 56rem) {
					order: 1;
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

				@media (max-width: 56rem) {
					order: 3;
					flex: 1 1 100%;
					flex-wrap: nowrap;
					gap: 1.1rem;
					margin-left: 0;
					overflow-x: auto;
					scrollbar-width: none;
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

					@media (max-width: 56rem) {
						white-space: nowrap;
					}
				}
			}

			& .tools {
				display: flex;
				align-items: center;
				gap: 1rem;

				@media (max-width: 56rem) {
					order: 2;
					margin-left: auto;
				}

				& .login,
				& .account button {
					font-family: var(--mono);
					font-size: 11px;
					letter-spacing: 0.08em;
					text-transform: uppercase;
					color: var(--ink2);
					padding: 0.3rem 0.6rem;
					border: 1px solid var(--rule);

					&:hover {
						color: var(--ink);
						border-color: var(--ink3);
						text-decoration: none;
					}
				}

				& .account {
					display: flex;
					align-items: center;
					gap: 0.75rem;

					& .name {
						font-family: var(--serif);
						font-size: 14px;
						color: var(--ink2);

						@media (max-width: 40rem) {
							display: none;
						}
					}

					& .org {
						max-width: 14rem;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
						font-family: var(--mono);
						font-size: 11px;
						letter-spacing: 0.06em;
						color: var(--ink2);

						/* a client workspace is marked so nobody files into the wrong one */
						&[data-kind='mandant'] {
							color: var(--navy);
						}
					}
				}
			}
		}
	}
</style>
