<!--
	@component
	The risk picture of a DPIA: key figures, the DSK matrix before and after
	measures side by side, and every risk in a table with its threats,
	ratings and measures. Unrated risks are left out of the matrices. The whole picture
	downloads as an Excel workbook or prints on its own landscape page.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import Icon from '#lib/ui/Icon.svelte';
	import { formatValue } from '../../records/format.js';
	import { getStore } from '../../records/store/index.js';
	import type { RecordView, StoredRecord } from '../../records/types.js';
	import { fieldById } from '../../records/validate.js';
	import { text } from '../i18n.js';
	import { definition as tomDefinition } from '../tom-katalog/definition.js';
	import { assessRisks, RISKS, type Rating, type RiskLevel } from './definition.js';
	import RiskMatrix from './RiskMatrix.svelte';
	import { compareWithTom, type CoverageStatus } from './tom.js';

	let { record }: { record: RecordView } = $props();

	/** the linked TOM entry: undefined while none is linked or it loads, null when it is gone */
	let tom = $state<StoredRecord | null | undefined>(undefined);
	const tomId = $derived(
		typeof record.data.tom === 'string' && record.data.tom ? record.data.tom : null
	);
	$effect(() => {
		const id = tomId;
		tom = undefined;
		if (!id) return;
		let live = true;
		getStore()
			.get(id)
			.then(
				(detail) => live && (tom = detail?.record ?? null),
				() => live && (tom = null)
			);
		return () => {
			live = false;
		};
	});
	const comparison = $derived(tom ? compareWithTom(record, tom) : null);
	const gaps = $derived(
		comparison?.goals.filter((g) => g.status === 'luecke' || g.status === 'unbelegt').length ?? 0
	);

	const STATUS: Record<CoverageStatus, { label: () => string; badge: string }> = {
		abgedeckt: { label: m.dsfa_tom_status_abgedeckt, badge: 'khaki' },
		luecke: { label: m.dsfa_tom_status_luecke, badge: 'wax' },
		unbelegt: { label: m.dsfa_tom_status_unbelegt, badge: 'wax' },
		offen: { label: m.dsfa_tom_status_offen, badge: '' }
	};
	const NEED: Record<string, () => string> = {
		normal: m.dsfa_tom_need_normal,
		hoch: m.dsfa_tom_need_hoch,
		sehr_hoch: m.dsfa_tom_need_sehr_hoch
	};
	const need = (value: string | null) => (value && NEED[value]?.()) || m.dsfa_tom_need_unknown();
	/** the entry's title and status, e.g. "TOM-Katalog: Portal · Teilweise umgesetzt" */
	const tomLine = $derived.by(() => {
		if (!tom) return '';
		const field = fieldById(tomDefinition, 'status');
		const status = field ? formatValue(field, tom.data.status, getLocale()) : '';
		return [m.dsfa_tom_entry({ title: tom.title }), status].filter(Boolean).join(' · ');
	});

	let exporting = $state(false);
	let failed = $state(false);

	async function downloadExcel() {
		exporting = true;
		failed = false;
		try {
			const { downloadDsfaWorkbook } = await import('./excel.js');
			const name = String(record.data.bezeichnung ?? '')
				.replace(/[^\p{L}\p{N}]+/gu, '-')
				.replace(/^-|-$/g, '');
			const day = new Date().toISOString().slice(0, 10);
			await downloadDsfaWorkbook(
				record,
				getLocale(),
				`dsfa-${name || 'export'}-${day}.xlsx`,
				tom ?? null
			);
		} catch {
			failed = true;
		} finally {
			exporting = false;
		}
	}

	const LEVEL: Record<RiskLevel, () => string> = {
		gering: m.risk_low,
		risiko: m.risk_mid,
		hoch: m.risk_high
	};

	const risks = $derived(assessRisks(record).map((risk, index) => ({ ...risk, n: index + 1 })));
	const rated = $derived(risks.filter((risk) => risk.initial && risk.residual));
	const count = (phase: 'before' | 'after', level: RiskLevel) =>
		risks.filter((risk) => risk[phase] === level).length;
	const highBefore = $derived(count('before', 'hoch'));
	const highAfter = $derived(count('after', 'hoch'));

	const rating = (value: Rating | null) =>
		value ? `${value.likelihood} / ${value.severity}` : '—';
	const measures = (id: string) => {
		const value = record.data[`${id}_massnahmen`];
		return typeof value === 'string' && value.trim() ? value : '—';
	};
	const matrixLabel = (phase: string, key: 'initial' | 'residual', level: 'before' | 'after') =>
		m.dsfa_dash_matrix_label({
			phase,
			list:
				rated
					.map(
						(risk) => `${risk.n} ${text(risk.title)} ${rating(risk[key])} ${LEVEL[risk[level]!]()}`
					)
					.join('; ') || m.dsfa_dash_none_rated()
		});
