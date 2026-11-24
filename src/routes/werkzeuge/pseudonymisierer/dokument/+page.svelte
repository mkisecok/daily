<script lang="ts">
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { m } from '#lib/paraglide/messages.js';
	import { buildRun, detect } from '#lib/tools/pseudonymisierer/detect.js';
	import { DocxError, openDocx } from '#lib/tools/pseudonymisierer/document/docx.js';
	import type { CleanReport } from '#lib/tools/pseudonymisierer/document/clean.js';
	import {
		documentPages,
		trimmed,
		variableName
	} from '#lib/tools/pseudonymisierer/document/run.js';
	import { kindOf, MAX_FILE_BYTES } from '#lib/tools/pseudonymisierer/ingest/index.js';
	import { pageAt } from '#lib/tools/pseudonymisierer/pages.js';
	import {
		DEFAULT_OFF,
		RULE_KEYS,
		TOKEN_TIER,
		TOKEN_TYPES
	} from '#lib/tools/pseudonymisierer/rules.js';
	import { readTerms, termList, withoutNever } from '#lib/tools/pseudonymisierer/terms.js';
	import type { Finding, Place, RuleKey } from '#lib/tools/pseudonymisierer/types.js';
	import DocumentExport from '#lib/tools/pseudonymisierer/ui/DocumentExport.svelte';
	import DocumentRestore from '#lib/tools/pseudonymisierer/ui/DocumentRestore.svelte';
	import ModeNav from '#lib/tools/pseudonymisierer/ui/ModeNav.svelte';
	import PageView from '#lib/tools/pseudonymisierer/ui/PageView.svelte';
	import '#lib/tools/pseudonymisierer/ui/tiers.css';
	import { localized } from '#lib/i18n/links.js';
	import { text } from '#lib/tools/i18n.js';
	import ToolHeader from '#lib/tools/_shared/ToolHeader.svelte';
	import Switch from '#lib/ui/form/Switch.svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/** the rules and own terms set on the text page apply here as well */
	const terms = readTerms();
	const savedMine = terms.mine?.filter((key): key is RuleKey =>
		(RULE_KEYS as string[]).includes(key)
	);
	const active = new Set<RuleKey>(savedMine ?? RULE_KEYS.filter((key) => !DEFAULT_OFF.has(key)));
	const always = termList(terms.always);
	const never = termList(terms.never);

	let doc = $state<{ name: string; bytes: Uint8Array; text: string; cleaned: CleanReport } | null>(
		null
	);
	let status = $state<{ text: string; error: boolean } | null>(null);
	let reading = $state(false);

	/** boxed or selected stretches, replaced where they are */
	let places = $state<Place[]>([]);
	/** selected words, replaced wherever they occur; value → variable name */
	const manualMarks = new SvelteMap<string, string>();
	const mutedValues = new SvelteSet<string>();
	const marks = $derived(
		new Map<string, string>([
			...always.map((term): [string, string] => [term, 'CUSTOM']),
			...manualMarks
		])
	);

	const spans = $derived(
		doc ? withoutNever(detect(doc.text, active, marks, mutedValues, places), never) : []
	);
	const run = $derived(doc ? buildRun(doc.text, spans) : null);
	const values = $derived(
		Object.fromEntries(
			Object.entries(run?.mapping ?? {}).map(([original, entry]) => [entry.replacement, original])
		)
	);
	const pages = $derived(doc ? documentPages(doc.text) : []);
	let page = $state(0);
	let boxing = $state(true);

	/** a stretch waiting for its name and for where it counts */
	let pending = $state<{ start: number; end: number; label: string; here: boolean } | null>(null);
	const sectionLabel = () => m.anon_doc_default_label();

	function takeRange(start: number, end: number, via: 'selection' | 'box') {
		if (!doc) return;
		const range = trimmed(doc.text, start, end);
		if (range.end <= range.start) return;
		const value = doc.text.slice(range.start, range.end);
		// a word or name counts everywhere, a passage where it stands
		const here = via === 'box' || value.length > 60 || /\n/.test(value);
		pending = { ...range, here, label: here ? sectionLabel() : 'NAME' };
	}

	function setScope(here: boolean) {
		if (!pending) return;
		const defaults = [sectionLabel(), 'NAME'];
		pending = {
			...pending,
			here,
			label: defaults.includes(pending.label) ? (here ? sectionLabel() : 'NAME') : pending.label
		};
	}

	function apply() {
		if (!doc || !pending) return;
		const label = variableName(pending.label) || variableName(sectionLabel());
		const value = doc.text.slice(pending.start, pending.end);
		if (pending.here) {
			const { start, end } = pending;
			places = [
				...places.filter((place) => place.end <= start || place.start >= end),
				{ start, end, label }
			];
		} else {
			manualMarks.set(value, label);
		}
		mutedValues.delete(value);
		pending = null;
	}

	/** a click on a mark: a box or a word marked by hand goes, a found value switches off or on */
	function toggle(value: string) {
		if (!doc) return;
		const text = doc.text;
		if (places.some((place) => text.slice(place.start, place.end) === value)) {
			places = places.filter((place) => text.slice(place.start, place.end) !== value);
		} else if (manualMarks.has(value)) {
			manualMarks.delete(value);
		} else if (mutedValues.has(value)) {
			mutedValues.delete(value);
		} else {
			mutedValues.add(value);
		}
	}

	/** renames a variable the user made */
	function rename(row: Finding, input: string) {
		if (!doc) return;
		const label = variableName(input);
		if (!label) return;
		const text = doc.text;
		if (manualMarks.has(row.original)) manualMarks.set(row.original, label);
		places = places.map((place) =>
			text.slice(place.start, place.end) === row.original ? { ...place, label } : place
		);
	}

	const rows = $derived(run ? [...run.findings, ...run.muted] : []);
	/** the pages a value is on, as "3, 5" */
	const pagesFor = (row: Finding) =>
		[
			...new Set(
				row.spanIds.map((id) => pageAt(pages, spans.find((span) => span.id === id)?.start ?? 0) + 1)
			)
		].join(', ');
	const preview = (value: string) => {
		const flat = value.replace(/\s*\n\s*/g, ' ⏎ ');
		return flat.length > 90 ? `${flat.slice(0, 88)}…` : flat;
	};
	const placed = (row: Finding) =>
		doc !== null &&
		places.some((place) => doc!.text.slice(place.start, place.end) === row.original);

	async function load(event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		const name = file.name;
		if (/\.doc$/i.test(name)) {
			status = { text: m.anon_doc_err_doc({ name }), error: true };
			return;
		}
		if (kindOf(file) !== 'docx') {
			status = { text: m.anon_doc_err_kind({ name }), error: true };
			return;
		}
		if (file.size > MAX_FILE_BYTES) {
			status = { text: m.anon_err_too_large({ name }), error: true };
			return;
		}
		reading = true;
		status = { text: m.anon_reading(), error: false };
		try {
			const bytes = new Uint8Array(await file.arrayBuffer());
			const opened = openDocx(bytes, { clean: true });
			doc = { name, bytes, text: opened.text, cleaned: opened.cleaned! };
			places = [];
			manualMarks.clear();
			mutedValues.clear();
			pending = null;
			page = 0;
			status = {
				text: m.anon_doc_loaded({ name, pages: documentPages(opened.text).length }),
				error: false
			};
		} catch (failure) {
			status = {
				text:
					failure instanceof DocxError
						? m.anon_doc_err_not_docx({ name })
						: m.anon_err_failed({ name }),
				error: true
			};
		} finally {
			reading = false;
		}
	}

	const typeNames = TOKEN_TYPES.filter((type) => type !== 'CUSTOM');
