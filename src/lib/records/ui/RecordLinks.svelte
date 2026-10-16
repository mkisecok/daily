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

<section class="links card">
	<h2 class="eyebrow">{m.records_links()}</h2>
	{#each backlinks as group (group.tool.manifest.slug)}
		<h3>{text(group.tool.manifest.name)}</h3>
		<ul>
			{#each group.records as record (record.id)}
				<li>
					<a href={resolve(hrefFor(group.tool.manifest.slug, record.id))}>{record.title}</a>
					{#if group.tool.definition.workflow}
						<span class="state badge navy"
							>{stateLabel(group.tool.definition, record.state, locale)}</span
						>
					{/if}
				</li>
			{/each}
		</ul>
	{/each}
</section>

<style>
	.links {
		margin-top: 1.5rem;

		& h3 {
			margin-top: 0.9rem;
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
			align-items: center;
			justify-content: space-between;
			min-height: 44px;
			padding: 0.45rem 0;
			font-size: 15px;
			font-weight: 500;
			overflow-wrap: anywhere;
			border-bottom: 1px solid var(--rule2);

			&:last-child {
				border-bottom: 0;
			}
		}

		@media print {
			box-shadow: none;
		}
	}
</style>
