<!--
	@component
	The text of a provision: numbered paragraphs and nested lists, with
	references to other provisions as links.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { localized } from '#lib/i18n/links.js';
	import type { RenderedBlock } from '../types.js';
	import Blocks from './Blocks.svelte';

	let { blocks, nested = false }: { blocks: RenderedBlock[]; nested?: boolean } = $props();
</script>

<div class="blocks" class:nested>
	{#each blocks as block, index (index)}
		<div class="block" class:labelled={block.label}>
			{#if block.label}<span class="label">{block.label}</span>{/if}
			<div class="body">
				{#if block.segments.some((s) => s.text.trim())}
					<p>
						{#each block.segments as segment, i (i)}{#if segment.law && segment.id}<a
									href={resolve(localized(`/normen/${segment.law}/${segment.id}`))}
									>{segment.text}</a
								>{:else}{segment.text}{/if}{/each}
					</p>
				{/if}
				{#if block.children}<Blocks blocks={block.children} nested />{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	.blocks {
		max-width: var(--measure);
		margin-top: 1rem;

		& .block {
			margin-top: 0.75rem;

			&.labelled {
				display: grid;
				grid-template-columns: 2.5rem 1fr;
				gap: 0 0.5rem;
			}

			& .label {
				font-family: var(--mono);
				font-size: 13px;
				color: var(--ink3);
				padding-top: 0.15rem;
			}

			& p {
				font-family: var(--serif);
				font-size: 16px;
				line-height: 1.6;
				color: var(--ink);
			}
		}

		&.nested .block {
			margin-top: 0.4rem;
		}
	}
</style>
