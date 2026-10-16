<!--
	@component
	The form for a new or existing record, grouped into the definition's
	sections. Assessment fields are not edited here: they come from their
	questionnaire.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { text } from '#lib/tools/i18n.js';
	import type { Option, RecordData, RecordToolDefinition } from '../types.js';
	import type { ValidationErrors } from '../validate.js';
	import FieldInput from './FieldInput.svelte';
	import { fromInputs, toInputs, type FormValues } from './inputs.js';

	let {
		definition,
		data = {},
		errors = {},
		busy = false,
		choices = {},
		onsave,
		oncancel
	}: {
		definition: RecordToolDefinition;
		data?: RecordData;
		errors?: ValidationErrors;
		busy?: boolean;
		/** options for reference fields, by field id */
		choices?: Record<string, Option[]>;
		onsave: (input: Record<string, unknown>) => void;
		oncancel: () => void;
	} = $props();

	// seeded once from the stored record; the parent remounts the form to reset it.
	// svelte-ignore state_referenced_locally
	let values = $state<FormValues>(toInputs(definition, data));

	const sections = $derived(
		definition.sections
			.map((section) => ({
				...section,
				fields: section.fields.filter((field) => field.type !== 'assessment')
			}))
			.filter((section) => section.fields.length > 0)
	);
	const hasErrors = $derived(Object.keys(errors).length > 0);

	function submit(event: SubmitEvent) {
		event.preventDefault();
		onsave(fromInputs(definition, values));
	}
</script>

<form class="record-form" onsubmit={submit} novalidate>
	{#if hasErrors}
		<p class="errors" role="alert">{m.records_errors()}</p>
	{/if}

	{#each sections as section (section.id)}
		<section class="section card">
			<h2>{text(section.title)}</h2>
			{#if section.intro}<p class="measure intro">{text(section.intro)}</p>{/if}
			{#each section.fields as field (field.id)}
				<FieldInput
					{field}
					bind:value={values[field.id]}
					error={errors[field.id]}
					choices={choices[field.id]}
				/>
			{/each}
		</section>
	{/each}

	<div class="toolbar actions">
		<button type="submit" disabled={busy}>{m.records_save()}</button>
		<button type="button" class="quiet" onclick={oncancel} disabled={busy}>
			{m.records_cancel()}
		</button>
	</div>
</form>

<style>
	/* one raised card per section, the fields inside */
	.record-form {
		display: grid;
		gap: 1.25rem;
		margin-top: 1.5rem;

		& .errors {
			padding: 0.75rem 1rem;
			font-size: 14px;
			color: var(--wax);
			background: var(--wax-soft);
			border: 1px solid var(--wax-soft);
			border-radius: var(--radius-card);
		}

		& .section {
			min-width: 0;
			padding-bottom: 0.25rem;

			& h2 {
				font-size: 18px;
				padding-bottom: 0.25rem;
			}

			& .intro {
				margin-top: 0.35rem;
				margin-bottom: 0.25rem;
				font-size: 14px;
				color: var(--ink2);
			}
		}

		& .actions {
			margin-top: 0.25rem;
		}
	}
</style>
