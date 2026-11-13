<script lang="ts">
	import { tick } from 'svelte';
	import { afterNavigate, goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { dayKey, formatShortDate } from '#lib/i18n/date.js';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { plain } from '#lib/notes/markdown.js';
	import { NOTES, sourceHref, tags } from '#lib/notes/tool.js';
	import Markdown from '#lib/notes/ui/Markdown.svelte';
	import { getStore } from '#lib/records/store/index.js';
	import type { StoredRecord } from '#lib/records/types.js';
	import ConfirmDialog from '#lib/ui/ConfirmDialog.svelte';
	import DatePicker from '#lib/ui/form/DatePicker.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import PrintDocument from '#lib/ui/PrintDocument.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const uid = $props.id();

	const store = getStore();
	const locale = getLocale();
	const notePath = (id: string) => localized(`/notizen?notiz=${id}`);
	const listPath = localized('/notizen');

	type Draft = { titel: string; tag: string; text: string; schlagworte: string; quelle: string };
	const str = (v: unknown) => (typeof v === 'string' ? v : '');

	let query = $state('');
	let editing = $state(false);
	let preview = $state(false);
	let textarea = $state<HTMLTextAreaElement>();
	let busy = $state(false);
	let confirmArchive = $state(false);
	let message = $state<string | null>(null);
	let draft = $state<Draft>({ titel: '', tag: '', text: '', schlagworte: '', quelle: '' });

	const detail = $derived(data.view === 'note' ? data.detail : null);
	const listing = $derived(!editing && data.view !== 'note');

	const filtered = $derived.by(() => {
		const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
		if (terms.length === 0) return data.notes;
		return data.notes.filter((note) => {
			const haystack = [note.title, str(note.data.text), str(note.data.schlagworte)]
				.join(' ')
				.toLowerCase();
			return terms.every((t) => haystack.includes(t));
		});
	});

	function fromRecord(record: StoredRecord): Draft {
		return {
			titel: str(record.data.titel),
			tag: str(record.data.tag),
			text: str(record.data.text),
			schlagworte: str(record.data.schlagworte),
			quelle: str(record.data.quelle)
		};
	}

	// each view starts clean; the editor opens with the prefill or the note
	afterNavigate(() => {
		message = null;
		confirmArchive = false;
		preview = false;
		if (data.view === 'new') {
			editing = true;
			draft = { ...data.prefill, tag: '', schlagworte: '' };
		} else {
			editing = false;
		}
	});

	function togglePreview() {
		preview = !preview;
	}

	// Esc on the toggle closes the preview and returns to the text
	async function closePreviewOnEscape(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !preview) return;

		event.preventDefault();
		preview = false;
		// the text is inert until the closed state reaches the DOM
		await tick();
		textarea?.focus();
	}

	async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
		busy = true;
		message = null;
		try {
			return await action();
		} catch {
			message = m.records_failed();
			return undefined;
		} finally {
			busy = false;
		}
	}

	async function save(event: SubmitEvent) {
		event.preventDefault();
		if (!draft.titel.trim()) {
			message = m.records_errors();
			return;
		}
		if (detail) {
			const record = detail.record;
			const result = await run(() => store.update(record.id, { ...draft }, record.version));
			if (!result) return;
			if (!result.ok) {
				message = result.error === 'conflict' ? m.records_conflict() : m.records_errors();
			} else {
				editing = false;
				message = m.records_saved();
			}
			await invalidate('records:data');
		} else {
			const result = await run(() => store.create(NOTES, { ...draft }));
			if (result?.ok) await goto(resolve(notePath(result.value.id)));
			else if (result) message = m.records_errors();
		}
	}

	/** opens today's note, creating it on first use */
	async function today() {
		const day = dayKey(new Date().toISOString());
		const existing = (await store.list(NOTES)).find((n) => n.data.tag === day);
		if (existing) {
			await goto(resolve(notePath(existing.id)));
			return;
		}
		const result = await run(() =>
			store.create(NOTES, {
				titel: m.notes_daily_title({ date: formatShortDate(`${day}T12:00:00.000Z`, locale) }),
				tag: day
			})
		);
		if (result?.ok) await goto(resolve(notePath(result.value.id)));
	}

	async function archive(record: StoredRecord) {
		const result = await run(() => store.archive(record.id));
		if (result?.ok) await goto(resolve(listPath));
	}
