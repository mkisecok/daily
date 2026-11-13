<!--
	@component
	The body of a printed Prüfbericht, shown only on paper below the
	PrintDocument head: the result in words, the reasons as a table with
	their legal basis, duties and notes as a checklist, the answers as a
	compact table, the sources with the Rechtsstand, and a signature block.
	No colour carries meaning here; every level is written out.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { cite, text } from '../i18n.js';
	import type { Question, QuestionnaireResult, ToolManifest } from '../types.js';
	import Rechtsstand from './Rechtsstand.svelte';

	type AnswerRow = { number: number; question: Question; answer: string };

	let {
		result,
		tool,
		answers
	}: { result: QuestionnaireResult; tool: ToolManifest; answers: AnswerRow[] } = $props();

	const LEVEL = {
		negative: m.verdict_level_negative,
		conditional: m.verdict_level_conditional,
		positive: m.verdict_level_positive
	} as const;

	const ANSWER: Record<string, () => string> = {
		yes: m.answer_yes,
		no: m.answer_no,
		unknown: m.answer_unknown,
		na: m.answer_na
	};
</script>

<section class="print-report print-only">
	<h2>{m.verdict_label()}</h2>
	<p class="level">{m.verdict_scale({ level: LEVEL[result.verdict]() })}</p>
	<p class="headline">{text(result.headline)}</p>
	<p>{text(result.explanation)}</p>

	{#if result.reasons.length > 0}
		<h2>{m.verdict_reasons()}</h2>
		<table>
			<thead>
				<tr>
					<th class="number">{m.print_number()}</th>
					<th>{m.print_finding()}</th>
					<th class="basis">{m.print_basis()}</th>
				</tr>
			</thead>
			<tbody>
				{#each result.reasons as reason, index (index)}
					<tr>
						<td class="number">{index + 1}</td>
						<td>{text(reason.text)}</td>
						<td class="basis">{reason.cite ? cite(reason.cite) : '—'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}

	{#if (result.notes?.length ?? 0) > 0}
		<h2>{result.notesTitle ? text(result.notesTitle) : m.verdict_notes()}</h2>
		<ul class="checklist">
			{#each result.notes ?? [] as note, index (index)}
				<li>{text(note)}</li>
			{/each}
		</ul>
	{/if}

	{#if answers.length > 0}
		<h2>{m.run_answers()}</h2>
		<table class="answers">
			<thead>
				<tr>
					<th class="number">{m.print_number()}</th>
					<th>{m.print_question()}</th>
					<th class="answer">{m.print_answer()}</th>
				</tr>
			</thead>
			<tbody>
				{#each answers as row (row.question.id)}
					<tr>
						<td class="number">{row.number}</td>
						<td>{text(row.question.text)}</td>
						<td class="answer">{ANSWER[row.answer]?.() ?? '—'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}

	<h2>{m.verdict_sources()}</h2>
	<p class="sources">{result.citations.map(cite).join(' · ')}</p>
	<Rechtsstand {tool} stored={result.lawAsOf} />

	<div class="signature">
		<div class="line">{m.print_sign_place()}</div>
		<div class="line">{m.print_sign_name()}</div>
	</div>
</section>

<style>
	.print-report {
		font-size: 10pt;
		line-height: 1.4;

		& h2 {
			margin: 6mm 0 2mm;
			font-family: var(--serif);
			font-size: 12pt;
		}

		& .level {
			margin: 0;
			font-size: 9pt;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.04em;
		}

		& .headline {
			margin: 1mm 0 2mm;
			font-family: var(--serif);
			font-size: 14pt;
		}

		& table {
			width: 100%;
			border-collapse: collapse;

			& th,
			& td {
				padding: 1.2mm 2mm;
				text-align: left;
				vertical-align: top;
				border-bottom: 0.3pt solid #999;
			}

			& thead th {
				font-size: 8.5pt;
				border-bottom: 0.6pt solid #000;
			}

			& .number {
				width: 8mm;
			}

			& .basis {
				width: 42mm;
				font-family: var(--mono);
				font-size: 8.5pt;
			}

			& .answer {
				width: 22mm;
			}
		}

		/* a printed checklist: a box to tick in front of each duty */
		& .checklist {
			margin: 0;
			padding: 0;
			list-style: none;

			& li {
				position: relative;
				margin-bottom: 1.5mm;
				padding-left: 6mm;
				break-inside: avoid;

				&::before {
					position: absolute;
					top: 0.2em;
					left: 0;
					width: 3mm;
					height: 3mm;
					border: 0.5pt solid #000;
					content: '';
				}
			}
		}

		& .sources {
			margin: 0;
			font-family: var(--mono);
			font-size: 8.5pt;
		}

		& .signature {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 12mm;
			margin-top: 16mm;
			break-inside: avoid;

			& .line {
				padding-top: 1.5mm;
				font-size: 8.5pt;
				border-top: 0.5pt solid #000;
			}
		}
	}
</style>
