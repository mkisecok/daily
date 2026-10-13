<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { localized } from '#lib/i18n/links.js';
	import DateLine from '#lib/ui/DateLine.svelte';
	import Wordmark from '#lib/ui/Wordmark.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const sections = $derived([
		{
			numeral: 'I.',
			title: m.landing_read_title(),
			body: m.landing_read_body(),
			href: resolve(localized('/nachrichten')),
			link: m.nav_feed()
		},
		{
			numeral: 'II.',
			title: m.landing_note_title(),
			body: m.landing_note_body(),
			href: resolve(localized('/notizen')),
			link: m.nav_notes()
		},
		{
			numeral: 'III.',
			title: m.landing_work_title(),
			body: m.landing_work_body(),
			href: resolve(localized('/werkzeuge')),
			link: m.nav_tools()
		}
	]);
</script>

<svelte:head>
	<title>Daily — {m.site_tagline()}</title>
	<meta name="description" content={m.landing_claim()} />
</svelte:head>

<DateLine date={data.today} issue={data.issue} locale={data.locale} />

<section class="hero">
	<Wordmark size="hero" />
	<h1>{m.landing_claim()}</h1>
	<p class="measure lead">{m.landing_intro()}</p>
	<p class="eyebrow">{m.landing_status()}</p>
</section>

{#each sections as section (section.numeral)}
	<hr class="rule" />
	<section class="part">
		<span class="numeral" aria-hidden="true">{section.numeral}</span>
		<div>
			<h2>{section.title}</h2>
			<p class="measure">{section.body}</p>
			<a href={section.href}>{section.link} →</a>
		</div>
	</section>
{/each}

<style>
	.hero {
		padding: 3.5rem 0 3rem;

		& h1 {
			margin-top: 1.5rem;
			font-size: clamp(26px, 3.6vw, 40px);
			max-width: 24ch;
		}

		& .lead {
			margin-top: 1.25rem;
			font-size: 17px;
			color: var(--ink2);
		}

		& .eyebrow {
			margin-top: 2rem;
		}
	}

	.part {
		display: grid;
		grid-template-columns: 4rem 1fr;
		gap: 1rem;
		padding: 2.25rem 0;

		@media (max-width: 40rem) {
			grid-template-columns: 1fr;
		}

		& .numeral {
			font-family: var(--serif);
			font-size: 22px;
			font-weight: 600;
			color: var(--ink3);
		}

		& h2 {
			font-size: 24px;
		}

		& p {
			margin-top: 0.6rem;
			color: var(--ink2);
		}

		& a {
			display: inline-block;
			margin-top: 0.9rem;
			font-family: var(--mono);
			font-size: 12px;
			letter-spacing: 0.06em;
		}
	}
</style>
