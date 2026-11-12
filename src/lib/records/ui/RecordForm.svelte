<!--
	@component
	The form for a new or existing record, grouped into the definition's
	sections. Assessment fields are not edited here: they come from their
	questionnaire. Leaving with unsaved input asks first. With a `draftKey`
	the input is kept as a draft in this tab while one types and offered
	again after a reload. Forms of three or more sections get an index of
	their sections with how far each is filled, beside the form on wide
	screens and in the save bar on narrow ones; the save bar stays at the
	bottom of the window.
-->
<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import type { Attachment } from 'svelte/attachments';
	import { formatShortDate, formatTime } from '#lib/i18n/date.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { clearDraft, loadDraft, saveDraft } from '../drafts.js';
	import { m } from '#lib/paraglide/messages.js';
	import { text } from '#lib/tools/i18n.js';
	import type { Option, RecordData, RecordToolDefinition } from '../types.js';
	import type { ValidationErrors } from '../validate.js';
	import ConfirmDialog from '#lib/ui/ConfirmDialog.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { dueId, noteId } from '../checks.js';
	import { validateRecord } from '../validate.js';
	import CheckRow from './CheckRow.svelte';
	import FieldInput from './FieldInput.svelte';
	import { fromInputs, toInputs, type FormValue, type FormValues } from './inputs.js';

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

	const filled = (value: FormValue | undefined) =>
		Array.isArray(value)
			? value.length > 0
			: value !== null && value !== undefined && `${value}`.trim() !== '';

	type SectionState = 'done' | 'partial' | 'empty' | 'error' | 'skipped';
	const STATE_LABEL: Record<SectionState, () => string> = {
		skipped: m.form_section_skipped,
		done: m.form_section_done,
		partial: m.form_section_partial,
		empty: m.form_section_empty,
		error: m.form_section_error
	};

	/** how far each section is filled; a section with an error shows the error */
	/**
	 * the input as stored data, for sections that apply only to some records;
	 * attached questionnaire results are not form fields, so they come from the record
	 */
	const current = $derived(
		validateRecord(definition, { ...data, ...fromInputs(definition, values) }).data
	);
	const applies = (section: { when?: (data: RecordData) => boolean }) =>
		!section.when || section.when(current);

	const progress = $derived(
		sections.map((section) => {
			if (!applies(section)) return { section, total: 0, count: 0, state: 'skipped' as const };
			// a checklist point counts once; its note and due date are extras
			const own = section.fields.filter((field) => !field.partOf);
			const total = own.length;
			const count = own.filter((field) => filled(values[field.id])).length;
			const state: Exclude<SectionState, 'skipped'> = section.fields.some(
				(field) => errors[field.id]
			)
				? 'error'
				: count === total
					? 'done'
					: count > 0
						? 'partial'
						: 'empty';
			return { section, total, count, state };
		})
	);
	const totals = $derived({
		filled: progress.reduce((n, p) => n + p.count, 0),
		total: progress.reduce((n, p) => n + p.total, 0),
		required: sections
			.flatMap((section) => section.fields)
			.filter((field) => field.required && !filled(values[field.id])).length
	});

	const showIndex = $derived(sections.length >= 3);
	/** field types that keep the full width in a two-column section */
	const WIDE = new Set(['textarea', 'multiselect', 'reference', 'assessment']);
	let active = $state<string | null>(null);
	let menuOpen = $state(false);
	/** after a jump the chosen section stays current until the scroll settles */
	let jumpedAt = 0;
	const position = $derived(Math.max(1, sections.findIndex((s) => s.id === active) + 1));

	/** marks the section in the upper part of the window as the current one */
	function watch(id: string): Attachment {
		return (element) => {
			const observer = new IntersectionObserver(
				(entries) => {
					if (Date.now() - jumpedAt < 1500) return;
					if (entries.some((entry) => entry.isIntersecting)) active = id;
				},
				{ rootMargin: '-25% 0px -65% 0px' }
			);
			observer.observe(element);
			return () => observer.disconnect();
		};
	}

	/** scrolls to a section and focuses its first field */
	function jump(id: string) {
		menuOpen = false;
		active = id;
		jumpedAt = Date.now();
		const section = document.getElementById(`sec-${id}`);
		section?.scrollIntoView({ block: 'start' });
		section
			?.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea, button')
			?.focus({ preventScroll: true });
	}

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

