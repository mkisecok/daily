<!--
	@component
	The result of an SDM cube entry: key figures, then the cube itself in 3D,
	operations (or phases) × levels × goals of SDM V3.1a, D2.6, each block
	coloured by its status; a slice pulls out beside it. The x axis switches
	between the four phases and the nine groups of operations. Views a and b
	follow as tables, which also carry the values in print and for screen
	readers.
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
	import Cube3D from './Cube3D.svelte';

	let { record }: { record: RecordView & { id?: string } } = $props();

	const uid = $props.id();
	let chosenAxis = $state<Axis | null>(null);
	const axis = $derived(chosenAxis ?? defaultAxis(record));
	const cube = $derived(buildCube(record, axis));

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
		<div class="group no-print" role="group" aria-label={m.sdm_cube_axis()}>
			{#each [['phasen', m.sdm_cube_axis_phasen()], ['vorgaenge', m.sdm_cube_axis_vorgaenge()]] as const as [value, name] (value)}
				<button
					type="button"
					class="toggle"
					aria-pressed={axis === value}
					onclick={() => (chosenAxis = value)}>{name}</button
				>
			{/each}
		</div>
		<Cube3D {record} {axis} status={STATUS} />
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
				<table class="daily-table compact">
					<thead>
						<tr>
							<th>{m.sdm_cube_goal()}</th>
							{#each cube.columns as column (column.id)}
								<th title={text(column.title)}>
									{column.code ?? text(column.title)}
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
										<span class="visually-hidden">{STATUS[status]()}</span>
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
				<table class="daily-table compact">
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
		padding: var(--card-pad-compact);
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
		display: grid;
		gap: 0.75rem;
		padding: var(--card-pad-compact);

		& > .group {
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
			padding: var(--card-pad-compact);
		}

		& .scroll {
			overflow-x: auto;
		}
	}

	table tbody th {
		white-space: nowrap;
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
	}
</style>
