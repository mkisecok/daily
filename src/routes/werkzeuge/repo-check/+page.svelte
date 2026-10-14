<script lang="ts">
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { downloadText } from '#lib/records/ui/download.js';
	import { text } from '#lib/tools/i18n.js';
	import { findingsCsv, toResult } from '#lib/tools/repo-check/result.js';
	import {
		CATEGORY,
		scan,
		scannable,
		type Finding,
		type SourceFile
	} from '#lib/tools/repo-check/scan.js';
	import ToolHeader from '#lib/tools/_shared/ToolHeader.svelte';
	import Verdict from '#lib/tools/_shared/Verdict.svelte';
	import type { Localized } from '#lib/tools/types.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const L = (de: string, en: string): Localized => ({ de, en });
	const T = {
		intro: L(
			'Wählen Sie einen Ordner oder einzelne Dateien oder fügen Sie Code ein. Die Prüfung läuft vollständig in Ihrem Browser; keine Datei verlässt das Gerät. Abhängigkeiten, Build-Ordner, Binärdateien und Lock-Dateien werden übersprungen.',
			'Choose a folder or individual files, or paste code. The check runs entirely in your browser; no file leaves the device. Dependencies, build folders, binaries and lock files are skipped.'
		),
		folder: L('Ordner wählen', 'Choose folder'),
		files: L('Dateien wählen', 'Choose files'),
		paste: L('Oder Code einfügen', 'Or paste code'),
		pasteName: L('Dateiname für den eingefügten Code', 'File name for the pasted code'),
		loaded: L('Dateien geladen', 'files loaded'),
		skipped: L('übersprungen', 'skipped'),
		run: L('Prüfen', 'Check'),
		reset: L('Zurücksetzen', 'Reset'),
		csv: L('Befunde als CSV', 'Findings as CSV'),
		print: L('Drucken', 'Print'),
		category: L('Kategorie', 'Category'),
		rule: L('Regel', 'Rule'),
		place: L('Fundstelle', 'Location'),
		excerpt: L('Auszug', 'Excerpt'),
		more: L('weitere Befunde im CSV-Export', 'more findings in the CSV export')
	};
	const SHOWN = 300;

	const locale = getLocale();
	let files = $state<SourceFile[]>([]);
	let skipped = $state(0);
	let pasted = $state('');
	let pastedName = $state('eingefuegt.ts');
	let findings = $state<Finding[] | null>(null);
	let scanned = $state(0);
	let busy = $state(false);

	const result = $derived(findings ? toResult(findings, scanned) : null);

	/** Lets the input pick a whole folder (Chromium, Firefox, Safari). */
	function directory(node: HTMLInputElement) {
		node.setAttribute('webkitdirectory', '');
	}

	async function add(list: FileList | null) {
		if (!list) return;
		busy = true;
		const added: SourceFile[] = [];
		for (const file of Array.from(list)) {
			const path = file.webkitRelativePath || file.name;
			if (!scannable(path, file.size)) {
				skipped++;
				continue;
			}
			added.push({ path, content: await file.text() });
		}
		files = [...files, ...added];
		findings = null;
		busy = false;
	}

	function run() {
		const all = pasted.trim()
			? [...files, { path: pastedName || 'eingefuegt', content: pasted }]
			: files;
		findings = scan(all);
		scanned = all.length;
	}

	function reset() {
		files = [];
		skipped = 0;
		pasted = '';
		findings = null;
	}

	function exportCsv() {
		if (!findings) return;
		downloadText(
			`repo-check-${new Date().toISOString().slice(0, 10)}.csv`,
			findingsCsv(findings, locale),
			'text/csv;charset=utf-8'
		);
	}
</script>

<svelte:head>
	<title>{text(data.tool.name)} — Daily</title>
	<meta name="description" content={text(data.tool.summary)} />
</svelte:head>

<ToolHeader tool={data.tool} />

