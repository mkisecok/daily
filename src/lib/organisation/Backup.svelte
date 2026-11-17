<!--
	@component
	Datensicherung: downloads every entry of the workspace with its history
	as one file, and reads such a file back. Before anything is written it
	says how many entries are new and how many are already here; entries
	already here are never overwritten. In the preview it also says when this
	browser last made a backup.
-->
<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { formatShortDate } from '#lib/i18n/date.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import {
		backupFileName,
		makeBackup,
		planRestore,
		readBackup,
		type Backup
	} from '#lib/records/backup.js';
	import { getStore } from '#lib/records/store/index.js';
	import { downloadText } from '#lib/records/ui/download.js';
	import { getRecordTool } from '#lib/tools/registry.js';
	import Icon from '#lib/ui/Icon.svelte';

	let { workspace = null, preview = false }: { workspace?: string | null; preview?: boolean } =
		$props();

	const LAST_KEY = 'daily.backup.last.v1';

	let last = $state<string | null>(readLast());
	let busy = $state(false);
	let message = $state<string | null>(null);
	let pending = $state<{
		backup: Backup;
		total: number;
		added: number;
		present: number;
		unreadable: number;
	} | null>(null);
	let input = $state<HTMLInputElement>();

	function readLast(): string | null {
		try {
			return localStorage.getItem(LAST_KEY);
		} catch {
			return null;
		}
	}

	async function download() {
		busy = true;
		message = null;
		try {
			const now = new Date();
			const backup = makeBackup(await getStore().backup(), now);
			downloadText(
				backupFileName(workspace, now),
				JSON.stringify(backup, null, 1),
				'application/json'
			);
			if (preview) {
				try {
					localStorage.setItem(LAST_KEY, now.toISOString());
					last = now.toISOString();
				} catch {
					// without storage the browser just cannot remember the day
				}
			}
		} catch {
			message = m.backup_failed();
		} finally {
			busy = false;
		}
	}

	async function read(event: Event & { currentTarget: HTMLInputElement }) {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = '';
		pending = null;
		message = null;
		if (!file) return;
		busy = true;
		try {
			const backup = readBackup(JSON.parse(await file.text()));
			if ('error' in backup) {
				message = backup.error === 'version' ? m.backup_newer() : m.backup_not_daily();
				return;
			}
			const here = new Set((await getStore().backup()).records.map((record) => record.id));
			const plan = planRestore(backup, {
				here: (id) => here.has(id),
				free: () => true,
				getTool: getRecordTool,
				newId: () => ''
			});
			pending = {
				backup,
				total: backup.records.length,
				added: plan.added,
				present: plan.present,
				unreadable: plan.unreadable
			};
		} catch {
			message = m.backup_not_daily();
		} finally {
			busy = false;
		}
	}

	async function restore() {
		if (!pending) return;
		busy = true;
		try {
			const result = await getStore().restore(pending.backup);
			pending = null;
			message = m.backup_done({ count: String(result.added) });
			await invalidate('records:data');
		} catch {
			message = m.backup_failed();
		} finally {
			busy = false;
		}
	}
</script>

<section class="backup" aria-labelledby="backup-title">
	<h2 id="backup-title">{m.backup_title()}</h2>
	<p class="measure">{m.backup_intro()}</p>
	{#if preview}
		<p class="last">
			{last ? m.backup_last({ date: formatShortDate(last, getLocale()) }) : m.backup_never()}
		</p>
	{/if}

	<div class="toolbar">
		<button type="button" disabled={busy} onclick={download}>
			<Icon name="download" size={16} />{m.backup_export()}
		</button>
		<button type="button" class="quiet" disabled={busy} onclick={() => input?.click()}>
			{m.backup_import()}
		</button>
		<input
			bind:this={input}
			class="file"
			type="file"
			accept="application/json,.json"
			aria-label={m.backup_import()}
			onchange={read}
		/>
	</div>

	{#if pending}
		<div class="check" role="status">
			<p>
				{m.backup_counts({
					total: String(pending.total),
					added: String(pending.added),
					present: String(pending.present)
				})}{#if pending.unreadable > 0}
					· {m.backup_unreadable({ count: String(pending.unreadable) })}{/if}
			</p>
			{#if pending.added > 0}
				<p>{m.backup_keep()}</p>
				<div class="toolbar">
					<button type="button" disabled={busy} onclick={restore}>{m.backup_confirm()}</button>
					<button type="button" class="quiet" onclick={() => (pending = null)}>
						{m.records_cancel()}
					</button>
				</div>
			{:else}
				<p>{m.backup_nothing()}</p>
			{/if}
		</div>
	{/if}

	{#if message}
		<p class="result" role="status">{message}</p>
	{/if}
</section>

<style>
	.backup {
		margin-top: 2.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--rule);

		& h2 {
			margin: 0 0 0.5rem;
			font-size: 18px;
		}

		& .last {
			margin-top: 0.5rem;
			font-size: 14px;
			color: var(--ink3);
		}

		& .toolbar {
			margin-top: 1rem;
		}

		& .file {
			display: none;
		}

		& .result {
			margin-top: 1rem;
			font-weight: 500;
		}
	}

	.check {
		max-width: 44rem;
		margin-top: 1rem;
		padding: 0.9rem 1rem;
		font-size: 14px;
		background: var(--sheet);
		border: 1px solid var(--rule);
		border-radius: var(--radius);

		& p + p {
			margin-top: 0.4rem;
		}

		& .toolbar {
			margin-top: 0.75rem;
		}
	}
</style>
