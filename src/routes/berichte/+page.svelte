<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { formatLongDate, formatShortDate } from '#lib/i18n/date.js';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { ReportKind } from '#lib/reports/compose.js';
	import DeadlineList from '#lib/records/ui/DeadlineList.svelte';
	import { text } from '#lib/tools/i18n.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const locale = getLocale();
	const KIND_LABEL: Record<ReportKind, () => string> = {
		gesamt: m.reports_kind_gesamt,
		datenschutz: m.reports_kind_datenschutz,
		ki: m.reports_kind_ki,
		audit: m.reports_kind_audit
	};

	let preface = $state('');
	let outlook = $state('');

	const day = (iso: string) => formatShortDate(`${iso}T12:00:00.000Z`, locale);
	const recordPath = (slug: string, id: string) =>
		localized(`/werkzeuge/${slug}/eintraege?eintrag=${id}`);

	/** settings live in the URL, so a report can be reloaded and shared */
	function update(change: { art?: string; von?: string; bis?: string }) {
		const next = { art: data.kind, von: data.period.from, bis: data.period.to, ...change };
		goto(resolve(localized(`/berichte?art=${next.art}&von=${next.von}&bis=${next.bis}`)), {
			replace: true,
			reset: false
		});
	}
</script>

<svelte:head>
	<title>{m.nav_reports()} — Daily</title>
</svelte:head>

<header class="head no-print">
	<h1>{m.nav_reports()}</h1>
	<p class="measure intro">{m.reports_intro()}</p>
</header>

