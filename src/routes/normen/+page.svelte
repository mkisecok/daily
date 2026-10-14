<script lang="ts">
	import { resolve } from '$app/paths';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { lawById } from '#lib/normen/laws.js';
	import { search, type SearchHit } from '#lib/normen/search.js';
	import type { SearchEntry } from '#lib/server/normen.js';
	import { text } from '#lib/tools/i18n.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const LIMIT = 50;
	const lang = getLocale() === 'en' ? 'en' : 'de';
	let query = $state('');
	let index = $state<SearchEntry[] | null>(null);
	let loading = $state(false);

	const hits = $derived<SearchHit[]>(index && query.trim().length >= 2 ? search(index, query) : []);

	/** Loads the index once, when the user starts typing. */
	async function ensureIndex() {
		if (index || loading) return;
		loading = true;
		const response = await fetch(resolve('/normen/suche/[lang].json', { lang }));
		index = (await response.json()) as SearchEntry[];
		loading = false;
	}
</script>

<svelte:head>
	<title>{m.nav_norms()} — Daily</title>
	<meta name="description" content={m.normen_intro()} />
</svelte:head>

<header class="head">
	<h1>{m.nav_norms()}</h1>
	<p class="measure intro">{m.normen_intro()}</p>
</header>

<ol class="laws">
	{#each data.laws as law (law.id)}
		<li>
			<a class="name" href={resolve(localized(`/normen/${law.id}`))}>{law.law}</a>
			<span class="full">{text(law.name)}</span>
			<span class="count">{m.normen_provisions({ count: law.count })}</span>
		</li>
	{/each}
</ol>

<section class="search">
	<label for="normen-search">{m.normen_search()}</label>
	<input
		id="normen-search"
		type="search"
		bind:value={query}
		onfocus={ensureIndex}
		oninput={ensureIndex}
		placeholder={m.normen_search_placeholder()}
		autocomplete="off"
	/>
	{#if loading}
		<p class="status">{m.normen_loading()}</p>
	{:else if index && query.trim().length >= 2}
		<p class="status" aria-live="polite">
			{hits.length === 0 ? m.normen_no_results() : m.normen_results({ count: hits.length })}
		</p>
		<ol class="hits">
			{#each hits.slice(0, LIMIT) as hit (hit.entry.law + hit.entry.id)}
				<li>
					<a href={resolve(localized(`/normen/${hit.entry.law}/${hit.entry.id}`))}>
						<span class="ref">{hit.entry.label} {lawById(hit.entry.law)?.law}</span>
						{hit.entry.title}
					</a>
					<p class="snippet">{hit.snippet}</p>
				</li>
			{/each}
		</ol>
		{#if hits.length > LIMIT}<p class="status">{m.normen_more({ count: LIMIT })}</p>{/if}
	{/if}
</section>

<style>
	.head {
		padding: 2.5rem 0 1rem;
		border-bottom: 2px solid var(--ink);

		& h1 {
			font-size: clamp(28px, 4vw, 40px);
		}
	}

	.intro {
		margin-top: 0.75rem;
		font-size: 15px;
		color: var(--ink2);
	}

	.laws {
		list-style: none;
		margin-top: 1rem;

		& li {
			display: grid;
			grid-template-columns: 7rem 1fr auto;
			gap: 0.25rem 1.5rem;
			align-items: baseline;
			padding: 0.9rem 0;
			border-bottom: 1px solid var(--rule2);

			@media (max-width: 40rem) {
				grid-template-columns: 1fr;
			}
		}
	}

	.name {
		font-family: var(--mono);
		font-size: 15px;
		font-weight: 600;
	}

	.full {
		font-family: var(--serif);
		font-size: 17px;
	}

	.count,
	.status {
		font-size: 13px;
		color: var(--ink3);
	}

	.search {
		margin-top: 2.5rem;

		& label {
			display: block;
			font-family: var(--serif);
			font-size: 20px;
		}

		& input {
			width: 100%;
			max-width: var(--measure);
			margin-top: 0.5rem;
			padding: 0.6rem 0.7rem;
			font: inherit;
			font-size: 16px;
			color: var(--ink);
			background: var(--sheet);
			border: 1px solid var(--rule);
		}

		& .status {
			margin-top: 0.75rem;
		}
	}

	.hits {
		list-style: none;
		margin-top: 0.5rem;
		max-width: var(--measure);

		& li {
			padding: 0.75rem 0;
			border-bottom: 1px solid var(--rule2);
		}

		& a {
			font-family: var(--serif);
			font-size: 16px;
		}
	}

	.ref {
		display: block;
		font-family: var(--mono);
		font-size: 12px;
		color: var(--ink3);
	}

	.snippet {
		margin-top: 0.25rem;
		font-size: 14px;
		color: var(--ink2);
	}
</style>
