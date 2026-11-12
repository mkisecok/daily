<script lang="ts">
	import { PUBLIC_PREVIEW } from '$app/env/public';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount, tick } from 'svelte';
	import { formatShortDate, formatTime } from '#lib/i18n/date.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { clearDraft, draftKey, loadDraft, saveDraft } from '#lib/records/drafts.js';
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
	import { resultDashboards } from '#lib/tools/dashboards.js';
	import AssessmentHandoff from '#lib/records/ui/AssessmentHandoff.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const Dashboard = $derived(resultDashboards[data.tool.slug]);

	const engine = $derived(getQuestionnaire(data.tool.slug)?.engine);
	const toolHref = $derived(resolve(localized(`/werkzeuge/${data.tool.slug}`)));
	const saveHref = $derived(resolve(localized(`/werkzeuge/${data.tool.slug}/neu`)));
	const loginHref = $derived(
		resolve(localized(`/auth/login?next=${encodeURIComponent(saveHref)}`))
	);

	let answers = $state<Answers>({});
	let result = $state<QuestionnaireResult | null>(null);

	/** the answers as given so far, read from the form on every change */
	let current = $state<Answers>({});
	let form = $state<HTMLFormElement>();
	let restoredAt = $state<string | null>(null);

	// a questionnaire answered for an entry keeps its own draft
	const key = $derived(draftKey.check(data.tool.slug, page.url.searchParams.get('fuer') ?? ''));

	onMount(() => {
		const kept = loadDraft<Answers>(key);
		if (!kept || Object.keys(kept.values).length === 0) return;
		answers = kept.values;
		current = kept.values;
		restoredAt = `${formatShortDate(kept.savedAt, getLocale())}, ${formatTime(kept.savedAt, getLocale())}`;
	});

	function track() {
		if (!form) return;
		current = readAnswers(data.catalog, new FormData(form)).answers;
		saveDraft(key, current);
	}

	async function restart() {
		clearDraft(key);
		answers = {};
		current = {};
		restoredAt = null;
		await tick();
		form?.reset();
	}

	const total = $derived(data.catalog.sections.reduce((n, s) => n + s.questions.length, 0));
	const answered = $derived(Object.keys(current).length);

	/** scrolls to the first question still without an answer and focuses its first choice */
	function firstOpen() {
		const open = rows.find(({ question }) => !current[question.id]);
		if (!open) return;
		const row = document.getElementById(`q-${open.question.id}`);
		row?.scrollIntoView({ block: 'center' });
		row?.querySelector('input')?.focus({ preventScroll: true });
	}

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

<AssessmentHandoff questionnaire={data.tool.slug} {answers} {result} />

