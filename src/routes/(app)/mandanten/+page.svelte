<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '#lib/paraglide/messages.js';
	import Icon from '#lib/ui/Icon.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let renaming = $state<string | null>(null);
</script>

<svelte:head>
	<title>{m.org_title()} — Daily</title>
</svelte:head>

<PageHeader title={m.org_title()} description={m.org_intro()} />

{#if form && 'switched' in form && form.switched}
	<p class="message" role="status">{m.org_switched({ name: form.switched })}</p>
{/if}

<ul class="orgs">
	{#each data.organisations as org (org.id)}
		{@const active = org.id === data.activeId}
		<li class:active>
			{#if renaming === org.id}
				<form
					method="post"
					action="?/rename"
					class="rename"
					use:enhance={() =>
						async ({ result, update }) => {
							await update();
							if (result.type === 'success') renaming = null;
						}}
				>
					<input type="hidden" name="id" value={org.id} />
					<label class="visually-hidden" for="rename-{org.id}">{m.org_name()}</label>
					<input id="rename-{org.id}" name="name" value={org.name} maxlength="120" required />
					<span class="toolbar">
						<button type="submit">{m.org_save()}</button>
						<button type="button" class="quiet" onclick={() => (renaming = null)}>
							{m.org_cancel()}
						</button>
					</span>
					{#if form && 'action' in form && form.action === 'rename' && form.id === org.id}
						<span class="invalid">{m.org_name_invalid()}</span>
					{/if}
				</form>
			{:else}
				<span class="icon"><Icon name={org.kind === 'eigene' ? 'building' : 'user'} /></span>
				<span class="text">
					<span class="name">{org.name}</span>
					<span class="kind">{org.kind === 'eigene' ? m.org_own() : m.org_client()}</span>
				</span>
				<span class="toolbar">
					{#if active}
						<span class="current badge khaki">{m.org_active()}</span>
					{:else}
						<form method="post" action="?/switch" use:enhance>
							<input type="hidden" name="id" value={org.id} />
							<button type="submit" class="quiet">{m.org_switch()}</button>
						</form>
					{/if}
					{#if org.role === 'owner'}
						<button type="button" class="quiet" onclick={() => (renaming = org.id)}>
							{m.org_rename()}
						</button>
					{/if}
				</span>
			{/if}
		</li>
	{/each}
</ul>

<form method="post" action="?/create" class="create card" use:enhance>
	<label for="new-name">{m.org_add()}</label>
	<input id="new-name" name="name" maxlength="120" required placeholder={m.org_name()} />
	<span class="toolbar"><button type="submit">{m.org_add()}</button></span>
	{#if form && 'action' in form && form.action === 'create'}
		<span class="invalid">{m.org_name_invalid()}</span>
	{/if}
</form>

<style>
	/* a soft navy info card */
	.message {
		margin-bottom: 1.5rem;
		padding: 0.75rem 1rem;
		font-size: 14px;
		background: var(--navy-soft);
		border: 1px solid var(--navy-soft);
		border-radius: var(--radius-card);
	}

	/* a raised list of rows; the active organisation carries a khaki spine */
	.orgs {
		list-style: none;
		background: var(--sheet);
		border: 1px solid var(--rule2);
		border-radius: var(--radius-card);
		box-shadow: var(--shadow-raised);
		overflow: hidden;

		& li {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr) auto;
			gap: 0.5rem 1rem;
			align-items: center;
			min-height: 64px;
			padding: 0.85rem 1rem;
			border-bottom: 1px solid var(--rule2);

			&:last-child {
				border-bottom: 0;
			}

			@media (max-width: 40rem) {
				grid-template-columns: auto minmax(0, 1fr);

				& > .toolbar {
					grid-column: 1 / -1;
				}
			}

			& .icon {
				display: grid;
				place-items: center;
				width: 2.25rem;
				height: 2.25rem;
				color: var(--ink2);
				background: var(--paper);
				border-radius: var(--radius);
			}

			& .text {
				display: grid;
				gap: 0.1rem;
				min-width: 0;
			}

			& .name {
				font-size: 15px;
				font-weight: 600;
				overflow-wrap: anywhere;
			}

			& .kind {
				font-size: 13px;
				color: var(--ink3);
			}

			&.active {
				background: var(--khaki-soft);
				box-shadow: inset 3px 0 0 var(--khaki);

				& .icon {
					color: var(--on-khaki);
					background: var(--khaki);
				}
			}
		}
	}

	.rename,
	.create {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1rem;
		grid-column: 1 / -1;

		& input:not([type='hidden']) {
			flex: 1 1 14rem;
			min-width: 0;
			max-width: 32rem;
		}

		& .invalid {
			width: 100%;
			font-size: 13px;
			color: var(--wax);
		}

		& .visually-hidden {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
	}

	.create {
		margin-top: 1.5rem;

		& label {
			width: 100%;
			font-family: var(--serif);
			font-size: 18px;
		}
	}
</style>
