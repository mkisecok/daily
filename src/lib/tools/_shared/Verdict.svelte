<!--
	@component
	The result of a questionnaire as a raised result card: an "Ergebnis" badge
	and a left accent in the colour of the verdict (wax: action needed, navy:
	open points, khaki: nothing to do), one serif sentence, then the reasons,
	notes and sources as citation chips.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { text } from '../i18n.js';
	import type { QuestionnaireResult } from '../types.js';
	import Citation from './Citation.svelte';

	let { result }: { result: QuestionnaireResult } = $props();
</script>

<section class="verdict card" data-level={result.verdict}>
	<span
		class={[
			'badge',
			{
				wax: result.verdict === 'positive',
				navy: result.verdict === 'conditional',
				khaki: result.verdict === 'negative'
			}
		]}>{m.verdict_label()}</span
	>
	<h2 class="headline">{text(result.headline)}</h2>
	<p class="explanation measure">{text(result.explanation)}</p>

	{#if result.reasons.length > 0}
		<h3 class="reasons-title">{m.verdict_reasons()}</h3>
		<ol class="reasons">
			{#each result.reasons as reason (reason.questionId)}
				<li>
					<span class="reason-text">{text(reason.text)}</span>
					{#if reason.cite}<span class="chip"><Citation basis={reason.cite} /></span>{/if}
				</li>
			{/each}
		</ol>
	{/if}

	{#if result.notes && result.notes.length > 0}
		<h3 class="reasons-title">
			{result.notesTitle ? text(result.notesTitle) : m.verdict_notes()}
		</h3>
		<ul class="notes">
			{#each result.notes as note, index (index)}
				<li>{text(note)}</li>
			{/each}
		</ul>
	{/if}

	<p class="sources">
		<span class="sources-label">{m.verdict_sources()}</span>
		{#each result.citations as basis (basis.law + basis.ref)}
			<span class="chip"><Citation {basis} /></span>
		{/each}
	</p>
</section>

<style>
	/* a raised card; the accent is drawn as an inset shadow, so the corners stay round */
	.verdict {
		--accent: var(--ink3);

		margin-top: 1.5rem;
		padding: 1.5rem 1.75rem 1.5rem 2rem;
		box-shadow:
			inset 4px 0 0 var(--accent),
			var(--shadow-raised);

		&[data-level='positive'] {
			--accent: var(--wax);
		}

		&[data-level='conditional'] {
			--accent: var(--navy);
		}

		&[data-level='negative'] {
			--accent: var(--khaki);
		}

		@media (max-width: 40rem) {
			padding: 1.25rem 1rem 1.25rem 1.35rem;
		}

		@media print {
			box-shadow: inset 4px 0 0 var(--accent);
		}

		& .headline {
			margin-top: 0.75rem;
			font-size: clamp(24px, 3vw, 30px);
			color: var(--accent);
		}

		& .explanation {
			margin-top: 0.75rem;
			font-size: 16px;
			color: var(--ink2);
		}

		& .reasons-title {
			margin-top: 1.75rem;
			padding-top: 1.25rem;
			font-family: var(--sans);
			font-size: 14px;
			font-weight: 600;
			color: var(--ink);
			border-top: 1px solid var(--rule2);
		}

		& .chip {
			display: inline-flex;
			align-items: center;
			min-height: 1.75rem;
			padding: 0 0.5rem;
			vertical-align: middle;
			background: var(--sheet);
			border: 1px solid var(--rule2);
			border-radius: var(--radius-badge);

			&:hover {
				border-color: var(--navy);
			}
		}

		& .reasons {
			margin: 0.5rem 0 0 1.25rem;
			max-width: var(--measure);

			& li {
				padding: 0.4rem 0 0.4rem 0.25rem;
				font-family: var(--serif);
				font-size: 15px;
				line-height: 1.45;

				&::marker {
					font-family: var(--mono);
					font-size: 12px;
					color: var(--ink3);
				}
			}

			& .reason-text {
				margin-right: 0.6rem;
			}
		}

		& .notes {
			margin: 0.5rem 0 0 1.25rem;
			max-width: var(--measure);

			& li {
				padding: 0.3rem 0 0.3rem 0.25rem;
				font-size: 15px;
				color: var(--ink2);

				&::marker {
					color: var(--accent);
				}
			}
		}

		& .sources {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.35rem;
			margin-top: 1.75rem;
			padding-top: 1.25rem;
			border-top: 1px solid var(--rule2);

			& .sources-label {
				margin-right: 0.35rem;
				font-size: 13px;
				font-weight: 600;
				color: var(--ink2);
			}
		}
	}
</style>
