<!--
	@component
	The picture of an office move: how far each part of the checklist is,
	the DSK risk matrix before and after measures for the risks that apply,
	and the risks in a table. Parts the move does not include show as not
	relevant; unrated risks stay out of the matrices.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { checkStatus, settled } from '../../records/checks.js';
	import type { RecordView } from '../../records/types.js';
	import RiskMatrix from '../dsfa/RiskMatrix.svelte';
	import type { Rating, RiskLevel } from '../dsfa/definition.js';
	import { text } from '../i18n.js';
	import type { Localized } from '../types.js';
	import { applies, assessRisks, BLOCKS } from './definition.js';

	let { record }: { record: RecordView } = $props();

	const L = (de: string, en: string): Localized => ({ de, en });
	const T = {
		title: L('Stand des Umzugs', 'State of the move'),
		checklist: L('Checkliste', 'Checklist'),
		part: L('Bereich', 'Part'),
		done: L('Erledigt', 'Done'),
		gap: L('Lücke', 'Gap'),
		open: L('Offen', 'Open'),
		irrelevant: L('Entfällt', 'Not relevant'),
		risks: L('Risikoanalyse', 'Risk analysis'),
		before: L('Vor Maßnahmen', 'Before measures'),
		after: L('Nach Maßnahmen (Restrisiko)', 'After measures (residual risk)'),
		risk: L('Risiko', 'Risk'),
		beforeShort: L('Vorher', 'Before'),
		afterShort: L('Nachher', 'After'),
		threats: L('Gefährdungen', 'Threats'),
		unrated: L('Noch keine Risiken bewertet.', 'No risks rated yet.'),
		none: L(
			'Für diesen Umfang gilt keines der Umzugsrisiken.',
			'None of the move risks applies to this scope.'
		)
	};

	const LEVEL: Record<RiskLevel, () => string> = {
		gering: m.risk_low,
		risiko: m.risk_mid,
		hoch: m.risk_high
	};

	const blocks = $derived(
		BLOCKS.map((block) => {
			const items = block.items.filter((item) =>
				applies(record, { ...item, scope: item.scope ?? block.scope })
			);
			const done = items.filter((item) => settled(checkStatus(record.data[item.id]))).length;
			const gap = items.filter((item) => checkStatus(record.data[item.id]) === 'nein').length;
			return { block, total: items.length, done, gap, open: items.length - done - gap };
		})
	);

	const risks = $derived(assessRisks(record).map((risk, index) => ({ ...risk, n: index + 1 })));
	const rated = $derived(risks.filter((risk) => risk.initial));

	const points = (key: 'initial' | 'residual') =>
		rated.flatMap((risk) => (risk[key] ? [{ n: risk.n, rating: risk[key] as Rating }] : []));
	const label = (phase: Localized, key: 'before' | 'after') =>
		`${text(phase)}: ${rated
			.map((risk) => `${risk.n} ${text(risk.title)} ${risk[key] ? LEVEL[risk[key]]() : '—'}`)
			.join(', ')}`;
</script>

