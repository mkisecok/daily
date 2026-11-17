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
	import { resolve } from '$app/paths';
	import { text } from '../i18n.js';
	import { getTool } from '../registry.js';
	import { rememberVisit } from '../shelf.js';
	import type { ToolManifest } from '../types.js';
	import Rechtsstand from './Rechtsstand.svelte';
	import ToolMeta from './ToolMeta.svelte';

	let { tool }: { tool: ToolManifest } = $props();

	// the catalogue offers the tool opened last as its first card
	$effect(() => rememberVisit(tool.slug));

	const successor = $derived(
		tool.status === 'retired' && tool.successor ? getTool(tool.successor) : undefined
	);
	const trail = $derived([{ label: m.nav_tools(), path: localized('/werkzeuge') }]);
</script>

<PageHeader title={text(tool.name)} {trail}>
	{#snippet meta()}
		<ToolMeta {tool} />
		<Rechtsstand {tool} />
		{#if successor}
			<p class="retired" role="note">
				{m.tool_retired({ name: text(successor.name) })}
				<a href={resolve(localized(`/werkzeuge/${successor.slug}`))}>{text(successor.name)} →</a>
			</p>
		{/if}
	{/snippet}
</PageHeader>

<style>
	.retired {
		max-width: var(--measure);
		margin-top: 0.75rem;
		padding: 0.6rem 0.9rem;
		font-size: 14px;
		background: var(--navy-soft);
		border-radius: var(--radius);
	}
</style>
