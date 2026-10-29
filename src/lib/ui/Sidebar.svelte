<!--
	@component
	Desktop sidebar of the Arbeitsbereich: wordmark, the main areas with icons
	(the current one raised, deadlines with their counter), the account, and at
	the bottom the preview chip, language, theme and legal links. Sticky and
	scrollable on its own.
-->
<script lang="ts">
	import { PUBLIC_PREVIEW } from '$app/env/public';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { localized } from '#lib/i18n/links.js';
	import type { ThemeSetting } from '#lib/theme.js';
	import DeadlineCount from './DeadlineCount.svelte';
	import Icon from './Icon.svelte';
	import LangSwitch from './LangSwitch.svelte';
	import ThemeSwitch from './ThemeSwitch.svelte';
	import Tooltip from './Tooltip.svelte';
	import Wordmark from './Wordmark.svelte';
	import { navItems } from './nav.js';

	let {
		theme,
		user,
		organisation = null
	}: {
		theme: ThemeSetting;
		user: { displayName: string } | null;
		organisation?: { name: string; kind: 'eigene' | 'mandant' } | null;
	} = $props();

	const withRecords = $derived(!!user || PUBLIC_PREVIEW);
	const items = $derived(navItems(withRecords, page.route.id));
</script>

<aside class="sidebar no-print">
	<a class="home" href={resolve(localized('/'))}><Wordmark /></a>

	<nav aria-label={m.nav_label()}>
		<ul>
			{#each items as item (item.route)}
				<li>
					<a
						href={resolve(item.path)}
						class:current={item.current}
						aria-current={item.current ? 'page' : undefined}
					>
						<span class="ico"><Icon name={item.icon} size={18} /></span>
						<span>{item.label}</span>
						{#if item.route === '/fristen'}<DeadlineCount />{/if}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	{#if user || !PUBLIC_PREVIEW}
		<div class="group">
			<span class="eyebrow">{m.nav_account()}</span>
			{#if user}
				<a
					href={resolve(localized('/mandanten'))}
					class:current={page.route.id?.endsWith('/mandanten')}
				>
					<span class="ico"><Icon name="building" size={18} /></span>
					<span class="org" data-kind={organisation?.kind}
						>{organisation?.name ?? m.nav_clients()}</span
					>
				</a>
				<a href={resolve(localized('/konto'))} class:current={page.route.id?.endsWith('/konto')}>
					<span class="ico"><Icon name="user" size={18} /></span>
					<span>{m.nav_account()}</span>
				</a>
				<form method="post" action={resolve('/auth/logout')}>
					<button type="submit">
						<span class="ico"><Icon name="logout" size={18} /></span>
						<span>{m.nav_logout()} · {user.displayName}</span>
					</button>
				</form>
			{:else}
				<a
					href={resolve(localized(`/auth/login?next=${encodeURIComponent(page.url.pathname)}`))}
					data-sveltekit-reload
				>
					<span class="ico"><Icon name="user" size={18} /></span>
					<span>{m.nav_login()}</span>
				</a>
			{/if}
		</div>
	{/if}

	<div class="bottom">
		{#if PUBLIC_PREVIEW}
			<Tooltip text={m.preview_notice()}>
				<a class="chip" href={resolve(localized('/vorschau'))}>
					<span class="ico"><Icon name="eye" size={14} /></span>{m.preview_chip()}
				</a>
			</Tooltip>
		{/if}
		<div class="switches">
			<LangSwitch />
			<ThemeSwitch initial={theme} />
		</div>
		<p class="legal">
			<a href={resolve(localized('/impressum'))}>{m.footer_imprint()}</a>
			<a href={resolve(localized('/datenschutz'))}>{m.footer_privacy()}</a>
			<span>{m.footer_disclaimer()}</span>
		</p>
	</div>
</aside>

<style>
	.sidebar {
		position: sticky;
		top: 0;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		height: 100dvh;
		padding: 1.25rem 0.85rem 1rem;
		overflow-y: auto;
		background: var(--sidebar);
		border-right: 1px solid var(--rule2);

		@media (max-width: 56rem) {
			display: none;
		}

		& .home {
			padding: 0.2rem 0.6rem;
			color: inherit;

			&:hover {
				text-decoration: none;
			}
		}

		& ul {
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			gap: 2px;
			list-style: none;
		}

		& nav a,
		& .group a,
		& .group button {
			display: flex;
			align-items: center;
			gap: 0.65rem;
			width: 100%;
			min-height: 2.4rem;
			padding: 0.4rem 0.6rem;
			font-size: 14px;
			text-align: left;
			color: var(--ink2);
			border-radius: var(--radius);
			transition:
				background-color 0.12s ease,
				color 0.12s ease;

			&:hover {
				color: var(--ink);
				text-decoration: none;
				background: rgba(28, 27, 25, 0.05);
			}

			& .ico {
				display: inline-grid;
				place-items: center;
				color: var(--ink3);
			}

			&.current {
				font-weight: 500;
				color: var(--ink);
				background: var(--sheet);
				box-shadow: var(--shadow-raised);

				& .ico {
					color: var(--khaki);
				}
			}
		}

		& .group {
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			gap: 2px;

			& .eyebrow {
				padding: 0 0.6rem 0.3rem;
			}

			& .org {
				min-width: 0;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;

				&[data-kind='mandant'] {
					color: var(--navy);
				}
			}
		}

		& .bottom {
			display: grid;
			gap: 0.75rem;
			margin-top: auto;
			padding: 0 0.6rem;

			& .chip {
				display: inline-flex;
				align-items: center;
				gap: 0.35rem;
				padding: 0.2rem 0.55rem;
				font-family: var(--mono);
				font-size: 11px;
				letter-spacing: 0.08em;
				text-transform: uppercase;
				color: var(--navy);
				background: var(--navy-soft);
				border-radius: var(--radius-badge);

				&:hover {
					text-decoration: none;
				}
			}

			& .switches {
				display: flex;
				align-items: center;
				justify-content: space-between;
			}

			& .legal {
				display: flex;
				flex-wrap: wrap;
				gap: 0.2rem 0.75rem;
				font-size: 12px;
				color: var(--ink3);

				& a {
					color: var(--ink3);
				}

				& span {
					font-style: italic;
				}
			}
		}
	}
</style>
