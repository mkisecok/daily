<!--
	@component
	Switches the Pseudonymisierer between its two ways of working: text for an
	AI chat, and a Word or PDF document that comes back as a pseudonymised file.
-->
<script lang="ts">
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { resolve } from '$app/paths';

	let { current }: { current: 'text' | 'document' } = $props();

	const modes = $derived([
		{ id: 'text', label: m.anon_mode_text(), path: localized('/werkzeuge/pseudonymisierer') },
		{
			id: 'document',
			label: m.anon_mode_document(),
			path: localized('/werkzeuge/pseudonymisierer/dokument')
		}
	]);
</script>

<nav class="modes" aria-label={m.anon_modes()}>
	{#each modes as mode (mode.id)}
		<a
			class="daily-chip"
			href={resolve(mode.path)}
			aria-current={mode.id === current ? 'page' : undefined}>{mode.label}</a
		>
	{/each}
</nav>

<style>
	.modes {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;

		& a {
			text-decoration: none;

			/* as a pressed chip */
			&[aria-current='page'] {
				color: var(--ink);
				background: var(--primary-soft);
				border-color: var(--primary);
			}
		}
	}
</style>
