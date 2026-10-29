<!--
	@component
	The signed-in user's account: what Daily stores about them, a JSON copy of
	their data, and deleting the account (Art. 15, 17, 20 GDPR).
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatShortDate, formatTime } from '#lib/i18n/date.js';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import ConfirmDialog from '#lib/ui/ConfirmDialog.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const locale = getLocale();
	const account = $derived(data.account);
	const when = (date: Date | string) => {
		const iso = new Date(date).toISOString();
		return `${formatShortDate(iso, locale)} ${formatTime(iso, locale)}`;
	};

	let confirmDelete = $state(false);
	let deleteForm: HTMLFormElement | undefined = $state();
</script>

<svelte:head>
	<title>{m.nav_account()} — Daily</title>
</svelte:head>

<PageHeader title={m.nav_account()} description={m.account_intro()} />

{#if form?.shared}
	<p class="message" role="alert">{m.account_delete_shared({ names: form.shared.join(', ') })}</p>
{/if}

<div class="sections">
	<section class="card">
		<h2>{m.account_stored()}</h2>
		<dl>
			<dt>{m.account_email()}</dt>
			<dd>{account.user.email}</dd>
			<dt>{m.account_name()}</dt>
			<dd>{account.user.displayName}</dd>
			<dt>{m.account_locale()}</dt>
			<dd>{account.user.locale.toUpperCase()}</dd>
			<dt>{m.account_created()}</dt>
			<dd>{when(account.user.createdAt)}</dd>
			<dt>{m.account_last_login()}</dt>
			<dd>{when(account.user.lastLoginAt)}</dd>
		</dl>
	</section>

	<section class="card">
		<h2>{m.account_sessions()}</h2>
		<ul class="plain">
			{#each account.sessions as session (session.createdAt)}
				<li>
					{m.account_session_line({
						from: when(session.createdAt),
						until: when(session.expiresAt)
					})}
				</li>
			{/each}
		</ul>
		<p class="note">{m.account_sessions_note()}</p>
	</section>

	<section class="card">
		<h2>{m.account_orgs()}</h2>
		<ul class="plain orgs">
			{#each account.organisations as org (org.id)}
				<li>
					<span class="icon"
						><Icon name={org.kind === 'eigene' ? 'building' : 'user'} size={18} /></span
					>
					<span class="name">{org.name}</span>
					<span class="meta">
						{org.kind === 'eigene' ? m.org_own() : m.org_client()} ·
						{org.role === 'owner' ? m.account_role_owner() : m.account_role_member()} ·
						{m.account_org_records({ count: org.records })}
					</span>
				</li>
			{/each}
		</ul>
		<p class="toolbar">
			<a class="button quiet" href={resolve(localized('/mandanten'))}>{m.nav_clients()}</a>
		</p>
	</section>

	<section class="card">
		<h2>{m.account_export_title()}</h2>
		<p class="measure">{m.account_export_body()}</p>
		<p class="toolbar">
			<a class="button" href={resolve('/(app)/konto/export')} download data-sveltekit-reload>
				<Icon name="download" size={16} />{m.account_export()}
			</a>
		</p>
	</section>

	<section class="card danger">
		<h2>{m.account_delete_title()}</h2>
		<p class="measure">{m.account_delete_body()}</p>
		<form method="post" action="?/loeschen" bind:this={deleteForm}>
			<p class="toolbar">
				<button type="button" class="danger" onclick={() => (confirmDelete = true)}>
					<Icon name="trash" size={16} />{m.account_delete()}
				</button>
			</p>
		</form>
		<ConfirmDialog
			bind:open={confirmDelete}
			title={m.account_delete_confirm_title()}
			body={m.account_delete_confirm()}
			confirmLabel={m.account_delete()}
			tone="danger"
			icon="trash"
			typeToConfirm={m.account_delete_word()}
			onconfirm={() => deleteForm?.requestSubmit()}
		/>
	</section>
</div>

<style>
	.sections {
		display: grid;
		gap: 1.25rem;
		max-width: calc(var(--measure) + 4rem);
	}

	.card {
		padding: 1.25rem 1.5rem;

		& h2 {
			font-size: 18px;
			margin-bottom: 0.75rem;
		}

		& p + .toolbar,
		& .measure + form {
			margin-top: 0.75rem;
		}
	}

	.danger {
		border-color: var(--wax-soft);
	}

	dl {
		display: grid;
		grid-template-columns: minmax(8rem, max-content) minmax(0, 1fr);
		gap: 0.4rem 1.25rem;
		font-size: 14.5px;

		& dt {
			color: var(--ink3);
		}

		& dd {
			overflow-wrap: anywhere;
		}

		@media (max-width: 40rem) {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.1rem;

			& dd {
				margin-bottom: 0.5rem;
			}
		}
	}

	.plain {
		list-style: none;
		display: grid;
		gap: 0.5rem;
		font-size: 14.5px;
	}

	.orgs li {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 0 0.6rem;
		align-items: baseline;

		& .icon {
			grid-row: span 2;
			color: var(--ink3);
		}

		& .name {
			font-weight: 600;
			overflow-wrap: anywhere;
		}

		& .meta {
			font-size: 13px;
			color: var(--ink3);
		}
	}

	.note {
		margin-top: 0.75rem;
		font-size: 13px;
		color: var(--ink3);
	}

	.message {
		margin-bottom: 1.5rem;
		padding: 0.75rem 1rem;
		font-size: 14px;
		color: var(--wax);
		background: var(--wax-soft);
		border-radius: var(--radius-card);
	}
</style>
