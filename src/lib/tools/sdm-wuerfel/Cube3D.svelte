<!--
	@component
	The SDM cube in 3D: one small block per cell, operations (or phases) ×
	levels × goals, coloured by status. Dragging turns it, the view buttons
	snap to the three SDM views, "Auseinander" spreads the goal layers and
	"Nur Lücken" fades all but the gaps. A click on a block, or Enter on the
	cell chosen with the arrow keys, pulls its slice (one goal, one level or
	one column) out of the cube and lays it flat beside it, with what the
	chosen cell asks for and a link to rate it. With `onrate`, the panel
	rates the cell in place: the goal on that level, the operations with a
	gap and whether the processing performs them; the keys 1 to 4 rate the
	level of the cell the arrow keys are on. The tables of the result carry
	the same values for print and screen readers.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { RecordView } from '../../records/types.js';
	import { text } from '../i18n.js';
	import {
		activeVorgaenge,
		cells,
		columns,
		EBENEN,
		LEVEL_STATUS,
		levelStatus,
		VORGAENGE,
		ZIELE,
		type Axis,
		type CellStatus
	} from './cube.js';
	import { REQUIREMENTS } from './definition.js';

	let {
		record,
		axis,
		status: statusLabel,
		onrate
	}: {
		/** the entry; with its id, a cell links to rating it */
		record: RecordView & { id?: string };
		axis: Axis;
		status: Record<CellStatus, () => string>;
		/** stores changed fields of the entry; resolves to an error message, or null once saved */
		onrate?: (change: Record<string, unknown>) => Promise<string | null>;
	} = $props();

	type Pos = { x: number; y: number; z: number };
	type Mode = 'goal' | 'level' | 'column';

	const cols = $derived(columns(axis));
	const grid = $derived(cells(record, axis));
	const X = $derived(cols.length);
	const Y = EBENEN.length;
	const Z = ZIELE.length;
	/** the edge of one block; nine columns need smaller ones */
	const S = $derived(X > 4 ? 26 : 34);

	const VIEWS = {
		iso: { rx: -24, ry: -36, label: m.sdm3d_view_iso },
		a: { rx: -90, ry: 0, label: m.sdm3d_view_a },
		b: { rx: 0, ry: -90, label: m.sdm3d_view_b },
		c: { rx: 0, ry: 0, label: m.sdm3d_view_c }
	} as const;
	type View = keyof typeof VIEWS;

	let view = $state<View | null>('iso');
	let rx = $state<number>(VIEWS.iso.rx);
	let ry = $state<number>(VIEWS.iso.ry);
	let apart = $state(0);
	let gapsOnly = $state(false);
	let mode = $state<Mode>('goal');
	/** the cell whose slice is out, and the cell read in the slice */
	let picked = $state<Pos | null>(null);
	let read = $state<Pos | null>(null);
	/** the cell the arrow keys are on, and the one under the pointer */
	let cursor = $state<Pos>({ x: 0, y: 0, z: 0 });
	let hover = $state<Pos | null>(null);
	let dragging = $state(false);
	let drag: { x: number; y: number; rx: number; ry: number; moved: boolean } | null = null;

	const at = (p: Pos): CellStatus => grid[p.z]?.[p.y]?.[p.x] ?? 'entfaellt';
	const inSlice = (p: Pos) =>
		!!picked &&
		(mode === 'goal' ? p.z === picked.z : mode === 'level' ? p.y === picked.y : p.x === picked.x);
	const same = (a: Pos | null, b: Pos | null) =>
		!!a && !!b && a.x === b.x && a.y === b.y && a.z === b.z;

	const blocks = $derived(
		Array.from({ length: Z }, (_, z) =>
			Array.from({ length: Y }, (_, y) => Array.from({ length: X }, (_, x) => ({ x, y, z })))
		).flat(2)
	);

	/** where a block sits: centred, spread by `apart`, its slice moved out beside the cube */
	function place(p: Pos): string {
		const step = S + apart;
		let tx = (p.x - (X - 1) / 2) * step;
		let ty = (p.y - (Y - 1) / 2) * step;
		let tz = ((Z - 1) / 2 - p.z) * step;
		if (inSlice(p)) {
			if (mode === 'goal') {
				tx += (X * step) / 2 + S * 2;
				tz = ((Z + 1) / 2) * step;
			} else if (mode === 'level') {
				ty -= (Y * step) / 2 + S * 2;
			} else {
				tx += (X * step) / 2 + S * 2;
			}
		}
		return `translate3d(${tx}px, ${ty}px, ${tz}px)`;
	}

	const name = (p: Pos) =>
		m.sdm3d_cell({
			column: text(cols[p.x]!.title),
			level: text(EBENEN[p.y]!.title),
			goal: text(ZIELE[p.z]!.title)
		});

	function pick(p: Pos) {
		picked = p;
		read = p;
		cursor = p;
	}

	function close() {
		picked = null;
		read = null;
	}

	function snap(next: View) {
		view = next;
		rx = VIEWS[next].rx;
		ry = VIEWS[next].ry;
	}

	function posOf(target: EventTarget | null): Pos | null {
		const block = (target as HTMLElement | null)?.closest<HTMLElement>('[data-pos]');
		if (!block) return null;
		const [x, y, z] = block.dataset.pos!.split(',').map(Number);
		return { x: x!, y: y!, z: z! };
	}

	function down(event: PointerEvent) {
		drag = { x: event.clientX, y: event.clientY, rx, ry, moved: false };
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function move(event: PointerEvent) {
		if (!drag) {
			hover = posOf(event.target);
			return;
		}
		const dx = event.clientX - drag.x;
		const dy = event.clientY - drag.y;
		if (!drag.moved && Math.hypot(dx, dy) < 4) return;
		drag.moved = true;
		dragging = true;
		view = null;
		ry = drag.ry + dx * 0.5;
		rx = Math.max(-90, Math.min(90, drag.rx - dy * 0.5));
	}

	function up(event: PointerEvent) {
		const moved = drag?.moved;
		drag = null;
		dragging = false;
		if (moved) return;
		// the pointer was captured, so the block under it is found by its position
		const under = document.elementFromPoint(event.clientX, event.clientY);
		const p = posOf(under);
		if (p) pick(p);
	}

	function keys(event: KeyboardEvent) {
		const c = { ...cursor };
		if (event.key === 'ArrowLeft') c.x = Math.max(0, c.x - 1);
		else if (event.key === 'ArrowRight') c.x = Math.min(X - 1, c.x + 1);
		else if (event.key === 'ArrowUp') c.y = Math.max(0, c.y - 1);
		else if (event.key === 'ArrowDown') c.y = Math.min(Y - 1, c.y + 1);
		else if (event.key === 'PageUp') c.z = Math.max(0, c.z - 1);
		else if (event.key === 'PageDown') c.z = Math.min(Z - 1, c.z + 1);
		else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			pick(cursor);
			return;
		} else if (event.key === 'Escape' && picked) {
			close();
			return;
		} else if (onrate && /^[1-4]$/.test(event.key)) {
			// the four ratings in the order of the form
			const value = LEVEL_STATUS[Number(event.key) - 1]!.value;
			read = cursor;
			void setLevel(`${ZIELE[cursor.z]!.id}_${EBENEN[cursor.y]!.id}`, value);
			return;
		} else return;
		event.preventDefault();
		cursor = c;
	}

	/** the slice laid flat: its rows and columns, and the cube position of each grid cell */
	const flat = $derived.by(() => {
		if (!picked) return null;
		const p = picked;
		const colNames = cols.map((c) => c.code ?? text(c.title));
		const levelNames = EBENEN.map((e) => m.sdm_cube_level({ n: e.n }));
		if (mode === 'goal') {
			return {
				title: text(ZIELE[p.z]!.title),
				rows: levelNames,
				cols: colNames,
				pos: (r: number, c: number): Pos => ({ x: c, y: r, z: p.z })
			};
		}
		if (mode === 'level') {
			return {
				title: text(EBENEN[p.y]!.title),
				rows: ZIELE.map((z) => text(z.title)),
				cols: colNames,
				pos: (r: number, c: number): Pos => ({ x: c, y: p.y, z: r })
			};
		}
		return {
			title: text(cols[p.x]!.title),
			rows: ZIELE.map((z) => text(z.title)),
			cols: levelNames,
			pos: (r: number, c: number): Pos => ({ x: p.x, y: c, z: r })
		};
	});

	/** what the chosen cell asks for, what was noted and where a gap was recorded */
	const detail = $derived.by(() => {
		if (!read) return null;
		const goal = ZIELE[read.z]!;
		const level = EBENEN[read.y]!;
		const column = cols[read.x]!;
		const notes = record.data[`${goal.id}_anmerkungen`];
		const marked = record.data[`${goal.id}_luecken`];
		const gaps = VORGAENGE.filter(
			(v) => column.vorgaenge.includes(v.id) && Array.isArray(marked) && marked.includes(v.id)
		);
		return {
			name: name(read),
			status: at(read),
			requirement: REQUIREMENTS[goal.id]?.[read.y],
			notes: typeof notes === 'string' && notes.trim() ? notes : null,
			gaps: gaps.map((v) => `${text(v.title)} (${v.code})`),
			href: record.id
				? resolve(
						localized(
							`/werkzeuge/sdm-wuerfel/eintraege?eintrag=${record.id}&bearbeiten=${goal.id}_${level.id}`
						)
					)
				: null
		};
	});

	const shown = $derived(hover ?? cursor);
	const keysHint = $derived(onrate ? `${m.sdm3d_keys()} ${m.sdm3d_keys_rate()}` : m.sdm3d_keys());

	/** the rating under way, and how the last one ended */
	let saving = $state(false);
	let outcome = $state<{ text: string; error: boolean } | null>(null);

	async function rate(change: Record<string, unknown>) {
		if (!onrate || saving) return;
		saving = true;
		outcome = { text: m.sdm3d_saving(), error: false };
		const error = await onrate(change);
		saving = false;
		outcome = error ? { text: error, error: true } : { text: m.sdm3d_saved(), error: false };
	}

	/** the rating of the chosen cell: its level, and its column's operations */
	const rating = $derived.by(() => {
		if (!read || !onrate) return null;
		const goal = ZIELE[read.z]!;
		const level = EBENEN[read.y]!;
		const active = activeVorgaenge(record);
		const marked = record.data[`${goal.id}_luecken`];
		const gaps = Array.isArray(marked) ? (marked as string[]) : [];
		return {
			goal,
			level,
			field: `${goal.id}_${level.id}`,
			value: levelStatus(record, goal.id, level.id),
			active,
			gaps,
			operations: VORGAENGE.filter((v) => cols[read!.x]!.vorgaenge.includes(v.id))
		};
	});

	const setLevel = (field: string, value: string) => rate({ [field]: value });
	const toggle = (list: string[], id: string) =>
		list.includes(id) ? list.filter((v) => v !== id) : [...list, id];
