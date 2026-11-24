<!--
	@component
	Turns a pseudonymised Word file back: the file, its key file and the key's
	password in, the file with the original values out. Works on a file that
	was edited since, and names the placeholders the key does not know.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { DocxError } from '../document/docx.js';
	import { KeyError, unlockKey } from '../document/key.js';
	import { restoreDocx, type Restored } from '../document/run.js';
	import { MAX_FILE_BYTES } from '../ingest/index.js';
	import { DOCX_TYPE, saveFile } from './save.js';

	let doc = $state<File | null>(null);
	let key = $state<File | null>(null);
	let password = $state('');
	let busy = $state(false);
	let failure = $state<string | null>(null);
	let result = $state<(Restored & { name: string }) | null>(null);

	const pick = (event: Event & { currentTarget: HTMLInputElement }) =>
		event.currentTarget.files?.[0] ?? null;

	async function restore() {
		if (!doc || !key) return;
		busy = true;
		failure = null;
		result = null;
		try {
			if (doc.size > MAX_FILE_BYTES) throw new DocxError('not-docx');
			const content = await unlockKey(await key.text(), password);
			const restored = await restoreDocx(new Uint8Array(await doc.arrayBuffer()), content);
			const base = doc.name.replace(/\.docx$/i, '').replace(/-pseudonymisiert$/, '');
			result = { ...restored, name: `${base}-wiederhergestellt.docx` };
			password = '';
		} catch (error) {
			failure =
				error instanceof KeyError
					? error.reason === 'password'
						? m.anon_doc_restore_password()
						: m.anon_doc_restore_no_key()
					: error instanceof DocxError
						? m.anon_doc_err_not_docx({ name: doc.name })
						: m.anon_doc_restore_failed();
		} finally {
			busy = false;
		}
	}
</script>

<form
	class="restore"
	onsubmit={(event) => {
		event.preventDefault();
		void restore();
	}}
>
	<div class="files">
		<div class="field">
			<span class="daily-label field-label" id="anon-doc-restore-doc"
				>{m.anon_doc_restore_doc()}</span
			>
			<span class="pick">
				<label class="button quiet file"
					>{m.anon_doc_choose()}<input
						type="file"
						accept=".docx"
						aria-labelledby="anon-doc-restore-doc"
						onchange={(event) => (doc = pick(event))}
					/></label
				>
				<span class="chosen">{doc?.name ?? m.anon_doc_none()}</span>
			</span>
		</div>
		<div class="field">
			<span class="daily-label field-label" id="anon-doc-restore-key"
				>{m.anon_doc_restore_key()}</span
			>
			<span class="pick">
				<label class="button quiet file"
					>{m.anon_doc_choose()}<input
						type="file"
						accept=".json,application/json"
						aria-labelledby="anon-doc-restore-key"
						onchange={(event) => (key = pick(event))}
					/></label
				>
				<span class="chosen">{key?.name ?? m.anon_doc_none()}</span>
			</span>
		</div>
		<label class="field">
			<span class="daily-label field-label">{m.anon_doc_password()}</span>
			<input type="password" autocomplete="current-password" bind:value={password} />
		</label>
	</div>
	<div class="toolbar">
		<button type="submit" disabled={!doc || !key || !password || busy}
			>{busy ? m.anon_doc_restoring() : m.anon_doc_restore()}</button
		>
		{#if failure}<span class="status error" role="alert">{failure}</span>{/if}
	</div>
</form>

{#if result}
	<div class="done" role="status">
		{#if result.changed}<p class="notice">{m.anon_doc_restore_changed()}</p>{/if}
		<p>{m.anon_restored_count({ count: result.count, total: result.total })}</p>
		<button
			type="button"
			class="button"
			onclick={() => saveFile(result!.bytes, result!.name, DOCX_TYPE)}
			>{m.anon_doc_download_restored()}</button
		>
		{#if result.leftover.length > 0}
			<div class="leftover">
				<p>{m.anon_leftover()}</p>
				<ul>
					{#each result.leftover as token (token)}<li><code>{token}</code></li>{/each}
				</ul>
			</div>
		{/if}
	</div>
{/if}

<style>
	.restore {
		& .files {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
			gap: 0.75rem;
			margin-bottom: 0.75rem;
		}

		& .field {
			display: grid;
			gap: 0.25rem;
			min-width: 0;
		}

		& .pick {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.5rem;
			min-height: 2.75rem;
		}

		/* the file input fills its button, so the whole button opens the picker */
		& .file {
			position: relative;
			overflow: hidden;

			& input {
				position: absolute;
				inset: 0;
				opacity: 0;
				cursor: pointer;
			}
		}

		& .chosen {
			min-width: 0;
			font-size: 13px;
			color: var(--ink3);
			overflow-wrap: anywhere;
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

	.done {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--rule2);

		& p {
			margin: 0 0 0.75rem;
		}

		& .notice {
			padding: 0.5rem 0.75rem;
			font-size: 13px;
			background: var(--wax-soft);
			border-radius: var(--radius);
		}

		& .leftover {
			margin-top: 1rem;
			font-size: 14px;

			& ul {
				margin: 0;
				padding-left: 1.25rem;
			}
		}
	}
</style>
