<script lang="ts">
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { toIcs } from '#lib/records/ics.js';
	import DeadlineList from '#lib/records/ui/DeadlineList.svelte';
	import PrintDeadlines from '#lib/records/ui/PrintDeadlines.svelte';
	import { downloadText } from '#lib/records/ui/download.js';
	import Icon from '#lib/ui/Icon.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import PrintDocument from '#lib/ui/PrintDocument.svelte';
	import { formatShortDate } from '#lib/i18n/date.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const now = new Date();
	const locale = getLocale();

	function exportIcs() {
		downloadText(
			'daily-fristen.ics',
			toIcs(data.deadlines, getLocale()),
			'text/calendar;charset=utf-8'
		);
	}
</script>

<svelte:head>
	<title>{m.deadlines_title()} — Daily</title>
</svelte:head>

{#snippet actions()}
	{#if data.deadlines.length > 0}
		<button type="button" class="quiet no-print" onclick={() => window.print()}>
			<Icon name="printer" size={16} />{m.records_print()}
		</button>
		<button type="button" class="quiet no-print" onclick={exportIcs}>
			<Icon name="calendar" size={16} />{m.deadlines_ics()}
		</button>
	{/if}
{/snippet}

<PageHeader title={m.deadlines_title()} {actions} />

{#if data.preview}
	<p class="local no-print">
		<span class="icon"><Icon name="lock" /></span><span>{m.records_local()}</span>
	</p>
{/if}

<PrintDocument
	kind={m.print_kind_deadlines()}
	title={m.deadlines_title()}
	rows={[
		...(data.organisation
			? [{ label: m.print_organisation(), value: data.organisation.name }]
			: []),
		{ label: m.print_count(), value: String(data.deadlines.length) },
		{ label: m.print_created(), value: formatShortDate(now.toISOString(), locale) }
	]}
/>

<!-- on paper a table with dates; relative times like "in 3 Tagen" would be wrong a day later -->
<section class="print-body print-only">
	<PrintDeadlines deadlines={data.deadlines} {now} />
</section>

<div class="no-print">
	<DeadlineList
		deadlines={data.deadlines}
		{now}
		grouped
		hrefFor={(d) => localized(`/werkzeuge/${d.toolSlug}/eintraege?eintrag=${d.recordId}`)}
	/>
</div>

<style>
	/* a soft navy info card */
	.local {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		max-width: 100%;
		margin-bottom: 1.5rem;
		padding: 0.75rem 1rem;
		font-size: 14px;
		background: var(--navy-soft);
		border: 1px solid var(--navy-soft);
		border-radius: var(--radius-card);

		& .icon {
			display: inline-flex;
			color: var(--navy);
		}
	}
</style>
