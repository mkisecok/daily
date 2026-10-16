<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { localized } from '#lib/i18n/links.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { lawById } from '#lib/normen/laws.js';
	import { search, type SearchHit } from '#lib/normen/search.js';
	import type { SearchEntry } from '#lib/server/normen.js';
	import { text } from '#lib/tools/i18n.js';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const LIMIT = 50;
	const lang = getLocale() === 'en' ? 'en' : 'de';
	let query = $state('');
	let index = $state<SearchEntry[] | null>(null);
	let loading = $state(false);

	const hits = $derived<SearchHit[]>(index && query.trim().length >= 2 ? search(index, query) : []);

	// a search handed over in the address (e.g. from the command palette) fills the field
	afterNavigate(({ to }) => {
		const handed = to?.url.searchParams.get('q');
		if (handed) {
			query = handed;
			void ensureIndex();
		}
	});

	/** loads the index once, when the user starts typing */
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

<PageHeader title={m.nav_norms()} description={m.normen_intro()} />

<section class="search">
	<div class="card field">
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
		{/if}
	</div>
	{#if !loading && index && query.trim().length >= 2}
		{#if hits.length > 0}
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
		{/if}
		{#if hits.length > LIMIT}<p class="status more">{m.normen_more({ count: LIMIT })}</p>{/if}
	{/if}
</section>

<ol class="laws">
	{#each data.laws as law (law.id)}
		<li class="card">
			<a class="name" href={resolve(localized(`/normen/${law.id}`))}>{law.law}</a>
			<span class="full">{text(law.name)}</span>
			<span class="count badge">{m.normen_provisions({ count: law.count })}</span>
		</li>
	{/each}
</ol>

<style>
	.status {
		font-size: 13px;
		color: var(--ink3);
	}

	.search {
		max-width: calc(var(--measure) + 3rem);

		& .field {
			padding: 1.25rem 1.5rem;

			@media (max-width: 40rem) {
				padding: 1rem;
			}

			& label {
				display: block;
				font-family: var(--serif);
				font-size: 19px;
				font-weight: 600;
			}

			& input {
				width: 100%;
				min-height: 48px;
				margin-top: 0.6rem;
				font-size: 16px;
			}

			& .status {
				margin-top: 0.6rem;
			}
		}

		& .more {
			margin-top: 0.75rem;
		}

		/* the hits as rows in one raised list, like the records */
		& .hits {
			list-style: none;
			margin-top: 1rem;
			overflow: hidden;
			background: var(--sheet);
			border: 1px solid var(--rule2);
			border-radius: var(--radius-card);
			box-shadow: var(--shadow-raised);

			& li {
				position: relative;
				padding: 0.85rem 1.25rem;
				transition: background-color 0.12s ease;

				& + li {
					border-top: 1px solid var(--rule2);
				}

				&:hover {
					background: var(--navy-soft);
				}
			}

			& a {
				font-family: var(--serif);
				font-size: 16px;
				font-weight: 600;
				color: var(--ink);

				/* the whole row opens the provision */
				&::after {
					content: '';
					position: absolute;
					inset: 0;
				}

				& .ref {
					display: block;
					font-family: var(--mono);
					font-size: 12px;
					font-weight: 500;
					color: var(--navy);
				}
			}

			& .snippet {
				margin-top: 0.25rem;
				font-size: 14px;
				color: var(--ink2);
				overflow-wrap: anywhere;
			}
		}
	}

	.laws {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
		gap: 1rem;
		list-style: none;
		margin-top: 2rem;

		& li {
			position: relative;
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: 0.35rem;
			padding: 1.1rem 1.25rem;
			transition: border-color 0.12s ease;

			&:hover {
				border-color: var(--rule);
			}

			&:has(.name:focus-visible) {
				outline: 2px solid var(--navy);
				outline-offset: 2px;
			}

			& .name {
				font-family: var(--mono);
				font-size: 15px;
				font-weight: 600;

				/* the whole card opens the law */
				&::after {
					content: '';
					position: absolute;
					inset: 0;
					border-radius: inherit;
				}
			}

			& .full {
				flex: 1;
				font-family: var(--serif);
				font-size: 16px;
				line-height: 1.35;
				color: var(--ink);
			}

			& .count {
				margin-top: 0.4rem;
			}
		}
	}
</style>
