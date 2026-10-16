<!--
	@component
	Inline Markdown nodes: emphasis, code, links and links into the Navigator.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { localized } from '#lib/i18n/links.js';
	import type { Inline as Node } from '../markdown.js';
	import Inline from './Inline.svelte';

	let { nodes }: { nodes: Node[] } = $props();
</script>

{#each nodes as node, i (i)}{#if node.type === 'text'}{node.text}{:else if node.type === 'strong'}<strong
			><Inline nodes={node.children} /></strong
		>{:else if node.type === 'em'}<em><Inline nodes={node.children} /></em
		>{:else if node.type === 'code'}<code>{node.text}</code>{:else if node.type === 'norm'}<a
			class="norm"
			href={resolve(localized(node.path))}>{node.text}</a
		>{:else if node.external}<a href={node.href} rel="external noopener noreferrer" target="_blank"
			><Inline nodes={node.children} /></a
		>{:else}<a href={resolve(localized(node.href))}><Inline nodes={node.children} /></a>{/if}{/each}

<style>
	code {
		padding: 0.05em 0.3em;
		font-family: var(--mono);
		font-size: 0.86em;
		background: var(--rule2);
		border-radius: 4px;
		box-decoration-break: clone;
	}

	/* a citation into the Navigator, set like a reference */
	.norm {
		padding: 0 0.25em;
		font-family: var(--mono);
		font-size: 0.86em;
		background: var(--navy-soft);
		border-radius: 4px;
		box-decoration-break: clone;
	}
</style>
