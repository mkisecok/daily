<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatShortDate } from '#lib/i18n/date.js';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { text } from '#lib/tools/i18n.js';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const href = (id: string) => resolve(localized(`/normen/${data.law.id}/${id}`));
</script>

<svelte:head>
	<title>{data.law.law} — {m.nav_norms()} — Daily</title>
	<meta name="description" content={text(data.law.name)} />
</svelte:head>

<PageHeader
	title={text(data.law.name)}
	trail={[{ label: m.nav_norms(), path: localized('/normen') }]}
>
	{#snippet meta()}
		<p class="source">
			{data.source.version}.
			{m.normen_retrieved({ date: formatShortDate(data.retrieved, getLocale()) })}
			<a href={data.source.url} rel="external noopener" target="_blank">{m.normen_source()}</a>
		</p>
	{/snippet}
</PageHeader>

<nav class="toc" aria-label={m.normen_toc()}>
	{#each data.toc.chapters as chapter, index (index)}
		<section class="card">
			{#if chapter.title}<h2>{chapter.title}</h2>{/if}
			<ol>
				{#each chapter.entries as entry (entry.id)}
					<li><a href={href(entry.id)}><span class="ref">{entry.label}</span> {entry.title}</a></li>
				{/each}
			</ol>
		</section>
	{/each}

	{#if data.toc.annexes.length > 0}
		<section class="card">
			<h2>{m.normen_annexes()}</h2>
			<ol>
				{#each data.toc.annexes as entry (entry.id)}
					<li><a href={href(entry.id)}><span class="ref">{entry.label}</span> {entry.title}</a></li>
				{/each}
			</ol>
		</section>
	{/if}

	{#if data.toc.recitals.length > 0}
		<section class="card">
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
	.source {
		max-width: var(--measure);
		margin-top: 0.6rem;
		font-size: 13px;
		color: var(--ink3);
	}

	.toc {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;
		overflow-wrap: anywhere;

		& section {
			padding: 1.1rem 1.25rem 0.75rem;

			@media (max-width: 40rem) {
				padding: 0.9rem 0.75rem 0.5rem;
			}

			& h2 {
				padding: 0 0.5rem 0.6rem;
				font-size: 17px;
				border-bottom: 1px solid var(--rule2);
			}

			& ol {
				list-style: none;
				margin-top: 0.4rem;
				column-gap: 1.5rem;

				/* two columns only where two 22rem columns fit; a column width wider than a phone forces sideways scroll */
				@media (min-width: 52rem) {
					columns: 2 22rem;
				}
			}

			& li {
				break-inside: avoid;
				font-family: var(--serif);
				font-size: 15px;

				& a {
					display: flex;
					align-items: baseline;
					gap: 0.5rem;
					padding: 0.35rem 0.5rem;
					color: var(--ink);
					border-radius: var(--radius);
					transition: background-color 0.12s ease;

					&:hover {
						text-decoration: none;
						background: var(--navy-soft);
					}

					/* finger-sized rows on phones */
					@media (max-width: 40rem) {
						align-items: center;
						min-height: 44px;
						border-radius: 0;
						border-bottom: 1px solid var(--rule2);
					}
				}

				&:last-child a {
					@media (max-width: 40rem) {
						border-bottom: 0;
					}
				}

				& .ref {
					display: inline-block;
					flex: none;
					min-width: 4.5rem;
					font-family: var(--mono);
					font-size: 12px;
					color: var(--navy);
				}
			}

			/* recital numbers as a compact grid of chips */
			& .recitals {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(2.5rem, 1fr));
				gap: 0.35rem;
				margin-top: 0.75rem;
				padding-bottom: 0.5rem;
				font-family: var(--mono);
				font-size: 13px;

				& a {
					display: inline-grid;
					place-items: center;
					min-height: 2rem;
					color: var(--ink2);
					background: var(--canvas);
					border: 1px solid var(--rule2);
					border-radius: var(--radius-badge);
					transition:
						background-color 0.12s ease,
						border-color 0.12s ease;

					&:hover {
						text-decoration: none;
						color: var(--navy);
						background: var(--navy-soft);
						border-color: var(--navy-soft);
					}
				}

				/* recital numbers become tap-sized boxes on phones */
				@media (max-width: 40rem) {
					grid-template-columns: repeat(auto-fill, minmax(2.75rem, 1fr));

					& a {
						min-width: 2.75rem;
						min-height: 2.75rem;
					}
				}
			}
		}
	}
</style>
