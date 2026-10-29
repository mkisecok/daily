<script lang="ts">
	import { afterNavigate, goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { toCsv } from '#lib/records/csv.js';
	import { stateLabel } from '#lib/records/format.js';
	import { applyListQuery, readListQuery, writeListQuery } from '#lib/records/listing.js';
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
	import type { FormValues } from '#lib/records/ui/inputs.js';
	import { fieldById, type ValidationErrors } from '#lib/records/validate.js';
	import { formatShortDate } from '#lib/i18n/date.js';
	import { text } from '#lib/tools/i18n.js';
	import { getRecordTool } from '#lib/tools/registry.js';
	import Citation from '#lib/tools/_shared/Citation.svelte';
	import StatusBadge from '#lib/tools/_shared/StatusBadge.svelte';
	import Verdict from '#lib/tools/_shared/Verdict.svelte';
	import ConfirmDialog from '#lib/ui/ConfirmDialog.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import Select from '#lib/ui/form/Select.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const store = getStore();
	const locale = getLocale();
	const slug = $derived(data.tool.slug);
	const engine = $derived(getRecordTool(slug)?.engine);
	const detail = $derived(data.view === 'detail' ? data.detail : undefined);
	const records = $derived(data.view === 'list' ? data.records : []);
	const archived = $derived(data.view === 'list' && data.archived);
	// search, status and order live in the URL; load does not read them, so typing does not reload
	const query = $derived(readListQuery(page.url.searchParams));
	const shown = $derived(applyListQuery(data.definition, records, query, locale, data.titles));
	const stateItems = $derived(
		(data.definition.workflow?.states ?? []).map((state) => ({
			value: state.id,
			label: text(state.label)
		}))
	);
	const assessment = $derived(detail ? (engine?.assess?.(detail.record) ?? null) : null);

	const listPath = $derived(localized(`/werkzeuge/${slug}/eintraege`));
	const archivePath = $derived(localized(`/werkzeuge/${slug}/eintraege?archiviert=1`));
	const recordPath = (id: string) => localized(`/werkzeuge/${slug}/eintraege?eintrag=${id}`);
	const referenceHref = (tool: string, id: string) =>
		localized(`/werkzeuge/${tool}/eintraege?eintrag=${id}`);

	let editing = $state(false);
	let confirmArchive = $state(false);
	let confirmClear = $state(false);
	let busy = $state(false);
	let errors = $state<ValidationErrors>({});
	/** the user's input after a version conflict, kept until saved or discarded */
	let draft = $state<FormValues | null>(null);
	/** feedback above the page: `alert` for failures, `status` for success */
	let message = $state<{ text: string; tone: 'status' | 'alert' } | null>(null);

	// a different list, record or form starts clean
	afterNavigate(({ from, to }) => {
		if (from?.url?.search === to?.url?.search) return;
		editing = false;
		confirmArchive = false;
		errors = {};
		draft = null;
		message = null;
	});

	function setQuery(change: Partial<typeof query>) {
		const params = writeListQuery(page.url.searchParams, { ...query, ...change });
		const search = params.toString();
		void goto(resolve(localized(`/werkzeuge/${slug}/eintraege${search ? `?${search}` : ''}`)), {
			replace: true,
			reset: false
		});
	}

	/** a header click sorts by that column, a second click reverses the order */
	function sortBy(key: string) {
		setQuery(
			query.sort === key
				? { descending: !query.descending }
				: { sort: key, descending: key === 'updated' }
		);
	}

	/** the message for a store error other than invalid input */
	function describe(result: Exclude<StoreError, { error: 'invalid' }>): string {
		switch (result.error) {
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

	/** shows a store error: invalid input next to its fields, anything else as an alert */
	function fail(result: StoreError) {
		if (result.error === 'invalid') {
			errors = result.errors;
			message = null;
		} else {
			message = { text: describe(result), tone: 'alert' };
		}
	}

	/** runs a store call; failures (network, full storage) become a message */
	async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
		busy = true;
		message = null;
		try {
			return await action();
		} catch {
			message = { text: m.records_failed(), tone: 'alert' };
			return undefined;
		} finally {
			busy = false;
		}
	}

	async function create(input: Record<string, unknown>) {
		const result = await run(() => store.create(slug, input));
		if (!result) return;
		if (!result.ok) {
			fail(result);
			return;
		}
		await goto(resolve(recordPath(result.value.id)));
	}

	async function save(record: StoredRecord, input: Record<string, unknown>, values: FormValues) {
		const result = await run(() => store.update(record.id, input, record.version));
		if (!result) return;
		if (result.ok) {
			errors = {};
			draft = null;
			editing = false;
			message = { text: m.records_saved(), tone: 'status' };
		} else {
			fail(result);
			// keep the input; the form reopens on the newer version with it
			if (result.error === 'conflict') draft = values;
		}
		await invalidate('records:data');
	}

	function loadNewest() {
		draft = null;
		message = null;
	}

	async function restore(record: StoredRecord) {
		const result = await run(() => store.unarchive(record.id));
		if (result?.ok) message = { text: m.records_restored(), tone: 'status' };
		else if (result) fail(result);
		await invalidate('records:data');
	}

	async function transition(record: StoredRecord, to: string) {
		const result = await run(() => store.transition(record.id, to, record.version));
		if (result && !result.ok) fail(result);
		await invalidate('records:data');
	}

	async function archive(record: StoredRecord) {
		const result = await run(() => store.archive(record.id));
		if (result?.ok) await goto(resolve(listPath));
		else if (result) fail(result);
	}

	function exportCsv() {
		const day = new Date().toISOString().slice(0, 10);
		downloadText(
			`${slug}-${day}.csv`,
			toCsv(data.definition, shown, locale, data.titles),
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
	{#if shown.length > 0}
		<button type="button" class="quiet" onclick={exportCsv}>{m.records_csv()}</button>
		<button type="button" class="quiet" onclick={() => window.print()}>{m.records_print()}</button>
	{/if}
	<a class="button quiet" href={resolve(archived ? listPath : archivePath)}>
		{archived ? m.records_show_current() : m.records_show_archived()}
	</a>
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
	<p class="message no-print" role={message.tone}>
		{message.text}
		{#if draft}
			<button type="button" class="quiet" onclick={loadNewest}>{m.records_load_newest()}</button>
		{/if}
	</p>
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
					{:else}
						<button type="button" disabled={busy} onclick={() => restore(record)}
							>{m.records_restore()}</button
						>
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
			{#key `${record.version}:${draft ? 'draft' : 'stored'}`}
				<RecordForm
					definition={data.definition}
					data={record.data}
					draft={draft ?? undefined}
					{errors}
					{busy}
					choices={data.choices}
					onsave={(input, values) => save(record, input, values)}
					oncancel={() => {
						editing = false;
						errors = {};
						draft = null;
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
		{#if archived}<h2 class="mode-title">{m.records_show_archived()}</h2>{/if}
		{#if records.length === 0}
			<p class="empty">{archived ? m.records_archive_empty() : m.records_empty()}</p>
		{:else}
			<div class="filters">
				<label class="search">
					<span class="visually-hidden">{m.records_search()}</span>
					<input
						type="search"
						value={query.search}
						placeholder={m.records_search()}
						oninput={(event) => setQuery({ search: event.currentTarget.value })}
					/>
				</label>
				{#if stateItems.length > 0}
					<div class="state-filter">
						<label for="filter-state">{m.records_state()}</label>
						<Select
							id="filter-state"
							value={query.status}
							items={stateItems}
							placeholder={m.records_state_all()}
							onchange={(value: string) => setQuery({ status: value })}
						/>
					</div>
				{/if}
				{#if shown.length !== records.length}
					<p class="count" role="status">
						{m.records_matches({ shown: shown.length, total: records.length })}
					</p>
				{/if}
			</div>
			{#if shown.length === 0}
				<p class="empty">{m.records_no_matches()}</p>
			{:else}
				<RecordTable
					definition={data.definition}
					records={shown}
					titles={data.titles}
					hrefFor={(r) => recordPath(r.id)}
					caption={text(data.tool.name)}
					sort={query.sort}
					descending={query.descending}
					onsort={sortBy}
				/>
			{/if}
		{/if}
	</section>
	{#if shown.length > 0}
		<PrintRegister
			definition={data.definition}
			records={shown}
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

	.message {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
	}

	/* search, state filter and the match count above the table */
	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.75rem 1rem;
		margin-top: 1rem;

		& .search {
			flex: 1 1 16rem;
			max-width: 26rem;

			& input {
				width: 100%;
			}
		}

		& .state-filter {
			display: grid;
			gap: 0.25rem;
			min-width: 12rem;

			& label {
				font-size: 13px;
				color: var(--ink2);
			}
		}

		& .count {
			font-size: 13px;
			color: var(--ink3);
		}

		& .visually-hidden {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
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
