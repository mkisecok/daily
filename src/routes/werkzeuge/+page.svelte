<!--
	@component
	The tool catalogue as a bento: the tool opened last (or a good first one)
	as a large card, pinned, recent and often used tools beside it, then every
	tool as a compact tile with its own icon. Above them, "Was steht an?" opens
	the tool for a situation, and visitors who have not opened a tool yet see
	three first steps. Recent and pinned tools live in this browser only. A
	search or an area chip hides the situations and the bento and narrows the
	tiles; the full legal basis stays on each tool's own page.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { categories, tools } from '#lib/tools/registry.js';
	import { text } from '#lib/tools/i18n.js';
	import { AREA_ICONS, toolIcon } from '#lib/tools/icons.js';
	import { PINNED_KEY, RECENT_KEY, readList, togglePin, writeList } from '#lib/tools/shelf.js';
	import { SITUATIONS, SITUATIONS_SHOWN } from '#lib/tools/situations.js';
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

	/** the first card before anything was opened, then the side cards' fallbacks */
	const START = 'vvt';
	const SUGGESTED = ['dsfa', 'datenpanne', 'risikoklassifizierung', 'dsfa-schwellwert'];
	/** tiles keep tools of one kind together: checks, registers, cases, browser tools */
	const SHAPES: ToolShape[] = ['questionnaire', 'register', 'workflow', 'utility'];

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
	const sorted = tools.toSorted((a, b) => SHAPES.indexOf(a.shape) - SHAPES.indexOf(b.shape));
	const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
	const openable = (slug: string | undefined) => {
		const tool = slug ? bySlug.get(slug) : undefined;
		return tool && tool.status !== 'planned' ? tool : undefined;
	};
	const href = (tool: ToolManifest) => resolve(localized(`/werkzeuge/${tool.slug}`));

	/** three steps for someone new: what most organisations need first */
	const FIRST_STEPS = [
		{ label: m.tools_step_vvt, path: '/werkzeuge/vvt/eintraege?neu=1' },
		{ label: m.tools_step_tom, path: '/werkzeuge/tom-katalog/eintraege?neu=1' },
		{ label: m.tools_step_deadlines, path: '/fristen' }
	] as const;

	let query = $state('');
	let allSituations = $state(false);
	let area = $state<ToolCategory | null>(null);
	let recent = $state<string[]>([]);
	let pinned = $state<string[]>([]);

	$effect(() => {
		recent = readList(RECENT_KEY);
		pinned = readList(PINNED_KEY);
	});

	function pin(slug: string) {
		pinned = togglePin(pinned, slug);
		writeList(PINNED_KEY, pinned);
	}

	const needle = $derived(normalise(query));
	const browsing = $derived(needle === '' && area === null);
	const visible = $derived(
		sorted.filter(
			(tool) =>
				(area === null || tool.category === area) &&
				(needle === '' || haystack.get(tool.slug)!.includes(needle))
		)
	);
	const inArea = (category: ToolCategory) =>
		tools.filter((tool) => tool.category === category).length;

	const lead = $derived(openable(recent[0]) ?? bySlug.get(START)!);
	const side = $derived.by(() => {
		const slugs = [...new Set([...pinned, ...recent.slice(1), ...SUGGESTED])];
		return slugs
			.filter((slug) => slug !== lead.slug)
			.map(openable)
			.filter((tool) => tool !== undefined)
			.slice(0, pinned.length > 0 ? 4 : 3);
	});
	const sideLabel = (slug: string) =>
		pinned.includes(slug)
			? m.tools_pinned()
			: recent.includes(slug)
				? m.tools_recent()
				: m.tools_suggested();
</script>

<svelte:head>
	<title>{m.nav_tools()} — Daily</title>
	<meta name="description" content={m.tools_intro()} />
</svelte:head>

