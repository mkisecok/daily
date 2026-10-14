<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let renaming = $state<string | null>(null);
</script>

<svelte:head>
	<title>{m.org_title()} — Daily</title>
</svelte:head>

<header class="head">
	<h1>{m.org_title()}</h1>
	<p class="measure intro">{m.org_intro()}</p>
</header>

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
				<span class="name">{org.name}</span>
				<span class="kind">{org.kind === 'eigene' ? m.org_own() : m.org_client()}</span>
				<span class="toolbar">
					{#if active}
						<span class="current">{m.org_active()}</span>
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

<form method="post" action="?/create" class="create" use:enhance>
	<label for="new-name">{m.org_add()}</label>
	<input id="new-name" name="name" maxlength="120" required placeholder={m.org_name()} />
	<span class="toolbar"><button type="submit">{m.org_add()}</button></span>
	{#if form && 'action' in form && form.action === 'create'}
		<span class="invalid">{m.org_name_invalid()}</span>
	{/if}
</form>

<style>
	.head {
		padding: 2.5rem 0 1rem;
		border-bottom: 2px solid var(--ink);

		& h1 {
			font-size: clamp(28px, 4vw, 40px);
		}
	}

	.intro {
		margin-top: 0.75rem;
		font-size: 15px;
		color: var(--ink2);
	}

	.message {
		margin-top: 1.5rem;
		padding: 0.75rem 1rem;
		border-left: 3px solid var(--navy);
		background: var(--navy-soft);
		font-size: 14px;
	}

	.orgs {
		list-style: none;
		margin-top: 1.5rem;

		& li {
			display: grid;
			grid-template-columns: 1fr auto auto;
			gap: 0.5rem 1.5rem;
			align-items: center;
			padding: 0.9rem 0;
			border-bottom: 1px solid var(--rule2);

			@media (max-width: 40rem) {
				grid-template-columns: 1fr;
			}
		}

		& li.active .name {
			color: var(--navy);
		}
	}

	.name {
		font-family: var(--serif);
		font-size: 18px;
	}

	.kind,
	.current {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink3);
	}

	.current {
		color: var(--navy);
	}

	.rename,
	.create {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1rem;
		grid-column: 1 / -1;
	}

	.create {
		margin-top: 2rem;

		& label {
			width: 100%;
			font-family: var(--serif);
			font-size: 18px;
		}
	}

	input:not([type='hidden']) {
		flex: 1 1 18rem;
		max-width: 32rem;
		padding: 0.5rem 0.6rem;
		font: inherit;
		font-size: 15px;
		color: var(--ink);
		background: var(--sheet);
		border: 1px solid var(--rule);
	}

	.invalid {
		width: 100%;
		font-size: 13px;
		color: var(--wax);
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
