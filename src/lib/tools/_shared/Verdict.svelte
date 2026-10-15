<!--
	@component
	The result of a questionnaire, typeset like the operative part of a
	ruling: small-caps "ERGEBNIS", one serif sentence, then the reasoning.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { text } from '../i18n.js';
	import type { QuestionnaireResult } from '../types.js';
	import Citation from './Citation.svelte';

	let { result }: { result: QuestionnaireResult } = $props();
</script>

<section class="verdict" data-level={result.verdict}>
	<span class="eyebrow">{m.verdict_label()}</span>
	<h2 class="headline">{text(result.headline)}</h2>
	<p class="explanation measure">{text(result.explanation)}</p>

	{#if result.reasons.length > 0}
		<h3 class="eyebrow reasons-title">{m.verdict_reasons()}</h3>
		<ol class="reasons">
			{#each result.reasons as reason (reason.questionId)}
				<li>
					<span class="reason-text">{text(reason.text)}</span>
					{#if reason.cite}<Citation basis={reason.cite} />{/if}
				</li>
			{/each}
		</ol>
	{/if}

	{#if result.notes && result.notes.length > 0}
		<h3 class="eyebrow reasons-title">
			{result.notesTitle ? text(result.notesTitle) : m.verdict_notes()}
		</h3>
		<ul class="notes">
			{#each result.notes as note, index (index)}
				<li>{text(note)}</li>
			{/each}
		</ul>
	{/if}

	<p class="sources">
		<span class="eyebrow">{m.verdict_sources()}</span>
		{#each result.citations as basis, index (basis.law + basis.ref)}
			{#if index > 0}<span class="sep">·</span>{/if}
			<Citation {basis} />
		{/each}
	</p>
</section>

<style>
	.verdict {
		padding: 2rem 0 1.5rem;
		border-top: 2px solid var(--ink);
		border-bottom: 1px solid var(--rule);

		& .headline {
			margin-top: 0.5rem;
			font-size: clamp(24px, 3vw, 32px);
		}

		&[data-level='positive'] .headline {
			color: var(--wax);
		}

		&[data-level='conditional'] .headline {
			color: var(--navy);
		}

		&[data-level='negative'] .headline {
			color: var(--khaki);
		}

		& .explanation {
			margin-top: 1rem;
			font-size: 16px;
			color: var(--ink2);
		}

		& .reasons-title {
			margin-top: 2rem;
		}

		& .reasons {
			margin: 0.75rem 0 0 1.25rem;
			max-width: var(--measure);

			& li {
				padding: 0.4rem 0;
				font-family: var(--serif);
				font-size: 15px;
				line-height: 1.45;
			}

			& .reason-text {
				margin-right: 0.75rem;
			}
		}

		& .notes {
			margin: 0.75rem 0 0 1.25rem;
			max-width: var(--measure);

			& li {
				padding: 0.3rem 0;
				font-size: 15px;
				color: var(--ink2);
			}
		}

		& .sources {
			margin-top: 2rem;
			display: flex;
			flex-wrap: wrap;
			align-items: baseline;
			gap: 0.6rem;

			& .sep {
				color: var(--ink3);
			}
		}
	}
</style>
