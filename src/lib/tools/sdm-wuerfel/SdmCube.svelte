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
	import { resolve } from '$app/paths';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import Icon from '#lib/ui/Icon.svelte';
	import { invalidate } from '$app/navigation';
	import { getStore } from '../../records/store/index.js';
	import type { RecordView, StoredRecord } from '../../records/types.js';
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
	import { priorities, progress } from './focus.js';

	let {
		record
	}: { record: RecordView & Partial<Pick<StoredRecord, 'id' | 'version' | 'archivedAt'>> } =
		$props();

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

	/**
	 * rates from the cube: the change goes into the stored entry at the version
	 * shown, then the page loads it again. A saved, live entry only.
	 */
	const rate = $derived.by(() => {
		const { id, version } = record;
		if (!id || !version || record.archivedAt) return undefined;
		return async (change: Record<string, unknown>): Promise<string | null> => {
			try {
				const result = await getStore().update(id, { ...record.data, ...change }, version);
				if (!result.ok) return result.error === 'conflict' ? m.sdm3d_conflict() : m.sdm3d_failed();
				await invalidate('records:data');
				return null;
			} catch {
				return m.sdm3d_failed();
			}
		};
	});

	/** what to fix first, the five most pressing; the rest only counted */
	const SHOWN = 5;
	const focus = $derived(priorities(record));
	const rated = $derived(progress(record));
	const goalTitle = (id: string) => text(ZIELE.find((z) => z.id === id)!.title);
	const levelOf = (id: string) => EBENEN.find((e) => e.id === id)!;
	const editHref = (field: string) =>
		record.id
			? resolve(
					localized(`/werkzeuge/sdm-wuerfel/eintraege?eintrag=${record.id}&bearbeiten=${field}`)
				)
			: null;
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

	<p class="progress">
		<span class="label">{m.sdm_progress_label()}</span>
		<span class="meter" aria-hidden="true"
			><span style:width="{(rated.rated / rated.total) * 100}%"></span></span
		>
		<span>{m.sdm_progress({ rated: rated.rated, total: rated.total })}</span>
	</p>

	<section class="card focus" aria-labelledby="{uid}-focus">
		<h3 id="{uid}-focus">{m.sdm_focus_title()}</h3>
		{#if focus.length === 0}
			<p class="none">{m.sdm_focus_none()}</p>
		{:else}
			<ol>
				{#each focus.slice(0, SHOWN) as item (item.goal)}
					{@const href = editHref(`${item.goal}_${item.levels[0]!.level}`)}
					<li>
						<div class="line">
							<strong>{goalTitle(item.goal)}</strong>
							{#each item.levels as weak (weak.level)}
								<span class="pill s-{weak.status}"
									>{m.sdm_cube_level({ n: levelOf(weak.level).n })} · {STATUS[weak.status]()}</span
								>
							{/each}
							{#if href}<a class="edit no-print" {href}>{m.sdm3d_edit()}</a>{/if}
						</div>
						{#each item.why as why (why.de)}<p class="why">{text(why)}</p>{/each}
					</li>
				{/each}
			</ol>
			{#if focus.length > SHOWN}
				<p class="more">{m.sdm_focus_more({ count: focus.length - SHOWN })}</p>
			{/if}
		{/if}
	</section>

	<!-- on paper the tables of views a and b carry the cube; one angle of it would say less -->
	<section class="card cube-card no-print">
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
		<Cube3D {record} {axis} status={STATUS} onrate={rate} />
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

	/* how far the rating has come, one quiet line */
	.progress {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem 0.75rem;
		margin: 0;
		font-size: 13px;
		color: var(--ink2);

		& .label {
			font-weight: 600;
		}

		& .meter {
			width: min(100%, 14rem);
			height: 6px;
			overflow: hidden;
			background: var(--rule2);
			border-radius: 3px;

			& span {
				display: block;
				height: 100%;
				background: var(--primary);
			}
		}
	}

	/* the gaps to close first, each with why it ranks high */
	.focus {
		padding: var(--card-pad-compact);

		& ol {
			display: grid;
			gap: 0.75rem;
			margin: 0;
			padding-left: 1.25rem;
		}

		& .line {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.3rem 0.6rem;

			& strong {
				font-weight: 500;
			}

			& .edit {
				margin-left: auto;
				font-size: 13px;
			}
		}

		& .why {
			margin: 0.2rem 0 0;
			font-size: 13px;
			color: var(--ink2);
		}

		& .none,
		& .more {
			margin: 0;
			font-size: 13px;
			color: var(--ink3);
		}

		& .more {
			margin-top: 0.6rem;
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
