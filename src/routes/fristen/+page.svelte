<script lang="ts">
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { toIcs } from '#lib/records/ics.js';
	import DeadlineList from '#lib/records/ui/DeadlineList.svelte';
	import { downloadText } from '#lib/records/ui/download.js';
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

<header class="head">
	<h1>{m.deadlines_title()}</h1>
	{#if data.preview}<p class="local">{m.records_local()}</p>{/if}
</header>

{#if data.deadlines.length > 0}
	<p class="toolbar no-print">
		<button type="button" class="quiet" onclick={exportIcs}>{m.deadlines_ics()}</button>
	</p>
{/if}

<DeadlineList
	deadlines={data.deadlines}
	{now}
	hrefFor={(d) => localized(`/werkzeuge/${d.toolSlug}/eintraege?eintrag=${d.recordId}`)}
/>

<style>
	.head {
		padding: 2.5rem 0 1rem;
		border-bottom: 2px solid var(--ink);

		& h1 {
			font-size: clamp(28px, 4vw, 40px);
		}

		& .local {
			margin-top: 0.75rem;
			font-size: 14px;
			color: var(--ink2);
			max-width: var(--measure);
		}
	}

	.toolbar {
		margin-top: 1.25rem;
	}
</style>
