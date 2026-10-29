<!--
	@component
	Phone menu "Aktenschrank": a sheet from the right on the native `<dialog>`
	with the areas numbered like chapters, the account and the language and
	theme switches. Esc, the backdrop, the close button and any navigation
	close it; focus returns to the menu button.
-->
<script lang="ts">
	import { on } from 'svelte/events';
	import { PUBLIC_PREVIEW } from '$app/env/public';
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { localized, type RoutePath } from '#lib/i18n/links.js';
	import type { ThemeSetting } from '#lib/theme.js';
	import DeadlineCount from './DeadlineCount.svelte';
	import Icon from './Icon.svelte';
	import LangSwitch from './LangSwitch.svelte';
	import ThemeSwitch from './ThemeSwitch.svelte';
	import { navItems } from './nav.js';

	let {
		open = $bindable(false),
		id,
		theme,
		user,
		organisation,
		loginPath
	}: {
		open?: boolean;
		id: string;
		theme: ThemeSetting;
		user: { displayName: string } | null;
		organisation: { name: string; kind: 'eigene' | 'mandant' } | null;
		/** absent in the static preview, which has no sign-in */
		loginPath?: RoutePath;
	} = $props();

	const withRecords = $derived(!!user || PUBLIC_PREVIEW);
	const items = $derived(navItems(withRecords, page.route.id));

	afterNavigate(() => {
		open = false;
	});

	/** keeps the element in step with `open`; re-runs whenever `open` changes */
	function sync(dialog: HTMLDialogElement) {
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	}

	/** the sheet belongs to the phone layout: growing past it closes the dialog (its close event resets `open`) */
	function closeOnDesktop(dialog: HTMLDialogElement) {
		const desktop = window.matchMedia('(min-width: 56.01rem)');
		return on(desktop, 'change', (event) => {
			if (event.matches && dialog.open) dialog.close();
		});
	}

	/** the sheet fills the dialog, so a click on the dialog itself is a click on the backdrop */
	function backdrop(event: MouseEvent & { currentTarget: HTMLDialogElement }) {
		if (event.target === event.currentTarget) event.currentTarget.close();
	}
</script>

<!-- the Esc key closes the dialog natively, so the backdrop click needs no key handler -->
<dialog
	{@attach sync}
	{@attach closeOnDesktop}
	{id}
	class="sheet"
	aria-label={m.nav_label()}
	onclose={() => (open = false)}
	onclick={backdrop}
>
	<div class="inner">
		<div class="head">
			<span class="eyebrow">{m.nav_menu()}</span>
			<button type="button" class="close" onclick={() => (open = false)} aria-label={m.nav_close()}>
				<span class="ico"><Icon name="x" size={22} /></span>
			</button>
		</div>

		<nav aria-label={m.nav_label()}>
			<ol>
				{#each items as item (item.route)}
					<li>
						<a href={resolve(item.path)} aria-current={item.current ? 'page' : undefined}>
							<span class="ico"><Icon name={item.icon} size={20} /></span>
							<span class="label">{item.label}</span>
							{#if item.route === '/fristen'}<DeadlineCount />{/if}
						</a>
					</li>
				{/each}
			</ol>
		</nav>

		{#if user}
			<div class="account">
				<a class="name" href={resolve(localized('/konto'))}>{user.displayName}</a>
				{#if organisation}
					<a class="org" href={resolve(localized('/mandanten'))} data-kind={organisation.kind}
						>{m.org_working_in({ name: organisation.name })}</a
					>
				{/if}
				<form method="post" action={resolve('/auth/logout')}>
					<button type="submit" class="button quiet">{m.nav_logout()}</button>
				</form>
			</div>
		{:else if loginPath}
			<div class="account">
				<a class="button" href={resolve(loginPath)} data-sveltekit-reload>{m.nav_login()}</a>
			</div>
		{/if}

		{#if PUBLIC_PREVIEW}
			<a class="preview" href={resolve(localized('/vorschau'))}>
				<span class="ico"><Icon name="eye" size={18} /></span>
				<span>{m.preview_chip()} · {m.preview_more()}</span>
			</a>
		{/if}

		<div class="foot">
			<LangSwitch size="large" />
			<ThemeSwitch initial={theme} size="large" />
		</div>
	</div>
</dialog>

<style>
	.sheet {
		width: min(22rem, 100vw);
		max-width: 100vw;
		height: 100dvh;
		max-height: 100dvh;
		margin: 0 0 0 auto;
		padding: 0;
		color: var(--ink);
		background: var(--sheet);
		border: 0;
		border-left: 1px solid var(--rule);
		box-shadow: var(--shadow-modal);

		&::backdrop {
			background: rgba(28, 27, 25, 0.35);
		}

		&[open] {
			animation: slide-in 0.18s ease-out;

			@media (prefers-reduced-motion: reduce) {
				animation: none;
			}
		}

		& .inner {
			display: flex;
			flex-direction: column;
			min-height: 100%;
			padding: max(0.75rem, env(safe-area-inset-top)) 1.25rem max(1rem, env(safe-area-inset-bottom));
		}

		& .head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 0.5rem;

			& .close {
				display: inline-grid;
				place-items: center;
				width: 44px;
				height: 44px;
				margin-right: -0.6rem;
				color: var(--ink2);
				border-radius: var(--radius);

				&:hover {
					color: var(--ink);
					background: var(--navy-soft);
				}
			}
		}

		& ol {
			list-style: none;
		}

		& li {
			border-bottom: 1px solid var(--rule2);
		}

		& nav a {
			display: flex;
			align-items: center;
			gap: 0.9rem;
			min-height: 52px;
			padding: 0.8rem 0.5rem 0.7rem;
			color: var(--ink);

			&:hover {
				text-decoration: none;
				background: var(--navy-soft);
			}

			&[aria-current='page'] {
				box-shadow: inset 3px 0 0 var(--khaki);
				background: var(--khaki-soft);
			}

			& .ico {
				display: inline-grid;
				place-items: center;
				color: var(--ink3);
			}

			&[aria-current='page'] .ico {
				color: var(--khaki);
			}

			& .label {
				font-family: var(--serif);
				font-size: 19px;
			}
		}

		& .account {
			display: grid;
			gap: 0.6rem;
			justify-items: start;
			margin-top: 1.5rem;

			& .name {
				font-family: var(--serif);
				font-size: 16px;
			}

			& .org {
				font-size: 14px;
				color: var(--ink2);

				&[data-kind='mandant'] {
					color: var(--navy);
				}
			}
		}

		/* phones have no preview bar: this is where the preview explains itself */
		& .preview {
			display: flex;
			align-items: center;
			gap: 0.6rem;
			min-height: 44px;
			margin-top: 1.25rem;
			padding: 0.5rem 0.75rem;
			font-size: 14px;
			color: var(--navy);
			background: var(--navy-soft);
			border-radius: var(--radius);

			&:hover {
				text-decoration: none;
			}
		}

		& .foot {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-top: auto;
			padding-top: 1rem;
			border-top: 1px solid var(--rule);
		}
	}

	@keyframes slide-in {
		from {
			transform: translateX(100%);
		}
	}
</style>
