<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import RecordForm from '#lib/records/ui/RecordForm.svelte';
	import { getStore } from '#lib/records/store/index.js';
	import type { ValidationErrors } from '#lib/records/validate.js';
	import Backup from '#lib/organisation/Backup.svelte';
	import { ORGANISATION } from '#lib/organisation/tool.js';
	import { text } from '#lib/tools/i18n.js';
	import Icon from '#lib/ui/Icon.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let busy = $state(false);
	let errors = $state<ValidationErrors>({});
	let message = $state<string | null>(null);

	const backHref = $derived(
		data.back ? resolve(localized(`/werkzeuge/${data.back}`)) : resolve(localized('/werkzeuge'))
	);

	async function save(input: Record<string, unknown>) {
		busy = true;
		message = null;
		try {
			const store = getStore();
			const result = data.record
				? await store.update(data.record.id, input, data.record.version)
				: await store.create(ORGANISATION, input);
			if (result.ok) {
				errors = {};
				message = m.records_saved();
				await invalidate('records:data');
			} else if (result.error === 'invalid') {
				errors = result.errors;
				message = m.records_errors();
			} else {
				message = result.error === 'conflict' ? m.records_conflict() : m.records_failed();
			}
		} catch {
			message = m.records_failed();
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>{m.organisation_title()} — Daily</title>
</svelte:head>

<PageHeader
	title={m.organisation_title()}
	trail={[{ label: m.nav_tools(), path: localized('/werkzeuge') }]}
	description={text(data.definition.intro)}
/>

{#if data.preview}
	<aside class="local">
		<span class="icon"><Icon name="lock" /></span>
		<p>{m.records_local()}</p>
	</aside>
{/if}

{#if message}
	<p class="notice" role="status">
		{message}
		{#if data.back && message === m.records_saved()}
			<a href={backHref}>{m.organisation_back()} →</a>
		{/if}
	</p>
{/if}

{#key data.record?.version}
	<RecordForm
		definition={data.definition}
		data={data.record?.data ?? {}}
		version={data.record?.version}
		{errors}
		{busy}
		onsave={save}
		oncancel={() => history.back()}
	/>
{/key}

<Backup workspace={data.organisation?.name} preview={data.preview} />

<style>
	.local {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		margin-bottom: 1.25rem;
		padding: 0.75rem 1rem;
		font-size: 14px;
		background: var(--sheet);
		border: 1px solid var(--rule);
		border-radius: var(--radius);
	}

	.notice {
		margin-bottom: 1rem;
		font-weight: 500;

		& a {
			margin-left: 0.5rem;
		}
	}
</style>
