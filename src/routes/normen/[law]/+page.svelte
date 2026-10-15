<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatShortDate } from '#lib/i18n/date.js';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { text } from '#lib/tools/i18n.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const href = (id: string) => resolve(localized(`/normen/${data.law.id}/${id}`));
</script>

<svelte:head>
	<title>{data.law.law} — {m.nav_norms()} — Daily</title>
	<meta name="description" content={text(data.law.name)} />
</svelte:head>

<header class="head">
	<p class="eyebrow"><a href={resolve(localized('/normen'))}>{m.nav_norms()}</a></p>
	<h1>{text(data.law.name)}</h1>
	<p class="source">
		{data.source.version}.
		{m.normen_retrieved({ date: formatShortDate(data.retrieved, getLocale()) })}
		<a href={data.source.url} rel="external noopener" target="_blank">{m.normen_source()}</a>
	</p>
</header>

<nav class="toc" aria-label={m.normen_toc()}>
	{#each data.toc.chapters as chapter, index (index)}
		<section>
			{#if chapter.title}<h2>{chapter.title}</h2>{/if}
			<ol>
				{#each chapter.entries as entry (entry.id)}
					<li><a href={href(entry.id)}><span class="ref">{entry.label}</span> {entry.title}</a></li>
				{/each}
			</ol>
		</section>
	{/each}

	{#if data.toc.annexes.length > 0}
		<section>
			<h2>{m.normen_annexes()}</h2>
			<ol>
				{#each data.toc.annexes as entry (entry.id)}
					<li><a href={href(entry.id)}><span class="ref">{entry.label}</span> {entry.title}</a></li>
				{/each}
			</ol>
		</section>
	{/if}

	{#if data.toc.recitals.length > 0}
		<section>
			<h2>{m.normen_recitals()}</h2>
			<p class="recitals">
				{#each data.toc.recitals as entry (entry.id)}
					<a href={href(entry.id)}>{entry.label.replace(/\D+/, '')}</a>
				{/each}
			</p>
		</section>
	{/if}
</nav>

<style>
	.head {
		padding: 2.5rem 0 1rem;
		border-bottom: 2px solid var(--ink);

		& h1 {
			margin-top: 0.4rem;
			font-size: clamp(26px, 3.5vw, 36px);
		}

		& .source {
			margin-top: 0.75rem;
			font-size: 13px;
			color: var(--ink3);
			max-width: var(--measure);
		}
	}

	.toc section {
		padding-top: 1.75rem;

		& h2 {
			font-size: 17px;
			padding-bottom: 0.4rem;
			border-bottom: 1px solid var(--rule);
		}

		& ol {
			list-style: none;
			margin-top: 0.4rem;
			columns: 2 22rem;
			column-gap: 2.5rem;
		}

		& li {
			break-inside: avoid;
			font-family: var(--serif);
			font-size: 15px;

			& a {
				display: flex;
				align-items: baseline;
				gap: 0.4rem;
				padding: 0.3rem 0;

				/* finger-sized rows on phones */
				@media (max-width: 40rem) {
					align-items: center;
					min-height: 44px;
					border-bottom: 1px solid var(--rule2);
				}
			}

			& .ref {
				display: inline-block;
				flex: none;
				min-width: 4.5rem;
				font-family: var(--mono);
				font-size: 12px;
				color: var(--ink3);
			}
		}

		& .recitals {
			display: flex;
			flex-wrap: wrap;
			gap: 0.2rem 0.9rem;
			margin-top: 0.5rem;
			font-family: var(--mono);
			font-size: 13px;

			/* recital numbers become tap-sized boxes on phones */
			@media (max-width: 40rem) {
				gap: 0.35rem;

				& a {
					display: inline-grid;
					place-items: center;
					min-width: 2.75rem;
					min-height: 2.75rem;
					border: 1px solid var(--rule2);
					border-radius: var(--radius);
				}
			}
		}
	}
</style>
