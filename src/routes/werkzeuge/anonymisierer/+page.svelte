<script lang="ts">
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { m } from '#lib/paraglide/messages.js';
	import { buildRun, detect } from '#lib/tools/anonymisierer/detect.js';
	import { extract, ExtractError } from '#lib/tools/anonymisierer/ingest/index.js';
	import { restoreFrom } from '#lib/tools/anonymisierer/restore.js';
	import {
		RULE_GROUPS,
		RULE_KEYS,
		TIER_ORDER,
		TOKEN_TIER,
		TOKEN_TYPES
	} from '#lib/tools/anonymisierer/rules.js';
	import { SAMPLE } from '#lib/tools/anonymisierer/sample.js';
	import type {
		Finding,
		Mapping,
		RuleKey,
		Tier,
		TokenType
	} from '#lib/tools/anonymisierer/types.js';
	import { text } from '#lib/tools/i18n.js';
	import ToolHeader from '#lib/tools/_shared/ToolHeader.svelte';
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
		passport: m.anon_rule_passport,
		ip: m.anon_rule_ip,
		iban: m.anon_rule_iban,
		creditcard: m.anon_rule_creditcard,
		taxid: m.anon_rule_taxid,
		insurance: m.anon_rule_insurance,
		health: m.anon_rule_health,
		religion: m.anon_rule_religion,
		political: m.anon_rule_political,
		sexual: m.anon_rule_sexual
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
		CUSTOM: m.anon_type_custom
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
	const active = new SvelteSet<RuleKey>(RULE_KEYS);
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

	const spans = $derived(detect(source, active, manualMarks, mutedValues));
	const run = $derived(buildRun(source, spans));
	const rows = $derived([...run.findings, ...run.muted]);
	const groups = $derived(
		TIER_ORDER.map((tier) => ({
			tier,
			rows: rows.filter((row) => TOKEN_TIER[row.type] === tier)
		})).filter((group) => group.rows.length > 0)
	);
	/** the source cut into plain text and marks, for the highlighted view */
	const segments = $derived.by(() => {
		const out: { text: string; span?: (typeof spans)[number] }[] = [];
		let cursor = 0;
		for (const span of spans) {
			if (span.start > cursor) out.push({ text: source.slice(cursor, span.start) });
			out.push({ text: span.value, span });
			cursor = span.end;
		}
		if (cursor < source.length) out.push({ text: source.slice(cursor) });
		return out;
	});
	const restored = $derived(reply.trim() ? restoreFrom(reply, sent?.mapping ?? run.mapping) : null);
	const stale = $derived(sent !== null && sent.text !== run.text);

	const typeItems = $derived(
		TOKEN_TYPES.map((type) => ({ value: type, label: TYPE_LABEL[type]() }))
	);

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
		const snapshot = { text: run.text, mapping: { ...run.mapping } };
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

<svelte:head>
	<title>{text(data.tool.name)} — Daily</title>
	<meta name="description" content={text(data.tool.summary)} />
</svelte:head>

<ToolHeader tool={data.tool} />

<section class="input card">
	<p class="measure intro">{m.anon_intro()}</p>
	<div class="toolbar">
		<label class="button quiet file" aria-disabled={reading || undefined}>
			{m.anon_import()}
			<input type="file" accept={ACCEPT} disabled={reading} onchange={importFile} />
		</label>
		<button type="button" class="quiet" onclick={() => (source = SAMPLE)}>{m.anon_sample()}</button>
		<button type="button" class="quiet" onclick={clear}>{m.anon_clear()}</button>
		<span class="status" class:error={status?.error} aria-live="polite">{status?.text ?? ''}</span>
	</div>

	<label class="field-label" for="anon-source">{m.anon_source()}</label>
	<textarea id="anon-source" rows="10" bind:value={source} onselect={takeSelection}></textarea>
</section>

