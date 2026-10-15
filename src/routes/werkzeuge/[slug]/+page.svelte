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
	<p class="action">
		{#if recordTool}
			<!-- records live on their own page; saving is built in -->
			<a class="start" href={recordsHref}>{m.records_open()} →</a>
		{:else}
			<a class="start" href={checkHref}>{m.tool_start()} →</a>
		{/if}
		{#if PUBLIC_PREVIEW || recordTool}
			<!-- no accounts in the static preview; record tools save on their own page -->
		{:else if data.user}
			<a class="secondary" href={saveHref}>{m.tool_save()}</a>
		{:else}
			<a class="secondary" href={loginHref} data-sveltekit-reload>{m.tool_save_login()}</a>
		{/if}
	</p>
</section>

{#if data.user && !recordTool}
	<section class="runs">
		<h2 class="eyebrow">{m.tool_runs()}</h2>
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
		padding: 2rem 0;
		border-bottom: 1px solid var(--rule);

		& .lead {
			font-size: 17px;
			color: var(--ink2);
		}

		& p + p {
			margin-top: 1rem;
		}

		& .action {
			display: flex;
			flex-wrap: wrap;
			align-items: baseline;
			gap: 1.5rem;
			margin-top: 1.75rem;

			& .secondary {
				font-family: var(--mono);
				font-size: 12px;
				letter-spacing: 0.08em;
				text-transform: uppercase;
			}

			& .start {
				font-family: var(--mono);
				font-size: 12px;
				letter-spacing: 0.08em;
				text-transform: uppercase;
				padding: 0.5rem 0.9rem;
				border: 1px solid var(--navy);

				&:hover {
					background: var(--navy-soft);
					text-decoration: none;
				}
			}
		}
	}

	.runs {
		padding: 2rem 0;

		& .empty {
			margin-top: 0.75rem;
			color: var(--ink3);
		}

		& table {
			margin-top: 0.75rem;
			border-collapse: collapse;
			width: 100%;
			max-width: 40rem;
			font-size: 14px;

			& th {
				text-align: left;
				font-family: var(--mono);
				font-size: 11px;
				letter-spacing: 0.12em;
				text-transform: uppercase;
				font-weight: 500;
				color: var(--ink3);
				padding: 0.4rem 0;
				border-bottom: 1px solid var(--rule);
			}

			& td {
				padding: 0.55rem 0;
				border-bottom: 1px solid var(--rule2);
				font-variant-numeric: tabular-nums;
			}

			& .result {
				font-family: var(--serif);

				&[data-level='positive'] {
					color: var(--wax);
				}

				&[data-level='negative'] {
					color: var(--khaki);
				}
			}
		}
	}
</style>