</script>

<svelte:head>
	<title>{m.nav_notes()} — Daily</title>
</svelte:head>

<!-- the intro speaks about this browser; paper does not need it -->
<div class="no-print">
	<PageHeader
		title={m.nav_notes()}
		description={m.notes_intro()}
		actions={listing ? listActions : undefined}
	/>
</div>

{#snippet listActions()}
	<button type="button" onclick={today} disabled={busy}>{m.notes_today()}</button>
	<a class="button quiet" href={resolve(localized('/notizen?neu=1'))}>{m.notes_new()}</a>
{/snippet}

{#if message}<p class="message" role="status">{message}</p>{/if}

{#if editing}
	<form class="editor card" onsubmit={save}>
		<label class="field">
			<span>{m.notes_title()}</span>
			<input type="text" bind:value={draft.titel} required />
		</label>
		<div class="field">
			<label class="visually-hidden" for="{uid}-text">{m.notes_text()}</label>
			<!-- one box: the preview slides in over the text from the right and back out -->
			<div class="pane" data-preview={preview ? 'open' : 'closed'}>
				<textarea
					id="{uid}-text"
					bind:this={textarea}
					rows="14"
					bind:value={draft.text}
					aria-describedby="{uid}-help"
					inert={preview}></textarea>
				<div
					class="preview"
					id="{uid}-preview"
					role="region"
					aria-label={m.notes_preview()}
					inert={!preview}
				>
					<div class="sheet"><Markdown source={draft.text} /></div>
				</div>
				<button
					type="button"
					class="slide"
					aria-controls="{uid}-preview"
					aria-expanded={preview}
					aria-label={preview ? m.notes_preview_close() : m.notes_preview_open()}
					onclick={togglePreview}
					onkeydown={closePreviewOnEscape}
				>
					<span class="chevron"><Icon name="chevron-left" size={18} /></span>
				</button>
			</div>
			<small id="{uid}-help">{m.notes_text_help()}</small>
		</div>
		<div class="row">
			<div class="field">
				<DatePicker bind:value={draft.tag} label={m.notes_day()} granularity="day" />
			</div>
			<label class="field grow">
				<span>{m.notes_tags()}</span>
				<input type="text" bind:value={draft.schlagworte} />
				<small>{m.notes_tags_help()}</small>
			</label>
		</div>
		<label class="field">
			<span>{m.notes_source()}</span>
			<input type="text" bind:value={draft.quelle} />
			<small>{m.notes_source_help()}</small>
		</label>
		<div class="toolbar">
			<button type="submit" disabled={busy}>{m.notes_save()}</button>
			<button
				type="button"
				class="quiet"
				onclick={() => (detail ? (editing = false) : goto(resolve(listPath)))}
			>
				{m.records_cancel()}
			</button>
		</div>
	</form>
{:else if data.view === 'note'}
	{#if !detail}
		<p class="quiet-text">{m.records_not_found()}</p>
	{:else}
		{@const record = detail.record}
		{@const source = sourceHref(record.data.quelle)}
		<PrintDocument
			kind={m.print_kind_note()}
			title={record.title}
			rows={[
				...(record.data.tag
					? [
							{
								label: m.notes_day(),
								value: formatShortDate(`${str(record.data.tag)}T12:00:00.000Z`, locale)
							}
						]
					: []),
				...(tags(record.data.schlagworte).length > 0
					? [{ label: m.notes_tags(), value: tags(record.data.schlagworte).join(', ') }]
					: []),
				{ label: m.print_changed(), value: formatShortDate(record.updatedAt, locale) }
			]}
		/>
		<article class="note card">
			<!-- on paper the document head carries title, day and tags -->
			<h2 class="no-print">{record.title}</h2>
			<p class="meta no-print">
				{#if record.data.tag}<span class="badge"
						>{formatShortDate(`${str(record.data.tag)}T12:00:00.000Z`, locale)}</span
					>{/if}
				<span>{m.notes_updated({ date: formatShortDate(record.updatedAt, locale) })}</span>
				{#each tags(record.data.schlagworte) as tag (tag)}<span class="tag badge navy">{tag}</span
					>{/each}
			</p>
			<div class="text"><Markdown source={str(record.data.text)} /></div>
			{#if record.data.quelle}
				<p class="source">
					{m.notes_source()}:
					{#if source?.external}
						<a href={source.href} rel="external noopener noreferrer" target="_blank"
							>{source.href}</a
						>
					{:else if source}
						<a href={resolve(localized(source.href))}>{source.href}</a>
					{:else}
						{str(record.data.quelle)}
					{/if}
				</p>
			{/if}
		</article>
		<div class="toolbar actions no-print">
			<button
				type="button"
				onclick={() => {
					draft = fromRecord(record);
					editing = true;
				}}>{m.notes_edit()}</button
			>
			<button type="button" class="quiet" onclick={() => window.print()}>{m.records_print()}</button
			>
			<a class="button quiet" href={resolve(listPath)}>{m.notes_back()}</a>
			<button type="button" class="quiet" disabled={busy} onclick={() => (confirmArchive = true)}>
				{m.records_archive()}
			</button>
			<ConfirmDialog
				bind:open={confirmArchive}
				title={m.notes_archive_title()}
				body={m.records_archive_confirm()}
				confirmLabel={m.records_archive()}
				tone="danger"
				icon="archive"
				typeToConfirm={m.records_archive_word()}
				onconfirm={() => archive(record)}
			/>
		</div>
	{/if}
{:else}
	{#if data.notes.length > 0}
		<label class="search no-print">
			<span class="visually-hidden">{m.notes_search()}</span>
			<input type="search" bind:value={query} placeholder={m.notes_search()} />
		</label>
	{/if}
	{#if data.notes.length === 0}
		<p class="quiet-text">{m.notes_empty()}</p>
	{:else if filtered.length === 0}
		<p class="quiet-text">{m.notes_none_found()}</p>
	{:else}
		<ol class="notes">
			{#each filtered as note (note.id)}
				<li>
					<p class="line">
						<a href={resolve(notePath(note.id))}>{note.title}</a>
						<span class="date badge">{formatShortDate(note.updatedAt, locale)}</span>
					</p>
					{#if note.data.text}<p class="snippet">{plain(str(note.data.text))}</p>{/if}
					{#if tags(note.data.schlagworte).length > 0}
						<p class="tags">
							{#each tags(note.data.schlagworte) as tag (tag)}<span class="tag badge navy"
									>{tag}</span
								>{/each}
						</p>
					{/if}
				</li>
			{/each}
		</ol>
	{/if}
{/if}

<style>
	.message {
		max-width: var(--measure);
		margin-bottom: 1.25rem;
		padding: 0.7rem 1rem;
		font-size: 14px;
		background: var(--navy-soft);
		border-radius: var(--radius);
	}

	.search {
		& input {
			width: 100%;
			max-width: calc(var(--measure) + 2.5rem);
		}
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 0.5rem;
	}

	.tag {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.04em;
	}

	/* the notes as rows in one raised list, like the records */
	.notes {
		list-style: none;
		max-width: calc(var(--measure) + 2.5rem);
		margin-top: 1rem;
		overflow: hidden;
		background: var(--sheet);
		border: 1px solid var(--rule2);
		border-radius: var(--radius-card);
		box-shadow: var(--shadow-raised);

		& li {
			position: relative;
			min-height: 56px;
			padding: 0.85rem 1.25rem;
			transition: background-color 0.12s ease;

			& + li {
				border-top: 1px solid var(--rule2);
			}

			&:hover {
				background: var(--navy-soft);
			}

			@media (max-width: 40rem) {
				padding: 0.8rem 1rem;
			}

			& .line {
				display: flex;
				flex-wrap: wrap;
				align-items: baseline;
				justify-content: space-between;
				gap: 0.25rem 0.75rem;
			}

			& a {
				min-width: 0;
				font-family: var(--serif);
				font-size: 17px;
				font-weight: 600;
				color: var(--ink);
				overflow-wrap: anywhere;

				/* the whole row opens the note */
				&::after {
					content: '';
					position: absolute;
					inset: 0;
				}
			}

			& .date {
				flex: none;
				font-family: var(--mono);
				font-size: 11.5px;
			}

			& .snippet {
				display: -webkit-box;
				margin-top: 0.25rem;
				overflow: hidden;
				font-size: 14px;
				color: var(--ink2);
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 2;
				line-clamp: 2;
			}
		}
	}

	/* a note reads like a sheet; on paper the frame goes */
	.note {
		max-width: calc(var(--measure) + 4.5rem);
		padding: 1.75rem 2.25rem 2rem;

		@media (max-width: 40rem) {
			padding: 1.1rem 1rem 1.25rem;
		}

		@media print {
			padding: 0;
			border: 0;
			box-shadow: none;
		}

		& h2 {
			font-size: clamp(22px, 3vw, 28px);
		}

		& .meta {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.35rem 0.6rem;
			margin-top: 0.6rem;
			font-size: 13px;
			color: var(--ink3);
		}

		& .text {
			margin-top: 1.25rem;
			padding-top: 1.25rem;
			border-top: 1px solid var(--rule2);

			/* the document head above already closes with a rule */
			@media print {
				margin-top: 0;
				padding-top: 0;
				border-top: 0;
			}
		}

		& .source {
			margin-top: 1.5rem;
			padding-top: 0.9rem;
			font-size: 13px;
			color: var(--ink2);
			word-break: break-all;
			border-top: 1px solid var(--rule2);
		}
	}

	.editor {
		max-width: calc(var(--measure) + 4.5rem);
		padding: 1.5rem 2rem 1.75rem;

		@media (max-width: 40rem) {
			padding: 1rem;
		}

		& .field {
			--field-label-size: 15px;

			display: block;
			margin-top: 1rem;

			&:first-child {
				margin-top: 0;
			}

			& span {
				display: block;
				font-size: 14px;
				font-weight: 500;
			}

			& input,
			& textarea {
				width: 100%;
				margin-top: 0.3rem;
			}

			/* markdown source is written in mono on purpose */
			& textarea {
				min-height: 14lh;
				font-family: var(--mono);
				font-size: 14px;
				resize: vertical;
			}

			& small {
				display: block;
				margin-top: 0.3rem;
				font-size: 12px;
				color: var(--ink3);
			}
		}

		& .row {
			display: flex;
			flex-wrap: wrap;
			gap: 0 1.5rem;

			& .grow {
				flex: 1 1 16rem;
			}
		}

		/*
		 * text and preview share one box: the preview sheet slides in over the
		 * text from the right and back out, clipped by its frame so the page
		 * never scrolls sideways.
		 */
		& .pane {
			--slide: 0.26s cubic-bezier(0.2, 0.8, 0.2, 1);

			position: relative;
			display: inline-block;
			width: 100%;
			margin-top: 0.3rem;

			& textarea {
				display: block;
				margin-top: 0;
				padding-right: 3.4rem;
			}

			& .preview {
				position: absolute;
				inset: 0;
				overflow: clip;
				visibility: hidden;
				border-radius: var(--radius);
				transition: visibility 0s linear 0.26s;
			}

			& .sheet {
				height: 100%;
				padding: 1rem 3.4rem 1rem 1.1rem;
				overflow-y: auto;
				background: var(--canvas);
				border: 1px solid var(--rule2);
				border-radius: var(--radius);
				translate: 100% 0;
				transition: translate var(--slide);
			}

			/* round, so it reads as part of the box rather than one of the form buttons */
			& .slide {
				position: absolute;
				top: 50%;
				right: 0.6rem;
				display: grid;
				place-items: center;
				width: 2.25rem;
				height: 2.25rem;
				padding: 0;
				color: var(--ink2);
				background: var(--sheet);
				border: 1px solid var(--rule);
				border-radius: 50%;
				box-shadow: var(--shadow-raised);
				translate: 0 -50%;
				transition:
					color 0.12s ease,
					border-color 0.12s ease;

				&:hover {
					color: var(--ink);
					border-color: var(--ink3);
				}

				@media (max-width: 40rem) {
					width: 2.75rem;
					height: 2.75rem;
				}
			}

			& .chevron {
				display: grid;
				transition: rotate var(--slide);
			}

			&[data-preview='open'] {
				& .preview {
					visibility: visible;
					transition: visibility 0s;
				}

				& .sheet {
					translate: 0 0;
				}

				& .chevron {
					rotate: 180deg;
				}
			}

			@media (prefers-reduced-motion: reduce) {
				& .sheet,
				& .chevron {
					transition: none;
				}
			}
		}

		& .toolbar {
			margin-top: 1.5rem;
		}
	}

	.actions {
		margin-top: 1.5rem;
	}

	.quiet-text {
		margin-top: 1.5rem;
		font-size: 14px;
		color: var(--ink3);
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
