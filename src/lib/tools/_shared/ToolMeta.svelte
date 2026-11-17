<!--
	@component
	What a tool is, under its title: its status, its area with the area's dot,
	and the legal basis as citation chips. Shared by the tool page and the
	register page, so a tool reads the same wherever it is opened.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { ToolCategory, ToolManifest } from '../types.js';
	import Citation from './Citation.svelte';
	import StatusBadge from './StatusBadge.svelte';

	let { tool }: { tool: ToolManifest } = $props();

	const CATEGORY_LABEL: Record<ToolCategory, () => string> = {
		datenschutz: m.category_datenschutz,
		ki: m.category_ki,
		audit: m.category_audit,
		schulung: m.category_schulung,
		entwickler: m.category_entwickler
	};
	const categoryLabel = $derived(CATEGORY_LABEL[tool.category]());
</script>

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

<style>
	.tool-meta {
		--spine: var(--ink3);

		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
		margin-top: 0.75rem;

		&[data-area='datenschutz'] {
			--spine: var(--area-datenschutz);
		}

		&[data-area='ki'] {
			--spine: var(--area-ki);
		}

		&[data-area='audit'] {
			--spine: var(--area-audit);
		}

		&[data-area='schulung'] {
			--spine: var(--area-schulung);
		}

		&[data-area='entwickler'] {
			--spine: var(--area-entwickler);
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
