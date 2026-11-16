<!--
	@component
	The page of a training module on screen: what it covers, for whom, how
	long, the slides it has and a note on the places the organisation fills
	in (which of the organisation's details it shows are still missing),
	with the actions Vortragen, Handout drucken and Schulung erfassen,
	which opens a pre-filled Schulungsnachweis entry. The handout itself is
	LessonHandout, shown on paper only.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import Blanks from '#lib/ui/Blanks.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { fill, lessonSlots, SLOTS, type Details } from '#lib/organisation/slots.js';
	import { text } from '../i18n.js';
	import { LESSON_REGISTER } from '../lesson-entry.js';
	import type { Lesson, ToolManifest } from '../types.js';

	let {
		tool,
		lesson,
		details = {}
	}: { tool: ToolManifest; lesson: Lesson; details?: Details } = $props();

	const presentHref = $derived(resolve(localized(`/werkzeuge/${tool.slug}/vortrag`)));
	const recordHref = $derived(
		resolve(localized(`/werkzeuge/${LESSON_REGISTER}/eintraege?neu=1&schulung=${tool.slug}`))
	);
	// only the details this lesson shows, and which of them the organisation has not given yet
	const needed = $derived(lessonSlots(lesson));
	const missing = $derived(needed.filter((key) => !details[key]));
	const detailsHref = $derived(resolve(localized(`/organisation?fuer=${tool.slug}`)));
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

	{#if needed.length > 0}
		<aside class="details" data-complete={missing.length === 0} aria-labelledby="lesson-details">
			<h2 id="lesson-details">{m.lesson_details()}</h2>
			<p>
				{m.lesson_details_count({
					done: String(needed.length - missing.length),
					total: String(needed.length)
				})}
				{#if missing.length > 0}
					· {m.lesson_details_missing({
						list: missing.map((key) => text(SLOTS[key].label)).join(', ')
					})}
				{/if}
			</p>
			<a class="button quiet" href={detailsHref}>
				{missing.length > 0 ? m.lesson_details_edit() : m.lesson_details_change()}
			</a>
		</aside>
	{/if}

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
			<li><Blanks value={fill(text(slide.title), details, getLocale())} /></li>
		{/each}
	</ol>
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

	/* which of the organisation's details the lesson shows are still missing */
	.details {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		align-items: center;
		max-width: 44rem;
		margin-top: 1.5rem;
		padding: 0.9rem 1rem;
		font-size: 14px;
		background: var(--wax-soft);
		border-radius: var(--radius);

		&[data-complete='true'] {
			background: var(--area-schulung-soft);
		}

		& h2 {
			flex-basis: 100%;
			margin: 0;
			font-size: 15px;
		}

		& p {
			flex: 1;
			margin: 0;
		}
	}
</style>
