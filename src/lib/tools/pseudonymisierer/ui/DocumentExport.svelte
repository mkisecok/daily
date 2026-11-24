<!--
	@component
	Makes the pseudonymised Word file and its key, locked with a password the
	user chooses, and offers both for download as separate files. Says what
	cleaning took out and what it left unchecked, and when the marks have
	changed since the files were made.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { CleanReport } from '../document/clean.js';
	import { lockKey, MIN_PASSWORD } from '../document/key.js';
	import { pseudonymiseDocx, scrubbedName } from '../document/run.js';
	import type { Span } from '../types.js';
	import { DOCX_TYPE, saveFile } from './save.js';

	let {
		name,
		bytes,
		spans,
		values
	}: {
		/** the uploaded file's name */
		name: string;
		bytes: Uint8Array;
		spans: Span[];
		/** placeholder → original, for taking names out of the file name */
		values: Record<string, string>;
	} = $props();

	const base = $derived(name.replace(/\.docx$/i, ''));
	/** a suggestion the user may overwrite: the file name can name people too */
	let outBase = $derived(`${scrubbedName(base, values)}-pseudonymisiert`);
	let password = $state('');
	let repeat = $state('');
	let busy = $state(false);
	let failed = $state(false);
	let made = $state<{
		doc: Uint8Array;
		key: string;
		docName: string;
		keyName: string;
		cleaned: CleanReport;
		elsewhere: number;
		count: number;
		signature: string;
	} | null>(null);

	const signature = $derived(
		JSON.stringify(spans.filter((s) => !s.muted).map((s) => [s.start, s.end, s.replacement]))
	);
	const stale = $derived(made !== null && made.signature !== signature);
	const tooShort = $derived(password.length > 0 && password.length < MIN_PASSWORD);
	const mismatch = $derived(repeat.length > 0 && repeat !== password);
	const ready = $derived(password.length >= MIN_PASSWORD && repeat === password && !busy);

	async function make() {
		busy = true;
		failed = false;
		try {
			const result = await pseudonymiseDocx(bytes, spans);
			const key = await lockKey(result.key, password);
			const docName = `${outBase.trim() || 'dokument-pseudonymisiert'}.docx`;
			made = {
				doc: result.bytes,
				key,
				docName,
				keyName: docName.replace(/\.docx$/, '.schluessel.json'),
				cleaned: result.cleaned,
				elsewhere: result.elsewhere,
				count: Object.keys(result.key.values).length,
				signature
			};
			password = '';
			repeat = '';
		} catch {
			failed = true;
		} finally {
			busy = false;
		}
	}

	const removed = $derived.by(() => {
		if (!made) return [];
		const { cleaned, elsewhere } = made;
		return [
			cleaned.revisions > 0 && m.anon_doc_clean_revisions({ count: cleaned.revisions }),
			cleaned.comments > 0 && m.anon_doc_clean_comments({ count: cleaned.comments }),
			cleaned.properties > 0 && m.anon_doc_clean_properties({ count: cleaned.properties }),
			cleaned.thumbnail && m.anon_doc_clean_thumbnail(),
			elsewhere > 0 && m.anon_doc_clean_elsewhere({ count: elsewhere })
		].filter((line) => line !== false);
	});
</script>

<form
	class="export"
	onsubmit={(event) => {
		event.preventDefault();
		if (ready) void make();
	}}
>
	<label class="field">
		<span class="daily-label field-label">{m.anon_doc_out_name()}</span>
		<span class="name">
			<input type="text" bind:value={outBase} aria-describedby="anon-doc-name-hint" />
			<span class="ext">.docx</span>
		</span>
	</label>
	<p id="anon-doc-name-hint" class="hint">{m.anon_doc_out_name_hint()}</p>

	<div class="passwords">
		<label class="field">
			<span class="daily-label field-label">{m.anon_doc_password()}</span>
			<input
				type="password"
				autocomplete="new-password"
				bind:value={password}
				aria-invalid={tooShort || undefined}
				aria-describedby="anon-doc-password-hint"
			/>
		</label>
		<label class="field">
			<span class="daily-label field-label">{m.anon_doc_password_repeat()}</span>
			<input
				type="password"
				autocomplete="new-password"
				bind:value={repeat}
				aria-invalid={mismatch || undefined}
			/>
		</label>
	</div>
	<p id="anon-doc-password-hint" class="hint" class:error={tooShort || mismatch}>
		{mismatch
			? m.anon_doc_password_mismatch()
			: m.anon_doc_password_hint({ min: String(MIN_PASSWORD) })}
	</p>

	<div class="toolbar">
		<button type="submit" disabled={!ready}>{busy ? m.anon_doc_making() : m.anon_doc_make()}</button
		>
		{#if failed}<span class="status error" role="alert">{m.anon_doc_make_failed()}</span>{/if}
	</div>
</form>

{#if made}
	<div class="made" role="status">
		{#if stale}<p class="notice">{m.anon_doc_stale()}</p>{/if}
		<p>{m.anon_doc_made({ count: made.count })}</p>
		<div class="downloads">
			<button
				type="button"
				class="button"
				onclick={() => saveFile(made!.doc, made!.docName, DOCX_TYPE)}
				>{m.anon_doc_download_doc()}</button
			>
			<button
				type="button"
				class="button quiet"
				onclick={() => saveFile(made!.key, made!.keyName, 'application/json')}
				>{m.anon_doc_download_key()}</button
			>
		</div>
		<p class="hint">{m.anon_doc_keep_apart()}</p>
		{#if removed.length > 0}
			<h3>{m.anon_doc_cleaned()}</h3>
			<ul>
				{#each removed as line (line)}<li>{line}</li>{/each}
			</ul>
		{/if}
		{#if made.cleaned.images + made.cleaned.embedded > 0}
			<p class="notice">
				{m.anon_doc_unchecked({ images: made.cleaned.images, embedded: made.cleaned.embedded })}
			</p>
		{/if}
	</div>
{/if}

<style>
	.export {
		display: grid;
		gap: 0.25rem;

		& .field {
			display: grid;
			gap: 0.25rem;
		}

		& .name {
			display: flex;
			align-items: center;
			gap: 0.35rem;

			& input {
				flex: 1;
				min-width: 0;
			}

			& .ext {
				font-family: var(--mono);
				font-size: 13px;
				color: var(--ink3);
			}
		}

		& .passwords {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
			gap: 0.75rem;
			margin-top: 0.5rem;
		}
	}

	.hint {
		margin: 0 0 0.5rem;
		font-size: 13px;
		color: var(--ink3);

		&.error {
			color: var(--wax);
		}
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
	}

	.status.error {
		font-size: 13px;
		color: var(--wax);
	}

	.made {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--rule2);

		& p {
			margin: 0 0 0.75rem;
		}

		& h3 {
			margin: 1rem 0 0.25rem;
			font-size: 14px;
		}

		& ul {
			margin: 0;
			padding-left: 1.25rem;
			font-size: 14px;
			color: var(--ink2);
		}

		& .downloads {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
			margin-bottom: 0.5rem;
		}

		& .notice {
			margin-top: 0.75rem;
			padding: 0.5rem 0.75rem;
			font-size: 13px;
			background: var(--wax-soft);
			border-radius: var(--radius);
		}
	}
</style>
