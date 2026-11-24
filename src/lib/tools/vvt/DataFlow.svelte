<!--
	@component
	The data flow of one processing activity as a UML activity diagram with
	swimlanes: who handles the data (lanes) at which stage of its life
	(columns), with arrows between the stations. Stations the entries leave
	open are marked, special categories are shaded, transfers to third
	countries drawn in the primary colour. The same content is offered as a
	list, which phones show first; the diagram downloads as SVG and prints
	on a landscape page of its own.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import Icon from '#lib/ui/Icon.svelte';
	import { innerWidth } from 'svelte/reactivity/window';
	import { text } from '../i18n.js';
	import { GRID, LANES, layout, shorten, STAGES, toSvg, type DataFlow } from './flow.js';

	let { flow, title }: { flow: DataFlow; title: string } = $props();

	const plan = $derived(layout(flow));
	const laneName = (id: string) => text(LANES.find((lane) => lane.id === id)!.label);
	const nameOf = (id: string) => flow.nodes.find((node) => node.id === id)?.title ?? id;

	/** the diagram shrinks to the card's width, but not below legibility; past that it scrolls */
	let canvasWidth = $state(0);
	const scale = $derived(canvasWidth ? Math.max(0.62, Math.min(1, canvasWidth / plan.width)) : 1);

	/** phones start with the list, wider screens with the diagram, until one is chosen */
	let chosen = $state<'diagramm' | 'liste' | null>(null);
	const view = $derived(chosen ?? ((innerWidth.current ?? 1024) < 640 ? 'liste' : 'diagramm'));

	/** per stage the stations, each with where its arrows lead */
	const byStage = $derived(
		STAGES.map((stage) => ({
			stage,
			nodes: flow.nodes
				.filter((node) => node.stage === stage.id)
				.map((node) => ({
					...node,
					targets: flow.edges.filter((edge) => edge.from === node.id).map((edge) => nameOf(edge.to))
				}))
		})).filter((group) => group.nodes.length > 0)
	);

	function download() {
		const svg = toSvg(flow, getLocale(), `${m.flow_title()}: ${title}`);
		const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = `datenfluss-${title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'export'}.svg`;
		link.click();
		URL.revokeObjectURL(url);
	}
</script>