</script>

<svelte:head>
	<title>{m.anon_mode_document()} · {text(data.tool.name)} — Daily</title>
	<meta name="description" content={m.anon_doc_intro()} />
</svelte:head>

<ToolHeader tool={data.tool} />
<ModeNav current="document" />

<section class="card">
	<p class="measure intro">{m.anon_doc_intro()}</p>
	<div class="toolbar">
		<label class="button file" aria-disabled={reading || undefined}>
			{m.anon_doc_upload()}
			<input type="file" accept=".docx" disabled={reading} onchange={load} />
		</label>
		<span class="status" class:error={status?.error} aria-live="polite">{status?.text ?? ''}</span>
	</div>
	<p class="hint">
		{m.anon_doc_rules_hint()}
		<a href={resolve(localized('/werkzeuge/pseudonymisierer'))}>{m.anon_mode_text()}</a>
	</p>
</section>

{#if doc}
	<section class="card" aria-labelledby="anon-doc-pages">
		<h2 id="anon-doc-pages">{m.anon_doc_pages()}</h2>
		<p class="hint">{m.anon_doc_pages_hint()}</p>
		<div class="views" role="group" aria-label={m.anon_doc_tools()}>
			<button type="button" class="daily-chip" aria-pressed={boxing} onclick={() => (boxing = true)}
				>{m.anon_doc_tool_box()}</button
			>
			<button
				type="button"
				class="daily-chip"
				aria-pressed={!boxing}
				onclick={() => (boxing = false)}>{m.anon_doc_tool_select()}</button
			>
		</div>
		<div class="sheet">
			<PageView
				text={doc.text}
				{spans}
				{pages}
				bind:page
				ontoggle={toggle}
				onrange={takeRange}
				{boxing}
				{pending}
			/>
		</div>

		{#if pending}
			<form
				class="pending"
				aria-labelledby="anon-doc-pending"
				onsubmit={(event) => {
					event.preventDefault();
					apply();
				}}
			>
				<h3 id="anon-doc-pending">{m.anon_doc_pending()}</h3>
				<blockquote>{preview(doc.text.slice(pending.start, pending.end))}</blockquote>
				<div class="row">
					<label class="field">
						<span class="daily-label field-label">{m.anon_doc_variable()}</span>
						<input type="text" list="anon-doc-types" bind:value={pending.label} />
					</label>
					<fieldset>
						<legend class="daily-label">{m.anon_doc_scope()}</legend>
						<label
							><input
								type="radio"
								name="anon-doc-scope"
								checked={pending.here}
								onchange={() => setScope(true)}
							/>
							{m.anon_doc_scope_here()}</label
						>
						<label
							><input
								type="radio"
								name="anon-doc-scope"
								checked={!pending.here}
								onchange={() => setScope(false)}
							/>
							{m.anon_doc_scope_everywhere()}</label
						>
					</fieldset>
				</div>
				<p class="hint">
					{m.anon_doc_placeholder_preview({
						token: `«${variableName(pending.label) || variableName(sectionLabel())}_n»`
					})}
				</p>
				<div class="toolbar">
					<button type="submit">{m.anon_doc_apply()}</button>
					<button type="button" class="quiet" onclick={() => (pending = null)}
						>{m.anon_doc_discard()}</button
					>
				</div>
				<datalist id="anon-doc-types">
					{#each typeNames as type (type)}<option value={type}></option>{/each}
				</datalist>
			</form>
		{/if}
	</section>

	<section class="card" aria-labelledby="anon-doc-variables">
		<h2 id="anon-doc-variables">{m.anon_doc_variables()}</h2>
		{#if rows.length === 0}<p class="hint">{m.anon_findings_empty()}</p>{/if}
		<ul class="variables">
			{#each rows as row, index (row.original)}
				{@const own = placed(row) || manualMarks.has(row.original)}
				<li data-anon-tier={TOKEN_TIER[row.type]} data-muted={row.muted || undefined}>
					<span class="value" title={row.original}>{preview(row.original)}</span>
					<code class="token">{row.muted ? '—' : row.replacement}</code>
					<span class="where">{m.anon_doc_on_pages({ pages: pagesFor(row) })}</span>
					<span class="actions">
						{#if own}
							<span class="badge"
								>{placed(row) ? m.anon_doc_by_box() : m.anon_doc_everywhere()}</span
							>
							<label class="visually-hidden" for="anon-doc-name-{index}"
								>{m.anon_doc_rename({ value: preview(row.original) })}</label
							>
							<input
								id="anon-doc-name-{index}"
								class="rename"
								type="text"
								value={row.label ?? row.type}
								onchange={(event) => rename(row, event.currentTarget.value)}
							/>
							<button type="button" class="button ghost" onclick={() => toggle(row.original)}
								>{m.anon_unmark()}</button
							>
						{:else}
							<Switch
								id="anon-doc-on-{index}"
								bind:checked={() => !row.muted, () => toggle(row.original)}
								>{m.anon_doc_replace()}</Switch
							>
						{/if}
					</span>
				</li>
			{/each}
		</ul>
	</section>

	<section class="card" aria-labelledby="anon-doc-export">
		<h2 id="anon-doc-export">{m.anon_doc_export()}</h2>
		<p class="hint">{m.anon_doc_export_hint()}</p>
		{#key doc}
			<DocumentExport name={doc.name} bytes={doc.bytes} {spans} {values} />
		{/key}
	</section>
{/if}

<section class="card" aria-labelledby="anon-doc-restore">
	<h2 id="anon-doc-restore">{m.anon_doc_restore_title()}</h2>
	<p class="hint">{m.anon_doc_restore_hint()}</p>
	<DocumentRestore />
</section>

<style>
	.card {
		margin-top: 1rem;

		& h2 {
			margin-bottom: 0.5rem;
			font-size: 17px;
		}
	}

	.intro {
		margin-bottom: 1rem;
		font-size: 15px;
		color: var(--ink2);
	}

	.hint {
		margin: 0 0 0.75rem;
		font-size: 13px;
		color: var(--ink3);
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.75rem;
		margin-bottom: 0.75rem;
	}

	.status {
		font-size: 13px;
		color: var(--ink3);

		&.error {
			color: var(--wax);
		}
	}

	.file {
		position: relative;
		overflow: hidden;

		& input {
			position: absolute;
			inset: 0;
			opacity: 0;
			cursor: pointer;
		}
	}

	.views {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	/* the page as a sheet of paper, so it reads as the document */
	.sheet {
		padding: 1.25rem 1.5rem;
		background: var(--sheet);
		border: 1px solid var(--rule2);
		border-radius: var(--radius);
	}

	.pending {
		margin-top: 1rem;
		padding: 1rem;
		background: var(--primary-soft);
		border: 1px solid var(--primary);
		border-radius: var(--radius);

		& h3 {
			margin: 0 0 0.5rem;
			font-size: 15px;
		}

		& blockquote {
			margin: 0 0 0.75rem;
			padding-left: 0.75rem;
			font-size: 14px;
			color: var(--ink2);
			border-left: 3px solid var(--primary);
			overflow-wrap: anywhere;
		}

		& .row {
			display: flex;
			flex-wrap: wrap;
			gap: 0.75rem 1.5rem;
			align-items: end;
			margin-bottom: 0.5rem;
		}

		& .field {
			display: grid;
			gap: 0.25rem;
		}

		& fieldset {
			display: flex;
			flex-wrap: wrap;
			gap: 0.25rem 1rem;
			margin: 0;
			padding: 0;
			border: 0;

			& legend {
				width: 100%;
				margin-bottom: 0.25rem;
			}

			& label {
				display: inline-flex;
				align-items: center;
				gap: 0.35rem;
				font-size: 14px;
			}
		}
	}

	.variables {
		display: grid;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;

		& li {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			gap: 0.25rem 0.75rem;
			align-items: center;
			padding: 0.5rem 0.75rem;
			border-left: 3px solid var(--tier);
			background: var(--tier-soft);
			border-radius: 4px;

			&[data-muted] {
				background: none;
				border-left-style: dashed;
				opacity: 0.75;
			}
		}

		& .value {
			font-size: 14px;
			overflow-wrap: anywhere;
		}

		& .token {
			font-size: 13px;
			color: var(--tier);
		}

		& .where {
			font-size: 12px;
			color: var(--ink3);
		}

		& .actions {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			justify-content: end;
			gap: 0.5rem;
		}

		& .rename {
			width: 10rem;
			font-family: var(--mono);
			font-size: 13px;
		}
	}

	@media (max-width: 640px) {
		.sheet {
			padding: 0.75rem;
		}

		.variables li {
			grid-template-columns: minmax(0, 1fr);

			& .actions {
				justify-content: start;
			}
		}
	}
</style>