{#if result}
	{#if Dashboard}
		<div class="result-pair">
			<Dashboard {result} />
			<Verdict {result} tool={text(data.tool.name)} />
		</div>
	{:else}
		<Verdict {result} tool={text(data.tool.name)} />
	{/if}

	<section class="answers card">
		<h2>{m.run_answers()}</h2>
		<ol>
			{#each rows as { question, number } (question.id)}
				<li>
					<span class="number">{number}.</span>
					<span class="question">{text(question.text)}</span>
					<span class="answer badge" data-answer={answers[question.id]}>
						{answerLabel[answers[question.id]]?.() ?? '—'}
					</span>
					{#if question.cite}<span class="chip"><Citation basis={question.cite} /></span>{/if}
				</li>
			{/each}
		</ol>
	</section>

	<p class="note">{m.footer_disclaimer()} {m.run_disclaimer()} {m.check_not_saved()}</p>

	<div class="toolbar actions no-print">
		<button type="button" onclick={() => window.print()}>{m.run_print()}</button>
		<button type="button" class="quiet" onclick={edit}>{m.check_edit()}</button>
		{#if PUBLIC_PREVIEW}
			<!-- no accounts in the static preview -->
		{:else if data.user}
			<a class="button quiet" href={saveHref}>{m.tool_save()}</a>
		{:else}
			<a class="button quiet" href={loginHref} data-sveltekit-reload>{m.tool_save_login()}</a>
		{/if}
		<a class="button ghost" href={toolHref}>{m.run_back()}</a>
	</div>
{:else}
	<p class="measure intro">{text(data.catalog.intro)}</p>
	<noscript><p class="note">{m.check_noscript()}</p></noscript>

	{#if restoredAt}
		<p class="restored" role="status">
			<span>{m.check_restored({ time: restoredAt })}</span>
			<button type="button" class="quiet" onclick={restart}>{m.check_restart()}</button>
		</p>
	{/if}

	<form onsubmit={evaluate} onchange={track} bind:this={form}>
		{#each sections as section (section.id)}
			<section class="section card">
				<header class="section-head">
					<h2>{text(section.title)}</h2>
					{#if section.intro}
						<p class="measure section-intro">{text(section.intro)}</p>
					{/if}
				</header>
				{#each section.questions as { question, number } (question.id)}
					<QuestionRow {number} {question} value={answers[question.id]} />
				{/each}
			</section>
		{/each}

		<!-- stays in view at the bottom while answering -->
		<div class="toolbar actions form-bar">
			<span class="progress" aria-live="polite">
				<span class="meter" aria-hidden="true">
					<span style:width="{(answered / total) * 100}%"></span>
				</span>
				{m.check_progress({ answered, total })}
			</span>
			{#if answered < total}
				<button
					type="button"
					class="quiet jump"
					aria-label={m.check_first_open()}
					onclick={firstOpen}
				>
					<Icon name="arrow-down" size={16} />
					<span class="jump-label">{m.check_first_open()}</span>
				</button>
			{/if}
			<button type="submit">{m.form_check()}</button>
		</div>
		<p class="hint">{m.check_not_saved()}</p>
	</form>
{/if}

<style>
	.intro {
		font-size: 16px;
		color: var(--ink2);
	}

	/* a questionnaire section: a raised card with its question rows inside */
	.section {
		margin-top: 1.25rem;
		padding: 1.25rem 1.5rem 0.25rem;

		@media (max-width: 40rem) {
			padding: 1rem 1rem 0.25rem;
		}

		& .section-head {
			margin-bottom: 0.9rem;

			& h2 {
				font-size: 20px;
			}

			& .section-intro {
				margin-top: 0.4rem;
				font-size: 14px;
				color: var(--ink2);
			}
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

	.note {
		margin-top: 1.25rem;
		font-size: 13px;
		color: var(--ink3);
		max-width: var(--measure);
	}

	.actions {
		margin-top: 1.5rem;
	}

	.restored {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		align-items: center;
		justify-content: space-between;
		margin-top: 1.25rem;
		padding: 0.6rem 1rem;
		font-size: 14px;
		color: var(--navy);
		background: var(--navy-soft);
		border-radius: var(--radius-card);
	}

	/* progress and the evaluate button, held at the bottom of the window while answering */
	.form-bar {
		position: sticky;
		bottom: 0;
		z-index: 2;
		padding: 0.75rem 0;
		background: var(--canvas);
		border-top: 1px solid var(--rule2);

		@media print {
			position: static;
		}

		& .progress {
			display: inline-flex;
			flex: 1 1 12rem;
			gap: 0.6rem;
			align-items: center;
			font-size: 14px;
			font-variant-numeric: tabular-nums;
			color: var(--ink2);
		}

		& .meter {
			display: block;
			flex: 0 0 6rem;
			height: 4px;
			overflow: hidden;
			background: var(--rule2);
			border-radius: 2px;

			& span {
				display: block;
				height: 100%;
				background: var(--primary);
				transition: width 0.2s ease;
			}
		}

		/* one row on phones: the jump shrinks to its arrow, the meter goes */
		@media (max-width: 40rem) {
			flex-wrap: nowrap;
			gap: 0.5rem;

			& > button {
				flex: 0 0 auto;
			}

			& .meter,
			& .jump-label {
				display: none;
			}

			& .jump {
				min-width: 44px;
				min-height: 44px;
				justify-content: center;
				padding: 0;
			}
		}
	}

	.hint {
		margin-top: 0.5rem;
		font-size: 13px;
		color: var(--ink3);
	}

	/* a result with its picture: side by side, stacked on narrow screens */
	.result-pair {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
		align-items: start;
		gap: 1rem;
		margin-top: 1.5rem;

		& > :global(*) {
			margin-top: 0;
		}

		@media (max-width: 64rem) {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
