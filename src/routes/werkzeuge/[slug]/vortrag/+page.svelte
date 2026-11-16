<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { cite, text } from '#lib/tools/i18n.js';
	import Blanks from '#lib/ui/Blanks.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// slide 0 is the title; 1 to n are the lesson's slides
	const total = $derived(data.lesson.slides.length);
	const current = $derived.by(() => {
		const n = Number(page.url.searchParams.get('folie') ?? '0');
		return Number.isInteger(n) && n >= 0 && n <= total ? n : 0;
	});
	const slide = $derived(current > 0 ? data.lesson.slides[current - 1] : null);
	const lessonHref = $derived(resolve(localized(`/werkzeuge/${data.tool.slug}`)));

	let showNotes = $state(false);
	let stage = $state<HTMLElement>();
	let swipeFrom: number | null = null;

	/** keeps the slide in the URL, so a reload stays on it */
	function show(n: number) {
		const next = Math.min(Math.max(n, 0), total);
		if (next === current) return;
		goto(resolve(localized(`/werkzeuge/${data.tool.slug}/vortrag?folie=${next}`)), {
			replace: true,
			reset: false
		});
	}

	function fullscreen() {
		if (document.fullscreenElement) document.exitFullscreen();
		else stage?.requestFullscreen();
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		const keys: Record<string, () => void> = {
			ArrowRight: () => show(current + 1),
			ArrowDown: () => show(current + 1),
			PageDown: () => show(current + 1),
			' ': () => show(current + 1),
			ArrowLeft: () => show(current - 1),
			ArrowUp: () => show(current - 1),
			PageUp: () => show(current - 1),
			Home: () => show(0),
			End: () => show(total),
			n: () => (showNotes = !showNotes),
			f: fullscreen,
			Escape: () => {
				if (!document.fullscreenElement) goto(lessonHref);
			}
		};
		const action = keys[event.key];
		if (!action) return;
		event.preventDefault();
		action();
	}
</script>

<svelte:head>
	<title>{text(data.tool.name)} — Daily</title>
</svelte:head>

<svelte:window {onkeydown} />

<section
	class="presenter"
	data-area="schulung"
	aria-roledescription="presentation"
	aria-label={text(data.tool.name)}
	bind:this={stage}
	onpointerdown={(event) => (swipeFrom = event.clientX)}
	onpointerup={(event) => {
		if (swipeFrom === null) return;
		const dx = event.clientX - swipeFrom;
		swipeFrom = null;
		if (Math.abs(dx) > 60) show(current + (dx < 0 ? 1 : -1));
	}}
