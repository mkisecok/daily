<!--
	@component
	One numbered question with a yes / no / unclear choice. The citation sits
	on the right like a margin note. Works without JavaScript (plain radios).
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
	<div class="answers">
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
	.row {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-areas:
			'legend cite'
			'help cite'
			'answers cite';
		column-gap: 2rem;
		row-gap: 0.5rem;
		padding: 1.25rem 0;
		border: 0;
		border-bottom: 1px solid var(--rule2);

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
		}

		& .number {
			color: var(--ink3);
			flex-shrink: 0;
			min-width: 1.6rem;
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
			display: flex;
			gap: 1.5rem;
			margin-left: 2.35rem;

			& label {
				display: inline-flex;
				align-items: center;
				gap: 0.4rem;
				font-family: var(--mono);
				font-size: 12px;
				letter-spacing: 0.06em;
				text-transform: uppercase;
				color: var(--ink2);
				cursor: pointer;

				&:has(input:checked) {
					color: var(--ink);
				}
			}

			& input {
				accent-color: var(--navy);
				margin: 0;
			}
		}

		& .cite {
			grid-area: cite;
			align-self: start;
			padding-top: 0.2rem;
		}
	}
</style>
