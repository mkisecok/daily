<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { formatLongDate } from '#lib/i18n/date.js';
	import { localized } from '#lib/i18n/links.js';
	import { text } from '#lib/tools/i18n.js';
	import Citation from '#lib/tools/_shared/Citation.svelte';
	import ToolHeader from '#lib/tools/_shared/ToolHeader.svelte';
	import Verdict from '#lib/tools/_shared/Verdict.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const answerLabel: Record<string, () => string> = {
		yes: m.answer_yes,
		no: m.answer_no,
		unknown: m.answer_unknown,
		na: m.answer_na
	};

	/** every question with its continuous number and the stored answer */
	const rows = $derived.by(() => {
		let number = 0;
		return data.catalog.sections.flatMap((section) =>
			section.questions.map((question) => ({
				question,
				number: ++number,
				answer: data.run.answers[question.id]
			}))
		);
	});
</script>

<svelte:head>
	<title>{text(data.run.result.headline)} · {text(data.tool.name)} — Daily</title>
</svelte:head>

<ToolHeader tool={data.tool} />

<p class="meta">
	<span>{formatLongDate(data.run.createdAt, data.locale)}</span>
	<span class="sep">·</span>
	<span>{data.user.displayName}</span>
	<span class="sep">·</span>
	<span>{m.run_catalog_version()} {data.run.catalogVersion}</span>
</p>

<Verdict result={data.run.result} />

<section class="answers card">
	<h2>{m.run_answers()}</h2>
	<ol>
		{#each rows as { question, number, answer } (question.id)}
			<li>
				<span class="number">{number}.</span>
				<span class="question">{text(question.text)}</span>
				<span class="answer badge" data-answer={answer}>
					{answerLabel[answer]?.() ?? '—'}
				</span>
				{#if question.cite}<span class="chip"><Citation basis={question.cite} /></span>{/if}
			</li>
		{/each}
	</ol>
</section>

<p class="disclaimer">{m.footer_disclaimer()} {m.run_disclaimer()}</p>

<div class="toolbar actions no-print">
	<button type="button" onclick={() => window.print()}>{m.run_print()}</button>
	<a class="button quiet" href={resolve(localized(`/werkzeuge/${data.tool.slug}/neu`))}
		>{m.run_again()}</a
	>
	<a class="button ghost" href={resolve(localized(`/werkzeuge/${data.tool.slug}`))}
		>{m.run_back()}</a
	>
</div>

<style>
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 0.5rem;
		font-size: 14px;
		color: var(--ink2);

		& .sep {
			color: var(--ink3);
		}
	}

	/* the given answers as rows in a raised card */
	.answers {
		margin-top: 1.5rem;
		padding: 1.25rem 1.5rem 0.5rem;

		@media (max-width: 40rem) {
			padding: 1rem 1rem 0.5rem;
		}

		& h2 {
			font-size: 18px;
		}

		& ol {
			list-style: none;
			margin-top: 0.75rem;
		}

		& li {
			display: grid;
			grid-template-columns: 1.6rem minmax(0, 1fr) auto auto;
			gap: 0.5rem 1rem;
			align-items: center;
			padding: 0.65rem 0;
			font-size: 14px;
			border-top: 1px solid var(--rule2);

			@media (max-width: 40rem) {
				grid-template-columns: 1.6rem minmax(0, 1fr);
			}
		}

		& .number {
			font-family: var(--mono);
			font-size: 12px;
			font-variant-numeric: tabular-nums;
			color: var(--ink3);
		}

		& .question {
			font-family: var(--serif);
			font-size: 15px;
		}

		& .answer {
			justify-self: start;

			&[data-answer='yes'] {
				color: var(--wax);
				background: var(--wax-soft);
			}

			@media (max-width: 40rem) {
				grid-column: 2;
			}
		}

		& .chip {
			display: inline-flex;
			align-items: center;
			justify-self: start;
			max-width: 100%;
			min-height: 1.75rem;
			padding: 0 0.5rem;
			background: var(--sheet);
			border: 1px solid var(--rule2);
			border-radius: var(--radius-badge);

			&:hover {
				border-color: var(--navy);
			}

			@media (max-width: 40rem) {
				grid-column: 2;
			}
		}
	}

	.disclaimer {
		max-width: var(--measure);
		margin-top: 1.25rem;
		font-size: 13px;
		color: var(--ink3);
	}

	.actions {
		margin-top: 1.5rem;
	}
</style>
