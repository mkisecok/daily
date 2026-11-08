<!--
	@component
	The result of an SDM cube entry: key figures, then the cube itself drawn
	in projection. Its three visible faces are the three views of SDM V3.1a,
	D2.6: operations × goals on top, levels × goals on the side and
	operations × levels in front, each cell coloured by the worst status
	behind it. Choosing a goal turns the front into that goal's slice; the x
	axis switches between the four phases and the nine groups of operations.
	Views a and b follow as tables, which also carry the picture in print and
	for screen readers.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import Icon from '#lib/ui/Icon.svelte';
	import type { RecordView } from '../../records/types.js';
	import { text } from '../i18n.js';
	import {
		buildCube,
		defaultAxis,
		EBENEN,
		VORGAENGE,
		ZIELE,
		type Axis,
		type CellStatus
	} from './cube.js';

	let { record }: { record: RecordView } = $props();

	const uid = $props.id();
	let chosenAxis = $state<Axis | null>(null);
	let goal = $state<string | null>(null);
	const axis = $derived(chosenAxis ?? defaultAxis(record));
	const cube = $derived(buildCube(record, axis, goal));
	const goalIndex = $derived(goal ? ZIELE.findIndex((z) => z.id === goal) : -1);

	const STATUS: Record<CellStatus, () => string> = {
		umgesetzt: m.sdm_cube_status_umgesetzt,
		teilweise: m.sdm_cube_status_teilweise,
		luecke: m.sdm_cube_status_luecke,
		offen: m.sdm_cube_status_offen,
		entfaellt: m.sdm_cube_status_entfaellt
	};
	const ORDER: CellStatus[] = ['umgesetzt', 'teilweise', 'luecke', 'offen', 'entfaellt'];

	const total = VORGAENGE.length * EBENEN.length * ZIELE.length;
	const relevant = $derived(total - cube.counts.entfaellt);

	/* the projection: the front face is W × H, each goal adds one step of depth */
	const W = 360;
	const H = 168;
	const DX = 22;
	const DY = -13;
	const X0 = 132;
	const Y0 = 126;
	const XR = X0 + W;
	const cw = $derived(W / cube.columns.length);
	const ch = H / EBENEN.length;
	const points = (corners: [number, number][]) =>
		corners.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

	const topCell = (k: number, i: number) =>
		points([
			[X0 + i * cw + k * DX, Y0 + k * DY],
			[X0 + (i + 1) * cw + k * DX, Y0 + k * DY],
			[X0 + (i + 1) * cw + (k + 1) * DX, Y0 + (k + 1) * DY],
			[X0 + i * cw + (k + 1) * DX, Y0 + (k + 1) * DY]
		]);
	const sideCell = (k: number, j: number) =>
		points([
			[XR + k * DX, Y0 + j * ch + k * DY],
			[XR + (k + 1) * DX, Y0 + j * ch + (k + 1) * DY],
			[XR + (k + 1) * DX, Y0 + (j + 1) * ch + (k + 1) * DY],
			[XR + k * DX, Y0 + (j + 1) * ch + k * DY]
		]);
	const topStrip = (k: number) =>
		points([
			[X0 + k * DX, Y0 + k * DY],
			[XR + k * DX, Y0 + k * DY],
			[XR + (k + 1) * DX, Y0 + (k + 1) * DY],
			[X0 + (k + 1) * DX, Y0 + (k + 1) * DY]
		]);
	const sideStrip = (k: number) =>
		points([
			[XR + k * DX, Y0 + k * DY],
			[XR + (k + 1) * DX, Y0 + (k + 1) * DY],
			[XR + (k + 1) * DX, Y0 + H + (k + 1) * DY],
			[XR + k * DX, Y0 + H + k * DY]
		]);

	const front = $derived(
		goal ? m.sdm_cube_front_goal({ goal: text(ZIELE[goalIndex].title) }) : m.sdm_cube_front_all()
	);
	const label = $derived(
		m.sdm_cube_label({
			front,
			relevant,
			gaps: cube.counts.luecke,
			partly: cube.counts.teilweise,
			open: cube.counts.offen
		})
	);
</script>

