<!--
	@component
	The tool catalogue, grouped by what the tool is for: a one-off check, a
	register kept over time, a case with a deadline, or a tool that runs in the
	browser. A search field and area chips narrow the list; the full legal
	basis stays on each tool's own page.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { categories, tools } from '#lib/tools/registry.js';
	import { text } from '#lib/tools/i18n.js';
	import type { ToolCategory, ToolManifest, ToolShape } from '#lib/tools/types.js';
	import StatusBadge from '#lib/tools/_shared/StatusBadge.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';

	const areaLabel: Record<ToolCategory, () => string> = {
		datenschutz: m.category_datenschutz,
		ki: m.category_ki,
		audit: m.category_audit,
		entwickler: m.category_entwickler
	};

	const tasks: { shape: ToolShape; title: () => string; hint: () => string }[] = [
		{ shape: 'questionnaire', title: m.tools_task_check, hint: m.tools_task_check_hint },
		{ shape: 'register', title: m.tools_task_register, hint: m.tools_task_register_hint },
		{ shape: 'workflow', title: m.tools_task_case, hint: m.tools_task_case_hint },
		{ shape: 'utility', title: m.tools_task_browser, hint: m.tools_task_browser_hint }
	];

	/** the first legal basis without paragraph detail: "Art. 35 DSGVO" */
	function mainBasis(tool: ToolManifest): string {
		const basis = tool.legalBasis[0];
		return basis ? `${basis.ref.replace(/\s+Abs\..*$/, '')} ${basis.law}` : '';
	}

	const normalise = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

	/** name, summary and every citation, so a search for "Art. 35" finds its tools */
	const haystack = new Map(
		tools.map((tool) => [
			tool.slug,
			normalise(
				[
					text(tool.name),
					text(tool.summary),
					...tool.legalBasis.map((basis) => `${basis.ref} ${basis.law}`)
				].join(' ')
			)
		])
	);

	let query = $state('');
	let area = $state<ToolCategory | null>(null);

	const needle = $derived(normalise(query));
	const visible = $derived(
		tools.filter(
			(tool) =>
				(area === null || tool.category === area) &&
				(needle === '' || haystack.get(tool.slug)!.includes(needle))
		)
	);
	const inArea = (category: ToolCategory) =>
		tools.filter((tool) => tool.category === category).length;
</script>

<svelte:head>
	<title>{m.nav_tools()} — Daily</title>
	<meta name="description" content={m.tools_intro()} />
</svelte:head>

<PageHeader title={m.nav_tools()} description={m.tools_intro()} />

