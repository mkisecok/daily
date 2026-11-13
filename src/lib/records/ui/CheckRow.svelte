<!--
	@component
	One checklist point of a record form in one row: its label and citation,
	a compact Ja / Nein / Entfällt choice, and a note and due date that open
	on demand. They open by themselves when the point is answered "Nein" or
	already carries a note or date.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import Citation from '#lib/tools/_shared/Citation.svelte';
	import { text } from '#lib/tools/i18n.js';
	import Icon from '#lib/ui/Icon.svelte';
	import DatePicker from '#lib/ui/form/DatePicker.svelte';
	import type { FieldDef } from '../types.js';
	import type { FieldError } from '../validate.js';
	import type { FormValue } from './inputs.js';

	let {
		field,
		value = $bindable(),
		note = $bindable(),
		due = $bindable(),
		error = undefined
	}: {
		field: FieldDef & { type: 'check' };
		value: FormValue;
		note: FormValue;
		due: FormValue;
		error?: FieldError;
	} = $props();

	const id = $derived(`field-${field.id}`);
	const options = $derived([
		{ value: 'ja', label: m.answer_yes() },
		{ value: 'nein', label: m.answer_no() },
		...(field.na ? [{ value: 'entfaellt', label: m.answer_na() }] : [])
	]);

	const hasDetails = $derived(
		(typeof note === 'string' && note.trim() !== '') || (typeof due === 'string' && due !== '')
	);
	/** null until the user toggles; until then the details follow the answer */
	let toggled = $state<boolean | null>(null);
	const open = $derived(toggled ?? (hasDetails || value === 'nein'));

	const dueText = () => (typeof due === 'string' ? due : '');
	const setDue = (next: string) => (due = next);
</script>

<div class="check" data-status={value || 'offen'} class:invalid={error}>
	<div class="head">
		<span class="label" id="{id}-label">{text(field.label)}</span>
		{#if field.cite}<span class="cite"><Citation basis={field.cite} wrap /></span>{/if}
		{#if field.help}<p class="help">{text(field.help)}</p>{/if}
	</div>

	<fieldset class="answer">
		<legend class="visually-hidden">{text(field.label)}</legend>
		{#each options as option (option.value)}
			<label data-value={option.value}>
				<input type="radio" name={id} value={option.value} bind:group={value} />
				<span>{option.label}</span>
			</label>
		{/each}
	</fieldset>

	<button
		type="button"
		class="more"
		aria-expanded={open}
		aria-controls="{id}-details"
		onclick={() => (toggled = !open)}
	>
		<Icon name="edit" size={14} />
		<span>{m.check_details()}</span>
		{#if hasDetails && !open}<span class="dot" aria-hidden="true"></span>{/if}
	</button>

	{#if open}
		<div class="details" id="{id}-details">
			<label class="note">
				<!-- the date picker's label row, so both labels sit on one line -->
				<span class="daily-label-row"><span class="daily-field-label">{m.check_note()}</span></span>
				<input type="text" bind:value={note} />
			</label>
			<div class="due">
				<DatePicker bind:value={dueText, setDue} label={m.check_due()} granularity="day" />
			</div>
		</div>
	{/if}

	{#if error}
		<p class="error">{error === 'required' ? m.records_required() : m.records_invalid()}</p>
	{/if}
</div>

<style>
	/* label left, answer and toggle right; under each other in a narrow card */
	.check {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		grid-template-areas:
			'head answer more'
			'details details details'
			'error error error';
		column-gap: 1rem;
		align-items: center;
		padding: 0.7rem 0;
		border-bottom: 1px solid var(--rule2);

		&:last-child {
			border-bottom: 0;
		}

		@container (max-width: 36rem) {
			grid-template-columns: auto minmax(0, 1fr);
			grid-template-areas:
				'head head'
				'answer more'
				'details details'
				'error error';
			row-gap: 0.5rem;

			& .more {
				justify-self: end;
			}
		}
	}

	.head {
		grid-area: head;
		min-width: 0;

		& .label {
			font-family: var(--serif);
			font-size: 15px;
			line-height: 1.4;
			color: var(--ink);
		}

		& .cite {
			display: block;
			margin-top: 0.1rem;
		}

		& .help {
			margin-top: 0.2rem;
			font-size: 13px;
			color: var(--ink2);
		}
	}

	/* a segmented choice; the chosen answer takes its traffic-light colour */
	.answer {
		grid-area: answer;
		display: inline-flex;
		margin: 0;
		padding: 0;
		border: 0;

		& label {
			position: relative;
			display: inline-flex;
			align-items: center;
			min-height: 2rem;
			padding: 0 0.7rem;
			font-size: 13px;
			color: var(--ink2);
			background: var(--sheet);
			border: 1px solid var(--rule);
			cursor: pointer;

			&:not(:first-of-type) {
				margin-left: -1px;
			}

			&:first-of-type {
				border-radius: var(--radius) 0 0 var(--radius);
			}

			&:last-of-type {
				border-radius: 0 var(--radius) var(--radius) 0;
			}

			&:hover {
				color: var(--ink);
			}

			&:has(:checked) {
				z-index: 1;
				font-weight: 600;
			}

			&[data-value='ja']:has(:checked) {
				color: var(--risk-low-ink);
				background: var(--risk-low-soft);
				border-color: var(--risk-low);
			}

			&[data-value='nein']:has(:checked) {
				color: var(--risk-high-ink);
				background: var(--risk-high-soft);
				border-color: var(--risk-high);
			}

			&[data-value='entfaellt']:has(:checked) {
				color: var(--ink);
				background: var(--paper);
				border-color: var(--ink3);
			}

			&:has(:focus-visible) {
				z-index: 2;
				outline: 2px solid var(--navy);
				outline-offset: 2px;
			}

			@media (max-width: 40rem) {
				min-height: 2.5rem;
			}
		}

		/* the radio itself is hidden; the label is the control */
		& input {
			position: absolute;
			inset: 0;
			margin: 0;
			opacity: 0;
			cursor: pointer;
		}
	}

	.more {
		grid-area: more;
		display: inline-flex;
		gap: 0.35rem;
		align-items: center;
		min-height: 2rem;
		padding: 0 0.5rem;
		font-size: 12px;
		color: var(--ink3);
		background: none;
		border: 0;
		border-radius: var(--radius);
		cursor: pointer;

		&:hover,
		&[aria-expanded='true'] {
			color: var(--ink);
		}

		& .dot {
			width: 6px;
			height: 6px;
			background: var(--primary);
			border-radius: 50%;
		}
	}

	/* both labels in the shared field-label style, a size smaller than the point */
	.details {
		--field-label-size: 14px;

		grid-area: details;
		display: grid;
		grid-template-columns: minmax(0, 1fr) 12rem;
		gap: 0.75rem;
		align-items: end;
		margin-top: 0.6rem;

		@container (max-width: 36rem) {
			grid-template-columns: minmax(0, 1fr);
			margin-top: 0;
		}

		& input {
			width: 100%;
		}
	}

	.error {
		grid-area: error;
		margin-top: 0.3rem;
		font-size: 13px;
		color: var(--wax);
	}
</style>
