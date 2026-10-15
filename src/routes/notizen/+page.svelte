<script lang="ts">
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
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const store = getStore();
	const locale = getLocale();
	const notePath = (id: string) => localized(`/notizen?notiz=${id}`);
	const listPath = localized('/notizen');

	type Draft = { titel: string; tag: string; text: string; schlagworte: string; quelle: string };
	const str = (v: unknown) => (typeof v === 'string' ? v : '');

	let query = $state('');
	let editing = $state(false);
	let preview = $state(false);
	let busy = $state(false);
	let confirmArchive = $state(false);
	let message = $state<string | null>(null);
	let draft = $state<Draft>({ titel: '', tag: '', text: '', schlagworte: '', quelle: '' });

	const detail = $derived(data.view === 'note' ? data.detail : null);

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

<header class="head">
	<h1>{m.nav_notes()}</h1>
	<p class="measure intro">{m.notes_intro()}</p>
</header>

{#if message}<p class="message" role="status">{message}</p>{/if}

{#if editing}
	<form class="editor" onsubmit={save}>
		<label class="field">
			<span>{m.notes_title()}</span>
			<input type="text" bind:value={draft.titel} required />
		</label>
		<div class="tabs" role="tablist">
			<button type="button" role="tab" aria-selected={!preview} onclick={() => (preview = false)}>
				{m.notes_write()}
			</button>
			<button type="button" role="tab" aria-selected={preview} onclick={() => (preview = true)}>
				{m.notes_preview()}
			</button>
		</div>
		{#if preview}
			<div class="preview"><Markdown source={draft.text} /></div>
		{:else}
			<label class="field">
				<span class="visually-hidden">{m.notes_text()}</span>
				<textarea rows="14" bind:value={draft.text}></textarea>
				<small>{m.notes_text_help()}</small>
			</label>
		{/if}
		<div class="row">
			<label class="field">
				<span>{m.notes_day()}</span>
				<input type="date" bind:value={draft.tag} />
			</label>
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
		<article class="note">
			<h2>{record.title}</h2>
			<p class="meta">
				{#if record.data.tag}<span
						>{formatShortDate(`${str(record.data.tag)}T12:00:00.000Z`, locale)}</span
					>{/if}
				<span>{m.notes_updated({ date: formatShortDate(record.updatedAt, locale) })}</span>
				{#each tags(record.data.schlagworte) as tag (tag)}<span class="tag">{tag}</span>{/each}
			</p>
			<Markdown source={str(record.data.text)} />
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
			{#if confirmArchive}
				<span class="confirm">{m.records_archive_confirm()}</span>
				<button type="button" onclick={() => archive(record)} disabled={busy}>
					{m.records_archive_yes()}
				</button>
				<button type="button" class="quiet" onclick={() => (confirmArchive = false)}>
					{m.records_cancel()}
				</button>
			{:else}
				<button type="button" class="quiet" onclick={() => (confirmArchive = true)}>
					{m.records_archive()}
				</button>
			{/if}
		</div>
	{/if}
{:else}
	<div class="toolbar no-print">
		<button type="button" onclick={today} disabled={busy}>{m.notes_today()}</button>
		<a class="button quiet" href={resolve(localized('/notizen?neu=1'))}>{m.notes_new()}</a>
	</div>
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
					<a href={resolve(notePath(note.id))}>{note.title}</a>
					<span class="date">{formatShortDate(note.updatedAt, locale)}</span>
					{#if note.data.text}<p class="snippet">{plain(str(note.data.text))}</p>{/if}
					{#if tags(note.data.schlagworte).length > 0}
						<p class="tags">
							{#each tags(note.data.schlagworte) as tag (tag)}<span class="tag">{tag}</span>{/each}
						</p>
					{/if}
				</li>
			{/each}
		</ol>
	{/if}
{/if}

<style>
	.head {
		padding: 2.5rem 0 1rem;
		border-bottom: 2px solid var(--ink);

		& h1 {
			font-size: clamp(28px, 4vw, 40px);
		}
	}

	.intro {
		margin-top: 0.75rem;
		font-size: 15px;
		color: var(--ink2);
	}

	.message {
		margin-top: 1.25rem;
		padding: 0.7rem 1rem;
		border-left: 3px solid var(--navy);
		background: var(--navy-soft);
		font-size: 14px;
	}

	.toolbar {
		margin-top: 1.5rem;
	}

	.search input {
		width: 100%;
		max-width: var(--measure);
		margin-top: 1.25rem;
		padding: 0.55rem 0.7rem;
		font: inherit;
		color: var(--ink);
		background: var(--sheet);
		border: 1px solid var(--rule);
	}

	.notes {
		list-style: none;
		margin-top: 1rem;
		max-width: var(--measure);

		& li {
			padding: 0.9rem 0;
			border-bottom: 1px solid var(--rule2);
		}

		& a {
			font-family: var(--serif);
			font-size: 18px;
		}
	}

	.date,
	.meta {
		font-size: 13px;
		color: var(--ink3);
	}

	.date {
		margin-left: 0.75rem;
	}

	.snippet {
		margin-top: 0.25rem;
		font-size: 14px;
		color: var(--ink2);
	}

	.tags,
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem 0.9rem;
		margin-top: 0.35rem;
	}

	.tag {
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--navy);
	}

	.note {
		margin-top: 2rem;

		& h2 {
			font-size: clamp(24px, 3vw, 30px);
		}

		& :global(.markdown) {
			margin-top: 1.25rem;
		}
	}

	.source {
		margin-top: 1.5rem;
		font-size: 13px;
		color: var(--ink2);
		word-break: break-all;
	}

	.editor {
		margin-top: 1.5rem;
		max-width: var(--measure);
	}

	.field {
		display: block;
		margin-top: 1rem;

		& span {
			display: block;
			font-family: var(--serif);
			font-size: 15px;
		}

		& input,
		& textarea {
			width: 100%;
			margin-top: 0.3rem;
			padding: 0.5rem 0.6rem;
			font: inherit;
			font-size: 15px;
			color: var(--ink);
			background: var(--sheet);
			border: 1px solid var(--rule);
		}

		& textarea {
			font-family: var(--mono);
			font-size: 14px;
			line-height: 1.5;
			resize: vertical;
		}

		& small {
			display: block;
			margin-top: 0.3rem;
			font-size: 12px;
			color: var(--ink3);
		}
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 0 1.5rem;

		& .grow {
			flex: 1 1 16rem;
		}
	}

	.tabs {
		display: flex;
		gap: 1.25rem;
		margin-top: 1.25rem;
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.08em;
		text-transform: uppercase;

		& button {
			padding: 0.2rem 0;
			color: var(--ink3);
			border-bottom: 2px solid transparent;
		}

		& button[aria-selected='true'] {
			color: var(--ink);
			border-bottom-color: var(--ink);
		}
	}

	.preview {
		margin-top: 0.75rem;
		min-height: 10rem;
		padding: 0.75rem 0;
		border-top: 1px solid var(--rule2);
		border-bottom: 1px solid var(--rule2);
	}

	.actions {
		margin-top: 2rem;
	}

	.confirm {
		font-family: var(--sans);
		font-size: 14px;
		letter-spacing: 0;
		text-transform: none;
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