</script>

<section class="dashboard" aria-label={m.dsfa_dash_title()}>
	<div class="head">
		<h2><Icon name="chart-dots" size={18} />{m.dsfa_dash_title()}</h2>
		<div class="toolbar no-print">
			<button type="button" class="quiet" onclick={downloadExcel} disabled={exporting}>
				<Icon name="download" size={16} />{m.dsfa_xlsx_download()}
			</button>
			<button type="button" class="quiet" onclick={() => window.print()}>
				<Icon name="printer" size={16} />{m.records_print()}
			</button>
		</div>
		{#if failed}<p class="failed" role="alert">{m.dsfa_xlsx_failed()}</p>{/if}
	</div>
	<div class="figures">
		<div class="figure card">
			<span class="icon"><Icon name="list-details" size={18} /></span>
			<span class="caption">{m.dsfa_dash_risks()}</span>
			<strong>{rated.length}</strong>
			<span class="hint">{m.dsfa_dash_risks_of({ total: RISKS.length })}</span>
		</div>
		<div class="figure card" data-level="hoch">
			<span class="icon"><Icon name="alert-triangle" size={18} /></span>
			<span class="caption">{m.dsfa_dash_high_before()}</span>
			<strong>{highBefore}</strong>
			<span class="hint">{m.dsfa_dash_mid({ count: count('before', 'risiko') })}</span>
		</div>
		<div class="figure card" data-level="gering">
			<span class="icon"><Icon name="shield-check" size={18} /></span>
			<span class="caption">{m.dsfa_dash_high_after()}</span>
			<strong>{highAfter}</strong>
			<span class="hint good">
				{highBefore > highAfter
					? m.dsfa_dash_reduced({ count: highBefore - highAfter })
					: m.dsfa_dash_unchanged()}
			</span>
		</div>
		<div class="figure card" data-level={highAfter > 0 ? 'hoch' : 'gering'}>
			<span class="icon"><Icon name="building" size={18} /></span>
			<span class="caption">{m.dsfa_dash_consult()}</span>
			<strong class="word">
				{highAfter > 0 ? m.dsfa_dash_consult_yes() : m.dsfa_dash_consult_no()}
			</strong>
			<span class="hint level-ink">
				{highAfter > 0 ? m.dsfa_dash_consult_yes_hint() : m.dsfa_dash_consult_no_hint()}
			</span>
		</div>
	</div>

	<div class="matrices">
		<section class="card">
			<h2><Icon name="alert-triangle" size={18} />{m.dsfa_dash_before()}</h2>
			<RiskMatrix
				points={rated.map((risk) => ({ n: risk.n, rating: risk.initial! }))}
				label={matrixLabel(m.dsfa_dash_before(), 'initial', 'before')}
			/>
			{@render legend()}
		</section>
		<section class="card">
			<h2><Icon name="shield-check" size={18} />{m.dsfa_dash_after()}</h2>
			<RiskMatrix
				points={rated.map((risk) => ({ n: risk.n, rating: risk.residual! }))}
				filled
				label={matrixLabel(m.dsfa_dash_after(), 'residual', 'after')}
			/>
			{@render legend()}
		</section>
	</div>

	<section class="card table-card">
		<h2><Icon name="list-details" size={18} />{m.dsfa_dash_table()}</h2>
		<div class="scroll">
			<table>
				<thead>
					<tr>
						<th>#</th>
						<th>{m.dsfa_dash_col_risk()}</th>
						<th>{m.dsfa_dash_col_threats()}</th>
						<th>{m.dsfa_dash_col_rating()}</th>
						<th>{m.dsfa_dash_col_before()}</th>
						<th>{m.dsfa_dash_col_measures()}</th>
						<th>{m.dsfa_dash_col_rating()}</th>
						<th>{m.dsfa_dash_col_after()}</th>
					</tr>
				</thead>
				<tbody>
					{#each risks as risk (risk.id)}
						<tr>
							<td><span class="number">{risk.n}</span></td>
							<th scope="row">{text(risk.title)}</th>
							<td class="threats">
								{#each risk.threats as id, index (id)}<span>{id}</span>{index <
									risk.threats.length - 1
										? ', '
										: ''}{:else}—{/each}
							</td>
							<td class="rating">{rating(risk.initial)}</td>
							<td>{@render level(risk.before)}</td>
							<td class="measures">{measures(risk.id)}</td>
							<td class="rating">{rating(risk.residual)}</td>
							<td>{@render level(risk.after)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="card table-card tom-card" aria-labelledby="dsfa-tom-title">
		<h2 id="dsfa-tom-title"><Icon name="shield-check" size={18} />{m.dsfa_tom_title()}</h2>
		{#if !tomId}
			<p class="tom-note">{m.dsfa_tom_unlinked()}</p>
		{:else if tom === null}
			<p class="tom-note">{m.dsfa_tom_missing()}</p>
		{:else if tom && comparison}
			<p class="tom-entry">
				{tomLine} ·
				<span class:gap={gaps > 0}>{m.dsfa_tom_gaps({ count: gaps })}</span>
			</p>
			<p class="tom-need" class:low={comparison.needTooLow}>
				{m.dsfa_tom_need({ need: need(comparison.need), tom: need(comparison.tomNeed) })}
				{#if comparison.needTooLow}{m.dsfa_tom_need_low()}{/if}
			</p>
			<div class="scroll">
				<table>
					<thead>
						<tr>
							<th>{m.dsfa_tom_col_goal()}</th>
							<th>{m.dsfa_tom_col_status()}</th>
							<th>{m.dsfa_dash_col_threats()}</th>
							<th>{m.dsfa_dash_col_before()}</th>
							<th>{m.dsfa_tom_col_measures()}</th>
						</tr>
					</thead>
					<tbody>
						{#each comparison.goals as row (row.risk.id)}
							<tr data-status={row.status}>
								<th scope="row">{text(row.goal)}</th>
								<td>
									<span class="badge {STATUS[row.status].badge}">{STATUS[row.status].label()}</span>
								</td>
								<td class="threats">{row.risk.threats.length}</td>
								<td>{@render level(row.risk.before)}</td>
								<td class="measures">
									{row.measures.map((measure) => text(measure)).join(', ') || m.dsfa_tom_none()}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</section>

{#snippet level(value: RiskLevel | null)}
	{#if value}<span class="level" data-level={value}>{LEVEL[value]()}</span>{:else}—{/if}
{/snippet}

{#snippet legend()}
	<p class="legend">
		<span data-level="gering">{m.risk_low()}</span>
		<span data-level="risiko">{m.risk_mid()}</span>
		<span data-level="hoch">{m.risk_high()}</span>
		<small>{m.dsfa_dash_source()}</small>
	</p>
{/snippet}

<style>
	.dashboard {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;
		margin-top: 1.5rem;

		& h2 {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin-bottom: 0.75rem;
			font-size: 17px;

			& :global(svg) {
				color: var(--primary);
			}
		}
	}

	[data-level='gering'] {
		--level: var(--risk-low);
		--level-soft: var(--risk-low-soft);
		--level-ink: var(--risk-low-ink);
	}

	[data-level='risiko'] {
		--level: var(--risk-mid);
		--level-soft: var(--risk-mid-soft);
		--level-ink: var(--risk-mid-ink);
	}

	[data-level='hoch'] {
		--level: var(--risk-high);
		--level-soft: var(--risk-high-soft);
		--level-ink: var(--risk-high-ink);
	}

	.figures {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.875rem;

		@media (max-width: 64rem) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.figure:not([data-level]) {
		--level-soft: var(--primary-soft);
		--level-ink: var(--primary);
	}

	.figure {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 1rem 1.1rem;

		& .icon {
			display: grid;
			place-items: center;
			width: 2.1rem;
			height: 2.1rem;
			margin-bottom: 0.4rem;
			color: var(--level-ink);
			background: var(--level-soft);
			border-radius: 9px;
		}

		& .caption {
			font-size: 13px;
			color: var(--ink3);
		}

		& strong {
			font-size: 28px;
			font-weight: 700;
			line-height: 1.15;
			letter-spacing: -0.02em;

			&.word {
				font-size: 21px;
				padding-block: 0.2rem;
			}
		}

		& .hint {
			font-size: 12.5px;
			color: var(--ink3);

			&.good {
				color: var(--risk-low-ink);
			}

			&.level-ink {
				color: var(--level-ink);
			}
		}
	}

	.matrices {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;

		@media (max-width: 64rem) {
			grid-template-columns: minmax(0, 1fr);
		}

		& .card {
			padding: 1.1rem 1.25rem;
		}
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem 1rem;
		margin-top: 0.5rem;
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
				background: var(--level);
				border-radius: 4px;
			}
		}

		& small {
			margin-left: auto;
			font-size: 12px;
			color: var(--ink3);
		}
	}

	.table-card {
		padding: 1.1rem 1.25rem;

		& .scroll {
			overflow-x: auto;
		}
	}

	.tom-card {
		& .tom-note,
		& .tom-entry,
		& .tom-need {
			margin: 0 0 0.6rem;
			font-size: 14px;
			color: var(--ink2);
		}

		& .gap,
		& .tom-need.low {
			color: var(--wax);
		}

		/* goals with a gap carry a wax rule on the left */
		& tr[data-status='luecke'] > th,
		& tr[data-status='unbelegt'] > th {
			box-shadow: inset 3px 0 0 var(--wax);
		}
	}

	table {
		width: 100%;
		font-size: 14px;
		border-collapse: collapse;

		& thead th {
			padding: 0.5rem 0.65rem;
			font-size: 12px;
			font-weight: 600;
			color: var(--ink3);
			text-align: left;
			text-transform: uppercase;
			letter-spacing: 0.04em;
			white-space: nowrap;
			border-bottom: 1px solid var(--rule);
		}

		& td,
		& tbody th {
			padding: 0.7rem 0.65rem;
			vertical-align: middle;
			text-align: left;
			border-bottom: 1px solid var(--rule2);
		}

		& tbody th {
			font-weight: 600;
		}

		& tbody tr:last-child > * {
			border-bottom: 0;
		}

		& .rating {
			font-family: var(--mono);
			font-size: 13px;
			color: var(--ink2);
			white-space: nowrap;
		}

		/* threat ids such as "G 0.23" wrap between ids, never inside one */
		& .threats {
			min-width: 7rem;
			font-family: var(--mono);
			font-size: 12px;
			color: var(--ink2);

			& span {
				white-space: nowrap;
			}
		}

		& .measures {
			min-width: 14rem;
			font-size: 13.5px;
			color: var(--ink2);
			white-space: pre-line;
		}
	}

	.number {
		display: inline-grid;
		place-items: center;
		width: 1.5rem;
		height: 1.5rem;
		font-size: 12px;
		font-weight: 700;
		color: var(--on-primary);
		background: var(--primary);
		border-radius: 50%;
	}

	.level {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.2rem 0.6rem;
		font-size: 12px;
		font-weight: 600;
		color: var(--level-ink);
		white-space: nowrap;
		background: var(--level-soft);
		border-radius: 999px;

		&::before {
			width: 0.5rem;
			height: 0.5rem;
			content: '';
			background: var(--level);
			border-radius: 50%;
		}
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 1rem;

		& h2 {
			margin: 0;
			font-size: 20px;
		}

		& .toolbar {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;

			& button {
				display: inline-flex;
				align-items: center;
				gap: 0.4rem;
			}
		}

		& .failed {
			flex-basis: 100%;
			font-size: 14px;
			color: var(--wax);
		}
	}

	/*
	 * on paper the picture fills one landscape page: four figures in a row,
	 * both matrices side by side, the full table; band colours kept
	 */
	@media print {
		@page dashboard {
			size: A4 landscape;
			margin: 12mm;
		}

		.dashboard {
			page: dashboard;
			gap: 4mm;
			margin-top: 0;
			print-color-adjust: exact;
			break-after: page;

			& :global(.card) {
				padding: 3mm 4mm;
				box-shadow: none;
				border: 0.3mm solid #ccc;
				break-inside: avoid;
			}

			& h2 {
				margin-bottom: 2mm;
				font-size: 12pt;
			}
		}

		.figures {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 3mm;
		}

		.figure {
			& .icon {
				display: none;
			}

			& strong {
				font-size: 16pt;

				&.word {
					font-size: 13pt;
				}
			}
		}

		.matrices {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 4mm;

			& :global(.matrix) {
				max-width: 100%;
				max-height: 105mm;
			}
		}

		.table-card {
			break-before: page;

			& .scroll {
				overflow: visible;
			}
		}

		table {
			font-size: 9pt;

			& .measures {
				min-width: 0;
			}
		}
	}
</style>
