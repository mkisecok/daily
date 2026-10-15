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

	function toggle(option: string, checked: boolean) {
		const list = Array.isArray(value) ? value : [];
		value = checked ? [...list, option] : list.filter((v) => v !== option);
	}
</script>

<div class="field" data-type={field.type} class:invalid={error}>
	{#if field.type === 'multiselect' || field.type === 'boolean'}
		<fieldset aria-describedby={describedBy}>
			<legend class="label">
				{text(field.label)}{#if field.required}<span class="req" aria-hidden="true">*</span>{/if}
			</legend>
			<div class="choices">
				{#if field.type === 'multiselect'}
					{#each field.options as option (option.value)}
						<label>
							<input
								type="checkbox"
								value={option.value}
								checked={Array.isArray(value) && value.includes(option.value)}
								onchange={(event) => toggle(option.value, event.currentTarget.checked)}
							/>
							<span>{text(option.label)}</span>
						</label>
					{/each}
				{:else}
					<label
						><input type="radio" name={id} value="true" bind:group={value} />{m.answer_yes()}</label
					>
					<label
						><input type="radio" name={id} value="false" bind:group={value} />{m.answer_no()}</label
					>
				{/if}
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
			<select
				{id}
				bind:value
				aria-describedby={describedBy}
				aria-invalid={!!error}
				aria-required={field.required || undefined}
			>
				<option value="">{m.records_select()}</option>
				{#each choices as choice (choice.value)}
					<option value={choice.value}>{text(choice.label)}</option>
				{/each}
			</select>
		{:else if field.type === 'select'}
			<select
				{id}
				bind:value
				aria-describedby={describedBy}
				aria-invalid={!!error}
				aria-required={field.required || undefined}
			>
				<option value="">{m.records_select()}</option>
				{#each field.options as option (option.value)}
					<option value={option.value}>{text(option.label)}</option>
				{/each}
			</select>
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
		{:else if field.type === 'date'}
			<input
				{id}
				type="date"
				bind:value
				aria-describedby={describedBy}
				aria-invalid={!!error}
				aria-required={field.required || undefined}
			/>
		{:else if field.type === 'datetime'}
			<input
				{id}
				type="datetime-local"
				bind:value
				aria-describedby={describedBy}
				aria-invalid={!!error}
				aria-required={field.required || undefined}
			/>
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
		grid-template-columns: 1fr auto;
		column-gap: 2rem;
		row-gap: 0.4rem;
		padding: 1rem 0;
		border-bottom: 1px solid var(--rule2);

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
	}

	fieldset {
		border: 0;
		padding: 0;
		margin: 0;
	}

	.label-row {
		display: block;
	}

	.label {
		display: block;
		padding: 0;
		font-family: var(--serif);
		font-size: 16px;
		color: var(--ink);
	}

	.label-row .label {
		display: inline;
	}

	.req {
		margin-left: 0.2rem;
		color: var(--wax);
	}

	input:not([type='checkbox'], [type='radio']),
	select,
	textarea {
		width: 100%;
		max-width: var(--measure);
		padding: 0.5rem 0.6rem;
		font: inherit;
		font-size: 15px;
		color: var(--ink);
		background: var(--sheet);
		border: 1px solid var(--rule);
		border-radius: 0;

		&:focus {
			border-color: var(--navy);
		}
	}

	[data-type='number'] input,
	[data-type='date'] input,
	[data-type='datetime'] input {
		width: auto;
	}

	textarea {
		resize: vertical;
		line-height: 1.45;
	}

	.with-unit {
		display: inline-flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.unit {
		font-size: 14px;
		color: var(--ink2);
	}

	.choices {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.5rem;
		margin-top: 0.4rem;

		& label {
			display: inline-flex;
			align-items: center;
			gap: 0.4rem;
			font-size: 14px;
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

	.help {
		font-size: 13px;
		color: var(--ink2);
		max-width: var(--measure);
	}

	.error {
		font-size: 13px;
		color: var(--wax);
	}

	.invalid :is(input, select, textarea) {
		border-color: var(--wax);
	}
</style>
