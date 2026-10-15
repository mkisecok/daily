<script lang="ts">
	import { PUBLIC_PREVIEW } from '$app/env/public';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { localized } from '#lib/i18n/links.js';
	import { readAnswers } from '#lib/tools/answers.js';
	import { text } from '#lib/tools/i18n.js';
	import { getQuestionnaire } from '#lib/tools/registry.js';
	import type { Answers, QuestionnaireResult, YesNoAnswer } from '#lib/tools/types.js';
	import Citation from '#lib/tools/_shared/Citation.svelte';
	import QuestionRow from '#lib/tools/_shared/QuestionRow.svelte';
	import ToolHeader from '#lib/tools/_shared/ToolHeader.svelte';
	import Verdict from '#lib/tools/_shared/Verdict.svelte';
	import AssessmentHandoff from '#lib/records/ui/AssessmentHandoff.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const engine = $derived(getQuestionnaire(data.tool.slug)?.engine);
	const toolHref = $derived(resolve(localized(`/werkzeuge/${data.tool.slug}`)));
	const saveHref = $derived(resolve(localized(`/werkzeuge/${data.tool.slug}/neu`)));
	const loginHref = $derived(
		resolve(localized(`/auth/login?next=${encodeURIComponent(saveHref)}`))
	);

	let answers = $state<Answers>({});
	let result = $state<QuestionnaireResult | null>(null);

	const answerLabel: Record<YesNoAnswer, () => string> = {
		yes: m.answer_yes,
		no: m.answer_no,
		unknown: m.answer_unknown,
		na: m.answer_na
	};

	/** questions numbered continuously across sections */
	const sections = $derived.by(() => {
		let number = 0;
		return data.catalog.sections.map((section) => ({
			...section,
			questions: section.questions.map((question) => ({ question, number: ++number }))
		}));
	});
	const rows = $derived(sections.flatMap((section) => section.questions));

	/** evaluates in the browser; nothing leaves the page */
	function evaluate(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();
		if (!engine) return;
		const read = readAnswers(data.catalog, new FormData(event.currentTarget));
		answers = read.answers;
		result = engine(data.catalog, read.answers);
		window.scrollTo({ top: 0 });
	}

	function edit() {
		result = null;
	}
</script>

<svelte:head>
	<title>{text(data.tool.name)} — Daily</title>
	<meta name="description" content={text(data.tool.summary)} />
</svelte:head>

<ToolHeader tool={data.tool} />

<AssessmentHandoff questionnaire={data.tool.slug} catalogVersion={data.catalog.version} {result} />

{#if result}
	<Verdict {result} />

	<section class="answers">
		<h2 class="eyebrow">{m.run_answers()}</h2>
		<ol>
			{#each rows as { question, number } (question.id)}
				<li>
					<span class="number">{number}.</span>
					<span class="question">{text(question.text)}</span>
					<span class="answer" data-answer={answers[question.id]}>
						{answerLabel[answers[question.id]]?.() ?? '—'}
					</span>
					{#if question.cite}<Citation basis={question.cite} />{/if}
				</li>
			{/each}
		</ol>
	</section>

	<p class="note">{m.footer_disclaimer()} {m.run_disclaimer()} {m.check_not_saved()}</p>

	<div class="actions no-print">
		<button type="button" onclick={() => window.print()}>{m.run_print()}</button>
		<button type="button" class="quiet" onclick={edit}>{m.check_edit()}</button>
		{#if PUBLIC_PREVIEW}
			<!-- no accounts in the static preview -->
		{:else if data.user}
			<a href={saveHref}>{m.tool_save()}</a>
		{:else}
			<a href={loginHref} data-sveltekit-reload>{m.tool_save_login()}</a>
		{/if}
		<a href={toolHref}>{m.run_back()}</a>
	</div>
{:else}
	<p class="measure intro">{text(data.catalog.intro)}</p>
	<noscript><p class="note">{m.check_noscript()}</p></noscript>

	<form onsubmit={evaluate}>
		{#each sections as section (section.id)}
			<section class="section">
				<h2>{text(section.title)}</h2>
				{#if section.intro}
					<p class="measure section-intro">{text(section.intro)}</p>
				{/if}
				{#each section.questions as { question, number } (question.id)}
					<QuestionRow {number} {question} value={answers[question.id]} />
				{/each}
			</section>
		{/each}

		<div class="actions">
			<button type="submit">{m.form_check()}</button>
			<span class="hint">{m.check_not_saved()}</span>
		</div>
	</form>
{/if}

<style>
	.intro {
		margin-top: 1.5rem;
		font-size: 16px;
		color: var(--ink2);
	}

	.section {
		padding-top: 2.5rem;

		& h2 {
			font-size: 22px;
			padding-bottom: 0.5rem;
			border-bottom: 1px solid var(--rule);
		}

		& .section-intro {
			margin: 0.75rem 0 0.5rem;
			font-size: 14px;
			color: var(--ink2);
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

	.note {
		margin-top: 1rem;
		font-size: 13px;
		font-style: italic;
		color: var(--ink3);
		max-width: var(--measure);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		flex-wrap: wrap;
		margin-top: 2rem;
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.08em;
		text-transform: uppercase;

		& button {
			font: inherit;
			letter-spacing: inherit;
			text-transform: inherit;
			padding: 0.6rem 1.1rem;
			border: 1px solid var(--ink);
			color: var(--on-navy);
			background: var(--ink);

			&:hover {
				background: var(--navy);
				border-color: var(--navy);
			}

			&.quiet {
				color: var(--ink);
				background: none;

				&:hover {
					color: var(--on-navy);
				}
			}
		}

		& .hint {
			font-family: var(--sans);
			font-size: 13px;
			letter-spacing: 0;
			text-transform: none;
			color: var(--ink3);
		}
	}
</style>