</script>

<div class="cube3d" data-open={!!picked || undefined}>
	<div class="controls no-print">
		<div class="group" role="group" aria-label={m.sdm3d_views()}>
			{#each Object.entries(VIEWS) as [id, v] (id)}
				<button
					type="button"
					class="toggle"
					aria-pressed={view === id}
					onclick={() => snap(id as View)}>{v.label()}</button
				>
			{/each}
		</div>
		<label class="apart">
			<span>{m.sdm3d_apart()}</span>
			<input type="range" min="0" max="36" step="1" bind:value={apart} />
		</label>
		<button
			type="button"
			class="toggle"
			aria-pressed={gapsOnly}
			onclick={() => (gapsOnly = !gapsOnly)}>{m.sdm3d_gaps_only()}</button
		>
	</div>

	<div class="stage">
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (the cube is a custom widget: role application takes the arrow keys and the pointer, which Svelte's role list does not count as interactive) -->
		<div
			class="scene"
			class:dragging
			role="application"
			aria-roledescription={m.sdm3d_role()}
			aria-label={m.sdm3d_label({ n: X * Y * Z })}
			aria-describedby="sdm3d-keys"
			tabindex="0"
			onpointerdown={down}
			onpointermove={move}
			onpointerup={up}
			onpointerleave={() => (hover = null)}
			onkeydown={keys}
		>
			<div
				class="cube"
				style:transform="translateX({picked ? -S * 1.5 : 0}px) rotateX({rx}deg) rotateY({ry}deg)"
			>
				{#each blocks as p (`${p.x},${p.y},${p.z}`)}
					{@const status = at(p)}
					<div
						class="block s-{status}"
						data-pos="{p.x},{p.y},{p.z}"
						data-dim={(picked && !inSlice(p)) || (gapsOnly && status !== 'luecke') || undefined}
						data-read={same(p, read) || undefined}
						data-cursor={same(p, cursor) || undefined}
						style:transform={place(p)}
						style:--s="{S}px"
						aria-hidden="true"
					>
						<i class="f front"></i><i class="f back"></i><i class="f right"></i><i class="f left"
						></i><i class="f top"></i><i class="f bottom"></i>
					</div>
				{/each}
			</div>
		</div>

		<aside class="slice no-print" aria-live="polite">
			{#if flat && detail}
				<div class="group" role="group" aria-label={m.sdm3d_slice()}>
					<button
						type="button"
						class="toggle"
						aria-pressed={mode === 'goal'}
						onclick={() => (mode = 'goal')}>{m.sdm3d_slice_goal()}</button
					>
					<button
						type="button"
						class="toggle"
						aria-pressed={mode === 'level'}
						onclick={() => (mode = 'level')}>{m.sdm3d_slice_level()}</button
					>
					<button
						type="button"
						class="toggle"
						aria-pressed={mode === 'column'}
						onclick={() => (mode = 'column')}
						>{axis === 'phasen' ? m.sdm3d_slice_phase() : m.sdm3d_slice_vorgang()}</button
					>
				</div>
				<h4>{flat.title}</h4>
				<div class="flat" style:--cols={flat.cols.length}>
					<span></span>
					{#each flat.cols as col (col)}<span class="head" title={col}>{col}</span>{/each}
					{#each flat.rows as row, r (row)}
						<span class="row">{row}</span>
						{#each flat.cols as col, c (col)}
							{@const p = flat.pos(r, c)}
							<button
								type="button"
								class="cell s-{at(p)}"
								aria-pressed={same(p, read)}
								aria-label="{name(p)}: {statusLabel[at(p)]()}"
								onclick={() => (read = p)}
							></button>
						{/each}
					{/each}
				</div>

				<div class="detail">
					<p class="where">{detail.name}</p>
					<span class="pill s-{detail.status}">{statusLabel[detail.status]()}</span>
					{#if rating}
						<fieldset class="rate" disabled={saving}>
							<legend
								>{m.sdm3d_rate_level({
									goal: text(rating.goal.title),
									n: rating.level.n
								})}</legend
							>
							<div class="choices">
								{#each LEVEL_STATUS as option, index (option.value)}
									<label class="choice s-{option.value}">
										<input
											type="radio"
											name="sdm3d-rate"
											value={option.value}
											checked={rating.value === option.value}
											onchange={() => setLevel(rating.field, option.value)}
										/>
										<span class="name">{text(option.label)}</span>
										<span class="key" aria-hidden="true">{index + 1}</span>
									</label>
								{/each}
							</div>
							<p class="hint">{m.sdm3d_rate_hint()}</p>
							{#each rating.operations as operation (operation.id)}
								{@const on = rating.active.includes(operation.id)}
								<div class="operation">
									<label>
										<input
											type="checkbox"
											checked={on}
											onchange={() => rate({ vorgaenge: toggle(rating.active, operation.id) })}
										/>
										{m.sdm3d_rate_active({
											vorgang: `${text(operation.title)} (${operation.code})`
										})}
									</label>
									{#if on}
										<label>
											<input
												type="checkbox"
												checked={rating.gaps.includes(operation.id)}
												onchange={() =>
													rate({
														[`${rating.goal.id}_luecken`]: toggle(rating.gaps, operation.id)
													})}
											/>
											{m.sdm3d_rate_gap({ vorgang: operation.code })}
										</label>
									{/if}
								</div>
							{/each}
						</fieldset>
						{#if outcome}
							<p class="outcome" class:error={outcome.error} role="status">{outcome.text}</p>
						{/if}
					{/if}
					{#if detail.requirement}
						<p class="label">{m.sdm3d_requirement()}</p>
						<p>{text(detail.requirement)}</p>
					{/if}
					{#if detail.gaps.length > 0}
						<p class="label">{m.sdm3d_gaps()}</p>
						<p>{detail.gaps.join(', ')}</p>
					{/if}
					{#if detail.notes}
						<p class="label">{m.sdm3d_measures()}</p>
						<p class="notes">{detail.notes}</p>
					{/if}
					<div class="toolbar">
						{#if detail.href}<a class="button quiet" href={detail.href}
								>{onrate ? m.sdm3d_open_form() : m.sdm3d_edit()}</a
							>{/if}
						<button type="button" class="button ghost" onclick={close}>{m.sdm3d_back()}</button>
					</div>
				</div>
			{:else}
				<p class="empty">{m.sdm3d_empty()}</p>
			{/if}
		</aside>
	</div>

	<p class="under no-print">
		<span class="now">{name(shown)}: {statusLabel[at(shown)]()}</span>
		<span id="sdm3d-keys" class="keys">{keysHint}</span>
	</p>
	<p class="axes">
		{m.sdm3d_axes({
			x: axis === 'phasen' ? m.sdm_cube_axis_phasen() : m.sdm_cube_axis_vorgaenge()
		})}
	</p>
</div>

<style>
	.cube3d {
		display: grid;
		gap: 0.75rem;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;

		& .apart {
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			font-size: 13px;
			color: var(--ink2);

			& input {
				width: 7rem;
				accent-color: var(--primary);
			}
		}
	}

	.group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.toggle {
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

	/* the cube on the left; once a slice is out, it lies flat on the right */
	.stage {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;

		@media (min-width: 56rem) {
			grid-template-columns: minmax(0, 1fr) 19rem;
		}
	}

	.scene {
		position: relative;
		height: 400px;
		overflow: hidden;
		cursor: grab;
		perspective: 1200px;
		touch-action: none;
		user-select: none;
		border-radius: var(--radius);

		&.dragging {
			cursor: grabbing;

			& .cube {
				transition: none;
			}
		}

		&:focus-visible {
			outline: 2px solid var(--navy);
			outline-offset: 2px;
		}

		@media (max-width: 40rem) {
			height: 320px;
		}
	}

	.cube {
		position: absolute;
		top: 50%;
		left: 50%;
		transform-style: preserve-3d;
		transition: transform 0.5s cubic-bezier(0.3, 0.7, 0.2, 1);
	}

	.block {
		position: absolute;
		transform-style: preserve-3d;
		transition:
			transform 0.55s cubic-bezier(0.3, 0.7, 0.2, 1),
			opacity 0.3s;

		&[data-dim] {
			opacity: 0.1;
		}

		& .f {
			position: absolute;
			top: calc(var(--s) / -2);
			left: calc(var(--s) / -2);
			width: var(--s);
			height: var(--s);
			background: var(--fill);
			border: 1px solid color-mix(in srgb, var(--ink) 22%, transparent);
		}

		& .front {
			transform: translateZ(calc(var(--s) / 2));
		}

		& .back {
			transform: rotateY(180deg) translateZ(calc(var(--s) / 2));
		}

		& .right {
			transform: rotateY(90deg) translateZ(calc(var(--s) / 2));
		}

		& .left {
			transform: rotateY(-90deg) translateZ(calc(var(--s) / 2));
		}

		& .top {
			transform: rotateX(90deg) translateZ(calc(var(--s) / 2));
		}

		& .bottom {
			transform: rotateX(-90deg) translateZ(calc(var(--s) / 2));
		}

		/* a little shade, so the faces read as a solid */
		& .top {
			filter: brightness(1.08);
		}

		& .right,
		& .left {
			filter: brightness(0.9);
		}

		&.s-entfaellt .f {
			background: transparent;
			border: 1px dashed color-mix(in srgb, var(--ink3) 45%, transparent);
		}

		&[data-read] .f,
		&[data-cursor] .f {
			border: 2px solid var(--ink);
		}
	}

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
		--fill: transparent;
		--soft: transparent;
		--ink-s: var(--ink3);
	}

	.slice {
		font-size: 14px;

		& h4 {
			margin: 0.75rem 0 0.5rem;
			font-size: 15px;
		}

		& .empty {
			margin: 0;
			color: var(--ink3);
		}
	}

	/* the slice laid flat: row names, then one square per cell */
	.flat {
		display: grid;
		grid-template-columns: minmax(4.5rem, 7rem) repeat(var(--cols), minmax(1rem, 1fr));
		gap: 3px;
		align-items: center;

		/* long phase names are cut; the full name is in the title and the cell's label */
		& .head {
			overflow: hidden;
			font-size: 11px;
			color: var(--ink3);
			text-align: center;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		& .row {
			overflow: hidden;
			font-size: 12px;
			color: var(--ink2);
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		& .cell {
			height: 1.6rem;
			padding: 0;
			background: var(--fill);
			border: 1px solid var(--rule);
			border-radius: 4px;
			cursor: pointer;

			&.s-entfaellt {
				border-style: dashed;
			}

			&[aria-pressed='true'] {
				outline: 2px solid var(--ink);
				outline-offset: 1px;
			}
		}
	}

	.detail {
		margin-top: 0.9rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--rule2);

		& p {
			margin: 0.15rem 0 0;
		}

		& .where {
			margin-bottom: 0.35rem;
			font-weight: 500;
		}

		& .label {
			margin-top: 0.6rem;
			font-size: 12px;
			font-weight: 600;
			color: var(--ink3);
		}

		& .notes {
			white-space: pre-wrap;
		}

		& .toolbar {
			margin-top: 0.75rem;
		}
	}

	/* rating in place: the four ratings as a segmented row, then the operations */
	.rate {
		margin: 0.75rem 0 0;
		padding: 0;
		border: 0;

		& legend {
			margin-bottom: 0.4rem;
			font-size: 12px;
			font-weight: 600;
			color: var(--ink3);
		}

		& .choices {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 4px;
		}

		& .choice {
			display: flex;
			align-items: center;
			gap: 0.35rem;
			padding: 0.3rem 0.5rem;
			font-family: var(--sans);
			font-size: 13px;
			line-height: 1.3;
			background: var(--sheet);
			border: 1px solid var(--rule);
			border-radius: var(--radius);
			cursor: pointer;

			& input {
				accent-color: var(--fill);
			}

			&:has(input:checked) {
				color: var(--ink-s);
				background: var(--soft);
				border-color: var(--fill);
			}

			&.s-entfaellt:has(input:checked) {
				border-color: var(--ink3);
			}

			& .name {
				flex: 1;
			}

			& .key {
				font-family: var(--mono);
				font-size: 11px;
				color: var(--ink3);
			}
		}

		& .hint {
			margin: 0.35rem 0 0;
			font-size: 12px;
			color: var(--ink3);
		}

		& .operation {
			display: grid;
			gap: 0.2rem;
			margin-top: 0.5rem;
			font-size: 13px;

			& label {
				display: flex;
				align-items: center;
				gap: 0.4rem;
			}

			& label + label {
				padding-left: 1.4rem;
			}
		}

		&:disabled {
			opacity: 0.7;
		}
	}

	.outcome {
		font-size: 12.5px;
		color: var(--ink3);

		&.error {
			color: var(--wax);
		}
	}

	.pill {
		display: inline-block;
		padding: 0.05rem 0.45rem;
		font-size: 12px;
		font-weight: 500;
		color: var(--ink-s);
		background: var(--soft);
		border-radius: var(--radius-badge);
	}

	.under {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.25rem 1rem;
		margin: 0;
		font-size: 13px;

		& .now {
			font-weight: 500;
		}

		& .keys {
			color: var(--ink3);
		}
	}

	.axes {
		margin: 0;
		font-size: 12.5px;
		color: var(--ink3);
	}

	@media (prefers-reduced-motion: reduce) {
		.cube,
		.block {
			transition: none;
		}
	}
</style>
