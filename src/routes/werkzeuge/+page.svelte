<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { localized } from '#lib/i18n/links.js';
	import { categories, toolsByCategory } from '#lib/tools/registry.js';
	import { text } from '#lib/tools/i18n.js';
	import type { ToolCategory } from '#lib/tools/types.js';
	import Citation from '#lib/tools/_shared/Citation.svelte';
	import StatusBadge from '#lib/tools/_shared/StatusBadge.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';

	const labels: Record<ToolCategory, () => string> = {
		datenschutz: m.category_datenschutz,
		ki: m.category_ki,
		audit: m.category_audit,
		entwickler: m.category_entwickler
	};

	const numerals = ['I', 'II', 'III', 'IV'];
</script>

<svelte:head>
	<title>{m.nav_tools()} — Daily</title>
	<meta name="description" content={m.tools_intro()} />
</svelte:head>

<PageHeader title={m.nav_tools()} description={m.tools_intro()} />

{#each categories as category, index (category)}
	<section class="group">
		<h2><span class="numeral">{numerals[index]}.</span> {labels[category]()}</h2>
		<ol class="list">
			{#each toolsByCategory(category) as tool, position (tool.slug)}
				<li class="tool card index" data-area={category} data-status={tool.status}>
					<div class="meta">
						<span class="chapter">{numerals[index]}.{position + 1}</span>
						<StatusBadge status={tool.status} />
					</div>
					<div class="name">
						{#if tool.status === 'planned'}
							<span class="title">{text(tool.name)}</span>
						{:else}
							<a class="title" href={resolve(localized(`/werkzeuge/${tool.slug}`))}
								>{text(tool.name)}</a
							>
						{/if}
					</div>
					<p class="summary">{text(tool.summary)}</p>
					<ul class="basis">
						{#each tool.legalBasis as basis (basis.law + basis.ref)}
							<li class="cite-chip"><Citation {basis} /></li>
						{/each}
					</ul>
				</li>
			{/each}
		</ol>
	</section>
{/each}

<style>
	.group {
		padding: 0.5rem 0 2rem;

		& h2 {
			display: flex;
			align-items: baseline;
			gap: 0.6rem;
			font-size: 20px;

			& .numeral {
				font-family: var(--mono);
				font-size: 13px;
				font-weight: 500;
				color: var(--ink3);
			}
		}

		/* cards on a shared row grid, so names, summaries and citations line up across a row */
		& .list {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
			gap: 1rem;
			margin-top: 1rem;
			list-style: none;

			& .tool {
				display: grid;
				grid-row: span 4;
				grid-template-rows: subgrid;
				gap: 0.6rem;
				transition:
					border-color 0.12s ease,
					box-shadow 0.12s ease;

				&:hover {
					border-color: var(--rule);
					box-shadow:
						inset 4px 0 0 var(--spine),
						var(--shadow-float);
				}

				&:has(.title:focus-visible) {
					border-color: var(--navy);
					/* keep the area spine next to the focus ring */
					box-shadow:
						inset 4px 0 0 var(--spine),
						0 0 0 3px var(--navy-soft);
				}

				& .meta {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 0.75rem;

					& .chapter {
						font-family: var(--mono);
						font-size: 12px;
						letter-spacing: 0.04em;
						color: var(--spine);
					}
				}

				& .name {
					display: flex;
					align-items: baseline;
				}

				& .title {
					font-family: var(--serif);
					font-size: 18px;
					font-weight: 600;
					line-height: 1.25;
					color: var(--ink);

					&:focus-visible {
						outline: none;
					}
				}

				& .summary {
					font-size: 14px;
					color: var(--ink2);
				}

				& .basis {
					display: flex;
					flex-wrap: wrap;
					align-content: flex-end;
					gap: 0.35rem;
					padding-top: 0.7rem;
					list-style: none;
					border-top: 1px solid var(--rule2);

					& .cite-chip {
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

				&[data-status='planned'] {
					& .title {
						color: var(--ink2);
					}

					& .summary {
						color: var(--ink3);
					}
				}
			}
		}
	}
</style>
