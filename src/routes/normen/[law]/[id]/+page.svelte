<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatShortDate } from '#lib/i18n/date.js';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import Blocks from '#lib/normen/ui/Blocks.svelte';
	import { text } from '#lib/tools/i18n.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const lawPath = $derived(localized(`/normen/${data.law.id}`));
	const href = (id: string) => resolve(localized(`/normen/${data.law.id}/${id}`));
</script>

<svelte:head>
	<title>{data.provision.label} {data.law.law} — Daily</title>
	<meta name="description" content="{data.provision.label} {data.law.law} {data.provision.title}" />
</svelte:head>

<article class="provision">
	<header class="head">
		<p class="eyebrow">
			<a href={resolve(localized('/normen'))}>{m.nav_norms()}</a> ·
			<a href={resolve(lawPath)}>{data.law.law}</a>
			{#if data.provision.chapter}· {data.provision.chapter}{/if}
		</p>
		<h1>
			<span class="ref">{data.provision.label} {data.law.law}</span>
			{data.provision.title}
		</h1>
	</header>

	{#if data.provision.fallback}<p class="fallback">{m.normen_fallback()}</p>{/if}

	<Blocks blocks={data.provision.blocks} />

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
			<a href={href(data.prev.id)} rel="prev">← {data.prev.label} {data.prev.title}</a>
		{:else}<span></span>{/if}
		<a href={resolve(lawPath)}>{m.normen_back()}</a>
		{#if data.next}
			<a href={href(data.next.id)} rel="next">{data.next.label} {data.next.title} →</a>
		{:else}<span></span>{/if}
	</nav>

	<p class="source">
		{data.source.version}.
		{m.normen_retrieved({ date: formatShortDate(data.retrieved, getLocale()) })}
		<a href={data.source.url} rel="external noopener" target="_blank">{m.normen_source()}</a>
	</p>
</article>

<style>
	.head {
		padding: 2.5rem 0 1rem;
		border-bottom: 2px solid var(--ink);

		& h1 {
			margin-top: 0.5rem;
			font-size: clamp(24px, 3.2vw, 34px);
		}
	}

	.ref {
		display: block;
		font-family: var(--mono);
		font-size: 14px;
		font-weight: 500;
		color: var(--navy);
	}

	.fallback {
		margin-top: 1.25rem;
		padding: 0.6rem 0.9rem;
		border-left: 3px solid var(--khaki);
		background: var(--khaki-soft);
		font-size: 14px;
		max-width: var(--measure);
	}

	.provision :global(.blocks) {
		margin-top: 1rem;
	}

	.cited {
		margin-top: 2.5rem;

		& ul {
			list-style: none;
			margin-top: 0.5rem;
			display: flex;
			flex-wrap: wrap;
			gap: 0.4rem 1.5rem;
		}

		& li {
			font-family: var(--serif);
			font-size: 15px;
		}
	}

	.toolbar {
		margin-top: 2rem;
	}

	.pager {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 1rem;
		margin-top: 2.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--rule);
		font-size: 14px;

		& a[rel='next'] {
			text-align: right;
		}

		@media (max-width: 40rem) {
			grid-template-columns: 1fr;

			& a[rel='next'] {
				text-align: left;
			}
		}
	}

	.source {
		margin-top: 1.5rem;
		font-size: 12px;
		color: var(--ink3);
		max-width: var(--measure);
	}
</style>
