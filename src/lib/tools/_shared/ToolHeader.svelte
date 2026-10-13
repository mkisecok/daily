<!--
	@component
	Heading block for a tool page: category eyebrow, name, status, legal basis.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { text } from '../i18n.js';
	import type { ToolManifest } from '../types.js';
	import Citation from './Citation.svelte';
	import StatusBadge from './StatusBadge.svelte';

	let { tool }: { tool: ToolManifest } = $props();

	const categoryLabel = $derived(
		tool.category === 'datenschutz'
			? m.category_datenschutz()
			: tool.category === 'ki'
				? m.category_ki()
				: tool.category === 'audit'
					? m.category_audit()
					: m.category_entwickler()
	);
</script>

<header class="tool-header">
	<p class="eyebrow">{categoryLabel}</p>
	<div class="title">
		<h1>{text(tool.name)}</h1>
		<StatusBadge status={tool.status} />
	</div>
	<p class="basis">
		{#each tool.legalBasis as basis, index (basis.law + basis.ref)}
			{#if index > 0}<span class="sep">·</span>{/if}
			<Citation {basis} />
		{/each}
	</p>
</header>

<style>
	.tool-header {
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--rule);

		& .title {
			display: flex;
			align-items: baseline;
			gap: 1.25rem;
			flex-wrap: wrap;
			margin-top: 0.5rem;

			& h1 {
				font-size: clamp(28px, 3.5vw, 36px);
			}
		}

		& .basis {
			margin-top: 0.75rem;
			display: flex;
			flex-wrap: wrap;
			gap: 0.6rem;
			align-items: baseline;
		}

		& .sep {
			color: var(--ink3);
		}
	}
</style>
