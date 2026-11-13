<!--
	@component
	The result of a questionnaire set like a short legal opinion: a dateline,
	the verdict as one serif sentence and a green-yellow-red scale with a
	marker on its level (red: action needed, yellow: open points, green:
	nothing to do), both in the same colour, then numbered parts for
	reasons, duties and sources. Each reason carries its citation in the
	margin; on narrow widths the citation moves under its text.
-->
<script lang="ts">
	import { formatShortDate } from '#lib/i18n/date.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { text } from '../i18n.js';
	import type { QuestionnaireResult, ToolManifest } from '../types.js';
	import Citation from './Citation.svelte';
	import Rechtsstand from './Rechtsstand.svelte';

	let {
		result,
		tool,
		at
	}: {
		result: QuestionnaireResult;
		/** the tool, named in the dateline and dated under the sources */
		tool?: ToolManifest;
		/** when the result was produced; today when not given */
		at?: string;
	} = $props();

	const NUMERALS = ['I', 'II', 'III', 'IV'];

	/** the traffic light from nothing to do to action needed, in reading order */
	const LEVELS = [
		{ id: 'negative', tone: 'low', label: m.verdict_level_negative },
		{ id: 'conditional', tone: 'mid', label: m.verdict_level_conditional },
		{ id: 'positive', tone: 'high', label: m.verdict_level_positive }
	] as const;

	const current = $derived(LEVELS.find((level) => level.id === result.verdict));

	const date = $derived(formatShortDate(at ?? new Date().toISOString(), getLocale()));
	const hasNotes = $derived((result.notes?.length ?? 0) > 0);
	// parts are numbered in the order they appear, whichever are present
	const parts = $derived(
		[result.reasons.length > 0 && 'reasons', hasNotes && 'notes', 'sources'].filter(Boolean)
	);
	const numeral = (part: string) => `${NUMERALS[parts.indexOf(part)]}.`;
</script>