<section class="flow card" aria-labelledby="flow-title">
	<div class="head">
		<div>
			<h2 id="flow-title">{m.flow_title()}</h2>
			<p class="intro">{m.flow_intro()}</p>
		</div>
		<div class="toolbar no-print">
			<div class="views" role="group" aria-label={m.flow_views()}>
				<button
					type="button"
					class="toggle"
					aria-pressed={view === 'diagramm'}
					onclick={() => (chosen = 'diagramm')}>{m.flow_view_diagram()}</button
				>
				<button
					type="button"
					class="toggle"
					aria-pressed={view === 'liste'}
					onclick={() => (chosen = 'liste')}>{m.flow_view_list()}</button
				>
			</div>
			<button type="button" class="quiet" onclick={download}>
				<Icon name="download" size={16} />{m.flow_export()}
			</button>
		</div>
	</div>

	{#if flow.warnings.length > 0}
		<div class="warnings" role="note">
			<p class="label">{m.flow_warnings()}</p>
			<ul>
				{#each flow.warnings as warning (warning.de)}<li>{text(warning)}</li>{/each}
			</ul>
		</div>
	{/if}

	<div class="canvas" class:hidden={view !== 'diagramm'} bind:clientWidth={canvasWidth}>
		<div class="fit" style:width="{plan.width * scale}px" style:height="{plan.height * scale}px">
			<div
				class="plane"
				role="img"
				aria-label={m.flow_label({ count: flow.nodes.length })}
				style:width="{plan.width}px"
				style:height="{plan.height}px"
				style:transform="scale({scale})"
			>
				<svg width={plan.width} height={plan.height} aria-hidden="true">
					<defs>
						{#each ['plain', 'transfer', 'warn'] as kind (kind)}
							<marker
								id="flow-arrow-{kind}"
								class="arrow {kind}"
								viewBox="0 0 10 10"
								refX="9"
								refY="5"
								markerWidth="7"
								markerHeight="7"
								orient="auto-start-reverse"
							>
								<path d="M0,0 L10,5 L0,10 z" />
							</marker>
						{/each}
					</defs>
					{#each STAGES as stage, i (stage.id)}
						<text class="stage" x={GRID.head + i * GRID.col + GRID.col / 2} y="20"
							>{text(stage.label)}</text
						>
					{/each}
					{#each plan.lanes as lane, i (lane.id)}
						<rect
							class="lane"
							class:odd={i % 2 === 1}
							x="0"
							y={lane.y}
							width={plan.width}
							height={lane.h}
						/>
						<text class="lane-name" x="10" y={lane.y + lane.h / 2 + 4}>{laneName(lane.id)}</text>
					{/each}
					{#each plan.paths as path, i (i)}
						{@const kind = path.tone ?? 'plain'}
						<path class="edge {kind}" d={path.d} marker-end="url(#flow-arrow-{kind})" />
						{#if path.label}
							<text class="edge-label {kind}" x={path.mid.x} y={path.mid.y - 5}
								>{shorten(path.label, 34)}</text
							>
						{/if}
					{/each}
				</svg>
				{#each plan.boxes as box (box.id)}
					<div
						class="box"
						data-tone={box.tone}
						style:left="{box.x}px"
						style:top="{box.y}px"
						style:width="{box.w}px"
						style:height="{box.h}px"
						title={box.detail ? `${box.title}: ${box.detail}` : box.title}
					>
						<strong>{box.title}</strong>
						{#if box.detail}<span>{box.detail}</span>{/if}
					</div>
				{/each}
			</div>
		</div>
		<p class="legend">
			<span class="key sensitive"></span>{m.flow_legend_sensitive()}
			<span class="key warn"></span>{m.flow_legend_warn()}
			<span class="key transfer"></span>{m.flow_legend_transfer()}
		</p>
	</div>

	<ol class="stages" class:hidden={view !== 'liste'}>
		{#each byStage as group (group.stage.id)}
			<li>
				<h3>{text(group.stage.label)}</h3>
				<ul>
					{#each group.nodes as node (node.id)}
						<li data-tone={node.tone}>
							<span class="lane-tag">{laneName(node.lane)}</span>
							<strong>{node.title}</strong>
							{#if node.detail}<span class="detail">{node.detail}</span>{/if}
							{#if node.targets.length > 0}
								<span class="targets">→ {m.flow_to({ targets: node.targets.join(', ') })}</span>
							{/if}
						</li>
					{/each}
				</ul>
			</li>
		{/each}
	</ol>
</section>

<style>
	.flow {
		display: grid;
		gap: 0.9rem;
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.5rem 1rem;

		& h2 {
			margin: 0;
		}

		& .intro {
			max-width: 46rem;
			margin: 0.25rem 0 0;
			font-size: 14px;
			color: var(--ink2);
		}
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.views {
		display: flex;
		gap: 0.3rem;
	}

	.toggle {
		padding: 0.25rem 0.7rem;
		font-size: 13px;
		color: var(--ink2);
		background: var(--sheet);
		border: 1px solid var(--rule);
		border-radius: 999px;

		&[aria-pressed='true'] {
			color: var(--on-primary);
			background: var(--primary);
			border-color: var(--primary);
		}
	}

	.warnings {
		padding: 0.6rem 0.8rem;
		background: var(--risk-high-soft);
		border-radius: var(--radius);

		& .label {
			margin: 0 0 0.2rem;
			font-size: 12px;
			font-weight: 600;
			color: var(--risk-high-ink);
		}

		& ul {
			margin: 0;
			padding-left: 1.1rem;
			font-size: 13.5px;
			color: var(--ink);
		}
	}

	/* above the display of .canvas and .stages, which would otherwise win */
	.flow .hidden {
		display: none;
	}

	.canvas {
		overflow-x: auto;
	}

	.fit {
		overflow: hidden;
	}

	.plane {
		position: relative;
		transform-origin: top left;
	}

	svg {
		position: absolute;
		inset: 0;

		& .stage {
			font-size: 12px;
			font-weight: 600;
			text-anchor: middle;
			fill: var(--ink2);
		}

		& .lane {
			fill: var(--paper);
			stroke: var(--rule2);

			&.odd {
				fill: var(--sheet);
			}
		}

		& .lane-name {
			font-size: 11.5px;
			font-weight: 600;
			fill: var(--ink2);
		}

		& .edge {
			fill: none;
			stroke: var(--ink3);
			stroke-width: 1.4;

			&.transfer {
				stroke: var(--primary);
			}

			&.warn {
				stroke: var(--risk-high);
				stroke-dasharray: 4 3;
			}
		}

		& .edge-label {
			font-size: 10px;
			text-anchor: middle;
			fill: var(--ink3);

			&.transfer {
				fill: var(--primary);
			}

			&.warn {
				fill: var(--risk-high-ink);
			}
		}

		& .arrow path {
			fill: var(--ink3);
		}

		& .arrow.transfer path {
			fill: var(--primary);
		}

		& .arrow.warn path {
			fill: var(--risk-high);
		}
	}

	.box {
		position: absolute;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.35rem 0.5rem;
		overflow: hidden;
		font-size: 11.5px;
		line-height: 1.3;
		background: var(--sheet);
		border: 1px solid var(--rule);
		border-radius: 8px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);

		& strong {
			overflow: hidden;
			font-size: 12px;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		& span {
			display: -webkit-box;
			overflow: hidden;
			color: var(--ink2);
			-webkit-line-clamp: 2;
			line-clamp: 2;
			-webkit-box-orient: vertical;
		}

		&[data-tone='sensitive'] {
			background: var(--risk-mid-soft);
			border-color: var(--risk-mid);
		}

		&[data-tone='warn'] {
			background: var(--risk-high-soft);
			border-color: var(--risk-high);
		}
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem 0.9rem;
		margin: 0.5rem 0 0;
		font-size: 12px;
		color: var(--ink3);

		& .key {
			display: inline-block;
			width: 0.9rem;
			height: 0.6rem;
			margin-right: -0.5rem;
			border-radius: 2px;

			&.sensitive {
				background: var(--risk-mid-soft);
				border: 1px solid var(--risk-mid);
			}

			&.warn {
				background: var(--risk-high-soft);
				border: 1px solid var(--risk-high);
			}

			&.transfer {
				height: 2px;
				background: var(--primary);
			}
		}
	}

	.stages {
		display: grid;
		gap: 0.8rem;
		margin: 0;
		padding: 0;
		list-style: none;

		& h3 {
			margin: 0 0 0.3rem;
			font-size: 14px;
		}

		& ul {
			display: grid;
			gap: 0.35rem;
			margin: 0;
			padding: 0;
			list-style: none;
		}

		& ul li {
			display: grid;
			gap: 0.1rem;
			padding: 0.45rem 0.6rem;
			font-size: 13.5px;
			border: 1px solid var(--rule2);
			border-left: 3px solid var(--rule);
			border-radius: 6px;

			&[data-tone='sensitive'] {
				border-left-color: var(--risk-mid);
			}

			&[data-tone='warn'] {
				border-left-color: var(--risk-high);
			}
		}

		& .lane-tag {
			font-size: 11.5px;
			font-weight: 600;
			color: var(--ink3);
			text-transform: uppercase;
			letter-spacing: 0.04em;
		}

		& .detail {
			color: var(--ink2);
		}

		& .targets {
			font-size: 12.5px;
			color: var(--ink3);
		}
	}

	@media print {
		/* the diagram on a landscape page of its own, whatever the view on screen */
		@page flow {
			size: A4 landscape;
			margin: 12mm;
		}

		.flow {
			page: flow;
			padding: 0;
			box-shadow: none;
			border: 0;
			print-color-adjust: exact;
		}

		.flow .canvas.hidden {
			display: block;
		}

		.canvas {
			overflow: visible;
		}

		.flow .stages {
			display: none;
		}
	}
</style>