<section class="input no-print">
	<p class="measure intro">{text(T.intro)}</p>
	<div class="toolbar">
		<label class="button quiet">
			{text(T.folder)}
			<input
				type="file"
				multiple
				{@attach directory}
				onchange={(e) => add(e.currentTarget.files)}
			/>
		</label>
		<label class="button quiet">
			{text(T.files)}
			<input type="file" multiple onchange={(e) => add(e.currentTarget.files)} />
		</label>
		<span class="status" aria-live="polite">
			{files.length}
			{text(T.loaded)}{#if skipped > 0}, {skipped} {text(T.skipped)}{/if}
		</span>
	</div>

	<label class="paste-label" for="paste">{text(T.paste)}</label>
	<textarea id="paste" rows="8" bind:value={pasted} spellcheck="false"></textarea>
	<label class="paste-name">
		{text(T.pasteName)}
		<input type="text" bind:value={pastedName} />
	</label>

	<div class="toolbar actions">
		<button type="button" onclick={run} disabled={busy || (files.length === 0 && !pasted.trim())}>
			{text(T.run)}
		</button>
		<button type="button" class="quiet" onclick={reset}>{text(T.reset)}</button>
	</div>
</section>

{#if result && findings}
	<Verdict {result} />

	{#if findings.length > 0}
		<div class="toolbar actions no-print">
			<button type="button" class="quiet" onclick={exportCsv}>{text(T.csv)}</button>
			<button type="button" class="quiet" onclick={() => window.print()}>{text(T.print)}</button>
		</div>
		<div class="scroll">
			<table class="findings">
				<thead>
					<tr>
						<th scope="col">{text(T.category)}</th>
						<th scope="col">{text(T.rule)}</th>
						<th scope="col">{text(T.place)}</th>
						<th scope="col">{text(T.excerpt)}</th>
					</tr>
				</thead>
				<tbody>
					{#each findings.slice(0, SHOWN) as finding, index (index)}
						<tr data-category={finding.rule.category}>
							<td class="category">{text(CATEGORY[finding.rule.category].label)}</td>
							<td>{text(finding.rule.label)}</td>
							<td class="place">{finding.path}:{finding.line}</td>
							<td><code>{finding.excerpt}</code></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if findings.length > SHOWN}
			<p class="more">{findings.length - SHOWN} {text(T.more)}</p>
		{/if}
	{/if}
{/if}

<style>
	.input {
		padding: 1.5rem 0;
	}

	.intro {
		margin-bottom: 1.25rem;
		font-size: 15px;
		color: var(--ink2);
	}

	label.button {
		position: relative;
		cursor: pointer;

		& input {
			position: absolute;
			inset: 0;
			opacity: 0;
			cursor: pointer;
		}

		&:focus-within {
			outline: 2px solid var(--navy);
			outline-offset: 2px;
		}
	}

	.status {
		font-family: var(--sans);
		font-size: 13px;
		letter-spacing: 0;
		text-transform: none;
		color: var(--ink3);
	}

	.paste-label {
		display: block;
		margin-top: 1.5rem;
		font-family: var(--serif);
		font-size: 16px;
	}

	textarea,
	.paste-name input {
		width: 100%;
		margin-top: 0.4rem;
		padding: 0.5rem 0.6rem;
		font-family: var(--mono);
		font-size: 13px;
		color: var(--ink);
		background: var(--sheet);
		border: 1px solid var(--rule);
	}

	.paste-name {
		display: block;
		margin-top: 0.75rem;
		font-size: 13px;
		color: var(--ink2);

		& input {
			max-width: 24rem;
			display: block;
		}
	}

	.actions {
		margin-top: 1.25rem;
	}

	.scroll {
		overflow-x: auto;
		margin-top: 1.5rem;
	}

	.findings {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;

		& th,
		& td {
			padding: 0.5rem 1rem 0.5rem 0;
			text-align: left;
			vertical-align: baseline;
			border-bottom: 1px solid var(--rule2);
		}

		& th {
			font-family: var(--mono);
			font-size: 11px;
			font-weight: 500;
			letter-spacing: 0.1em;
			text-transform: uppercase;
			color: var(--ink3);
			border-bottom: 1px solid var(--ink);
		}

		& tr[data-category='geheimnis'] .category {
			color: var(--wax);
		}

		& .place,
		& code {
			font-family: var(--mono);
			font-size: 12px;
			word-break: break-all;
		}
	}

	.more {
		margin-top: 0.75rem;
		font-size: 13px;
		color: var(--ink3);
	}
</style>
