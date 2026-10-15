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

<section class="answers">
	<h2 class="eyebrow">{m.run_answers()}</h2>
	<ol>
		{#each rows as { question, number, answer } (question.id)}
			<li>
				<span class="number">{number}.</span>
				<span class="question">{text(question.text)}</span>
				<span class="answer" data-answer={answer}>
					{answerLabel[answer]?.() ?? '—'}
				</span>
				{#if question.cite}<Citation basis={question.cite} />{/if}
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
		margin: 1rem 0 1.5rem;
		font-family: var(--serif);
		font-size: 15px;
		color: var(--ink2);

		& .sep {
			margin: 0 0.5rem;
			color: var(--ink3);
		}
	}

	.answers {
		padding: 2rem 0;

		& ol {
			list-style: none;
			margin-top: 0.75rem;
		}

		& li {
			display: grid;
			grid-template-columns: 1.6rem 1fr auto auto;
			gap: 0.5rem 1rem;
			align-items: baseline;
			padding: 0.6rem 0;
			border-bottom: 1px solid var(--rule2);
			font-size: 14px;

			@media (max-width: 40rem) {
				grid-template-columns: 1.6rem 1fr;
			}
		}

		& .number {
			color: var(--ink3);
		}

		& .question {
			font-family: var(--serif);
			font-size: 15px;
		}

		& .answer {
			font-family: var(--mono);
			font-size: 11px;
			letter-spacing: 0.1em;
			text-transform: uppercase;
			color: var(--ink2);

			&[data-answer='yes'] {
				color: var(--wax);
			}

			@media (max-width: 40rem) {
				grid-column: 2;
			}
		}
	}

	.disclaimer {
		font-size: 13px;
		font-style: italic;
		color: var(--ink3);
	}

	.actions {
		margin-top: 2rem;
	}
</style>
