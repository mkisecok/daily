<!--
	@component
	A note's Markdown, rendered from the parsed tree; no HTML from the note
	reaches the page.
-->
<script lang="ts">
	import { parse } from '../markdown.js';
	import Inline from './Inline.svelte';

	let { source }: { source: string } = $props();

	const blocks = $derived(parse(source));
</script>

<div class="markdown">
	{#each blocks as block, i (i)}
		{#if block.type === 'heading'}
			{#if block.level === 1}<h2><Inline nodes={block.children} /></h2>
			{:else if block.level === 2}<h3><Inline nodes={block.children} /></h3>
			{:else}<h4><Inline nodes={block.children} /></h4>{/if}
		{:else if block.type === 'paragraph'}
			<p><Inline nodes={block.children} /></p>
		{:else if block.type === 'quote'}
			<blockquote><Inline nodes={block.children} /></blockquote>
		{:else if block.ordered}
			<ol>
				{#each block.items as item, j (j)}<li><Inline nodes={item} /></li>{/each}
			</ol>
		{:else}
			<ul>
				{#each block.items as item, j (j)}<li><Inline nodes={item} /></li>{/each}
			</ul>
		{/if}
	{/each}
</div>

<style>
	.markdown {
		max-width: var(--measure);
		font-family: var(--serif);
		font-size: 16.5px;
		line-height: 1.65;
		color: var(--ink);
		overflow-wrap: break-word;

		& > * + * {
			margin-top: 0.8rem;
		}

		& h2,
		& h3,
		& h4 {
			line-height: 1.25;
		}

		& h2 {
			font-size: 22px;
		}

		& h3 {
			font-size: 18.5px;
		}

		& h4 {
			font-size: 16.5px;
		}

		& ul,
		& ol {
			padding-left: 1.4rem;

			& li + li {
				margin-top: 0.3rem;
			}

			& li::marker {
				color: var(--ink3);
			}
		}

		& ol li::marker {
			font-family: var(--mono);
			font-size: 0.85em;
		}

		& blockquote {
			padding: 0.5rem 1rem;
			color: var(--ink2);
			background: var(--paper);
			border-left: 3px solid var(--rule);
			border-radius: 0 var(--radius) var(--radius) 0;
		}

		/* headings get air above them, except at the very top */
		& > * + h2,
		& > * + h3,
		& > * + h4 {
			margin-top: 1.5rem;
		}
	}
</style>
