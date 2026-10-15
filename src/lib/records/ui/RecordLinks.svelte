<!--
	@component
	Records of other tools that point to this one, e.g. the findings of an
	audit, grouped by tool and linked.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import type { RoutePath } from '#lib/i18n/links.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { m } from '#lib/paraglide/messages.js';
	import { text } from '#lib/tools/i18n.js';
	import { stateLabel } from '../format.js';
	import type { Backlinks } from '../links.js';

	let {
		backlinks,
		hrefFor
	}: {
		backlinks: Backlinks;
		/** route path to a record of a tool; resolved here */
		hrefFor: (tool: string, id: string) => RoutePath;
	} = $props();

	const locale = getLocale();
</script>

<section class="links">
	<h2 class="eyebrow">{m.records_links()}</h2>
	{#each backlinks as group (group.tool.manifest.slug)}
		<h3>{text(group.tool.manifest.name)}</h3>
		<ul>
			{#each group.records as record (record.id)}
				<li>
					<a href={resolve(hrefFor(group.tool.manifest.slug, record.id))}>{record.title}</a>
					{#if group.tool.definition.workflow}
						<span class="state">{stateLabel(group.tool.definition, record.state, locale)}</span>
					{/if}
				</li>
			{/each}
		</ul>
	{/each}
</section>

<style>
	.links {
		padding-top: 2rem;

		& h3 {
			margin-top: 0.75rem;
			font-size: 16px;
		}

		& ul {
			list-style: none;
			margin-top: 0.4rem;
		}

		& li {
			display: flex;
			flex-wrap: wrap;
			gap: 0.25rem 1rem;
			align-items: baseline;
			padding: 0.45rem 0;
			border-bottom: 1px solid var(--rule2);
			font-family: var(--serif);
			font-size: 15px;
		}
	}

	.state {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--navy);
	}
</style>
