<!--
	@component
	One field of a record form: label, help and citation on the left like a
	questionnaire row, the input below. Datetimes are entered in German time.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import Citation from '#lib/tools/_shared/Citation.svelte';
	import { text } from '#lib/tools/i18n.js';
	import type { FieldError } from '../validate.js';
	import type { FieldDef, Option } from '../types.js';
	import type { FormValue } from './inputs.js';
	import Chips from '#lib/ui/form/Chips.svelte';
	import Combobox from '#lib/ui/form/Combobox.svelte';
	import DatePicker from '#lib/ui/form/DatePicker.svelte';
	import Select from '#lib/ui/form/Select.svelte';

	let {
		field,
		value = $bindable(),
		error = undefined,
		choices = []
	}: {
		field: FieldDef;
		value: FormValue;
		error?: FieldError;
		/** records a reference field can point to */
		choices?: Option[];
	} = $props();

	const id = $derived(`field-${field.id}`);
	const describedBy = $derived(
		[field.help ? `${id}-help` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') ||
			undefined
	);

	/** single-value controls work on strings; an empty one stands for no value */
	const asText = () => (typeof value === 'string' ? value : value == null ? '' : String(value));
	const setText = (next: string) => (value = next);
	const asList = () => (Array.isArray(value) ? value : []);
	const setList = (next: string[]) => (value = next);
</script>

<div class="field" data-type={field.type} class:invalid={error}>
	{#if field.type === 'multiselect'}
		<span class="label-row">
			<span class="label" id="{id}-label">{text(field.label)}</span>{#if field.required}<span
					class="req"
					aria-hidden="true">*</span
				>{/if}
		</span>
		<Chips
			bind:value={asList, setList}
			items={field.options.map((o) => ({ value: o.value, label: text(o.label) }))}
			labelledBy="{id}-label"
			{describedBy}
		/>
	{:else if field.type === 'date' || field.type === 'datetime'}
		<DatePicker
			bind:value={asText, setText}
			label={text(field.label)}
			granularity={field.type === 'date' ? 'day' : 'minute'}
			{describedBy}
			invalid={!!error}
			required={field.required}
		/>
	{:else if field.type === 'boolean'}
		<fieldset aria-describedby={describedBy}>
			<legend class="label">
				{text(field.label)}{#if field.required}<span class="req" aria-hidden="true">*</span>{/if}
			</legend>
			<div class="choices">
				<label
					><input type="radio" name={id} value="true" bind:group={value} />{m.answer_yes()}</label
				>
				<label
					><input type="radio" name={id} value="false" bind:group={value} />{m.answer_no()}</label
				>
			</div>
		</fieldset>
	{:else}
		<!-- The asterisk stays outside the label so the accessible name is the label alone. -->
		<span class="label-row">
			<label class="label" for={id}>{text(field.label)}</label>{#if field.required}<span
					class="req"
					aria-hidden="true">*</span
				>{/if}
		</span>
		{#if field.type === 'textarea'}
			<textarea
				{id}
				rows="4"
				bind:value
				aria-describedby={describedBy}
				aria-invalid={!!error}
				aria-required={field.required || undefined}></textarea>
		{:else if field.type === 'reference'}
			<Combobox
				{id}
				bind:value={asText, setText}
				items={choices.map((c) => ({ value: c.value, label: text(c.label) }))}
				placeholder={m.records_select()}
				empty={m.control_no_match()}
				{describedBy}
				invalid={!!error}
				required={field.required}
			/>
		{:else if field.type === 'select'}
			<Select
				{id}
				bind:value={asText, setText}
				items={field.options.map((o) => ({ value: o.value, label: text(o.label) }))}
				placeholder={m.records_select()}
				{describedBy}
				invalid={!!error}
				required={field.required}
			/>
		{:else if field.type === 'number'}
			<span class="with-unit">
				<input
					{id}
					type="number"
					min={field.min}
					bind:value
					aria-describedby={describedBy}
					aria-invalid={!!error}
					aria-required={field.required || undefined}
				/>
				{#if field.unit}<span class="unit">{text(field.unit)}</span>{/if}
			</span>
		{:else}
			<input
				{id}
				type="text"
				bind:value
				aria-describedby={describedBy}
				aria-invalid={!!error}
				aria-required={field.required || undefined}
			/>
		{/if}
	{/if}

	{#if field.help}<p class="help" id="{id}-help">{text(field.help)}</p>{/if}
	{#if error}
		<p class="error" id="{id}-error">
			{error === 'required' ? m.records_required() : m.records_invalid()}
		</p>
	{/if}
	{#if field.cite}<div class="cite"><Citation basis={field.cite} /></div>{/if}
</div>

<style>
	.field {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		column-gap: 2rem;
		row-gap: 0.4rem;
		min-width: 0;
		padding: 1rem 0;
		border-bottom: 1px solid var(--rule2);

		/* the section card frames the last field */
		&:last-child {
			border-bottom: 0;
		}

		& > *:not(.cite) {
			grid-column: 1;
		}

		& .cite {
			grid-column: 2;
			grid-row: 1;
			padding-top: 0.15rem;
		}

		@media (max-width: 40rem) {
			grid-template-columns: 1fr;

			& .cite {
				grid-column: 1;
				grid-row: auto;
			}
		}

		& fieldset {
			border: 0;
			padding: 0;
			margin: 0;

			& .choices {
				margin-top: 0.4rem;
			}
		}

		& .label {
			display: block;
			padding: 0;
			font-family: var(--serif);
			font-size: 16px;
			color: var(--ink);
		}

		& .label-row {
			display: block;

			& .label {
				display: inline;
			}
		}

		& .req {
			margin-left: 0.2rem;
			color: var(--wax);
		}

		& input:not([type='checkbox'], [type='radio']),
		& textarea {
			width: 100%;
			max-width: var(--measure);
		}

		&[data-type='number'] input {
			width: auto;
		}

		& textarea {
			resize: vertical;
		}

		& .with-unit {
			display: inline-flex;
			align-items: baseline;
			gap: 0.5rem;

			& .unit {
				font-size: 14px;
				color: var(--ink2);
			}
		}

		& .help {
			font-size: 13px;
			color: var(--ink2);
			max-width: var(--measure);
		}

		& .error {
			font-size: 13px;
			color: var(--wax);
		}
	}
</style>