<div class="work">
	<section class="card rules" aria-labelledby="anon-rules">
		<h2 id="anon-rules">{m.anon_rules()}</h2>
		{#each RULE_GROUPS as group (group.id)}
			<fieldset data-art9={group.art9 || undefined}>
				<legend>{GROUP_TITLE[group.id]()}</legend>
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
	</section>

	<div class="results">
		{#if source.trim()}
			<section class="card" aria-labelledby="anon-marked">
				<h2 id="anon-marked">{m.anon_marked()}</h2>
				<p class="hint">{m.anon_marked_hint()}</p>
				<p class="marked">
					{#each segments as segment, index (index)}
						{#if segment.span}
							<button
								type="button"
								class="mark"
								data-tier={TOKEN_TIER[segment.span.type]}
								aria-pressed={!segment.span.muted}
								title={segment.span.muted ? undefined : segment.span.replacement}
								onclick={() => toggle(segment.text)}>{segment.text}</button
							>
						{:else}{segment.text}{/if}
					{/each}
				</p>
			</section>
		{/if}

		<section class="card" aria-labelledby="anon-findings">
			<h2 id="anon-findings">{m.anon_findings()}</h2>
			{#if rows.length === 0}
				<p class="hint">{m.anon_findings_empty()}</p>
			{/if}
			{#each groups as group (group.tier)}
				<h3 class="tier" data-tier={group.tier}>{TIER_TITLE[group.tier]()}</h3>
				<ul class="findings">
					{#each group.rows as row (row.original)}
						{@const id = `finding-${rows.indexOf(row)}`}
						<li data-tier={group.tier} data-muted={row.muted || undefined}>
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
								{#if row.manual}
									<span class="badge">{m.anon_by_hand()}</span>
									<button
										type="button"
										class="button ghost"
										onclick={() => manualMarks.delete(row.original)}>{m.anon_unmark()}</button
									>
								{/if}
							</span>
						</li>
					{/each}
				</ul>
			{/each}

			<h3 class="manual-title">{m.anon_manual()}</h3>
			<form
				class="manual"
				onsubmit={(event) => {
					event.preventDefault();
					mark();
				}}
			>
				<label>
					<span class="field-label">{m.anon_manual_value()}</span>
					<input type="text" bind:value={manualValue} aria-describedby="anon-manual-hint" />
				</label>
				<span class="manual-type">
					<label class="field-label" for="anon-manual-type">{m.anon_manual_type()}</label>
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
	</div>
</div>

<section class="card io">
	<label class="field-label" for="anon-output">{m.anon_output()}</label>
	<p class="hint">{m.anon_output_hint()}</p>
	<textarea id="anon-output" rows="10" readonly value={run.text}></textarea>
	<div class="toolbar actions">
		<button type="button" onclick={copyOutput} disabled={!run.text}>{m.anon_copy()}</button>
		<span class="status" class:error={copyStatus?.error} aria-live="polite"
			>{copyStatus?.text ?? ''}</span
		>
	</div>
</section>

<section class="card io">
	<label class="field-label" for="anon-reply">{m.anon_reply()}</label>
	<p class="hint">{m.anon_reply_hint()}</p>
	<textarea id="anon-reply" rows="8" bind:value={reply}></textarea>

	{#if restored}
		{#if stale}<p class="notice">{m.anon_stale()}</p>{/if}
		<label class="field-label" for="anon-restored">{m.anon_restored()}</label>
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
	/* tier colours: Art. 9 alone in wax, identifiers navy, numbers khaki, the rest ink */
	[data-tier] {
		--tier: var(--ink2);
		--tier-soft: var(--neutral-soft);

		&[data-tier='3'] {
			--tier: var(--wax);
			--tier-soft: var(--wax-soft);
		}

		&[data-tier='1'] {
			--tier: var(--navy);
			--tier-soft: var(--navy-soft);
		}

		&[data-tier='2'] {
			--tier: var(--khaki);
			--tier-soft: var(--khaki-soft);
		}
	}

	.card {
		margin-top: 1rem;
		padding: 1.25rem 1.5rem 1.5rem;

		@media (max-width: 40rem) {
			padding: 1rem;
		}

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
		display: block;
		margin: 1.25rem 0 0.4rem;
		font-size: 14px;
		font-weight: 600;
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

	/* rules beside the results on wide screens, above them otherwise */
	.work {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0 1rem;
		align-items: start;

		@media (min-width: 80rem) {
			grid-template-columns: minmax(14rem, 17rem) minmax(0, 1fr);
		}
	}

	.rules {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
		gap: 0 1.5rem;

		@media (min-width: 80rem) {
			grid-template-columns: minmax(0, 1fr);
		}

		& h2 {
			grid-column: 1 / -1;
		}

		& fieldset {
			display: grid;
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
	}

	.marked {
		margin: 0;
		font-size: 14px;
		line-height: 1.9;
		white-space: pre-wrap;
		overflow-wrap: anywhere;

		& .mark {
			padding: 0 0.15rem;
			font: inherit;
			color: var(--tier);
			background: var(--tier-soft);
			border: 0;
			border-bottom: 2px solid var(--tier);
			border-radius: 3px;
			cursor: pointer;

			&[aria-pressed='false'] {
				color: var(--ink3);
				background: none;
				border-bottom-style: dashed;
				border-bottom-color: var(--rule);
				text-decoration: line-through;
			}

			&:focus-visible {
				outline: 2px solid var(--navy);
				outline-offset: 1px;
			}
		}
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
