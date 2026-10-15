<!--
	@component
	Phone menu "Aktenschrank": a sheet from the right on the native `<dialog>`
	with the areas numbered like chapters, the account and the language and
	theme switches. Esc, the backdrop, the close button and any navigation
	close it; focus returns to the menu button.
-->
<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { localized } from '#lib/i18n/links.js';
	import type { ThemeSetting } from '#lib/theme.js';
	import Icon from './Icon.svelte';
	import LangSwitch from './LangSwitch.svelte';
	import ThemeSwitch from './ThemeSwitch.svelte';

	type Item = { href: string; route: string; label: string; current: boolean };

	let {
		open = $bindable(false),
		id,
		items,
		theme,
		user,
		organisation,
		loginHref
	}: {
		open?: boolean;
		id: string;
		items: Item[];
		theme: ThemeSetting;
		user: { displayName: string } | null;
		organisation: { name: string; kind: 'eigene' | 'mandant' } | null;
		/** absent in the static preview, which has no sign-in */
		loginHref?: string;
	} = $props();

	const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

	afterNavigate(() => {
		open = false;
	});

	/** keeps the element in step with `open`; re-runs whenever `open` changes */
	function sync(dialog: HTMLDialogElement) {
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	}

	/** the sheet fills the dialog, so a click on the dialog itself is a click on the backdrop */
	function backdrop(event: MouseEvent & { currentTarget: HTMLDialogElement }) {
		if (event.target === event.currentTarget) event.currentTarget.close();
	}
</script>

<!-- the Esc key closes the dialog natively, so the backdrop click needs no key handler -->
<dialog
	{@attach sync}
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
				<Icon name="x" size={22} />
			</button>
		</div>

		<nav aria-label={m.nav_label()}>
			<ol>
				{#each items as item, i (item.route)}
					<li>
						<a href={item.href} aria-current={item.current ? 'page' : undefined}>
							<span class="numeral">{NUMERALS[i]}</span>
							<span class="label">{item.label}</span>
						</a>
					</li>
				{/each}
			</ol>
		</nav>

		{#if user}
			<div class="account">
				<span class="name">{user.displayName}</span>
				{#if organisation}
					<a class="org" href={resolve(localized('/mandanten'))} data-kind={organisation.kind}
						>{m.org_working_in({ name: organisation.name })}</a
					>
				{/if}
				<form method="post" action={resolve('/auth/logout')}>
					<button type="submit" class="button quiet">{m.nav_logout()}</button>
				</form>
			</div>
		{:else if loginHref}
			<div class="account">
				<a class="button" href={loginHref} data-sveltekit-reload>{m.nav_login()}</a>
			</div>
		{/if}

		<div class="foot">
			<LangSwitch />
			<ThemeSwitch initial={theme} />
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
			align-items: baseline;
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

			& .numeral {
				min-width: 2.2rem;
				font-family: var(--mono);
				font-size: 12px;
				color: var(--ink3);
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
