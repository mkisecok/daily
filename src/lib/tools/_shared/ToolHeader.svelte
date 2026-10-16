<!--
	@component
	Head of a tool page in the Arbeitsbereich: a trail back to the catalogue,
	the tool name as the page title, its status and area, and the legal basis
	as citation chips.
-->
<script lang="ts">
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import PageHeader from '#lib/ui/PageHeader.svelte';
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
	const trail = $derived([{ label: m.nav_tools(), path: localized('/werkzeuge') }]);
</script>

<PageHeader title={text(tool.name)} {trail}>
	{#snippet meta()}
		<div class="tool-meta" data-area={tool.category}>
			<StatusBadge status={tool.status} />
			<span class="category">{categoryLabel}</span>
		</div>
		{#if tool.legalBasis.length > 0}
			<ul class="basis">
				{#each tool.legalBasis as basis (basis.law + basis.ref)}
					<li class="chip"><Citation {basis} /></li>
				{/each}
			</ul>
		{/if}
	{/snippet}
</PageHeader>

<style>
	.tool-meta {
		--spine: var(--ink3);

		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
		margin-top: 0.75rem;

		&[data-area='datenschutz'] {
			--spine: var(--navy);
		}

		&[data-area='ki'] {
			--spine: var(--wax);
		}

		&[data-area='audit'] {
			--spine: var(--khaki);
		}

		/* the area, marked with a dot in its spine colour as on the index cards */
		& .category {
			display: inline-flex;
			align-items: center;
			gap: 0.4rem;
			font-size: 13px;
			color: var(--ink2);

			&::before {
				content: '';
				width: 6px;
				height: 6px;
				background: var(--spine);
				border-radius: 50%;
			}
		}
	}

	.basis {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 0.75rem;
		list-style: none;

		& .chip {
			display: inline-flex;
			align-items: center;
			min-height: 1.75rem;
			padding: 0 0.5rem;
			background: var(--sheet);
			border: 1px solid var(--rule2);
			border-radius: var(--radius-badge);

			&:hover {
				border-color: var(--navy);
			}
		}
	}
</style>
