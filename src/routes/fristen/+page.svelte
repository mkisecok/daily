<script lang="ts">
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { toIcs } from '#lib/records/ics.js';
	import DeadlineList from '#lib/records/ui/DeadlineList.svelte';
	import { downloadText } from '#lib/records/ui/download.js';
	import Icon from '#lib/ui/Icon.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const now = new Date();

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

<DeadlineList
	deadlines={data.deadlines}
	{now}
	grouped
	hrefFor={(d) => localized(`/werkzeuge/${d.toolSlug}/eintraege?eintrag=${d.recordId}`)}
/>

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
