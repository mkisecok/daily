<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '#lib/paraglide/messages.js';
	import { text } from '#lib/tools/i18n.js';
	import QuestionRow from '#lib/tools/_shared/QuestionRow.svelte';
	import ToolHeader from '#lib/tools/_shared/ToolHeader.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let submitting = $state(false);

	/** questions numbered continuously across sections */
	const sections = $derived.by(() => {
		let number = 0;
		return data.catalog.sections.map((section) => ({
			...section,
			questions: section.questions.map((question) => ({ question, number: ++number }))
		}));
	});
</script>

<svelte:head>
	<title>{text(data.tool.name)} — Daily</title>
</svelte:head>

<ToolHeader tool={data.tool} />

<p class="measure intro">{text(data.catalog.intro)}</p>

{#if form?.missing}
	<p class="error" role="alert">{m.form_missing_answers()}</p>
{/if}

<form
	method="post"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	}}
>
	{#each sections as section (section.id)}
		<section class="section card">
			<header class="section-head">
				<h2>{text(section.title)}</h2>
				{#if section.intro}
					<p class="measure section-intro">{text(section.intro)}</p>
				{/if}
			</header>
			{#each section.questions as { question, number } (question.id)}
				<QuestionRow {number} {question} value={form?.answers?.[question.id]} />
			{/each}
		</section>
	{/each}

	<div class="toolbar actions">
		<button type="submit" disabled={submitting}>{m.form_evaluate()}</button>
		<span class="note">{m.form_saved_note()}</span>
	</div>
</form>

<style>
	.intro {
		font-size: 16px;
		color: var(--ink2);
	}

	.error {
		max-width: var(--measure);
		margin-top: 1.25rem;
		padding: 0.65rem 0.9rem;
		font-size: 14px;
		color: var(--wax);
		background: var(--wax-soft);
		border-radius: var(--radius);
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

	.actions {
		margin-top: 1.5rem;

		& .note {
			font-size: 13px;
			color: var(--ink3);
		}
	}
</style>