<PageHeader title={m.nav_tools()} description={m.tools_intro()}>
	{#snippet actions()}
		<label class="search">
			<Icon name="search" size={18} />
			<input
				type="search"
				aria-label={m.tools_search_label()}
				placeholder={m.tools_search_placeholder()}
				bind:value={query}
			/>
		</label>
	{/snippet}
</PageHeader>

{#if browsing}
	<section class="situations" aria-labelledby="situations-title">
		<h2 id="situations-title">{m.tools_situations_title()}</h2>
		<ul id="situation-list">
			{#each allSituations ? SITUATIONS : SITUATIONS.slice(0, SITUATIONS_SHOWN) as situation (situation.id)}
				{@const tool = bySlug.get(situation.tool)!}
				<li>
					<a class="situation" href={href(tool)} data-area={tool.category}>
						<span class="icon"><Icon name={situation.icon} size={18} /></span>
						<span class="text">
							<strong>{text(situation.label)}</strong>
							<span class="target">{text(tool.name)}</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
		<button
			type="button"
			class="more"
			aria-expanded={allSituations}
			aria-controls="situation-list"
			onclick={() => (allSituations = !allSituations)}
		>
			{allSituations ? m.tools_situations_less() : m.tools_situations_more()}
			<Icon name={allSituations ? 'chevron-up' : 'chevron-down'} size={16} />
		</button>
		{#if recent.length === 0}
			<nav class="first-steps" aria-label={m.tools_first_steps_label()}>
				<span class="label">{m.tools_first_steps()}</span>
				<ol>
					{#each FIRST_STEPS as step (step.path)}
						<li><a href={resolve(localized(step.path))}>{step.label()}</a></li>
					{/each}
				</ol>
			</nav>
		{/if}
	</section>

	<section class="bento" aria-label={m.tools_recent()}>
		<a class="feature" href={href(lead)} data-area={lead.category}>
			<span class="label">{recent[0] === lead.slug ? m.tools_recent() : m.tools_start()}</span>
			<span class="icon"><Icon name={toolIcon(lead.slug)} size={28} /></span>
			<span class="text">
				<strong>{text(lead.name)}</strong>
				<span class="summary">{text(lead.summary)}</span>
			</span>
			<span class="go"
				>{recent[0] === lead.slug ? m.tools_continue() : m.tools_open()}
				<Icon name="arrow-right" size={16} /></span
			>
		</a>
		{#each side as tool (tool.slug)}
			<a class="side" href={href(tool)} data-area={tool.category}>
				<span class="label">{sideLabel(tool.slug)}</span>
				<span class="icon"><Icon name={toolIcon(tool.slug)} size={22} /></span>
				<strong>{text(tool.name)}</strong>
				<span class="summary">{text(tool.summary)}</span>
			</a>
		{/each}
		{#if pinned.length === 0}
			<p class="side hint"><Icon name="pin" size={20} />{m.tools_pin_hint()}</p>
		{/if}
	</section>
{/if}

<section class="catalogue">
	<div class="filters">
		<h2>{m.tools_all()} <span class="count">{visible.length}</span></h2>
		<div class="chips" role="group" aria-label={m.tools_filter_label()}>
			<button type="button" class="chip" aria-pressed={area === null} onclick={() => (area = null)}>
				{m.tools_filter_all()} <span class="count">{tools.length}</span>
			</button>
			{#each categories as category (category)}
				<button
					type="button"
					class="chip"
					data-area={category}
					aria-pressed={area === category}
					onclick={() => (area = area === category ? null : category)}
				>
					<Icon name={AREA_ICONS[category]} size={16} />
					{areaLabel[category]()} <span class="count">{inArea(category)}</span>
				</button>
			{/each}
		</div>
	</div>

	{#if visible.length > 0}
		<ul class="tiles">
			{#each visible as tool (tool.slug)}
				{@const isPinned = pinned.includes(tool.slug)}
				<li class="tile" data-area={tool.category} data-status={tool.status}>
					<span class="icon"><Icon name={toolIcon(tool.slug)} size={20} /></span>
					<span class="text">
						{#if tool.status === 'planned'}
							<span class="name">{text(tool.name)}</span>
						{:else}
							<a class="name" href={href(tool)}>{text(tool.name)}</a>
						{/if}
						<span class="meta">
							{mainBasis(tool)}
							{#if tool.status !== 'stable'}<StatusBadge status={tool.status} />{/if}
						</span>
					</span>
					{#if tool.status !== 'planned'}
						<button
							type="button"
							class="pin"
							aria-pressed={isPinned}
							aria-label={isPinned
								? m.tools_unpin({ name: text(tool.name) })
								: m.tools_pin({ name: text(tool.name) })}
							onclick={() => pin(tool.slug)}
						>
							<Icon name={isPinned ? 'pinned' : 'pin'} size={16} />
						</button>
					{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty" role="status">{m.tools_empty({ query: query.trim() })}</p>
	{/if}
</section>

<style>
	/* each area tints its icons; set on cards, tiles and chips alike */
	[data-area] {
		--area: var(--ink3);
		--area-soft: var(--neutral-soft);

		&[data-area='datenschutz'] {
			--area: var(--area-datenschutz);
			--area-soft: var(--area-datenschutz-soft);
		}

		&[data-area='ki'] {
			--area: var(--area-ki);
			--area-soft: var(--area-ki-soft);
		}

		&[data-area='audit'] {
			--area: var(--area-audit);
			--area-soft: var(--area-audit-soft);
		}

		&[data-area='entwickler'] {
			--area: var(--area-entwickler);
			--area-soft: var(--area-entwickler-soft);
		}
	}

	.icon {
		display: grid;
		flex: none;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		color: var(--area);
		background: var(--area-soft);
		border-radius: 10px;
	}

	.label {
		font-size: 11.5px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink3);
	}

	.count {
		font-family: var(--mono);
		font-size: 12px;
		font-weight: 400;
		color: var(--ink3);
	}

	.search {
		position: relative;
		display: block;
		width: 22rem;
		max-width: 100%;

		& :global(svg) {
			position: absolute;
			top: 50%;
			left: 0.8rem;
			color: var(--ink3);
			transform: translateY(-50%);
			pointer-events: none;
		}

		& input {
			width: 100%;
			min-height: 2.75rem;
			padding-left: 2.5rem;
			border-radius: var(--radius-card);
		}
	}

	/* situations as small link cards; the first steps as a numbered line below */
	.situations {
		display: grid;
		gap: 0.875rem;
		margin-bottom: 2.25rem;

		& h2 {
			font-size: 20px;
		}

		& ul {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 1fr));
			gap: 0.625rem;
			list-style: none;

			/* two compact columns on a phone, so the tools stay within reach */
			@media (max-width: 40rem) {
				grid-template-columns: repeat(2, minmax(0, 1fr));
				gap: 0.5rem;
			}
		}

		& .more {
			justify-self: start;
			display: inline-flex;
			align-items: center;
			gap: 0.4rem;
			padding: 0;
			font-size: 14px;
			color: var(--navy);
			background: none;
			border: 0;
			cursor: pointer;

			&:hover {
				text-decoration: underline;
			}
		}
	}

	.situation {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		height: 100%;
		padding: 0.75rem 0.875rem;
		color: var(--ink);
		text-decoration: none;
		background: var(--sheet);
		border: 1px solid var(--rule2);
		border-radius: 12px;
		transition: border-color 0.15s ease;

		&:hover {
			text-decoration: none;
			border-color: var(--area);
		}

		& .icon {
			width: 2.25rem;
			height: 2.25rem;
		}

		& .text {
			display: grid;
			gap: 0.1rem;
			min-width: 0;
		}

		& strong {
			font-size: 14px;
			font-weight: 600;
			line-height: 1.3;
		}

		& .target {
			font-size: 12.5px;
			color: var(--ink3);
		}

		@media (max-width: 40rem) {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
			padding: 0.75rem;

			& strong {
				font-size: 13.5px;
			}

			& .target {
				display: none;
			}
		}
	}

	.first-steps {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem 1rem;

		& ol {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem 1.25rem;
			padding: 0;
			list-style: none;
			counter-reset: step;

			@media (max-width: 40rem) {
				flex-direction: column;
			}
		}

		& li {
			counter-increment: step;

			&::before {
				content: counter(step) ' · ';
				font-family: var(--mono);
				font-size: 12px;
				color: var(--ink3);
			}
		}
	}

	/* one large card over two rows, four small ones in a 2 × 2 beside it */
	.bento {
		display: grid;
		grid-template-columns: minmax(0, 2fr) repeat(2, minmax(0, 1fr));
		grid-template-rows: repeat(2, minmax(9.5rem, auto));
		gap: 0.875rem;
		margin-bottom: 2.5rem;

		@media (max-width: 64rem) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			grid-template-rows: none;
		}

		@media (max-width: 40rem) {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	.feature,
	.side {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 1.25rem;
		color: var(--ink);
		text-decoration: none;
		background: var(--sheet);
		border: 1px solid var(--rule2);
		border-radius: 16px;
		box-shadow: var(--shadow-raised);
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			border-color 0.15s ease;

		& strong {
			font-size: 16px;
			font-weight: 650;
			line-height: 1.3;
		}

		& .summary {
			display: -webkit-box;
			overflow: hidden;
			font-size: 13.5px;
			line-height: 1.45;
			color: var(--ink2);
			-webkit-line-clamp: 3;
			line-clamp: 3;
			-webkit-box-orient: vertical;
		}

		&:focus-visible {
			outline: none;
			box-shadow:
				0 0 0 3px var(--navy-soft),
				0 0 0 1px var(--navy);
		}
	}

	/* on phones the small cards shrink to a row: icon, label and name */
	@media (max-width: 40rem) {
		.side:not(.hint) {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr);
			align-items: center;
			gap: 0.1rem 0.85rem;
			padding: 0.9rem 1rem;

			& .icon {
				grid-row: span 2;
			}

			& .summary {
				display: none;
			}
		}
	}

	a.side:hover {
		border-color: var(--area);
		box-shadow: var(--shadow-float);
		transform: translateY(-2px);
	}

	.feature {
		--feature-from: #1e40af;
		--feature-to: #3b6ae0;

		grid-row: span 2;
		justify-content: space-between;
		color: #fff;
		background: linear-gradient(135deg, var(--feature-from), var(--feature-to));
		border: 0;

		& .label {
			color: rgba(255, 255, 255, 0.75);
		}

		& .icon {
			width: 3.25rem;
			height: 3.25rem;
			color: #fff;
			background: rgba(255, 255, 255, 0.16);
			border-radius: 14px;
		}

		& .text {
			display: grid;
			gap: 0.4rem;
		}

		& strong {
			font-size: clamp(20px, 2.2vw, 25px);
			font-weight: 700;
			letter-spacing: -0.01em;
		}

		& .summary {
			max-width: 52ch;
			font-size: 14px;
			color: rgba(255, 255, 255, 0.85);
		}

		& .go {
			display: inline-flex;
			align-items: center;
			align-self: flex-start;
			gap: 0.4rem;
			min-height: 2.25rem;
			padding: 0 0.9rem;
			font-weight: 600;
			color: var(--feature-from);
			background: #fff;
			border-radius: var(--radius);
		}

		&:hover {
			box-shadow: 0 12px 32px rgba(30, 64, 175, 0.35);
			transform: translateY(-2px);
		}

		@media (max-width: 64rem) {
			grid-column: 1 / -1;
			grid-row: auto;
			min-height: 15rem;
		}
	}

	:global(html[data-theme='dark']) .feature {
		--feature-from: #1d3a99;
		--feature-to: #4361d8;

		&:hover {
			box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
		}
	}

	.side.hint {
		align-items: center;
		justify-content: center;
		font-size: 13.5px;
		color: var(--ink3);
		text-align: center;
		background: transparent;
		border: 1px dashed var(--rule);
		box-shadow: none;
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem 1.25rem;
		margin-bottom: 1rem;

		& h2 {
			display: flex;
			align-items: baseline;
			gap: 0.5rem;
			font-size: 19px;
		}
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 2.25rem;
		padding: 0 0.85rem;
		font: inherit;
		font-size: 13.5px;
		font-weight: 500;
		color: var(--ink2);
		background: var(--sheet);
		border: 1px solid var(--rule);
		border-radius: 999px;
		cursor: pointer;

		& :global(svg) {
			color: var(--area);
		}

		&:hover {
			border-color: var(--primary);
		}

		&:focus-visible {
			outline: none;
			box-shadow: 0 0 0 3px var(--navy-soft);
		}

		&[aria-pressed='true'] {
			color: var(--on-primary);
			background: var(--primary);
			border-color: var(--primary);

			& :global(svg),
			& .count {
				color: inherit;
			}
		}
	}

	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15.5rem, 1fr));
		gap: 0.625rem;
		padding: 0;
		list-style: none;
	}

	/* the name's link covers the tile; the pin sits above it */
	.tile {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-height: 4.25rem;
		padding: 0.7rem 0.75rem;
		background: var(--sheet);
		border: 1px solid var(--rule2);
		border-radius: var(--radius-card);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;

		& .icon {
			width: 2.25rem;
			height: 2.25rem;
			border-radius: 9px;
		}

		& .text {
			display: grid;
			flex: 1;
			min-width: 0;
		}

		& .name {
			font-size: 14px;
			font-weight: 600;
			line-height: 1.3;
			color: var(--ink);
			text-decoration: none;
			hyphens: auto;
			overflow-wrap: break-word;

			&::after {
				position: absolute;
				inset: 0;
				content: '';
				border-radius: inherit;
			}

			&:focus-visible {
				outline: none;
			}
		}

		& .meta {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.2rem 0.45rem;
			margin-top: 0.1rem;
			font-size: 12px;
			color: var(--ink3);

			& :global(.badge) {
				font-size: 10.5px;
			}
		}

		&:hover {
			border-color: var(--area);
			box-shadow: var(--shadow-raised);
		}

		&:has(.name:focus-visible) {
			box-shadow: 0 0 0 2px var(--navy);
		}

		&[data-status='planned'] .name {
			color: var(--ink2);
		}
	}

	.pin {
		position: relative;
		z-index: 1;
		display: grid;
		flex: none;
		place-items: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		color: var(--ink3);
		background: transparent;
		border: 0;
		border-radius: var(--radius);
		cursor: pointer;
		opacity: 0;

		&:hover {
			color: var(--primary);
			background: var(--primary-soft);
		}

		&:focus-visible {
			outline: none;
			opacity: 1;
			box-shadow: 0 0 0 2px var(--navy);
		}

		&[aria-pressed='true'] {
			color: var(--primary);
			opacity: 1;
		}

		.tile:hover & {
			opacity: 1;
		}

		@media (hover: none) {
			opacity: 1;
		}
	}

	.empty {
		padding: 1.5rem 0;
		color: var(--ink2);
	}
</style>
