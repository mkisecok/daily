<!--
	@component
	The AI usage policy on paper as a document to sign, below a letter head:
	each clause as "§ n" with its sentences as numbered paragraphs, open
	points in square brackets marked to be filled in, the day it enters into
	force, and lines for management and, where it is involved, the works
	council. The warnings for the drafter stay on screen.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { text } from '#lib/tools/i18n.js';
	import type { ReportPrintProps } from '#lib/tools/prints.js';
	import { policyClauses } from './engine.js';

	let { answers }: ReportPrintProps = $props();

	const clauses = $derived(policyClauses(answers));
	/** a sentence split into plain text and the placeholders in square brackets */
	const pieces = (sentence: string) =>
		sentence
			.split(/(\[[^\]]+\])/)
			.filter(Boolean)
			.map((piece) => ({
				piece,
				open: piece.startsWith('[')
			}));
</script>

<section class="print-body print-only policy">
	{#each clauses as clause, index (index)}
		<h2>§ {index + 1} {text(clause.title)}</h2>
		<ol class:single={clause.sentences.length === 1}>
			{#each clause.sentences as sentence, n (n)}
				<li>
					{#each pieces(text(sentence)) as { piece, open }, k (k)}
						{#if open}<mark>{piece}</mark>{:else}{piece}{/if}
					{/each}
				</li>
			{/each}
		</ol>
	{/each}

	<p class="in-force">{m.print_policy_in_force()} <span class="blank"></span></p>

	<div class="signature">
		<div class="line">{m.print_sign_place()}</div>
		<div class="line">{m.print_sign_management()}</div>
		{#if answers.p_council === 'yes'}
			<div class="line">{m.print_sign_place()}</div>
			<div class="line">{m.print_sign_council()}</div>
		{/if}
	</div>
</section>

<style>
	.policy {
		& h2 {
			margin: 6mm 0 2mm;
			font-size: 11.5pt;
			break-after: avoid;
		}

		/* paragraphs numbered (1), (2) as in a statute; a lone one needs no number */
		& ol {
			margin: 0;
			padding-left: 8mm;
			list-style: none;
			counter-reset: paragraph;

			& li {
				position: relative;
				margin-bottom: 1.5mm;
				line-height: 1.45;
				counter-increment: paragraph;

				&::before {
					position: absolute;
					left: -8mm;
					content: '(' counter(paragraph) ')';
				}
			}

			&.single {
				padding-left: 0;

				& li::before {
					content: none;
				}
			}
		}

		& mark {
			padding: 0 0.5mm;
			font-style: italic;
			color: inherit;
			background: none;
			border-bottom: 0.5pt dashed #000;
		}

		& .in-force {
			margin-top: 8mm;

			& .blank {
				display: inline-block;
				width: 40mm;
				border-bottom: 0.5pt solid #000;
			}
		}

		& .signature {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 14mm 12mm;
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
