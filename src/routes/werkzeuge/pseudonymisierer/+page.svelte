<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { m } from '#lib/paraglide/messages.js';
	import { buildRun, detect, suggest } from '#lib/tools/pseudonymisierer/detect.js';
	import { extract, ExtractError } from '#lib/tools/pseudonymisierer/ingest/index.js';
	import { restoreFrom } from '#lib/tools/pseudonymisierer/restore.js';
	import {
		DEFAULT_OFF,
		RULE_GROUPS,
		RULE_KEYS,
		TIER_ORDER,
		TOKEN_TIER,
		TOKEN_TYPES
	} from '#lib/tools/pseudonymisierer/rules.js';
	import { PAGE_BREAK, pagesOf } from '#lib/tools/pseudonymisierer/pages.js';
	import FindingReview from '#lib/tools/pseudonymisierer/ui/FindingReview.svelte';
	import ModeNav from '#lib/tools/pseudonymisierer/ui/ModeNav.svelte';
	import PageView from '#lib/tools/pseudonymisierer/ui/PageView.svelte';
	import { SAMPLE } from '#lib/tools/pseudonymisierer/sample.js';
	import {
		AI_NOTE,
		readTerms,
		termList,
		withoutNever,
		writeTerms
	} from '#lib/tools/pseudonymisierer/terms.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type {
		Finding,
		Mapping,
		RuleKey,
		Tier,
		TokenType
	} from '#lib/tools/pseudonymisierer/types.js';
	import { text } from '#lib/tools/i18n.js';
	import ToolHeader from '#lib/tools/_shared/ToolHeader.svelte';
	import '#lib/tools/pseudonymisierer/ui/tiers.css';
	import Select from '#lib/ui/form/Select.svelte';
	import Switch from '#lib/ui/form/Switch.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const RULE_LABEL: Record<RuleKey, () => string> = {
		name: m.anon_rule_name,
		email: m.anon_rule_email,
		phone: m.anon_rule_phone,
		address: m.anon_rule_address,
		date: m.anon_rule_date,
		anydate: m.anon_rule_anydate,
		postcode: m.anon_rule_postcode,
		plate: m.anon_rule_plate,
		pension: m.anon_rule_pension,
		kvnr: m.anon_rule_kvnr,
		passport: m.anon_rule_passport,
		ip: m.anon_rule_ip,
		iban: m.anon_rule_iban,
		creditcard: m.anon_rule_creditcard,
		taxid: m.anon_rule_taxid,
		insurance: m.anon_rule_insurance,
		health: m.anon_rule_health,
		religion: m.anon_rule_religion,
		political: m.anon_rule_political,
		sexual: m.anon_rule_sexual,
		ethnic: m.anon_rule_ethnic,
		union: m.anon_rule_union,
		genetic: m.anon_rule_genetic,
		biometric: m.anon_rule_biometric
	};
	const TYPE_LABEL: Record<TokenType, () => string> = {
		NAME: m.anon_type_name,
		EMAIL: m.anon_type_email,
		PHONE: m.anon_type_phone,
		ADDRESS: m.anon_type_address,
		DATE: m.anon_type_date,
		NUMBER: m.anon_type_number,
		HEALTH_DATA: m.anon_type_health,
		RELIGION: m.anon_type_religion,
		POLITICAL: m.anon_type_political,
		SEXUAL_ORIENT: m.anon_type_sexual,
		ETHNIC_ORIGIN: m.anon_type_ethnic,
		TRADE_UNION: m.anon_type_union,
		GENETIC_DATA: m.anon_type_genetic,
		BIOMETRIC_DATA: m.anon_type_biometric,
		CUSTOM: m.anon_type_custom
	};
	const GROUP_CHIP: Record<(typeof RULE_GROUPS)[number]['id'], () => string> = {
		standard: m.anon_chip_standard,
		financial: m.anon_chip_financial,
		art9: m.anon_chip_art9
	};
	const GROUP_TITLE: Record<(typeof RULE_GROUPS)[number]['id'], () => string> = {
		standard: m.anon_group_standard,
		financial: m.anon_group_financial,
		art9: m.anon_group_art9
	};
	const TIER_TITLE: Record<Tier, () => string> = {
		3: m.anon_tier_art9,
		1: m.anon_tier_direct,
		2: m.anon_tier_numbers,
		0: m.anon_tier_other
	};
	const ACCEPT = '.pdf,.docx,.txt,.md,.markdown,.csv,.tsv,.log,.json,.xml';

	let source = $state('');
	/** the user's own standard where one is saved, else the standard set */
	const savedMine = readTerms().mine?.filter((key): key is RuleKey =>
		(RULE_KEYS as string[]).includes(key)
	);
	const active = new SvelteSet<RuleKey>(
		savedMine ?? RULE_KEYS.filter((key) => !DEFAULT_OFF.has(key))
	);
	const manualMarks = new SvelteMap<string, TokenType>();
	const mutedValues = new SvelteSet<string>();

	let manualValue = $state('');
	let manualType = $state<TokenType>('NAME');
	let status = $state<{ text: string; error: boolean } | null>(null);
	let reading = $state(false);
	let copyStatus = $state<{ text: string; error: boolean } | null>(null);
	/** what was copied out last; a reply is restored against this mapping */
	let sent = $state<{ text: string; mapping: Mapping } | null>(null);
	let reply = $state('');

	/** the browser's own term lists and the note setting, kept across visits */
	let terms = $state(readTerms());
	const always = $derived(termList(terms.always));
	const never = $derived(termList(terms.never));
	/** own terms count as marks; a hand mark on the same value wins */
	const marks = $derived(
		new Map<string, TokenType>([
			...always.map((term): [string, TokenType] => [term, 'CUSTOM']),
			...manualMarks
		])
	);

	function saveTerms(change: Partial<typeof terms>) {
		terms = { ...terms, ...change };
		writeTerms(terms);
	}

	const spans = $derived(withoutNever(detect(source, active, marks, mutedValues), never));
	const run = $derived(buildRun(source, spans));
	const note = getLocale() === 'de' ? AI_NOTE.de : AI_NOTE.en;
	/** exactly what goes into the AI chat: the note, if wanted, then the text */
	/** the text for the AI: page breaks of an imported PDF become blank lines */
	const sendable = $derived(run.text.replaceAll(PAGE_BREAK, ''));
	const outgoing = $derived(sendable.trim() && terms.note ? `${note}\n\n${sendable}` : sendable);
	const suggestions = $derived(suggest(source, spans));

	// an earlier version could load a name model; whatever it left in the cache goes
	onMount(() => {
		if ('caches' in window) void caches.delete('daily-gliner-v1').catch(() => {});
	});

	const rows = $derived([...run.findings, ...run.muted]);
	const groups = $derived(
		TIER_ORDER.map((tier) => ({
			tier,
			rows: rows.filter((row) => TOKEN_TIER[row.type] === tier)
		})).filter((group) => group.rows.length > 0)
	);
	/** the text in pages, and where the page view and the review stand */
	const pages = $derived(pagesOf(source));
	let page = $state(0);
	let finding = $state(0);
	let view = $state<'pages' | 'review'>('pages');
	const restored = $derived(reply.trim() ? restoreFrom(reply, sent?.mapping ?? run.mapping) : null);
	const stale = $derived(sent !== null && sent.text !== outgoing);

	const typeItems = $derived(
		TOKEN_TYPES.map((type) => ({ value: type, label: TYPE_LABEL[type]() }))
	);

	/** the user's saved standard, when there is one */
	const mine = $derived(
		terms.mine?.filter((key): key is RuleKey => (RULE_KEYS as string[]).includes(key)) ?? null
	);
	/** whether the switches are exactly the saved standard */
	const saved = $derived(
		mine !== null && active.size === mine.length && mine.every((key) => active.has(key))
	);

	/** keeps the current switches as the user's own standard, the start of every visit */
	function saveMine() {
		saveTerms({ mine: [...active] });
	}

	/**
	 * a group counts as on when its everyday rules are; the rules a standard run
	 * leaves off (every date) stay out of the group button
	 */
	const everyday = (keys: readonly RuleKey[]) => keys.filter((key) => !DEFAULT_OFF.has(key));
	const groupOn = (keys: readonly RuleKey[]) => everyday(keys).every((key) => active.has(key));

	/** a group chip switches its rules together: all off when they were on, else on */
	function toggleGroup(keys: readonly RuleKey[]) {
		if (groupOn(keys)) {
			for (const key of keys) active.delete(key);
		} else {
			for (const key of everyday(keys)) active.add(key);
		}
	}

	/** replaced values a group's rules found, counted once each */
	const groupCount = (keys: readonly RuleKey[]) =>
		run.findings.filter((finding) => finding.ruleKey && keys.includes(finding.ruleKey)).length;

	let marked = $state<HTMLElement | null>(null);

	/** a selection inside the highlighted text becomes the value to mark */
	function takeMarkedSelection() {
		const selection = document.getSelection();
		if (!marked || !selection?.anchorNode || !marked.contains(selection.anchorNode)) return;
		const selected = selection.toString().trim();
		if (selected && selected.length <= 120) manualValue = selected;
	}

	function toggle(value: string) {
		if (mutedValues.has(value)) mutedValues.delete(value);
		else mutedValues.add(value);
	}

	/** a new category is a manual mark, which wins over every detector */
	function retype(finding: Finding, type: TokenType) {
		manualMarks.set(finding.original, type);
		mutedValues.delete(finding.original);
	}

	function mark() {
		const value = manualValue.trim();
		if (!value) return;
		manualMarks.set(value, manualType);
		mutedValues.delete(value);
		manualValue = '';
	}

	function takeSelection(event: Event & { currentTarget: HTMLTextAreaElement }) {
		const field = event.currentTarget;
		const selected = field.value.slice(field.selectionStart, field.selectionEnd).trim();
		if (selected) manualValue = selected;
	}

	async function importFile(event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		reading = true;
		status = { text: m.anon_reading(), error: false };
		const name = file.name;
		try {
			const result = await extract(file);
			if (result.needsOcr) {
				status = { text: m.anon_err_no_text({ name }), error: true };
				return;
			}
			source = source.trim() ? `${source.trimEnd()}\n\n${result.text}` : result.text;
			status = {
				text: result.pages
					? m.anon_imported_pages({ name, pages: result.pages })
					: m.anon_imported({ name }),
				error: false
			};
		} catch (failure) {
			const reason = failure instanceof ExtractError ? failure.reason : null;
			status = {
				text:
					reason === 'unsupported'
						? m.anon_err_unsupported({ name })
						: reason === 'too-large'
							? m.anon_err_too_large({ name })
							: m.anon_err_failed({ name }),
				error: true
			};
		} finally {
			reading = false;
		}
	}

	async function copy(value: string, onCopied?: () => void) {
		try {
			await navigator.clipboard.writeText(value);
			onCopied?.();
			copyStatus = { text: m.anon_copied(), error: false };
		} catch {
			copyStatus = { text: m.anon_copy_failed(), error: true };
		}
	}

	function copyOutput() {
		const snapshot = { text: outgoing, mapping: { ...run.mapping } };
		copy(snapshot.text, () => (sent = snapshot));
	}

	function clear() {
		source = '';
		reply = '';
		sent = null;
		status = null;
		copyStatus = null;
		manualMarks.clear();
		mutedValues.clear();
	}
