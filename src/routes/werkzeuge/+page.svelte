<script lang="ts">
	import type { Path } from '$app/types';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { categories, toolsByCategory } from '#lib/tools/registry.js';
	import { text } from '#lib/tools/i18n.js';
	import type { ToolCategory } from '#lib/tools/types.js';
	import Citation from '#lib/tools/_shared/Citation.svelte';
	import StatusBadge from '#lib/tools/_shared/StatusBadge.svelte';

	const labels: Record<ToolCategory, () => string> = {
		datenschutz: m.category_datenschutz,
		ki: m.category_ki,
		audit: m.category_audit,
		entwickler: m.category_entwickler
	};

	const numerals = ['I.', 'II.', 'III.', 'IV.'];
</script>

<svelte:head>
	<title>{m.nav_tools()} — Daily</title>
	<meta name="description" content={m.tools_intro()} />
</svelte:head>

<header class="head">
	<h1>{m.nav_tools()}</h1>
	<p class="measure lead">{m.tools_intro()}</p>
</header>

{#each categories as category, index (category)}
	<section class="group">
		<h2><span class="numeral">{numerals[index]}</span> {labels[category]()}</h2>
		<ol class="list">
			{#each toolsByCategory(category) as tool (tool.slug)}
				<li class="tool" data-status={tool.status}>
					<div class="name">
						{#if tool.status === 'planned'}
							<span class="title">{text(tool.name)}</span>
						{:else}
							<a class="title" href={resolve(`/werkzeuge/${tool.slug}` as Path)}
								>{text(tool.name)}</a
							>
						{/if}
						<StatusBadge status={tool.status} />
					</div>
					<p class="summary">{text(tool.summary)}</p>
					<p class="basis">
						{#each tool.legalBasis as basis, i (basis.law + basis.ref)}
							{#if i > 0}<span class="sep">·</span>{/if}
							<Citation {basis} />
						{/each}
					</p>
				</li>
			{/each}
		</ol>
	</section>
{/each}

<style>
	.head {
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--rule);

		& h1 {
			font-size: clamp(30px, 4vw, 40px);
		}

		& .lead {
			margin-top: 1rem;
			font-size: 17px;
			color: var(--ink2);
		}
	}

	.group {
		padding: 2.5rem 0 1rem;

		& h2 {
			font-size: 22px;
			padding-bottom: 0.75rem;
			border-bottom: 1px solid var(--rule);
		}

		& .numeral {
			color: var(--ink3);
			margin-right: 0.5rem;
		}
	}

	.list {
		list-style: none;
	}

	.tool {
		display: grid;
		grid-template-columns: minmax(14rem, 18rem) 1fr;
		gap: 0.5rem 2.5rem;
		padding: 1.25rem 0;
		border-bottom: 1px solid var(--rule2);

		@media (max-width: 48rem) {
			grid-template-columns: 1fr;
		}

		&[data-status='planned'] {
			& .title {
				color: var(--ink2);
			}

			& .summary {
				color: var(--ink3);
			}
		}

		& .name {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: 0.4rem;
		}

		& .title {
			font-family: var(--serif);
			font-size: 18px;
			font-weight: 600;
			color: var(--ink);
		}

		& .summary {
			font-size: 14px;
			color: var(--ink2);
			max-width: var(--measure);
		}

		& .basis {
			grid-column: 2;
			display: flex;
			flex-wrap: wrap;
			gap: 0.6rem;

			@media (max-width: 48rem) {
				grid-column: 1;
			}
		}

		& .sep {
			color: var(--ink3);
		}
	}
</style>
