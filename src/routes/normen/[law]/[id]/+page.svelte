<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatShortDate } from '#lib/i18n/date.js';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import Blocks from '#lib/normen/ui/Blocks.svelte';
	import { text } from '#lib/tools/i18n.js';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const lawPath = $derived(localized(`/normen/${data.law.id}`));
	const href = (id: string) => resolve(localized(`/normen/${data.law.id}/${id}`));
	const title = $derived(
		[data.provision.label, data.law.law, data.provision.title].filter(Boolean).join(' ')
	);
</script>

<svelte:head>
	<title>{data.provision.label} {data.law.law} — Daily</title>
	<meta name="description" content="{data.provision.label} {data.law.law} {data.provision.title}" />
</svelte:head>

<article class="provision">
	<PageHeader
		{title}
		trail={[
			{ label: m.nav_norms(), path: localized('/normen') },
			{ label: data.law.law, path: lawPath }
		]}
	>
		{#snippet meta()}
			{#if data.provision.chapter}<p class="chapter">{data.provision.chapter}</p>{/if}
		{/snippet}
	</PageHeader>

	<div class="card reading">
		{#if data.provision.fallback}<p class="fallback">{m.normen_fallback()}</p>{/if}

		<Blocks blocks={data.provision.blocks} />
	</div>

	{#if data.citedBy.length > 0}
		<section class="cited no-print">
			<h2 class="eyebrow">{m.normen_cited_by()}</h2>
			<ul>
				{#each data.citedBy as tool (tool.slug)}
					<li><a href={resolve(localized(`/werkzeuge/${tool.slug}`))}>{text(tool.name)}</a></li>
				{/each}
			</ul>
		</section>
	{/if}

	<p class="toolbar no-print">
		<a
			class="button quiet"
			href={resolve(
				localized(
					`/notizen?neu=1&titel=${encodeURIComponent(`${data.provision.label} ${data.law.law}${data.provision.title ? ` – ${data.provision.title}` : ''}`)}&text=${encodeURIComponent(`${data.provision.label} ${data.law.law}`)}`
				)
			)}>{m.notes_from_norm()}</a
		>
	</p>

	<nav class="pager no-print" aria-label={data.law.law}>
		{#if data.prev}
			<a class="card" href={href(data.prev.id)} rel="prev">
				<span class="eyebrow">← {m.normen_prev()}</span>
				<span class="target">{data.prev.label} {data.prev.title}</span>
			</a>
		{:else}<span></span>{/if}
		<a class="back" href={resolve(lawPath)}>{m.normen_back()}</a>
		{#if data.next}
			<a class="card" href={href(data.next.id)} rel="next">
				<span class="eyebrow">{m.normen_next()} →</span>
				<span class="target">{data.next.label} {data.next.title}</span>
			</a>
		{:else}<span></span>{/if}
	</nav>

	<p class="source">
		{data.source.version}.
		{m.normen_retrieved({ date: formatShortDate(data.retrieved, getLocale()) })}
		<a href={data.source.url} rel="external noopener" target="_blank">{m.normen_source()}</a>
	</p>
</article>

<style>
	.provision {
		/* the reading column: the law text at its measure plus the card's padding */
		--reading: calc(var(--measure) + 4.5rem);

		& .chapter {
			margin-top: 0.6rem;
			font-size: 14px;
			color: var(--ink2);
		}

		& .reading {
			max-width: var(--reading);
			padding: 1.75rem 2.25rem 2rem;

			@media (max-width: 40rem) {
				padding: 1.1rem 1rem 1.25rem;
			}

			@media print {
				padding: 0;
				border: 0;
				box-shadow: none;
			}
		}

		& .fallback {
			margin-bottom: 1.25rem;
			padding: 0.6rem 0.9rem;
			font-size: 14px;
			background: var(--khaki-soft);
			border-radius: var(--radius);
		}

		& .cited {
			max-width: var(--reading);
			margin-top: 2rem;

			& ul {
				display: flex;
				flex-wrap: wrap;
				gap: 0.5rem;
				margin-top: 0.6rem;
				list-style: none;
			}

			/* each citing tool as a chip */
			& a {
				display: inline-flex;
				align-items: center;
				min-height: 36px;
				padding: 0.3rem 0.8rem;
				font-family: var(--serif);
				font-size: 15px;
				background: var(--sheet);
				border: 1px solid var(--rule2);
				border-radius: var(--radius);
				box-shadow: var(--shadow-raised);
				transition: border-color 0.12s ease;

				&:hover {
					text-decoration: none;
					border-color: var(--navy);
				}

				@media (max-width: 40rem) {
					min-height: 44px;
				}
			}
		}

		& .toolbar {
			margin-top: 1.75rem;
		}

		& .pager {
			display: grid;
			grid-template-columns: 1fr auto 1fr;
			align-items: center;
			gap: 1rem;
			max-width: var(--reading);
			margin-top: 2rem;

			& .card {
				display: flex;
				flex-direction: column;
				gap: 0.2rem;
				min-width: 0;
				height: 100%;
				padding: 0.8rem 1rem;
				color: var(--ink);
				transition: border-color 0.12s ease;

				&:hover {
					text-decoration: none;
					border-color: var(--navy);
				}

				& .target {
					font-family: var(--serif);
					font-size: 15px;
					line-height: 1.35;
					overflow-wrap: anywhere;
				}
			}

			& a[rel='next'] {
				text-align: right;
			}

			& .back {
				font-size: 14px;
			}

			@media (max-width: 40rem) {
				grid-template-columns: 1fr;

				& a[rel='next'] {
					text-align: left;
				}

				& .back {
					order: 1;
					padding: 0.6rem 0;
				}
			}
		}

		& .source {
			max-width: var(--reading);
			margin-top: 1.5rem;
			font-size: 12px;
			color: var(--ink3);
		}
	}
</style>
