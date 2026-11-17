<script lang="ts">
	import { PUBLIC_PREVIEW } from '$app/env/public';
	import { onMount } from 'svelte';
	import { loadDetails } from '#lib/organisation/load.js';
	import type { Details } from '#lib/organisation/slots.js';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { formatShortDate } from '#lib/i18n/date.js';
	import { localized } from '#lib/i18n/links.js';
	import { text } from '#lib/tools/i18n.js';
	import { getLesson, getQuestionnaire, getRecordTool } from '#lib/tools/registry.js';
	import LessonHandout from '#lib/tools/_shared/LessonHandout.svelte';
	import LessonOverview from '#lib/tools/_shared/LessonOverview.svelte';
	import ToolHeader from '#lib/tools/_shared/ToolHeader.svelte';
	import PrintDocument from '#lib/ui/PrintDocument.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const questionnaire = $derived(getQuestionnaire(data.tool.slug));
	const recordTool = $derived(getRecordTool(data.tool.slug));
	const lesson = $derived(getLesson(data.tool.slug));

	/** the organisation's details a lesson shows; they live in the store, so only the browser has them */
	let details = $state<Details>({});
	onMount(() => {
		if (!getLesson(data.tool.slug)) return;
		(async () => {
			details = (await loadDetails()).details;
		})();
	});
	const recordsHref = $derived(resolve(localized(`/werkzeuge/${data.tool.slug}/eintraege`)));
	const checkHref = $derived(resolve(localized(`/werkzeuge/${data.tool.slug}/pruefen`)));
	const saveHref = $derived(resolve(localized(`/werkzeuge/${data.tool.slug}/neu`)));
	const loginHref = $derived(
		resolve(localized(`/auth/login?next=${encodeURIComponent(saveHref)}`))
	);
</script>

<svelte:head>
	<title>{text(data.tool.name)} — Daily</title>
	<meta name="description" content={text(data.tool.summary)} />
</svelte:head>

<ToolHeader tool={data.tool} />

{#if lesson}
	<PrintDocument
		letter
		kind={m.print_kind_handout()}
		title={text(data.tool.name)}
		rows={[
			{ label: m.lesson_audience(), value: text(lesson.audience) },
			{ label: m.lesson_length(), value: m.lesson_minutes({ minutes: String(lesson.minutes) }) },
			{ label: m.lesson_version(), value: String(lesson.version) }
		]}
	/>
	<LessonOverview tool={data.tool} {lesson} {details} />
	<LessonHandout {lesson} {details} />
{:else}
	<section class="intro">
		<p class="measure lead">{text(data.tool.summary)}</p>
		{#if questionnaire}
			<p class="measure">{text(questionnaire.catalog.intro)}</p>
		{:else if recordTool}
			<p class="measure">{text(recordTool.definition.intro)}</p>
		{/if}
		<div class="toolbar action">
			{#if recordTool}
				<!-- records live on their own page; saving is built in -->
				<a class="button" href={recordsHref}>{m.records_open()} →</a>
			{:else}
				<a class="button" href={checkHref}>{m.tool_start()} →</a>
			{/if}
			{#if PUBLIC_PREVIEW || recordTool}
				<!-- no accounts in the static preview; record tools save on their own page -->
			{:else if data.user}
				<a class="button quiet" href={saveHref}>{m.tool_save()}</a>
			{:else}
				<a class="button quiet" href={loginHref} data-sveltekit-reload>{m.tool_save_login()}</a>
			{/if}
		</div>
	</section>
{/if}

{#if data.user && !recordTool && !lesson}
	<section class="runs card">
		<h2>{m.tool_runs()}</h2>
		{#if data.runs.length === 0}
			<p class="empty">{m.tool_runs_empty()}</p>
		{:else}
			<table class="daily-table flush">
				<thead>
					<tr>
						<th>{m.col_date()}</th>
						<th>{m.col_result()}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.runs as run (run.id)}
						<tr>
							<td>
								<a href={resolve(localized(`/werkzeuge/${data.tool.slug}/${run.id}`))}>
									{formatShortDate(run.createdAt.toISOString(), data.locale)}
								</a>
							</td>
							<td class="result" data-level={run.verdict}>
								{run.headline ? text(run.headline) : '—'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>
{/if}

<style>
	.intro {
		padding-bottom: 2rem;

		& .lead {
			font-size: 17px;
			color: var(--ink2);
		}

		& p + p {
			margin-top: 1rem;
		}

		& .action {
			margin-top: 1.5rem;
		}
	}

	/* earlier runs as rows in a raised card */
	.runs {
		max-width: 44rem;
		padding-bottom: 0.5rem;

		& h2 {
			font-size: 18px;
		}

		& .empty {
			margin: 0.5rem 0 0.75rem;
			color: var(--ink3);
		}

		& table {
			margin-top: 0.75rem;

			& td {
				font-variant-numeric: tabular-nums;
			}

			& .result {
				font-family: var(--serif);
				font-size: 15px;

				&[data-level='positive'] {
					color: var(--wax);
				}

				&[data-level='conditional'] {
					color: var(--navy);
				}

				&[data-level='negative'] {
					color: var(--primary);
				}
			}
		}
	}
</style>