>
	<article class="slide" aria-live="polite">
		{#if slide}
			<h1><Blanks value={text(slide.title)} /></h1>
			<ul class="points">
				{#each slide.points as point, index (index)}
					<li><Blanks value={text(point)} /></li>
				{/each}
			</ul>
			{#if slide.example}
				<p class="example">
					<strong>{m.lesson_example()}</strong>
					{text(slide.example)}
				</p>
			{/if}
			{#if slide.cite}
				<p class="cite">{slide.cite.map((basis) => cite(basis)).join(' · ')}</p>
			{/if}
		{:else}
			<p class="eyebrow">{m.category_schulung()}</p>
			<h1 class="title">{text(data.tool.name)}</h1>
			<p class="facts">
				{text(data.lesson.audience)} · {m.lesson_minutes({ minutes: String(data.lesson.minutes) })}
			</p>
		{/if}
	</article>

	{#if showNotes && slide?.notes}
		<aside class="notes" aria-label={m.lesson_notes()}>{text(slide.notes)}</aside>
	{/if}

	<nav class="controls" aria-label={m.lesson_counter({ n: String(current), total: String(total) })}>
		<a class="button quiet" href={lessonHref} aria-label={m.lesson_exit()}
			><Icon name="x" size={16} /><span class="label">{m.lesson_exit()}</span></a
		>
		<span class="keys">{m.lesson_keys()}</span>
		<span class="counter">{current} / {total}</span>
		<button
			type="button"
			class="button quiet"
			onclick={() => (showNotes = !showNotes)}
			aria-pressed={showNotes}
			aria-label={m.lesson_notes()}
		>
			<Icon name="notes" size={16} /><span class="label">{m.lesson_notes()}</span>
		</button>
		<button
			type="button"
			class="button quiet"
			onclick={fullscreen}
			aria-label={m.lesson_fullscreen()}
		>
			<Icon name="maximize" size={16} /><span class="label">{m.lesson_fullscreen()}</span>
		</button>
		<button
			type="button"
			class="button quiet step"
			onclick={() => show(current - 1)}
			disabled={current === 0}
			aria-label={m.lesson_prev()}
		>
			<Icon name="chevron-left" size={18} />
		</button>
		<button
			type="button"
			class="button step"
			onclick={() => show(current + 1)}
			disabled={current === total}
			aria-label={m.lesson_next()}
		>
			<Icon name="chevron-right" size={18} />
		</button>
	</nav>
</section>

<style>
	/* the presentation covers the whole window, sidebar and header included */
	.presenter {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: grid;
		/* the column may shrink below its content, so the controls never widen the page */
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: 1fr auto auto;
		background: var(--paper);
		border-left: 6px solid var(--area-schulung);
		touch-action: pan-y;
	}

	.slide {
		align-self: center;
		width: min(100%, 64rem);
		margin: 0 auto;
		padding: 3rem clamp(1.25rem, 5vw, 4rem);

		& h1 {
			font-family: var(--serif);
			font-size: clamp(28px, 4.2vw, 48px);
			line-height: 1.15;
		}

		& .title {
			font-size: clamp(34px, 5.5vw, 64px);
		}

		& .eyebrow {
			margin-bottom: 1rem;
			font-size: 15px;
			font-weight: 600;
			letter-spacing: 0.06em;
			text-transform: uppercase;
			color: var(--area-schulung);
		}

		& .facts {
			margin-top: 1.5rem;
			font-size: clamp(17px, 2vw, 22px);
			color: var(--ink2);
		}

		& .points {
			margin: 2rem 0 0;
			padding-left: 1.4em;
			font-size: clamp(18px, 2.3vw, 26px);
			line-height: 1.4;

			& li + li {
				margin-top: 0.7rem;
			}

			& li::marker {
				color: var(--area-schulung);
			}
		}

		& .example {
			margin-top: 2rem;
			padding: 1rem 1.25rem;
			font-size: clamp(16px, 1.9vw, 21px);
			background: var(--area-schulung-soft);
			border-radius: 8px;

			& strong {
				display: block;
				margin-bottom: 0.25rem;
				font-size: 13px;
				letter-spacing: 0.04em;
				text-transform: uppercase;
				color: var(--area-schulung);
			}
		}

		& .cite {
			margin-top: 2rem;
			font-family: var(--mono);
			font-size: 13px;
			color: var(--ink3);
		}
	}

	.notes {
		max-height: 30vh;
		overflow: auto;
		padding: 1rem clamp(1.25rem, 5vw, 4rem);
		font-size: 15px;
		color: var(--ink2);
		background: var(--sheet);
		border-top: 1px solid var(--rule);
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem clamp(1rem, 3vw, 2rem);
		border-top: 1px solid var(--rule);

		& .keys {
			flex: 1;
			font-size: 13px;
			color: var(--ink3);

			@media (max-width: 56rem) {
				display: none;
			}
		}

		/* the arrows are icons only, so they need less room than a labelled button */
		& .step {
			padding-inline: 0.7rem;
		}

		/* on phones the labelled buttons keep only their icon, so the row fits */
		& .label {
			@media (max-width: 40rem) {
				display: none;
			}
		}

		/* pushed right also on phones, where the key hint is hidden */
		& .counter {
			min-width: 4rem;
			margin-left: auto;
			font-variant-numeric: tabular-nums;
			text-align: center;
			color: var(--ink2);
		}
	}
</style>
