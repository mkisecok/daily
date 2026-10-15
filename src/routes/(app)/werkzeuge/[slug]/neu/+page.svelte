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
		<section class="section">
			<h2>{text(section.title)}</h2>
			{#if section.intro}
				<p class="measure section-intro">{text(section.intro)}</p>
			{/if}
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
		margin-top: 1.5rem;
		font-size: 16px;
		color: var(--ink2);
	}

	.error {
		margin-top: 1.5rem;
		font-family: var(--mono);
		font-size: 12px;
		color: var(--wax);
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

	.actions {
		margin-top: 2.5rem;

		& .note {
			font-size: 13px;
			color: var(--ink3);
		}
	}
</style>