<form class="settings no-print" onsubmit={(e) => e.preventDefault()}>
	<label>
		<span>{m.reports_kind()}</span>
		<select value={data.kind} onchange={(e) => update({ art: e.currentTarget.value })}>
			{#each Object.entries(KIND_LABEL) as [value, label] (value)}
				<option {value}>{label()}</option>
			{/each}
		</select>
	</label>
	<label>
		<span>{m.reports_from()}</span>
		<input
			type="date"
			value={data.period.from}
			onchange={(e) => update({ von: e.currentTarget.value })}
		/>
	</label>
	<label>
		<span>{m.reports_to()}</span>
		<input
			type="date"
			value={data.period.to}
			onchange={(e) => update({ bis: e.currentTarget.value })}
		/>
	</label>
	<label class="wide">
		<span>{m.reports_preface()}</span>
		<textarea rows="3" bind:value={preface}></textarea>
	</label>
	<label class="wide">
		<span>{m.reports_outlook()}</span>
		<textarea rows="3" bind:value={outlook}></textarea>
	</label>
	<p class="toolbar wide">
		<button type="button" onclick={() => window.print()}>{m.reports_print()}</button>
	</p>
</form>

<article class="report">
	<header class="cover">
		<p class="eyebrow">Daily</p>
		<h2>{KIND_LABEL[data.kind]()}</h2>
		<p>{m.reports_period({ from: day(data.period.from), to: day(data.period.to) })}</p>
		{#if data.organisation}<p>{m.reports_organisation({ name: data.organisation.name })}</p>{/if}
		<p class="generated">
			{m.reports_generated({ date: formatLongDate(new Date().toISOString(), locale) })}
		</p>
	</header>

	{#if preface.trim()}
		<section class="free">
			<h3>{m.reports_preface()}</h3>
			<p>{preface}</p>
		</section>
	{/if}

	{#if data.report}
		{@const report = data.report}
		<section>
			<h3>{m.reports_registers()}</h3>
			{#if report.sections.length === 0}
				<p class="quiet-text">{m.reports_empty()}</p>
			{/if}
			{#each report.sections as section (section.slug)}
				<div class="tool">
					<h4>{text(section.name)}</h4>
					<p class="summary">
						{m.reports_summary({
							total: section.total,
							created: section.created,
							updated: section.updated
						})}
					</p>
					{#if section.states.length > 0}
						<p class="row">
							<span class="eyebrow">{m.reports_status()}</span>
							{#each section.states as state (state.label)}
								<span class:terminal={state.terminal}>{state.label}: {state.count}</span>
							{/each}
						</p>
					{/if}
					{#if section.outcomes.length > 0}
						<ul class="outcomes">
							{#each section.outcomes as outcome (outcome.verdict + outcome.headline.de)}
								<li data-level={outcome.verdict}>
									{text(outcome.headline)} <strong>{outcome.count}</strong>
								</li>
							{/each}
						</ul>
					{/if}
					{#if section.items.length > 0}
						<details open>
							<summary>{m.reports_entries()} ({section.items.length})</summary>
							<ul class="items">
								{#each section.items as item (item.id)}
									<li>
										<a href={resolve(recordPath(section.slug, item.id))}>{item.title}</a>
										{#if item.state}<span class="state">{item.state}</span>{/if}
										<span class="date">{formatShortDate(item.updatedAt, locale)}</span>
									</li>
								{/each}
							</ul>
						</details>
					{/if}
				</div>
			{/each}
		</section>

		<section>
			<h3>{m.reports_runs()}</h3>
			{#if data.preview}
				<p class="quiet-text">{m.reports_runs_preview()}</p>
			{:else if report.runs.length === 0}
				<p class="quiet-text">{m.reports_empty()}</p>
			{:else}
				{#each report.runs as run (run.slug)}
					<div class="tool">
						<h4>
							{text(run.name)}
							<span class="count">{m.reports_runs_count({ count: run.count })}</span>
						</h4>
						<ul class="outcomes">
							{#each run.outcomes as outcome (outcome.verdict + outcome.headline.de)}
								<li data-level={outcome.verdict}>
									{text(outcome.headline)} <strong>{outcome.count}</strong>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			{/if}
		</section>

		{#if report.deadlines.overdue.length > 0}
			<section>
				<h3>{m.reports_deadlines_overdue()}</h3>
				<DeadlineList
					deadlines={report.deadlines.overdue}
					hrefFor={(d) => recordPath(d.toolSlug, d.recordId)}
				/>
			</section>
		{/if}
		{#if report.deadlines.upcoming.length > 0}
			<section>
				<h3>{m.reports_deadlines_upcoming()}</h3>
				<DeadlineList
					deadlines={report.deadlines.upcoming}
					hrefFor={(d) => recordPath(d.toolSlug, d.recordId)}
				/>
			</section>
		{/if}
	{/if}

	{#if outlook.trim()}
		<section class="free">
			<h3>{m.reports_outlook()}</h3>
			<p>{outlook}</p>
		</section>
	{/if}
</article>

<style>
	.head {
		padding: 2.5rem 0 1rem;
		border-bottom: 2px solid var(--ink);

		& h1 {
			font-size: clamp(28px, 4vw, 40px);
		}

		& .intro {
			margin-top: 0.75rem;
			font-size: 15px;
			color: var(--ink2);
		}
	}

	.settings {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem 1.5rem;
		margin-top: 1.5rem;
		max-width: var(--measure);

		& label span {
			display: block;
			font-family: var(--serif);
			font-size: 14px;
		}

		& select,
		& input,
		& textarea {
			margin-top: 0.3rem;
			padding: 0.45rem 0.6rem;
			font: inherit;
			font-size: 14px;
			color: var(--ink);
			background: var(--sheet);
			border: 1px solid var(--rule);
		}

		& .wide {
			flex: 1 1 100%;

			& textarea {
				width: 100%;
			}
		}
	}

	.report {
		margin-top: 2.5rem;
		border-top: 2px solid var(--ink);

		@media print {
			margin-top: 0;
			border-top: 0;
		}

		& .cover {
			padding: 1.5rem 0;
			border-bottom: 1px solid var(--rule);

			& h2 {
				margin: 0.3rem 0 0.5rem;
				font-size: clamp(26px, 3.5vw, 34px);
			}

			& p {
				font-size: 15px;
			}

			& .generated {
				margin-top: 0.4rem;
				font-size: 13px;
				color: var(--ink3);
			}
		}

		& section {
			padding-top: 1.75rem;

			& h3 {
				font-size: 20px;
				padding-bottom: 0.4rem;
				border-bottom: 1px solid var(--rule);
			}

			&.free p {
				margin-top: 0.75rem;
				max-width: var(--measure);
				white-space: pre-line;
				font-family: var(--serif);
				font-size: 16px;
			}

			& .tool {
				padding: 1rem 0;
				border-bottom: 1px solid var(--rule2);
				break-inside: avoid;

				& h4 {
					font-size: 17px;
				}

				& .summary,
				& .count {
					font-size: 13px;
					color: var(--ink2);
				}

				& .row {
					display: flex;
					flex-wrap: wrap;
					gap: 0.3rem 1rem;
					align-items: baseline;
					margin-top: 0.5rem;
					font-size: 14px;

					& .terminal {
						color: var(--khaki);
					}
				}

				& .outcomes {
					list-style: none;
					margin-top: 0.5rem;
					font-family: var(--serif);
					font-size: 15px;

					& li[data-level='positive'] {
						color: var(--wax);
					}

					& li[data-level='conditional'] {
						color: var(--navy);
					}

					& li[data-level='negative'] {
						color: var(--khaki);
					}

					& strong {
						margin-left: 0.4rem;
						font-family: var(--mono);
						font-size: 13px;
					}
				}

				& details {
					margin-top: 0.5rem;
					font-size: 14px;

					& summary {
						cursor: pointer;
						color: var(--ink2);
					}

					& .items {
						list-style: none;
						margin-top: 0.4rem;

						& li {
							display: flex;
							flex-wrap: wrap;
							gap: 0.2rem 1rem;
							padding: 0.3rem 0;

							& .state {
								font-family: var(--mono);
								font-size: 11px;
								letter-spacing: 0.08em;
								text-transform: uppercase;
								color: var(--navy);
							}

							& .date {
								color: var(--ink3);
							}
						}
					}
				}
			}

			& .quiet-text {
				margin-top: 0.75rem;
				font-size: 14px;
				color: var(--ink3);
			}
		}
	}
</style>