<div class="filters">
	<label class="search">
		<Icon name="search" size={16} />
		<input
			type="search"
			aria-label={m.tools_search_label()}
			placeholder={m.tools_search_placeholder()}
			bind:value={query}
		/>
	</label>
	<div class="chips" role="group" aria-label={m.tools_filter_label()}>
		<button type="button" class="chip" aria-pressed={area === null} onclick={() => (area = null)}>
			{m.tools_filter_all()} <span class="count">{tools.length}</span>
		</button>
		{#each categories as category (category)}
			<button
				type="button"
				class="chip"
				aria-pressed={area === category}
				onclick={() => (area = area === category ? null : category)}
			>
				{areaLabel[category]()} <span class="count">{inArea(category)}</span>
			</button>
		{/each}
	</div>
</div>

{#each tasks as task (task.shape)}
	{@const list = visible.filter((tool) => tool.shape === task.shape)}
	{#if list.length > 0}
		<section class="group">
			<h2>{task.title()} <span class="count">{list.length}</span></h2>
			<p class="hint">{task.hint()}</p>
			<ul class="rows card">
				{#each list as tool (tool.slug)}
					<li class="tool" data-area={tool.category} data-status={tool.status}>
						{#if tool.status === 'planned'}
							<span class="name">{text(tool.name)}</span>
						{:else}
							<a class="name" href={resolve(localized(`/werkzeuge/${tool.slug}`))}
								>{text(tool.name)}</a
							>
						{/if}
						<span class="summary">{text(tool.summary)}</span>
						<span class="meta">
							{areaLabel[tool.category]()} · {mainBasis(tool)}
							{#if tool.status !== 'stable'}<StatusBadge status={tool.status} />{/if}
						</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{/each}

{#if visible.length === 0}
	<p class="empty" role="status">{m.tools_empty({ query: query.trim() })}</p>
{/if}

<style>
	.filters {
		display: grid;
		gap: 0.75rem;
		margin-bottom: 1.75rem;
	}

	/* the field keeps the global input look; the icon sits on top of it */
	.search {
		position: relative;
		display: block;
		max-width: 28rem;

		& :global(svg) {
			position: absolute;
			top: 50%;
			left: 0.75rem;
			color: var(--ink3);
			transform: translateY(-50%);
			pointer-events: none;
		}

		& input {
			width: 100%;
			padding-left: 2.25rem;
		}
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.chip {
		min-height: 2rem;
		padding: 0 0.8rem;
		font: inherit;
		font-size: 13.5px;
		color: var(--ink2);
		background: var(--sheet);
		border: 1px solid var(--rule);
		border-radius: 999px;
		cursor: pointer;

		&:hover {
			border-color: var(--navy);
		}

		&:focus-visible {
			outline: none;
			box-shadow: 0 0 0 3px var(--navy-soft);
		}

		&[aria-pressed='true'] {
			color: var(--on-navy);
			background: var(--navy);
			border-color: var(--navy);

			& .count {
				color: inherit;
			}
		}
	}

	.count {
		font-family: var(--mono);
		font-size: 12px;
		font-weight: 400;
		color: var(--ink3);
	}

	.group {
		padding-bottom: 1.75rem;

		& h2 {
			display: flex;
			align-items: baseline;
			gap: 0.5rem;
			font-size: 19px;
		}
	}

	.hint {
		margin-top: 0.15rem;
		font-size: 13.5px;
		color: var(--ink3);
	}

	.rows {
		margin-top: 0.6rem;
		padding: 0;
		overflow: hidden;
		list-style: none;
	}

	/* one row per tool; the inset shadow draws the area's colour spine */
	.tool {
		--spine: var(--ink3);

		display: grid;
		grid-template-columns: minmax(12rem, 17rem) minmax(0, 1fr) auto;
		align-items: baseline;
		gap: 0.2rem 1.25rem;
		padding: 0.7rem 1rem 0.7rem 1.15rem;
		border-bottom: 1px solid var(--rule2);
		box-shadow: inset 3px 0 0 var(--spine);

		&:last-child {
			border-bottom: 0;
		}

		&[data-area='datenschutz'] {
			--spine: var(--navy);
		}

		&[data-area='ki'] {
			--spine: var(--wax);
		}

		&[data-area='audit'] {
			--spine: var(--khaki);
		}

		&:hover {
			background: var(--sheet);
		}

		&:has(.name:focus-visible) {
			box-shadow:
				inset 3px 0 0 var(--spine),
				inset 0 0 0 2px var(--navy);
		}

		& .name {
			font-family: var(--serif);
			font-size: 16px;
			font-weight: 600;
			line-height: 1.3;
			color: var(--ink);
			text-decoration: none;

			&:hover {
				text-decoration: underline;
				text-underline-offset: 0.18em;
			}

			&:focus-visible {
				outline: none;
			}
		}

		& .summary {
			overflow: hidden;
			font-size: 13.5px;
			color: var(--ink2);
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		& .meta {
			display: flex;
			align-items: center;
			gap: 0.4rem;
			font-size: 12.5px;
			color: var(--ink3);
			white-space: nowrap;
		}

		&[data-status='planned'] .name {
			color: var(--ink2);
		}

		@media (max-width: 48rem) {
			grid-template-columns: minmax(0, 1fr);

			& .summary {
				display: -webkit-box;
				white-space: normal;
				-webkit-line-clamp: 2;
				line-clamp: 2;
				-webkit-box-orient: vertical;
			}

			& .meta {
				flex-wrap: wrap;
				white-space: normal;
			}
		}
	}

	.empty {
		padding: 1.5rem 0;
		color: var(--ink2);
	}
</style>