<section class="move" aria-label={text(T.title)}>
	<h2>{text(T.checklist)}</h2>
	<table class="progress">
		<thead>
			<tr>
				<th scope="col">{text(T.part)}</th>
				<th scope="col" class="bar-col"><span class="visually-hidden">{text(T.done)}</span></th>
				<th scope="col" class="num">{text(T.done)}</th>
				<th scope="col" class="num">{text(T.gap)}</th>
				<th scope="col" class="num">{text(T.open)}</th>
			</tr>
		</thead>
		<tbody>
			{#each blocks as { block, total, done, gap, open } (block.id)}
				<tr data-relevant={total > 0}>
					<th scope="row">{text(block.title)}</th>
					{#if total > 0}
						<td class="bar-col">
							<span class="bar" aria-hidden="true">
								<span class="done" style:width="{(done / total) * 100}%"></span>
								<span class="gap" style:width="{(gap / total) * 100}%"></span>
							</span>
						</td>
						<td class="num">{done}/{total}</td>
						<td class="num" data-alert={gap > 0}>{gap}</td>
						<td class="num">{open}</td>
					{:else}
						<td class="bar-col"></td>
						<td class="num irrelevant" colspan="3">{text(T.irrelevant)}</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>

	<h2>{text(T.risks)}</h2>
	{#if risks.length === 0}
		<p class="quiet">{text(T.none)}</p>
	{:else if rated.length === 0}
		<p class="quiet">{text(T.unrated)}</p>
	{:else}
		<div class="matrices">
			<figure>
				<figcaption>{text(T.before)}</figcaption>
				<RiskMatrix points={points('initial')} label={label(T.before, 'before')} />
			</figure>
			<figure>
				<figcaption>{text(T.after)}</figcaption>
				<RiskMatrix points={points('residual')} filled label={label(T.after, 'after')} />
			</figure>
		</div>
	{/if}

	{#if risks.length > 0}
		<table class="risks">
			<thead>
				<tr>
					<th scope="col" class="num">#</th>
					<th scope="col">{text(T.risk)}</th>
					<th scope="col">{text(T.threats)}</th>
					<th scope="col">{text(T.beforeShort)}</th>
					<th scope="col">{text(T.afterShort)}</th>
				</tr>
			</thead>
			<tbody>
				{#each risks as risk (risk.id)}
					<tr>
						<td class="num">{risk.n}</td>
						<th scope="row">{text(risk.title)}</th>
						<!-- a threat number such as G 0.8 never breaks -->
						<td class="threats">{risk.threats.replaceAll('G ', 'G\u00a0')}</td>
						<td>{@render level(risk.before)}</td>
						<td>{@render level(risk.after)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</section>

{#snippet level(value: RiskLevel | null)}
	{#if value}<span class="level" data-level={value}>{LEVEL[value]()}</span>{:else}—{/if}
{/snippet}

<style>
	.move {
		display: grid;
		gap: 1rem;
		margin-top: 1.5rem;
		padding: 1.5rem 1.75rem 1.75rem;
		background: var(--sheet);
		border: 1px solid var(--rule2);
		border-radius: 4px;

		@media (max-width: 40rem) {
			padding: 1.25rem 1rem;
		}

		@media print {
			padding: 0;
			border: 0;
		}

		& h2 {
			font-size: 18px;

			&:not(:first-child) {
				margin-top: 0.75rem;
				padding-top: 1.25rem;
				border-top: 1px solid var(--rule2);
			}
		}
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;

		& th,
		& td {
			padding: 0.5rem 0.75rem 0.5rem 0;
			text-align: left;
			vertical-align: middle;
			border-bottom: 1px solid var(--rule2);
		}

		& thead th {
			font-size: 11px;
			font-weight: 400;
			letter-spacing: 0.06em;
			text-transform: uppercase;
			color: var(--ink3);
		}

		& tbody th {
			font-weight: 500;
		}

		& .num {
			font-variant-numeric: tabular-nums;
			text-align: right;
			white-space: nowrap;
		}
	}

	.progress {
		& tr[data-relevant='false'] th {
			font-weight: 400;
			color: var(--ink3);
		}

		& .bar-col {
			width: 30%;

			@media (max-width: 40rem) {
				display: none;
			}
		}

		& .bar {
			display: flex;
			height: 6px;
			overflow: hidden;
			background: var(--rule2);
			border-radius: 3px;
			print-color-adjust: exact;

			& .done {
				background: var(--risk-low);
			}

			& .gap {
				background: var(--risk-high);
			}
		}

		& [data-alert='true'] {
			font-weight: 600;
			color: var(--risk-high-ink);
		}

		& .irrelevant {
			color: var(--ink3);
		}
	}

	.matrices {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.5rem;

		@media (max-width: 56rem) {
			grid-template-columns: minmax(0, 1fr);
		}

		& figure {
			margin: 0;
		}

		& figcaption {
			margin-bottom: 0.5rem;
			font-family: var(--serif);
			font-size: 15px;
			font-weight: 600;
		}
	}

	.risks {
		& .threats {
			font-family: var(--mono);
			font-size: 12px;
			color: var(--ink3);
		}

		@media (max-width: 40rem) {
			& th:nth-child(3),
			& td:nth-child(3) {
				display: none;
			}
		}
	}

	.level {
		display: inline-block;
		padding: 0.1rem 0.45rem;
		font-size: 12px;
		font-weight: 500;
		color: var(--level-ink);
		background: var(--level-soft);
		border-radius: 2px;
		print-color-adjust: exact;

		&[data-level='gering'] {
			--level-ink: var(--risk-low-ink);
			--level-soft: var(--risk-low-soft);
		}

		&[data-level='risiko'] {
			--level-ink: var(--risk-mid-ink);
			--level-soft: var(--risk-mid-soft);
		}

		&[data-level='hoch'] {
			--level-ink: var(--risk-high-ink);
			--level-soft: var(--risk-high-soft);
		}
	}

	.quiet {
		font-size: 14px;
		color: var(--ink3);
	}
</style>
