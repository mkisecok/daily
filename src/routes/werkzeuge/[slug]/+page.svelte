<script lang="ts">
	import { PUBLIC_PREVIEW } from '$app/env/public';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { formatShortDate } from '#lib/i18n/date.js';
	import { localized } from '#lib/i18n/links.js';
	import { text } from '#lib/tools/i18n.js';
	import { getQuestionnaire, getRecordTool } from '#lib/tools/registry.js';
	import ToolHeader from '#lib/tools/_shared/ToolHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const questionnaire = $derived(getQuestionnaire(data.tool.slug));
	const recordTool = $derived(getRecordTool(data.tool.slug));
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

{#if data.user && !recordTool}
	<section class="runs card">
		<h2>{m.tool_runs()}</h2>
		{#if data.runs.length === 0}
			<p class="empty">{m.tool_runs_empty()}</p>
		{:else}
			<table>
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
		padding: 1.25rem 1.25rem 0.5rem;

		& h2 {
			font-size: 18px;
		}

		& .empty {
			margin: 0.5rem 0 0.75rem;
			color: var(--ink3);
		}

		& table {
			width: 100%;
			margin-top: 0.75rem;
			border-collapse: collapse;
			font-size: 14px;

			& th {
				padding: 0.4rem 1rem 0.4rem 0;
				font-size: 12px;
				font-weight: 600;
				text-align: left;
				color: var(--ink3);
				border-bottom: 1px solid var(--rule2);
			}

			& td {
				padding: 0.7rem 1rem 0.7rem 0;
				font-variant-numeric: tabular-nums;
				border-bottom: 1px solid var(--rule2);
			}

			& tr:last-child td {
				border-bottom: 0;
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
					color: var(--khaki);
				}
			}
		}
	}
</style>
