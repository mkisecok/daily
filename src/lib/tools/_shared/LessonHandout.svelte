<!--
	@component
	The handout of a training module, on paper only below a letter head:
	each slide with its points, the example and the provisions it cites, in
	the order presented. Speaker notes stay with the presenter.
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

		& .cite {
			margin: 2mm 0 0;
			font-family: var(--mono);
			font-size: 8pt;
		}
	}
</style>
