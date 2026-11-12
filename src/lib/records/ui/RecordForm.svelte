<!--
	@component
	The form for a new or existing record, grouped into the definition's
	sections. Assessment fields are not edited here: they come from their
	questionnaire. Leaving with unsaved input asks first. With a `draftKey`
	the input is kept as a draft in this tab while one types and offered
	again after a reload.
-->
<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { formatShortDate, formatTime } from '#lib/i18n/date.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { clearDraft, loadDraft, saveDraft } from '../drafts.js';
	import { m } from '#lib/paraglide/messages.js';
	import { text } from '#lib/tools/i18n.js';
	import type { Option, RecordData, RecordToolDefinition } from '../types.js';
	import type { ValidationErrors } from '../validate.js';
	import ConfirmDialog from '#lib/ui/ConfirmDialog.svelte';
	import FieldInput from './FieldInput.svelte';
	import { fromInputs, toInputs, type FormValues } from './inputs.js';

	let {
		definition,
		data = {},
		draft,
		errors = {},
		busy = false,
		choices = {},
		draftKey,
		version,
		onsave,
		oncancel
	}: {
		definition: RecordToolDefinition;
		data?: RecordData;
		/** input kept from an earlier attempt, shown instead of `data` */
		draft?: FormValues;
		errors?: ValidationErrors;
		busy?: boolean;
		/** options for reference fields, by field id */
		choices?: Record<string, Option[]>;
		/** where the input is kept as a draft while unsaved; none keeps no draft */
		draftKey?: string;
		/** the stored record's version, to tell a draft from an older one */
		version?: number;
		/** `values` is the raw form state, for keeping the input after a conflict */
		onsave: (input: Record<string, unknown>, values: FormValues) => void | Promise<void>;
		oncancel: () => void;
	} = $props();

	// seeded once from the stored record; the parent remounts the form to reset it.
	// svelte-ignore state_referenced_locally
	const stored = JSON.stringify(toInputs(definition, data));
	// a kept draft wins over the stored data, unless input from a conflict is passed in
	// svelte-ignore state_referenced_locally
	const kept = !draft && draftKey ? loadDraft<FormValues>(draftKey) : null;
	const resumed = kept && JSON.stringify(kept.values) !== stored ? kept : null;
	// svelte-ignore state_referenced_locally
	let values = $state<FormValues>(
		draft ? $state.snapshot(draft) : resumed ? resumed.values : JSON.parse(stored)
	);
	const dirty = $derived(JSON.stringify(values) !== stored);

	let restored = $state(resumed);
	// svelte-ignore state_referenced_locally
	const older = !!(resumed?.version && version && resumed.version !== version);
	const restoredAt = $derived(
		restored
			? `${formatShortDate(restored.savedAt, getLocale())}, ${formatTime(restored.savedAt, getLocale())}`
			: ''
	);

	// keeps the input a moment after the last change; an unchanged form keeps no draft
	$effect(() => {
		if (!draftKey) return;
		const snapshot = $state.snapshot(values);
		const changed = dirty;
		const timer = setTimeout(() => {
			if (changed) saveDraft(draftKey, snapshot, version);
			else clearDraft(draftKey);
		}, 400);
		return () => clearTimeout(timer);
	});

	function discardDraft() {
		values = JSON.parse(stored);
		restored = null;
		if (draftKey) clearDraft(draftKey);
	}

	/** set while saving or after the user chose to discard, so navigation goes ahead */
	let leaving = false;
	let confirmLeave = $state(false);
	/** where to go once the user discards; null means the cancel button */
	let pending: URL | null = null;

	beforeNavigate((navigation) => {
		if (!dirty || leaving) return;
		// closing the tab or leaving the site: the browser asks itself
		navigation.cancel();
		if (navigation.type === 'leave' || !navigation.to) return;
		pending = navigation.to.url;
		confirmLeave = true;
	});

	function cancel() {
		if (!dirty) {
			if (draftKey) clearDraft(draftKey);
			return oncancel();
		}
		pending = null;
		confirmLeave = true;
	}

	function discard() {
		leaving = true;
		if (draftKey) clearDraft(draftKey);
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- the URL comes from SvelteKit's own navigation and is resolved already
		if (pending) void goto(pending);
		else oncancel();
	}

	const sections = $derived(
		definition.sections
			.map((section) => ({
				...section,
				fields: section.fields.filter((field) => field.type !== 'assessment')
			}))
			.filter((section) => section.fields.length > 0)
	);
	const hasErrors = $derived(Object.keys(errors).length > 0);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		leaving = true;
		try {
			await onsave(fromInputs(definition, values), $state.snapshot(values));
		} finally {
			leaving = false;
		}
	}
</script>

<form class="record-form" onsubmit={submit} novalidate>
	{#if restored}
		<p class="draft" role="status">
			<span>
				{m.draft_restored({ time: restoredAt })}
				{#if older}{m.draft_older()}{/if}
			</span>
			<button type="button" class="quiet" onclick={discardDraft}>{m.draft_discard()}</button>
		</p>
	{/if}
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
		<button type="button" class="quiet" onclick={cancel} disabled={busy}>
			{m.records_cancel()}
		</button>
	</div>
</form>

<ConfirmDialog
	bind:open={confirmLeave}
	title={m.records_leave_title()}
	body={m.records_leave_body()}
	confirmLabel={m.records_leave_confirm()}
	tone="danger"
	onconfirm={discard}
/>

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

		& .draft {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem 1rem;
			align-items: center;
			justify-content: space-between;
			padding: 0.6rem 1rem;
			font-size: 14px;
			color: var(--navy);
			background: var(--navy-soft);
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
