<!--
	@component
	The handout of a training module, on paper only below a letter head:
	each slide with its points, the example and the provisions it cites, in
	the order presented, then the review questions with boxes to tick and
	the answers with their reasons. Speaker notes stay with the presenter.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import Blanks from '#lib/ui/Blanks.svelte';
	import { cite, text } from '../i18n.js';
	import type { Lesson } from '../types.js';

	let { lesson }: { lesson: Lesson } = $props();
</script>

<section class="print-body print-only handout">
	{#each lesson.slides as slide, index (index)}
		<article class="slide">
			<h2>{index + 1}. <Blanks value={text(slide.title)} /></h2>
			<ul>
				{#each slide.points as point, n (n)}
					<li><Blanks value={text(point)} /></li>
				{/each}
			</ul>
			{#if slide.example}
				<p class="example"><strong>{m.lesson_example()}:</strong> {text(slide.example)}</p>
			{/if}
			{#if slide.cite}
				<p class="cite">{slide.cite.map((basis) => cite(basis)).join(' · ')}</p>
			{/if}
		</article>
	{/each}

	<h2 class="review">{m.lesson_review()}</h2>
	<ol class="quiz">
		{#each lesson.quiz as question, index (index)}
			<li>
				<p class="question">{text(question.text)}</p>
				<ul class="choices">
					{#each question.options as option, n (n)}
						<li>{text(option.text)}</li>
					{/each}
				</ul>
			</li>
		{/each}
	</ol>

	<h2>{m.lesson_answers()}</h2>
	<ol class="answers">
		{#each lesson.quiz as question, index (index)}
			{@const right = question.options.find((option) => option.correct)!}
			<li>
				<strong>{text(right.text)}.</strong>
				{text(right.why)}
				{#if question.cite}<span class="cite">{cite(question.cite)}</span>{/if}
			</li>
		{/each}
	</ol>
</section>

<style>
	.handout {
		& .slide {
			padding-bottom: 3mm;
			border-bottom: 0.3pt solid #999;
			break-inside: avoid;
		}

		& h2 {
			margin-top: 5mm;
		}

		& ul {
			margin: 0;
			padding-left: 5mm;
		}

		& li {
			margin-bottom: 1mm;
		}

		& .example {
			margin: 2mm 0 0;
			font-style: italic;
		}

		/* the questions start on a page of their own, to hand out after the session */
		& .review {
			break-before: page;
			margin-top: 0;
		}

		& .quiz {
			margin: 0;
			padding-left: 5mm;

			& > li {
				margin-bottom: 4mm;
				break-inside: avoid;
			}

			& .question {
				margin: 0 0 1.5mm;
				font-weight: 600;
			}
		}

		/* an empty box before each answer, to tick by hand */
		/* one answer per line, even when several would fit */
		& .choices {
			display: grid;
			gap: 1mm;
			margin: 0;
			padding: 0;
			list-style: none;

			& li {
				&::before {
					display: inline-block;
					width: 3mm;
					height: 3mm;
					margin-right: 2mm;
					vertical-align: -0.3mm;
					content: '';
					border: 0.5pt solid #000;
				}
			}
		}

		& .answers {
			margin: 0;
			padding-left: 5mm;

			& li {
				margin-bottom: 2mm;
			}

			& .cite {
				margin-left: 2mm;
			}
		}

		& .cite {
			margin: 2mm 0 0;
			font-family: var(--mono);
			font-size: 8pt;
		}
	}
</style>
