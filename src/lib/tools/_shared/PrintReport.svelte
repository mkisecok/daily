<!--
	@component
	The body of a printed Prüfbericht, shown only on paper below the
	PrintDocument head: the result (PrintResult), the answers as a compact
	table, the sources with the Rechtsstand, and a signature block.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { cite, text } from '../i18n.js';
	import type { Question, QuestionnaireResult, ToolManifest } from '../types.js';
	import PrintResult from './PrintResult.svelte';
	import Rechtsstand from './Rechtsstand.svelte';

	type AnswerRow = { number: number; question: Question; answer: string };

	let {
		result,
		tool,
		answers
	}: { result: QuestionnaireResult; tool: ToolManifest; answers: AnswerRow[] } = $props();

	const ANSWER: Record<string, () => string> = {
		yes: m.answer_yes,
		no: m.answer_no,
		unknown: m.answer_unknown,
		na: m.answer_na
	};
</script>

<section class="print-body print-only">
	<PrintResult {result} />

	{#if answers.length > 0}
		<h2>{m.run_answers()}</h2>
		<table class="print-table">
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
	.answer {
		width: 22mm;
	}

	.sources {
		margin: 0;
		font-family: var(--mono);
		font-size: 8.5pt;
	}

	/* two lines to sign on, kept together on one page */
	.signature {
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
</style>
