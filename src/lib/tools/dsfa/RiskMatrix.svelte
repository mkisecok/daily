<!--
	@component
	The DSK risk matrix: severity up, likelihood across, the three bands drawn
	as curves the way Kurzpapier Nr. 18 shows them. Each risk sits as a
	numbered marker in the centre of its cell; several in one cell spread out.
	`filled` draws the markers solid (residual risk) instead of hollow.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { text } from '../i18n.js';
	import { SCALE, type Rating } from './definition.js';

	let {
		points,
		filled = false,
		label
	}: {
		points: { n: number; rating: Rating }[];
		filled?: boolean;
		/** accessible name: the phase and every risk with its rating */
		label: string;
	} = $props();

	const CELL = 100;
	const GAP = 32;

	/** marker positions in the 400 × 400 plot, at most three in a row per cell */
	const placed = $derived.by(() => {
		const cells: Record<string, { n: number; rating: Rating }[]> = {};
		for (const point of points) {
			(cells[`${point.rating.likelihood},${point.rating.severity}`] ??= []).push(point);
		}
		return Object.values(cells).flatMap((group) => {
			const rows = Math.ceil(group.length / 3);
			return group.map((point, index) => {
				const row = Math.floor(index / 3);
				const inRow = row === rows - 1 ? group.length - row * 3 : 3;
				const col = index % 3;
				return {
					n: point.n,
					x: (point.rating.likelihood - 0.5) * CELL + (col - (inRow - 1) / 2) * GAP,
					y: 400 - (point.rating.severity - 0.5) * CELL + (row - (rows - 1) / 2) * GAP
				};
			});
		});
	});
</script>

<svg class="matrix" viewBox="-116 -10 536 486" role="img" aria-label={label}>
	<rect width="400" height="400" fill="var(--risk-mid)" />
	<path d="M0,400 L0,217 C70,255 150,330 193,400 Z" fill="var(--risk-low)" />
	<path
		d="M73,0 L400,0 L400,238 C340,222 300,190 268,140 C228,80 150,22 73,0 Z"
		fill="var(--risk-high)"
	/>
	<g class="grid">
		{#each [1, 2, 3] as k (k)}
			<line x1={k * CELL} y1="0" x2={k * CELL} y2="400" />
			<line x1="0" y1={k * CELL} x2="400" y2={k * CELL} />
		{/each}
		<rect width="400" height="400" fill="none" />
	</g>

	{#each placed as marker (marker.n)}
		<g class={['marker', { filled }]}>
			<circle cx={marker.x} cy={marker.y} r="14" />
			<text x={marker.x} y={marker.y + 5}>{marker.n}</text>
		</g>
	{/each}

	<g class="axis" aria-hidden="true">
		{#each SCALE as step, k (step.value)}
			<text class="tick" x="-10" y={400 - (k + 0.5) * CELL + 4} text-anchor="end"
				>{text(step.label)}</text
			>
			<text class="tick" x={(k + 0.5) * CELL} y="424" text-anchor="middle">{text(step.label)}</text>
		{/each}
		<text class="title" x="200" y="458" text-anchor="middle">{m.dsfa_dash_likelihood()} →</text>
		<text class="title" transform="translate(-102,200) rotate(-90)" text-anchor="middle"
			>{m.dsfa_dash_severity()} →</text
		>
	</g>
</svg>

<style>
	.matrix {
		display: block;
		width: 100%;
		max-width: 34rem;
		margin-inline: auto;
		font-family: var(--sans);
	}

	.grid {
		fill: none;
		stroke: #1c1b19;
		stroke-opacity: 0.5;
		stroke-width: 1.5;
	}

	/* hollow before measures, solid after; the colours stay fixed on the bands */
	.marker {
		& circle {
			fill: #fff;
			stroke: #1c1b19;
			stroke-width: 2.5;
		}

		& text {
			font-size: 13px;
			font-weight: 700;
			fill: #1c1b19;
			text-anchor: middle;
		}

		&.filled {
			& circle {
				fill: #1c1b19;
				stroke: #fff;
				stroke-width: 2;
			}

			& text {
				fill: #fff;
			}
		}
	}

	.axis {
		& .tick {
			font-size: 13px;
			fill: var(--ink2);
		}

		& .title {
			font-size: 13px;
			font-weight: 600;
			fill: var(--ink);
		}
	}
</style>