{#snippet sectionList()}
	<ol class="section-list">
		{#each progress as { section, total, count, state } (section.id)}
			<li>
				<button
					type="button"
					class="section-link"
					aria-current={active === section.id ? 'location' : undefined}
					onclick={() => jump(section.id)}
				>
					<span class="mark" data-state={state} aria-hidden="true"></span>
					<span class="name">{text(section.title)}</span>
					<span class="count">{state === 'skipped' ? '–' : `${count}/${total}`}</span>
					<span class="visually-hidden">{STATE_LABEL[state]()}</span>
				</button>
			</li>
		{/each}
	</ol>
{/snippet}

<div class="form-shell">
	<div class="form-layout" data-index={showIndex}>
		{#if showIndex}
			<nav class="index" aria-label={m.form_sections()}>
				<p class="index-title">{m.form_sections()}</p>
				{@render sectionList()}
			</nav>
		{/if}

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
				{@const open = applies(section)}
				<section
					class="section card"
					id="sec-{section.id}"
					data-applies={open}
					{@attach watch(section.id)}
				>
					<h2>{text(section.title)}</h2>
					{#if !open}
						<!-- the fields keep their values; they count again once the section applies -->
						<p class="skipped">{m.form_skipped()}</p>
					{:else}
						{#if section.intro}<p class="measure intro">{text(section.intro)}</p>{/if}
						<div class="fields" data-columns={section.columns ?? 1}>
							{#each section.fields as field (field.id)}
								{#if field.partOf}
									<!-- shown inside its checklist point -->
								{:else if field.type === 'check'}
									<CheckRow
										{field}
										bind:value={values[field.id]}
										bind:note={values[noteId(field.id)]}
										bind:due={values[dueId(field.id)]}
										error={errors[field.id]}
									/>
								{:else if section.columns === 2}
									<div class="cell" data-wide={WIDE.has(field.type)}>
										<FieldInput
											{field}
											bind:value={values[field.id]}
											error={errors[field.id]}
											choices={choices[field.id]}
										/>
									</div>
								{:else}
									<FieldInput
										{field}
										bind:value={values[field.id]}
										error={errors[field.id]}
										choices={choices[field.id]}
									/>
								{/if}
							{/each}
						</div>
					{/if}
				</section>
			{/each}

			<!-- stays at the bottom of the window, so saving never needs a scroll to the end -->
			<div class="toolbar actions save-bar">
				<p class="progress">
					<span>{m.form_progress(totals)}</span>
					{#if totals.required > 0}
						<span class="required">{m.form_required_open({ count: totals.required })}</span>
					{/if}
				</p>
				{#if showIndex}
					<details class="sections-menu" bind:open={menuOpen}>
						<summary aria-label="{m.form_sections()} {position}/{sections.length}">
							<Icon name="list-details" size={16} />
							<span class="summary-label">{m.form_sections()}</span>
							<span class="summary-count">{position}/{sections.length}</span>
						</summary>
						<div class="menu">{@render sectionList()}</div>
					</details>
				{/if}
				<button type="submit" disabled={busy}>{m.records_save()}</button>
				<button type="button" class="quiet" onclick={cancel} disabled={busy}>
					{m.records_cancel()}
				</button>
			</div>
		</form>
	</div>
</div>

<ConfirmDialog
	bind:open={confirmLeave}
	title={m.records_leave_title()}
	body={m.records_leave_body()}
	confirmLabel={m.records_leave_confirm()}
	tone="danger"
	onconfirm={discard}
/>

<style>
	/*
	 * the shell is the size container; from 56rem of width the index stands
	 * beside the form and stays in view, below that it lives in the save bar
	 */
	.form-shell {
		container-type: inline-size;
		margin-top: 1.5rem;
	}

	.form-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1.5rem;
		align-items: start;
	}

	.index {
		display: none;
	}

	@container (min-width: 56rem) {
		.form-layout[data-index='true'] {
			grid-template-columns: 13rem minmax(0, 1fr);
		}

		.index {
			position: sticky;
			top: 5rem;
			display: block;
			max-height: calc(100dvh - 6rem);
			overflow-y: auto;
		}

		.sections-menu {
			display: none;
		}
	}

	.index-title {
		margin-bottom: 0.5rem;
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink3);
	}

	.section-list {
		display: grid;
		gap: 1px;
		list-style: none;
	}

	/* reset, since the phone menu sits in the toolbar, whose buttons are filled */
	.section-link {
		display: grid;
		margin: 0;
		font-family: var(--sans);
		font-weight: 400;
		background: none;
		border: 0;
		box-shadow: none;
		grid-template-columns: 0.75rem minmax(0, 1fr) auto;
		gap: 0.6rem;
		align-items: center;
		width: 100%;
		min-height: 2.25rem;
		padding: 0.3rem 0.5rem;
		font-size: 13px;
		line-height: 1.3;
		text-align: left;
		color: var(--ink2);
		border-radius: var(--radius);

		&:hover {
			color: var(--ink);
			background: var(--sheet);
		}

		&[aria-current='location'] {
			font-weight: 600;
			color: var(--ink);
			background: var(--sheet);
			box-shadow: inset 2px 0 0 var(--primary);
		}

		& .count {
			font-family: var(--mono);
			font-size: 11px;
			font-variant-numeric: tabular-nums;
			color: var(--ink3);
		}

		/* empty ring, half-filled, full, or an error dot */
		& .mark {
			width: 0.7rem;
			height: 0.7rem;
			border: 1.5px solid var(--ink3);
			border-radius: 50%;

			&[data-state='partial'] {
				background: linear-gradient(90deg, var(--primary) 50%, transparent 50%);
				border-color: var(--primary);
			}

			&[data-state='done'] {
				background: var(--risk-low);
				border-color: var(--risk-low);
			}

			&[data-state='error'] {
				background: var(--wax);
				border-color: var(--wax);
			}

			&[data-state='skipped'] {
				border-style: dashed;
			}
		}
	}

	/* one raised card per section, the fields inside */
	.record-form {
		display: grid;
		gap: 1.25rem;
		min-width: 0;

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

		/* a size container, so its fields can stack their citation when it is narrow */
		& .section {
			container-type: inline-size;
			min-width: 0;
			padding-bottom: 0.25rem;
			/* clear of the top bar when jumped to */
			scroll-margin-top: 5rem;

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

			& .skipped {
				padding-bottom: 0.75rem;
				font-size: 14px;
				color: var(--ink3);
			}

			&[data-applies='false'] h2 {
				color: var(--ink3);
			}
		}

		/* short fields in two columns, each with its own hairline; wide ones span both */
		& .fields[data-columns='2'] {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			column-gap: 1.5rem;

			/* the hairline moves from the field to its cell */
			& .cell {
				border-bottom: 1px solid var(--rule2);

				&[data-wide='true'] {
					grid-column: 1 / -1;
				}

				&:last-child {
					border-bottom: 0;
				}
			}

			@container (max-width: 30rem) {
				grid-template-columns: minmax(0, 1fr);
			}
		}
	}

	/* the save bar, held at the bottom of the window */
	.save-bar {
		position: sticky;
		bottom: 0;
		z-index: 2;
		margin-top: 0.25rem;
		padding: 0.75rem 0;
		background: var(--canvas);
		border-top: 1px solid var(--rule2);

		@media print {
			display: none;
		}

		& .progress {
			display: flex;
			flex: 1 1 14rem;
			flex-wrap: wrap;
			gap: 0 0.75rem;
			font-size: 13px;
			font-variant-numeric: tabular-nums;
			color: var(--ink2);

			& .required {
				font-weight: 600;
				color: var(--wax);
			}
		}

		/* phones: sections, save and cancel in one row; the counts move into the menu */
		@media (max-width: 40rem) {
			flex-wrap: nowrap;
			gap: 0.5rem;

			& > button {
				flex: 0 0 auto;
			}

			& .progress,
			& .summary-label {
				display: none;
			}
		}
	}

	/* the section list in the save bar, opening upwards */
	.sections-menu {
		position: relative;
		flex: 1 1 auto;

		& summary {
			display: inline-flex;
			gap: 0.4rem;
			align-items: center;
			white-space: nowrap;
			min-height: 44px;
			padding: 0 0.9rem;
			font-size: 14px;
			font-weight: 500;
			list-style: none;
			cursor: pointer;
			border: 1px solid var(--rule);
			border-radius: var(--radius);

			&::-webkit-details-marker {
				display: none;
			}
		}

		& .summary-count {
			font-variant-numeric: tabular-nums;
		}

		& .menu {
			position: absolute;
			bottom: calc(100% + 0.5rem);
			left: 0;
			width: min(20rem, calc(100vw - 2rem));
			max-height: 60dvh;
			padding: 0.4rem;
			overflow-y: auto;
			background: var(--sheet);
			border: 1px solid var(--rule2);
			border-radius: var(--radius-card);
			box-shadow: var(--shadow-raised);
		}
	}
</style>
