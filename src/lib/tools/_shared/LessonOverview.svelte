<!--
	@component
	The page of a training module on screen: what it covers, for whom, how
	long, the slides it has and a note on the places the organisation fills
	in, with the actions Vortragen, Handout drucken and Schulung erfassen,
	which opens a pre-filled Schulungsnachweis entry. The handout itself is
	LessonHandout, shown on paper only.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import Blanks from '#lib/ui/Blanks.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { text } from '../i18n.js';
	import { LESSON_REGISTER } from '../lesson-entry.js';
	import type { Lesson, ToolManifest } from '../types.js';

	let { tool, lesson }: { tool: ToolManifest; lesson: Lesson } = $props();

	const presentHref = $derived(resolve(localized(`/werkzeuge/${tool.slug}/vortrag`)));
	const recordHref = $derived(
		resolve(localized(`/werkzeuge/${LESSON_REGISTER}/eintraege?neu=1&schulung=${tool.slug}`))
	);
	const hasBlanks = $derived(
		lesson.slides.some((slide) => slide.points.some((point) => text(point).includes('[')))
	);
</script>

<section class="lesson no-print">
	<p class="measure lead">{text(tool.summary)}</p>
	<p class="measure">{text(lesson.intro)}</p>

	<dl class="facts">
		<div>
			<dt>{m.lesson_audience()}</dt>
			<dd>{text(lesson.audience)}</dd>
		</div>
		<div>
			<dt>{m.lesson_length()}</dt>
			<dd>
				{m.lesson_minutes({ minutes: String(lesson.minutes) })} · {m.lesson_slides({
					count: String(lesson.slides.length)
				})} · {m.lesson_questions({ count: String(lesson.quiz.length) })}
			</dd>
		</div>
	</dl>

	<div class="toolbar action">
		<a class="button" href={presentHref}
			><Icon name="player-play" size={16} />{m.lesson_present()}</a
		>
		<button type="button" class="quiet" onclick={() => window.print()}>
			<Icon name="printer" size={16} />{m.lesson_handout()}
		</button>
		<a class="button quiet" href={recordHref}>{m.lesson_record()}</a>
	</div>

	<h2>{m.lesson_outline()}</h2>
	<ol class="outline">
		{#each lesson.slides as slide, index (index)}
			<li><Blanks value={text(slide.title)} /></li>
		{/each}
	</ol>
	{#if hasBlanks}
		<p class="blanks measure" role="note">{m.lesson_blanks()}</p>
	{/if}
</section>

<style>
	.lesson {
		padding-bottom: 2rem;

		& .lead {
			font-size: 17px;
			color: var(--ink2);
		}

		& p + p {
			margin-top: 1rem;
		}

		& h2 {
			margin-top: 2rem;
			font-size: 18px;
		}
	}

	.facts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 2rem;
		margin: 1.25rem 0 0;

		& dt {
			font-size: 12px;
			font-weight: 600;
			color: var(--ink3);
		}

		& dd {
			margin: 0.15rem 0 0;
		}
	}

	.action {
		margin-top: 1.5rem;
	}

	.outline {
		max-width: 44rem;
		margin: 0.75rem 0 0;
		padding-left: 1.5rem;

		& li {
			padding: 0.35rem 0;
			border-bottom: 1px solid var(--rule2);
		}
	}

	.blanks {
		margin-top: 1rem;
		font-size: 14px;
		color: var(--ink3);
	}
</style>