<section class="cube-dash" aria-label={m.sdm_cube_title()}>
	<div class="head">
		<h2><Icon name="box" size={18} />{m.sdm_cube_title()}</h2>
		<span class="source">{m.sdm_cube_source()}</span>
	</div>

	<div class="figures">
		<div class="figure card">
			<span class="caption">{m.sdm_cube_fig_relevant()}</span>
			<strong>{relevant}</strong>
			<span class="hint">{m.sdm_cube_fig_relevant_of({ total })}</span>
		</div>
		<div class="figure card" data-status="luecke">
			<span class="caption">{m.sdm_cube_fig_gaps()}</span>
			<strong>{cube.counts.luecke}</strong>
			<span class="hint">{m.sdm_cube_fig_cells()}</span>
		</div>
		<div class="figure card" data-status="teilweise">
			<span class="caption">{m.sdm_cube_fig_partly()}</span>
			<strong>{cube.counts.teilweise}</strong>
			<span class="hint">{m.sdm_cube_fig_cells()}</span>
		</div>
		<div class="figure card" data-status="offen">
			<span class="caption">{m.sdm_cube_fig_open()}</span>
			<strong>{cube.counts.offen}</strong>
			<span class="hint">{m.sdm_cube_fig_cells()}</span>
		</div>
	</div>

	<section class="card cube-card">
		<div class="controls no-print">
			<div class="group" role="group" aria-label={m.sdm_cube_axis()}>
				{#each [['phasen', m.sdm_cube_axis_phasen()], ['vorgaenge', m.sdm_cube_axis_vorgaenge()]] as const as [value, name] (value)}
					<button
						type="button"
						class="toggle"
						aria-pressed={axis === value}
						onclick={() => (chosenAxis = value)}>{name}</button
					>
				{/each}
			</div>
			<div class="group goals" role="group" aria-label={m.sdm_cube_goal()}>
				<button
					type="button"
					class="toggle"
					aria-pressed={goal === null}
					onclick={() => (goal = null)}>{m.sdm_cube_all_goals()}</button
				>
				{#each ZIELE as ziel, k (ziel.id)}
					<button
						type="button"
						class="toggle"
						aria-pressed={goal === ziel.id}
						onclick={() => (goal = goal === ziel.id ? null : ziel.id)}
						><span class="n">{k + 1}</span>{text(ziel.title)}</button
					>
				{/each}
			</div>
		</div>

		<svg class="cube" viewBox="0 0 660 346" role="img" aria-label={label}>
			<defs>
				<pattern
					id="{uid}-hatch"
					width="6"
					height="6"
					patternUnits="userSpaceOnUse"
					patternTransform="rotate(45)"
				>
					<rect width="6" height="6" class="hatch-bg" />
					<line x1="0" y1="0" x2="0" y2="6" class="hatch-line" />
				</pattern>
			</defs>

			{#each cube.top as row, k (k)}
				{#each row as status, i (i)}
					<polygon
						class="cell top s-{status}"
						points={topCell(k, i)}
						style:fill={status === 'entfaellt' ? `url(#${uid}-hatch)` : null}
					/>
				{/each}
			{/each}
			{#each cube.side as row, k (k)}
				{#each row as status, j (j)}
					<polygon
						class="cell side s-{status}"
						points={sideCell(k, j)}
						style:fill={status === 'entfaellt' ? `url(#${uid}-hatch)` : null}
					/>
				{/each}
			{/each}
			{#each cube.front as row, j (j)}
				{#each row as status, i (i)}
					<rect
						class="cell s-{status}"
						x={X0 + i * cw}
						y={Y0 + j * ch}
						width={cw}
						height={ch}
						style:fill={status === 'entfaellt' ? `url(#${uid}-hatch)` : null}
					/>
				{/each}
			{/each}
			{#if goalIndex >= 0}
				<polygon class="chosen" points={topStrip(goalIndex)} />
				<polygon class="chosen" points={sideStrip(goalIndex)} />
			{/if}

			{#each ZIELE as ziel, k (ziel.id)}
				<text
					class="goal-n"
					class:active={k === goalIndex}
					x={X0 + (k + 0.5) * DX - 6}
					y={Y0 + (k + 0.5) * DY}
					text-anchor="end"
					dominant-baseline="central">{k + 1}</text
				>
			{/each}
			{#each EBENEN as ebene, j (ebene.id)}
				<text x={X0 - 8} y={Y0 + (j + 0.5) * ch} text-anchor="end" dominant-baseline="central"
					>{ebene.n} {text(ebene.title)}</text
				>
			{/each}
			{#each cube.columns as column, i (column.id)}
				<text x={X0 + (i + 0.5) * cw} y={Y0 + H + 16} text-anchor="middle"
					>{axis === 'phasen' ? text(column.title) : column.code}</text
				>
			{/each}
			<text class="axis" x={X0 + W / 2} y={Y0 + H + 38} text-anchor="middle">{m.sdm_cube_x()}</text>
			<text class="axis" x={X0 - 8} y={Y0 + H + 38} text-anchor="end">{m.sdm_cube_y()}</text>
			<text class="axis" x={XR + 7 * DX} y={Y0 + 7 * DY - 10} text-anchor="end"
				>{m.sdm_cube_z()}</text
			>
		</svg>

		<p class="front">{front}</p>
		<p class="legend">
			{#each ORDER as status (status)}
				<span class="s-{status}">{STATUS[status]()}</span>
			{/each}
		</p>
	</section>

	<div class="views">
		<section class="card view" aria-labelledby="{uid}-a">
			<h3 id="{uid}-a">{m.sdm_cube_view_a()}</h3>
			<div class="scroll">
				<table>
					<thead>
						<tr>
							<th>{m.sdm_cube_goal()}</th>
							{#each cube.columns as column (column.id)}
								<th title={text(column.title)}>
									{axis === 'phasen' ? text(column.title) : column.code}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each ZIELE as ziel, k (ziel.id)}
							<tr>
								<th scope="row">{text(ziel.title)}</th>
								{#each cube.top[k] as status, i (i)}
									<td class="dot s-{status}" title={STATUS[status]()}>
										<span class="sr-only">{STATUS[status]()}</span>
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
		<section class="card view" aria-labelledby="{uid}-b">
			<h3 id="{uid}-b">{m.sdm_cube_view_b()}</h3>
			<div class="scroll">
				<table>
					<thead>
						<tr>
							<th>{m.sdm_cube_goal()}</th>
							{#each EBENEN as ebene (ebene.id)}
								<th>{m.sdm_cube_level({ n: ebene.n })}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each ZIELE as ziel, k (ziel.id)}
							<tr>
								<th scope="row">{text(ziel.title)}</th>
								{#each cube.side[k] as status, j (j)}
									<td><span class="pill s-{status}">{STATUS[status]()}</span></td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	</div>
</section>

<style>
	.cube-dash {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;
		margin-top: 1.5rem;
		print-color-adjust: exact;

		& h2 {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin: 0;
			font-size: 17px;

			& :global(svg) {
				color: var(--primary);
			}
		}

		& h3 {
			margin: 0 0 0.6rem;
			font-size: 15px;
		}
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;

		& .source {
			font-size: 12.5px;
			color: var(--ink3);
		}
	}

	/* status colours: the DSK bands for in place, partly and gap */
	.s-umgesetzt {
		--fill: var(--risk-low);
		--soft: var(--risk-low-soft);
		--ink-s: var(--risk-low-ink);
	}

	.s-teilweise {
		--fill: var(--risk-mid);
		--soft: var(--risk-mid-soft);
		--ink-s: var(--risk-mid-ink);
	}

	.s-luecke {
		--fill: var(--risk-high);
		--soft: var(--risk-high-soft);
		--ink-s: var(--risk-high-ink);
	}

	.s-offen {
		--fill: var(--sheet);
		--soft: var(--neutral-soft);
		--ink-s: var(--ink2);
	}

	.s-entfaellt {
		--fill: var(--paper);
		--soft: transparent;
		--ink-s: var(--ink3);
	}

	.figures {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.875rem;

		@media (max-width: 48rem) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.figure {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.9rem 1.1rem;
		border-top: 3px solid var(--rule);

		&[data-status='luecke'] {
			border-top-color: var(--risk-high);
		}

		&[data-status='teilweise'] {
			border-top-color: var(--risk-mid);
		}

		& .caption,
		& .hint {
			font-size: 12.5px;
			color: var(--ink3);
		}

		& strong {
			font-size: 28px;
			font-weight: 700;
			line-height: 1.15;
		}
	}

	.cube-card {
		padding: 1.1rem 1.25rem;

		& .front {
			margin: 0.25rem 0 0;
			font-size: 13px;
			color: var(--ink2);
			text-align: center;
		}
	}

	.controls {
		display: grid;
		gap: 0.5rem;
		margin-bottom: 0.75rem;

		& .group {
			display: flex;
			flex-wrap: wrap;
			gap: 0.35rem;
		}
	}

	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.25rem 0.65rem;
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

		& .n {
			font-size: 11.5px;
			font-weight: 600;
			opacity: 0.75;
		}
	}

	.cube {
		display: block;
		width: 100%;
		max-width: 720px;
		margin-inline: auto;

		& text {
			font-size: 12px;
			fill: var(--ink2);
		}

		& .axis {
			font-size: 11.5px;
			fill: var(--ink3);
		}

		& .goal-n {
			font-weight: 600;
			fill: var(--ink3);

			&.active {
				fill: var(--primary);
			}
		}
	}

	.cell {
		fill: var(--fill);
		stroke: var(--canvas);
		stroke-width: 1;

		&.top {
			fill-opacity: 0.85;
		}

		&.side {
			fill-opacity: 0.7;
		}

		&.s-offen,
		&.s-entfaellt {
			stroke: var(--rule);
			fill-opacity: 1;
		}
	}

	.hatch-bg {
		fill: var(--paper);
	}

	.hatch-line {
		stroke: var(--ink3);
		stroke-opacity: 0.35;
		stroke-width: 1.5;
	}

	/* not relevant reads as hatched everywhere, so it never looks like open */
	.legend .s-entfaellt::before,
	.dot.s-entfaellt::before {
		background: repeating-linear-gradient(
			45deg,
			var(--paper) 0 3px,
			color-mix(in srgb, var(--ink3) 35%, var(--paper)) 3px 4px
		);
	}

	.chosen {
		fill: none;
		stroke: var(--primary);
		stroke-width: 2;
		stroke-linejoin: round;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.4rem 1rem;
		margin: 0.5rem 0 0;
		font-size: 12.5px;
		color: var(--ink2);

		& span {
			display: inline-flex;
			align-items: center;
			gap: 0.4rem;

			&::before {
				width: 0.85rem;
				height: 0.85rem;
				content: '';
				background: var(--fill);
				border: 1px solid var(--rule);
				border-radius: 4px;
			}
		}
	}

	.views {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;

		& .view {
			padding: 1.1rem 1.25rem;
		}

		& .scroll {
			overflow-x: auto;
		}
	}

	table {
		width: 100%;
		font-size: 13px;
		border-collapse: collapse;

		& th,
		& td {
			padding: 0.35rem 0.5rem;
			text-align: left;
			border-top: 1px solid var(--rule2);
		}

		& thead th {
			font-size: 12px;
			font-weight: 600;
			color: var(--ink3);
			border-top: 0;
		}

		& tbody th {
			font-weight: 500;
			white-space: nowrap;
		}
	}

	.dot {
		text-align: center;

		&::before {
			display: inline-block;
			width: 0.9rem;
			height: 0.9rem;
			content: '';
			vertical-align: middle;
			background: var(--fill);
			border: 1px solid var(--rule);
			border-radius: 4px;
		}
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	.pill {
		display: inline-block;
		padding: 0.05rem 0.45rem;
		font-size: 12px;
		font-weight: 500;
		white-space: nowrap;
		color: var(--ink-s);
		background: var(--soft);
		border-radius: var(--radius-badge);
	}

	@media print {
		.cube-dash {
			gap: 4mm;
			break-after: page;

			& :global(.card) {
				box-shadow: none;
				border: 0.3mm solid #ccc;
				break-inside: avoid;
			}
		}

		.cube {
			max-height: 110mm;
		}
	}
</style>
