<!--
	@component
	Head of a tool page in the Arbeitsbereich: a trail back to the catalogue,
	the tool name as the page title, its status and area, the legal basis as
	citation chips, and the button that plays the tool's demo.
-->
<script lang="ts">
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import { resolve } from '$app/paths';
	import { text } from '../i18n.js';
	import { getTool } from '../registry.js';
	import { rememberVisit } from '../shelf.js';
	import Icon from '#lib/ui/Icon.svelte';
	import { demo } from './demo/demo.svelte.js';
	import { scriptFor, workHref } from './demo/scripts.js';
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
	const script = $derived(scriptFor(tool));
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
	{#snippet actions()}
		{#if script}
			<button
				type="button"
				class="button quiet demo-start no-print"
				disabled={demo.active}
				onclick={() => demo.start(tool, script, workHref(tool))}
			>
				<Icon name="player-play" size={16} />{m.demo_button()}
			</button>
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

	.demo-start {
		gap: 0.4rem;
	}
</style>
