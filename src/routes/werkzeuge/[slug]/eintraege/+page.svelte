<script lang="ts">
	import { afterNavigate, goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { toCsv } from '#lib/records/csv.js';
	import { stateLabel } from '#lib/records/format.js';
	import { getStore } from '#lib/records/store/index.js';
	import type { StoreError } from '#lib/records/store/types.js';
	import type { StoredRecord } from '#lib/records/types.js';
	import DeadlineList from '#lib/records/ui/DeadlineList.svelte';
	import { downloadText } from '#lib/records/ui/download.js';
	import PrintRegister from '#lib/records/ui/PrintRegister.svelte';
	import RecordForm from '#lib/records/ui/RecordForm.svelte';
	import RecordHistory from '#lib/records/ui/RecordHistory.svelte';
	import RecordLinks from '#lib/records/ui/RecordLinks.svelte';
	import RecordTable from '#lib/records/ui/RecordTable.svelte';
	import RecordView from '#lib/records/ui/RecordView.svelte';
	import StateBar from '#lib/records/ui/StateBar.svelte';
	import { fieldById, type ValidationErrors } from '#lib/records/validate.js';
	import { formatShortDate } from '#lib/i18n/date.js';
	import { text } from '#lib/tools/i18n.js';
	import { getRecordTool } from '#lib/tools/registry.js';
	import Citation from '#lib/tools/_shared/Citation.svelte';
	import StatusBadge from '#lib/tools/_shared/StatusBadge.svelte';
	import Verdict from '#lib/tools/_shared/Verdict.svelte';
	import ConfirmDialog from '#lib/ui/ConfirmDialog.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const store = getStore();
	const locale = getLocale();
	const slug = $derived(data.tool.slug);
	const engine = $derived(getRecordTool(slug)?.engine);
	const detail = $derived(data.view === 'detail' ? data.detail : undefined);
	const records = $derived(data.view === 'list' ? data.records : []);
	const assessment = $derived(detail ? (engine?.assess?.(detail.record) ?? null) : null);

	const listPath = $derived(localized(`/werkzeuge/${slug}/eintraege`));
	const recordPath = (id: string) => localized(`/werkzeuge/${slug}/eintraege?eintrag=${id}`);
	const referenceHref = (tool: string, id: string) =>
		localized(`/werkzeuge/${tool}/eintraege?eintrag=${id}`);

	let editing = $state(false);
	let confirmArchive = $state(false);
	let confirmClear = $state(false);
	let busy = $state(false);
	let errors = $state<ValidationErrors>({});
	let message = $state<string | null>(null);

	// a different list, record or form starts clean
	afterNavigate(({ from, to }) => {
		if (from?.url?.search === to?.url?.search) return;
		editing = false;
		confirmArchive = false;
		errors = {};
		message = null;
	});

	/** the message for a store error; validation errors show in the form instead */
	function describe(result: StoreError): string | null {
		switch (result.error) {
			case 'invalid':
				errors = result.errors;
				return null;
			case 'conflict':
				return m.records_conflict();
			case 'missing':
				return m.records_missing({
					fields: result.missing
						.map((id) => {
							const field = fieldById(data.definition, id);
							return field ? text(field.label) : id;
						})
						.join(', ')
				});
			case 'blocked':
				return text(result.reason);
			default:
				return m.records_not_allowed();
		}
	}

	/** runs a store call; failures (network, full storage) become a message */
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

	async function create(input: Record<string, unknown>) {
		const result = await run(() => store.create(slug, input));
		if (!result) return;
		if (!result.ok) {
			message = describe(result);
			return;
		}
		await goto(resolve(recordPath(result.value.id)));
	}

	async function save(record: StoredRecord, input: Record<string, unknown>) {
		const result = await run(() => store.update(record.id, input, record.version));
		if (!result) return;
		if (result.ok) {
			errors = {};
			editing = false;
			message = m.records_saved();
		} else {
			message = describe(result);
			if (result.error === 'conflict') editing = false;
		}
		await invalidate('records:data');
	}

	async function transition(record: StoredRecord, to: string) {
		const result = await run(() => store.transition(record.id, to, record.version));
		if (result && !result.ok) message = describe(result);
		await invalidate('records:data');
	}

	async function archive(record: StoredRecord) {
		const result = await run(() => store.archive(record.id));
		if (result?.ok) await goto(resolve(listPath));
		else if (result) message = describe(result);
	}

	function exportCsv() {
		const day = new Date().toISOString().slice(0, 10);
		downloadText(
			`${slug}-${day}.csv`,
			toCsv(data.definition, records, locale, data.titles),
			'text/csv;charset=utf-8'
		);
	}

	async function clearLocal() {
		store.clear?.();
		await invalidate('records:data');
	}
</script>

<svelte:head>
	<title>{text(data.tool.name)} — Daily</title>
	<meta name="description" content={text(data.tool.summary)} />
</svelte:head>

{#snippet toolMeta()}
	<p class="tool-meta">
		<StatusBadge status={data.tool.status} />
		{#each data.tool.legalBasis as basis (basis.law + basis.ref)}
			<span class="sep" aria-hidden="true">·</span>
			<Citation {basis} />
		{/each}
	</p>
{/snippet}

{#snippet listActions()}
	<a class="button" href={resolve(localized(`/werkzeuge/${slug}/eintraege?neu=1`))}>
		{m.records_new()}
	</a>
	{#if records.length > 0}
		<button type="button" class="quiet" onclick={exportCsv}>{m.records_csv()}</button>
		<button type="button" class="quiet" onclick={() => window.print()}>{m.records_print()}</button>
	{/if}
{/snippet}

<div class="no-print">
	<PageHeader
		title={text(data.tool.name)}
		trail={[{ label: m.nav_tools(), path: localized('/werkzeuge') }]}
		description={data.view === 'list' ? text(data.definition.intro) : undefined}
		meta={toolMeta}
		actions={data.view === 'list' ? listActions : undefined}
	/>
</div>

{#if data.preview}
	<aside class="local no-print">
		<span class="icon"><Icon name="lock" /></span>
		<p>{m.records_local()}</p>
		<p class="toolbar">
			<button type="button" class="quiet" onclick={() => (confirmClear = true)}>
				{m.records_local_clear()}
			</button>
		</p>
		<ConfirmDialog
			bind:open={confirmClear}
			title={m.records_local_clear_title()}
			body={m.records_local_clear_confirm()}
			confirmLabel={m.records_local_clear()}
			tone="danger"
			icon="trash"
			typeToConfirm={m.records_local_clear_word()}
			onconfirm={clearLocal}
		/>
	</aside>
{/if}

{#if message}
	<p class="message no-print" role="status">{message}</p>
{/if}

{#if data.view === 'new'}
	<h2 class="mode-title">{m.records_new()}</h2>
	<RecordForm
		definition={data.definition}
		{errors}
		{busy}
		choices={data.choices}
		onsave={create}
		oncancel={() => goto(resolve(listPath))}
	/>
{:else if data.view === 'detail'}
	{#if !detail}
		<p class="quiet-text">{m.records_not_found()}</p>
		<p class="toolbar"><a class="button quiet" href={resolve(listPath)}>{m.records_back()}</a></p>
	{:else}
		{@const record = detail.record}
		<header class="record-head">
			<div class="heading">
				<h2>{record.title}</h2>
				{#if data.definition.workflow}
					<span class="badge navy">{stateLabel(data.definition, record.state, locale)}</span>
				{/if}
				{#if record.archivedAt}
					<span class="archived badge wax">
						{m.records_archived({ date: formatShortDate(record.archivedAt, locale) })}
					</span>
				{/if}
			</div>
			{#if !editing}
				<div class="toolbar actions no-print">
					{#if !record.archivedAt}
						<button type="button" onclick={() => (editing = true)}>{m.records_edit()}</button>
					{/if}
					<button type="button" class="quiet" onclick={() => window.print()}
						>{m.records_print()}</button
					>
					<a class="button quiet" href={resolve(listPath)}>{m.records_back()}</a>
					<a
						class="button quiet"
						href={resolve(
							localized(
								`/notizen?neu=1&titel=${encodeURIComponent(record.title)}&quelle=${encodeURIComponent(`/werkzeuge/${slug}/eintraege?eintrag=${record.id}`)}`
							)
						)}>{m.notes_from_record()}</a
					>
					{#if !record.archivedAt}
						<button
							type="button"
							class="quiet"
							disabled={busy}
							onclick={() => (confirmArchive = true)}
						>
							{m.records_archive()}
						</button>
						<ConfirmDialog
							bind:open={confirmArchive}
							title={m.records_archive_title()}
							body={m.records_archive_confirm()}
							confirmLabel={m.records_archive()}
							tone="danger"
							icon="archive"
							typeToConfirm={m.records_archive_word()}
							onconfirm={() => archive(record)}
						/>
					{/if}
				</div>
			{/if}
		</header>

		{#if editing}
			{#key record.version}
				<RecordForm
					definition={data.definition}
					data={record.data}
					{errors}
					{busy}
					choices={data.choices}
					onsave={(input) => save(record, input)}
					oncancel={() => {
						editing = false;
						errors = {};
					}}
				/>
			{/key}
		{:else}
			{#if data.definition.workflow}
				<StateBar
					events={detail.events}
					definition={data.definition}
					{record}
					{busy}
					ontransition={(to) => transition(record, to)}
				/>
			{/if}

			{#if detail.deadlines.length > 0}
				<section class="deadlines">
					<h2 class="eyebrow">{m.deadlines_title()}</h2>
					<DeadlineList
						deadlines={detail.deadlines}
						hrefFor={(d) => recordPath(d.recordId)}
						showTool={false}
					/>
				</section>
			{/if}

			{#if assessment}
				<Verdict result={assessment} />
			{/if}

			<RecordView
				definition={data.definition}
				{record}
				titles={data.titles}
				{referenceHref}
				assessHref={(field) =>
					localized(`/werkzeuge/${field.tool}/pruefen?fuer=${slug}:${record.id}:${field.id}`)}
			/>

			{#each data.composed as part (part.record.id)}
				<section class="composed">
					<h2 class="eyebrow">{m.records_composed()}</h2>
					<h3>
						{text(part.tool.manifest.name)}:
						<a href={resolve(referenceHref(part.tool.manifest.slug, part.record.id))}
							>{part.record.title}</a
						>
					</h3>
					<RecordView definition={part.tool.definition} record={part.record} />
					{#each part.backlinks as group (group.tool.manifest.slug)}
						<h3>{text(group.tool.manifest.name)} ({group.records.length})</h3>
						{#each group.records as item (item.id)}
							<article class="composed-record">
								<h4>
									{item.title}{#if group.tool.definition.workflow}
										<span class="composed-state badge navy"
											>{stateLabel(group.tool.definition, item.state, locale)}</span
										>{/if}
								</h4>
								<RecordView
									definition={group.tool.definition}
									record={item}
									titles={{ [part.record.id]: part.record.title }}
								/>
							</article>
						{/each}
					{/each}
				</section>
			{/each}

			{#if data.backlinks.length > 0}
				<RecordLinks backlinks={data.backlinks} hrefFor={referenceHref} />
			{/if}

			<RecordHistory definition={data.definition} events={detail.events} titles={data.titles} />
		{/if}
	{/if}
{:else}
	<section class="list no-print">
		{#if records.length === 0}
			<p class="empty">{m.records_empty()}</p>
		{:else}
			<RecordTable
				definition={data.definition}
				{records}
				titles={data.titles}
				hrefFor={(r) => recordPath(r.id)}
			/>
		{/if}
	</section>
	{#if records.length > 0}
		<PrintRegister
			definition={data.definition}
			{records}
			title={data.tool.name}
			titles={data.titles}
			organisation={data.organisation?.name}
		/>
	{/if}
{/if}

<style>
	.tool-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.6rem;
		margin-top: 0.75rem;

		& .sep {
			color: var(--ink3);
		}
	}

	/* soft navy info cards: the preview notice and status messages */
	.local,
	.message {
		margin-bottom: 1.5rem;
		padding: 0.75rem 1rem;
		font-size: 14px;
		background: var(--navy-soft);
		border: 1px solid var(--navy-soft);
		border-radius: var(--radius-card);
	}

	.local {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1rem;

		& .icon {
			display: inline-flex;
			color: var(--navy);
		}

		& p {
			flex: 1 1 16rem;
			min-width: 0;
			max-width: var(--measure);
		}

		& .toolbar {
			flex: 0 1 auto;
		}
	}

	.mode-title {
		font-size: clamp(22px, 2.6vw, 26px);
	}

	.record-head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem 2rem;

		& .heading {
			display: flex;
			flex: 1 1 18rem;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.5rem 0.75rem;
			min-width: 0;

			& h2 {
				font-size: clamp(22px, 2.6vw, 26px);
				overflow-wrap: anywhere;
			}
		}

		& .actions {
			flex: 0 1 auto;
			justify-content: flex-end;

			@media (max-width: 40rem) {
				flex: 1 1 100%;
				justify-content: flex-start;
			}
		}
	}

	.deadlines {
		margin-top: 2rem;
	}

	.composed {
		margin-top: 2.5rem;

		& h3 {
			margin-top: 1.5rem;
			font-size: 18px;
		}

		& .composed-record {
			margin-top: 1.5rem;
			break-inside: avoid;

			& h4 {
				font-size: 16px;

				& .composed-state {
					margin-left: 0.5rem;
					font-family: var(--sans);
					vertical-align: 0.1em;
				}
			}
		}
	}

	.quiet-text,
	.empty {
		margin-top: 1.5rem;
		font-size: 14px;
		color: var(--ink3);
	}

	.empty {
		padding: 2rem 1.25rem;
		text-align: center;
		background: var(--sheet);
		border: 1px dashed var(--rule);
		border-radius: var(--radius-card);
	}
</style>