<section class="verdict" data-level={result.verdict}>
	<p class="dateline">
		<span>{m.verdict_label()}</span>
		{#if tool}<span aria-hidden="true">·</span><span>{text(tool.name)}</span>{/if}
		<span aria-hidden="true">·</span><time datetime={at}>{date}</time>
	</p>
	<h2 class="headline">{text(result.headline)}</h2>
	{#if current}
		<div class="scale" role="img" aria-label={m.verdict_scale({ level: current.label() })}>
			{#each LEVELS as level (level.id)}
				<div class="step" data-tone={level.tone} data-current={level.id === current.id}>
					<span class="bar"></span>
					<span class="step-label">{level.label()}</span>
				</div>
			{/each}
		</div>
	{/if}
	<p class="explanation">{text(result.explanation)}</p>

	{#if result.reasons.length > 0}
		<section class="part">
			<h3><span class="numeral">{numeral('reasons')}</span> {m.verdict_reasons()}</h3>
			<ol class="reasons">
				{#each result.reasons as reason (reason.questionId)}
					<li>
						<span class="reason-text">{text(reason.text)}</span>
						{#if reason.cite}<span class="margin"><Citation basis={reason.cite} wrap /></span>{/if}
					</li>
				{/each}
			</ol>
		</section>
	{/if}

	{#if hasNotes}
		<section class="part">
			<h3>
				<span class="numeral">{numeral('notes')}</span>
				{result.notesTitle ? text(result.notesTitle) : m.verdict_notes()}
			</h3>
			<ol class="notes">
				{#each result.notes ?? [] as note, index (index)}
					<li>{text(note)}</li>
				{/each}
			</ol>
		</section>
	{/if}

	<section class="part">
		<h3><span class="numeral">{numeral('sources')}</span> {m.verdict_sources()}</h3>
		<ul class="sources">
			{#each result.citations as basis (basis.law + basis.ref)}
				<li><Citation {basis} wrap /></li>
			{/each}
		</ul>
		{#if tool}<div class="dated"><Rechtsstand {tool} /></div>{/if}
	</section>
</section>

<style>
	/*
	 * one sheet with a hairline, no shadow or accent bar. The margin column
	 * for citations exists only where the sheet is wide enough for it.
	 */
	.verdict {
		--accent: var(--ink);
		--margin: 11rem;

		container-type: inline-size;
		margin-top: 1.5rem;
		padding: 1.5rem 1.75rem 1.75rem;
		background: var(--sheet);
		border: 1px solid var(--rule2);
		border-radius: 4px;

		/* the headline takes the ink of its traffic-light step */
		&[data-level='positive'] {
			--accent: var(--risk-high-ink);
		}

		&[data-level='conditional'] {
			--accent: var(--risk-mid-ink);
		}

		&[data-level='negative'] {
			--accent: var(--risk-low-ink);
		}

		@media (max-width: 40rem) {
			padding: 1.25rem 1rem 1.5rem;
		}

		@media print {
			padding: 0;
			border: 0;
		}

		& .dateline {
			display: flex;
			flex-wrap: wrap;
			gap: 0 0.5rem;
			font-size: 11px;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			color: var(--ink3);

			& time {
				font-variant-numeric: tabular-nums;
			}
		}

		& .headline {
			margin-top: 0.6rem;
			font-size: clamp(22px, 2.6vw, 28px);
			line-height: 1.25;
			text-wrap: balance;
			color: var(--accent);
		}

		/* three equal segments; the current one is full colour with a marker above */
		& .scale {
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 3px;
			max-width: 30rem;
			margin-top: 1.1rem;

			& .step {
				--tone: var(--risk-low);
				--tone-ink: var(--risk-low-ink);

				position: relative;
				display: grid;
				gap: 0.4rem;
				padding-top: 0.7rem;

				&[data-tone='mid'] {
					--tone: var(--risk-mid);
					--tone-ink: var(--risk-mid-ink);
				}

				&[data-tone='high'] {
					--tone: var(--risk-high);
					--tone-ink: var(--risk-high-ink);
				}

				&:first-child .bar {
					border-radius: 2px 0 0 2px;
				}

				&:last-child {
					text-align: right;

					& .bar {
						border-radius: 0 2px 2px 0;
					}
				}

				&:nth-child(2) {
					text-align: center;
				}

				&[data-current='true'] {
					& .bar {
						opacity: 1;
					}

					& .step-label {
						font-weight: 600;
						color: var(--tone-ink);
					}

					&::before {
						position: absolute;
						top: 0;
						left: 50%;
						width: 0;
						height: 0;
						content: '';
						border-top: 7px solid var(--ink);
						border-right: 6px solid transparent;
						border-left: 6px solid transparent;
						translate: -50% 0;
					}
				}
			}

			& .bar {
				height: 8px;
				background: var(--tone);
				opacity: 0.25;
				print-color-adjust: exact;
			}

			& .step-label {
				font-size: 12px;
				line-height: 1.3;
				color: var(--ink3);
			}
		}

		& .explanation {
			max-width: var(--measure);
			margin-top: 0.6rem;
			font-size: 15px;
			line-height: 1.6;
			color: var(--ink2);
		}

		& .part {
			margin-top: 1.5rem;
			padding-top: 1.25rem;
			border-top: 1px solid var(--rule2);

			& h3 {
				font-family: var(--serif);
				font-size: 16px;
				font-weight: 600;
				color: var(--ink);
			}

			& .numeral {
				margin-right: 0.25rem;
				font-variant-numeric: tabular-nums;
			}
		}

		& .reasons,
		& .notes {
			display: grid;
			gap: 0.6rem;
			max-width: calc(var(--measure) + var(--margin));
			margin-top: 0.75rem;
			list-style: none;
			counter-reset: item;

			& li {
				position: relative;
				padding-left: 1.75rem;
				font-size: 15px;
				line-height: 1.55;
				counter-increment: item;

				&::before {
					position: absolute;
					left: 0;
					font-family: var(--mono);
					font-size: 12px;
					line-height: 1.55rem;
					content: counter(item) '.';
					color: var(--ink3);
				}
			}
		}

		& .reasons li {
			font-family: var(--serif);
			color: var(--ink);
		}

		& .notes li {
			color: var(--ink2);
		}

		& .margin {
			display: block;
			margin-top: 0.15rem;
		}

		/* citations in the left margin, as in a printed opinion */
		@container (min-width: 34rem) {
			& .part h3,
			& .notes,
			& .sources,
			& .dated {
				margin-left: calc(var(--margin) + 1.25rem);
			}

			& .reasons li {
				display: grid;
				grid-template-columns: var(--margin) minmax(0, 1fr);
				column-gap: 1.25rem;
				padding-left: 0;

				&::before {
					left: calc(var(--margin) + 1.25rem);
				}
			}

			& .reason-text {
				grid-row: 1;
				grid-column: 2;
				padding-left: 1.75rem;
			}

			& .margin {
				grid-row: 1;
				grid-column: 1;
				margin-top: 0.2rem;
				line-height: 1.35;
				text-align: right;
			}
		}

		& .sources {
			display: grid;
			gap: 0.2rem;
			margin-top: 0.6rem;
			list-style: none;
		}
	}
</style>