</script>

<svelte:document onselectionchange={takeMarkedSelection} />

<svelte:head>
	<title>{text(data.tool.name)} — Daily</title>
	<meta name="description" content={text(data.tool.summary)} />
</svelte:head>

<ToolHeader tool={data.tool} />
<ModeNav current="text" />

<section class="input card">
	<p class="measure intro">{m.anon_intro()}</p>
	<div class="toolbar">
		<label class="button quiet file" aria-disabled={reading || undefined}>
			{m.anon_import()}
			<input type="file" accept={ACCEPT} disabled={reading} onchange={importFile} />
		</label>
		<button type="button" class="quiet" data-demo="sample" onclick={() => (source = SAMPLE)}
			>{m.anon_sample()}</button
		>
		<button type="button" class="quiet" onclick={clear}>{m.anon_clear()}</button>
		<span class="status" class:error={status?.error} aria-live="polite">{status?.text ?? ''}</span>
	</div>

	<label class="daily-label field-label" for="anon-source">{m.anon_source()}</label>
	<textarea id="anon-source" rows="10" bind:value={source} onselect={takeSelection}></textarea>
</section>

<section class="card detection" aria-labelledby="anon-rules">
	<div class="head">
		<h2 id="anon-rules">{m.anon_rules()}</h2>
		<button type="button" class="button quiet" disabled={saved} onclick={saveMine}
			>{saved ? m.anon_mine_saved() : m.anon_mine_save()}</button
		>
	</div>

	<!-- what is on, at a glance; the switches themselves are under "Einzelne Regeln" -->
	<ul class="summary" aria-label={m.anon_summary()}>
		{#each RULE_GROUPS as group (group.id)}
			<li data-art9={group.art9 || undefined}>
				<span class="name">{GROUP_CHIP[group.id]()}</span>
				<span class="state"
					>{m.anon_summary_on({
						on: String(group.keys.filter((key) => active.has(key)).length),
						total: String(group.keys.length)
					})}</span
				>
				<span class="found"
					>{groupCount(group.keys) === 1
						? m.anon_summary_found_one()
						: m.anon_summary_found({ count: String(groupCount(group.keys)) })}</span
				>
			</li>
		{/each}
	</ul>

	<details class="single">
		<summary>{m.anon_rules_single()}</summary>
		<div class="rule-groups">
			{#each RULE_GROUPS as group (group.id)}
				<fieldset data-art9={group.art9 || undefined}>
					<legend>{GROUP_TITLE[group.id]()}</legend>
					<button type="button" class="button ghost all" onclick={() => toggleGroup(group.keys)}
						>{groupOn(group.keys) ? m.anon_group_all_off() : m.anon_group_all_on()}</button
					>
					{#each group.keys as key (key)}
						<Switch
							id="rule-{key}"
							bind:checked={
								() => active.has(key), (on) => (on ? active.add(key) : active.delete(key))
							}>{RULE_LABEL[key]()}</Switch
						>
					{/each}
				</fieldset>
			{/each}
		</div>
	</details>
	<details class="single own">
		<summary
			>{m.anon_terms()}{#if always.length + never.length > 0}
				<span class="badge num">{always.length + never.length}</span>{/if}</summary
		>
		<p class="hint">{m.anon_terms_hint()}</p>
		<div class="term-lists">
			<label>
				<span class="daily-label">{m.anon_terms_always()}</span>
				<textarea
					rows="4"
					value={terms.always}
					oninput={(event) => saveTerms({ always: event.currentTarget.value })}
					placeholder={m.anon_terms_always_placeholder()}></textarea>
			</label>
			<label>
				<span class="daily-label">{m.anon_terms_never()}</span>
				<textarea
					rows="4"
					value={terms.never}
					oninput={(event) => saveTerms({ never: event.currentTarget.value })}
					placeholder={m.anon_terms_never_placeholder()}></textarea>
			</label>
		</div>
	</details>
</section>

{#if source.trim()}
	<section class="card" aria-labelledby="anon-marked">
		<h2 id="anon-marked">{m.anon_marked()}</h2>
		<p class="hint">{m.anon_marked_hint()}</p>
		<div class="views" role="group" aria-label={m.anon_views()}>
			<button
				type="button"
				class="daily-chip"
				aria-pressed={view === 'pages'}
				onclick={() => (view = 'pages')}>{m.anon_view_pages()}</button
			>
			<button
				type="button"
				class="daily-chip"
				aria-pressed={view === 'review'}
				onclick={() => (view = 'review')}
				>{m.anon_view_review()} <span class="badge num">{spans.length}</span></button
			>
		</div>
		{#if view === 'pages'}
			<!-- a selection here fills the field below, as one in the source text does -->
			<PageView text={source} {spans} {pages} bind:page bind:element={marked} ontoggle={toggle} />
		{:else}
			<FindingReview
				text={source}
				{spans}
				{pages}
				bind:index={finding}
				onpage={(at) => (page = at)}
				typeLabel={(type) => TYPE_LABEL[type]()}
				ontoggle={toggle}
			/>
		{/if}

		<h3 class="manual-title">{m.anon_manual()}</h3>
		<form
			class="manual"
			onsubmit={(event) => {
				event.preventDefault();
				mark();
			}}
		>
			<label>
				<span class="daily-label field-label">{m.anon_manual_value()}</span>
				<input type="text" bind:value={manualValue} aria-describedby="anon-manual-hint" />
			</label>
			<span class="manual-type">
				<label class="daily-label field-label" for="anon-manual-type">{m.anon_manual_type()}</label>
				<Select
					id="anon-manual-type"
					required
					items={typeItems}
					placeholder={m.anon_manual_type()}
					bind:value={() => manualType, (type) => (manualType = type as TokenType)}
				/>
			</span>
			<button type="submit" class="button" disabled={!manualValue.trim()}>
				{m.anon_manual_add()}
			</button>
			<p id="anon-manual-hint" class="hint">{m.anon_manual_hint()}</p>
		</form>
	</section>
{/if}

<section class="card" aria-labelledby="anon-findings">
	<h2 id="anon-findings">{m.anon_findings()}</h2>
	{#if rows.length === 0}
		<p class="hint">{m.anon_findings_empty()}</p>
	{/if}
	{#each groups as group (group.tier)}
		<h3 class="tier" data-anon-tier={group.tier}>{TIER_TITLE[group.tier]()}</h3>
		<ul class="findings">
			{#each group.rows as row (row.original)}
				{@const id = `finding-${rows.indexOf(row)}`}
				<li data-anon-tier={group.tier} data-muted={row.muted || undefined}>
					<span class="value">
						<Switch id="{id}-on" bind:checked={() => !row.muted, () => toggle(row.original)}
							>{row.original}</Switch
						>
					</span>
					<code class="token">{row.muted ? '—' : row.replacement}</code>
					<span class="category">
						<label class="hidden-label" for="{id}-type"
							>{m.anon_category({ value: row.original })}</label
						>
						<Select
							id="{id}-type"
							required
							items={typeItems}
							placeholder={m.anon_manual_type()}
							bind:value={() => row.type, (type) => retype(row, type as TokenType)}
						/>
					</span>
					<span class="badges">
						{#if !row.confident}<span class="badge wax">{m.anon_unconfirmed()}</span>{/if}
						{#if manualMarks.has(row.original)}
							<span class="badge">{m.anon_by_hand()}</span>
							<button
								type="button"
								class="button ghost"
								onclick={() => manualMarks.delete(row.original)}>{m.anon_unmark()}</button
							>
						{:else if row.manual}
							<span class="badge navy">{m.anon_own_term()}</span>
						{/if}
					</span>
				</li>
			{/each}
		</ul>
	{/each}

	{#if suggestions.length > 0}
		<h3 class="manual-title">{m.anon_suggestions()}</h3>
		<p class="hint">{m.anon_suggestions_hint()}</p>
		<ul class="suggestions">
			{#each suggestions as suggestion (suggestion.value)}
				<li>
					<span class="value">{suggestion.value}</span>
					<span class="reason"
						>{suggestion.reason === 'email'
							? m.anon_suggestion_email()
							: m.anon_suggestion_first_name()} · {suggestion.count}×</span
					>
					<button
						type="button"
						class="button ghost"
						onclick={() => manualMarks.set(suggestion.value, 'NAME')}
						>{m.anon_suggestion_take()}</button
					>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section class="card io">
	<label class="daily-label field-label" for="anon-output">{m.anon_output()}</label>
	<p class="hint">{m.anon_output_hint()}</p>
	<textarea id="anon-output" rows="10" readonly value={outgoing}></textarea>
	<!-- outside the toolbar, whose buttons are styled as actions -->
	<div class="note-switch">
		<Switch id="anon-note" bind:checked={() => terms.note, (on) => saveTerms({ note: on })}
			>{m.anon_note()}</Switch
		>
	</div>
	<div class="toolbar actions">
		<button type="button" data-demo="copy" onclick={copyOutput} disabled={!run.text}
			>{m.anon_copy()}</button
		>
		<span class="status" class:error={copyStatus?.error} aria-live="polite"
			>{copyStatus?.text ?? ''}</span
		>
	</div>
</section>

<section class="card io">
	<label class="daily-label field-label" for="anon-reply">{m.anon_reply()}</label>
	<p class="hint">{m.anon_reply_hint()}</p>
	<textarea id="anon-reply" rows="8" bind:value={reply}></textarea>

	{#if restored}
		{#if stale}<p class="notice">{m.anon_stale()}</p>{/if}
		<label class="daily-label field-label" for="anon-restored">{m.anon_restored()}</label>
		<textarea id="anon-restored" rows="10" readonly value={restored.text}></textarea>
		<p class="hint" aria-live="polite">
			{m.anon_restored_count({ count: restored.count, total: restored.total })}
		</p>
		{#if restored.leftover.length > 0}
			<div class="leftover" role="status">
				<p>{m.anon_leftover()}</p>
				<ul>
					{#each restored.leftover as token (token)}<li><code>{token}</code></li>{/each}
				</ul>
			</div>
		{/if}
		<div class="toolbar actions">
			<button type="button" class="quiet" onclick={() => copy(restored.text)}
				>{m.anon_copy()}</button
			>
		</div>
	{/if}
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
		margin-bottom: 1.25rem;
		font-size: 15px;
		color: var(--ink2);
	}

	.hint {
		margin: 0 0 0.75rem;
		font-size: 13px;
		color: var(--ink3);
	}

	.status {
		font-size: 13px;
		color: var(--ink3);

		&.error {
			color: var(--wax);
		}
	}

	.field-label {
		margin-top: 1.25rem;
	}

	textarea {
		width: 100%;
		font-size: 14px;
	}

	/* the file input covers its label, so the label works as the button */
	label.file {
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

	.hidden-label {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	/* the title and the save button in one bar; the single rules fold away below */
	.detection {
		& .head {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			justify-content: space-between;
			gap: 0.5rem 1rem;
			margin-bottom: 0.75rem;

			& h2 {
				margin: 0;
			}
		}

		/* one quiet line per group: what is on and what it found */
		& .summary {
			display: grid;
			gap: 0.3rem;
			margin: 0 0 0.6rem;
			padding: 0;
			list-style: none;
			font-size: 14px;

			& li {
				display: flex;
				flex-wrap: wrap;
				gap: 0 0.5rem;
				align-items: baseline;
			}

			& .name {
				min-width: 13rem;
				font-weight: 500;
			}

			& li[data-art9] .name {
				color: var(--wax);
			}

			& .state,
			& .found {
				color: var(--ink2);
				font-variant-numeric: tabular-nums;
			}

			& .found::before {
				content: '·';
				margin-right: 0.5rem;
				color: var(--ink3);
			}
		}

		& .hint {
			margin-bottom: 0.5rem;
		}

		& summary {
			width: fit-content;
			font-size: 14px;
			font-weight: 500;
			color: var(--navy);
			cursor: pointer;
		}

		& .own {
			margin-top: 0.6rem;
		}

		& .term-lists {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
			gap: 1rem 1.5rem;

			& textarea {
				width: 100%;
			}
		}

		& .rule-groups {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
			align-items: start;
			gap: 0 2rem;
		}

		/* every column keeps its own rhythm, however long the others are */
		& fieldset {
			position: relative;
			display: grid;
			align-content: start;
			gap: 0.5rem;
			margin: 0.75rem 0 0;
			padding: 0;
			border: 0;
		}

		& legend {
			margin-bottom: 0.5rem;
			font-size: 12px;
			font-weight: 600;
			color: var(--ink3);
		}

		& fieldset[data-art9] legend {
			color: var(--wax);
		}

		/* "Alle an/aus" on the line of the group title */
		& fieldset .all {
			position: absolute;
			top: -1.85rem;
			right: 0;
			padding-block: 0.2rem;
			font-size: 13px;
		}
	}

	.views {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: 1rem;
	}

	.tier {
		margin: 1rem 0 0.25rem;
		font-family: var(--sans);
		font-size: 12px;
		font-weight: 600;
		color: var(--tier);
	}

	.findings {
		margin: 0;
		padding: 0;
		list-style: none;

		container-type: inline-size;

		/* value on its own line in a narrow column, token and category below it */
		& li {
			display: grid;
			grid-template-columns: minmax(0, 1fr) minmax(9rem, 13rem);
			gap: 0.4rem 1rem;
			align-items: center;
			padding: 0.5rem 0 0.5rem 0.75rem;
			border-bottom: 1px solid var(--rule2);
			box-shadow: inset 3px 0 0 var(--tier);

			& .value {
				grid-column: 1 / -1;
			}

			@container (min-width: 36rem) {
				grid-template-columns: minmax(0, 1fr) auto minmax(10rem, 13rem);

				& .value {
					grid-column: auto;
				}
			}

			&[data-muted] {
				box-shadow: inset 3px 0 0 var(--rule);

				& .value,
				& .token {
					color: var(--ink3);
				}
			}
		}

		& .value {
			font-size: 14px;
			overflow-wrap: anywhere;
		}

		& .token {
			font-family: var(--mono);
			font-size: 12px;
			color: var(--tier);
		}

		& .badges {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
			align-items: center;
			grid-column: 1 / -1;

			&:empty {
				display: none;
			}
		}
	}

	.manual-title {
		margin: 1.5rem 0 0;
		font-size: 15px;
	}

	.suggestions {
		margin: 0.5rem 0 0;
		padding: 0;
		list-style: none;

		& li {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.25rem 0.75rem;
			padding: 0.35rem 0;
			border-bottom: 1px solid var(--rule2);

			&:last-child {
				border-bottom: 0;
			}
		}

		& .value {
			font-weight: 600;
		}

		& .reason {
			font-size: 13px;
			color: var(--ink3);
		}

		& .button {
			margin-left: auto;
		}
	}

	.manual {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(10rem, 14rem) auto;
		gap: 0 0.75rem;
		align-items: end;

		@media (max-width: 40rem) {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.5rem;
		}

		& input {
			width: 100%;
		}

		& .field-label {
			margin-top: 0.75rem;
		}

		& .hint {
			grid-column: 1 / -1;
			margin-top: 0.5rem;
		}
	}

	.io {
		& .field-label:first-child {
			margin-top: 0;
		}

		& textarea[readonly] {
			font-family: var(--mono);
			font-size: 13px;
			background: var(--canvas);
		}
	}

	.note-switch {
		margin-top: 0.75rem;
	}

	.actions {
		margin-top: 1rem;
	}

	.notice {
		margin: 1rem 0 0;
		padding: 0.6rem 0.9rem;
		font-size: 13px;
		color: var(--navy);
		background: var(--navy-soft);
		border-radius: var(--radius);
	}

	.leftover {
		margin-top: 0.75rem;
		padding: 0.6rem 0.9rem;
		font-size: 13px;
		color: var(--wax);
		background: var(--wax-soft);
		border-radius: var(--radius);

		& p {
			margin: 0 0 0.3rem;
		}

		& ul {
			display: flex;
			flex-wrap: wrap;
			gap: 0.25rem 1rem;
			margin: 0;
			padding: 0;
			list-style: none;
		}

		& code {
			font-family: var(--mono);
		}
	}
</style>
