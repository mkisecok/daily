<!--
	@component
	One numbered question with a yes / no / unclear choice as tiles, for a
	section card. The citation sits on the right as a chip, like a margin note.
	Works without JavaScript (plain radios).
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { fieldName, optionsFor } from '../answers.js';
	import { text } from '../i18n.js';
	import type { Question, YesNoAnswer } from '../types.js';
	import Citation from './Citation.svelte';

	let {
		number,
		question,
		value = undefined
	}: {
		number: number;
		question: Question;
		value?: YesNoAnswer;
	} = $props();

	const labels: Record<YesNoAnswer, () => string> = {
		yes: m.answer_yes,
		no: m.answer_no,
		unknown: m.answer_unknown,
		na: m.answer_na
	};
	const options = $derived(optionsFor(question));
</script>

<fieldset class="row">
	<legend class="legend">
		<span class="number">{number}.</span>
		<span class="text">{text(question.text)}</span>
	</legend>
	{#if question.help}
		<p class="help">{text(question.help)}</p>
	{/if}
	<div class="answers choices">
		{#each options as option (option)}
			<label>
				<input
					type="radio"
					name={fieldName(question)}
					value={option}
					checked={value === option}
					required
				/>
				<span>{labels[option]()}</span>
			</label>
		{/each}
	</div>
	{#if question.cite}
		<div class="cite"><Citation basis={question.cite} /></div>
	{/if}
</fieldset>

<style>
	/* one row inside a section card; hairlines between rows */
	.row {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-areas:
			'legend cite'
			'help cite'
			'answers cite';
		column-gap: 2rem;
		row-gap: 0.6rem;
		min-width: 0;
		padding: 1.1rem 0;
		border: 0;
		border-top: 1px solid var(--rule2);

		@media (max-width: 40rem) {
			grid-template-columns: 1fr;
			grid-template-areas:
				'legend'
				'help'
				'cite'
				'answers';
		}

		& .legend {
			grid-area: legend;
			display: flex;
			gap: 0.75rem;
			padding: 0;
			font-family: var(--serif);
			font-size: 17px;
			line-height: 1.4;
			color: var(--ink);
			max-width: var(--measure);

			& .number {
				flex-shrink: 0;
				min-width: 1.6rem;
				padding-top: 0.2rem;
				font-family: var(--mono);
				font-size: 12px;
				font-variant-numeric: tabular-nums;
				color: var(--ink3);
			}
		}

		& .help {
			grid-area: help;
			margin-left: 2.35rem;
			font-size: 14px;
			color: var(--ink2);
			max-width: var(--measure);
		}

		& .answers {
			grid-area: answers;
			margin-left: 2.35rem;
		}

		& .cite {
			grid-area: cite;
			align-self: start;
			justify-self: start;
			display: inline-flex;
			align-items: center;
			min-height: 1.75rem;
			padding: 0 0.5rem;
			background: var(--sheet);
			border: 1px solid var(--rule2);
			border-radius: var(--radius-badge);

			&:hover {
				border-color: var(--navy);
			}
		}

		/* on phones the tiles take the full width of the card */
		@media (max-width: 40rem) {
			& .help,
			& .answers {
				margin-left: 0;
			}
		}
	}
</style>
