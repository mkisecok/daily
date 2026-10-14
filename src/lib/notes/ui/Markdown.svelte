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
		font-size: 16px;
		line-height: 1.6;

		& > * + * {
			margin-top: 0.75rem;
		}

		& h2 {
			font-size: 21px;
		}

		& h3 {
			font-size: 18px;
		}

		& h4 {
			font-size: 16px;
		}

		& ul,
		& ol {
			padding-left: 1.4rem;
		}

		& blockquote {
			padding-left: 1rem;
			border-left: 3px solid var(--rule);
			color: var(--ink2);
		}
	}
</style>
