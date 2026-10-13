<script lang="ts">
	import type { Path } from '$app/types';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { m } from '#lib/paraglide/messages.js';
	import { formatLongDate } from '#lib/i18n/date.js';
	import { localized } from '#lib/i18n/links.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const tagLabels: Record<string, () => string> = {
		dsgvo: () => 'DSGVO',
		'ki-vo': () => 'KI-VO',
		bdsg: () => 'BDSG',
		tdddg: () => 'TDDDG',
		'data-act': () => 'Data Act',
		dsa: () => 'DSA',
		nis2: () => 'NIS2',
		bussgeld: m.tag_bussgeld,
		rechtsprechung: m.tag_rechtsprechung,
		aufsicht: m.tag_aufsicht,
		gesetzgebung: m.tag_gesetzgebung,
		leitlinie: m.tag_leitlinie
	};
	const regionLabels: Record<string, () => string> = {
		eu: () => 'EU',
		de: m.region_de,
		land: m.region_land
	};
	const regions = ['eu', 'de', 'land'];

	/** Items grouped by publication day, newest first. */
	const days = $derived.by(() => {
		const groups: { day: string; items: typeof data.items }[] = [];
		for (const item of data.items) {
			const day = item.publishedAt.slice(0, 10);
			const last = groups.at(-1);
			if (last && last.day === day) last.items.push(item);
			else groups.push({ day, items: [item] });
		}
		return groups;
	});

	const oldest = $derived(data.items.at(-1)?.publishedAt ?? null);

	/** Named action that keeps the active filters in the URL after the POST. */
	const bookmarkAction = $derived(page.url.search ? `${page.url.search}&/bookmark` : '?/bookmark');

	/** Current query with some parameters replaced; `null` removes one. */
	function link(params: Record<string, string | null>): Path {
		const search = new SvelteURLSearchParams(page.url.search);
		for (const [key, value] of Object.entries(params)) {
			if (value === null) search.delete(key);
			else search.set(key, value);
		}
		if (!('vor' in params)) search.delete('vor');
		const query = search.toString();
		return localized(`/nachrichten${query ? `?${query}` : ''}`);
	}

	function time(iso: string): string {
		return new Intl.DateTimeFormat(data.locale === 'en' ? 'en-GB' : 'de', {
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(iso));
	}
</script>

<svelte:head>
	<title>{m.nav_feed()} — Daily</title>
	<meta name="description" content={m.feed_intro()} />
</svelte:head>

<header class="head">
	<h1>{m.nav_feed()}</h1>
	<p class="measure lead">{m.feed_intro()}</p>
</header>

<nav class="filters no-print" aria-label={m.feed_filters()}>
	<div class="group">
		<span class="eyebrow">{m.filter_regulation()}</span>
		<a
			href={resolve(link({ tag: null }))}
			aria-current={data.filter.tag === null ? 'true' : undefined}
		>
			{m.filter_all()}
		</a>
		{#each data.tags.regulation as tag (tag)}
			<a href={resolve(link({ tag }))} aria-current={data.filter.tag === tag ? 'true' : undefined}>
				{tagLabels[tag]()}
			</a>
		{/each}
	</div>
	<div class="group">
		<span class="eyebrow">{m.filter_kind()}</span>
		{#each data.tags.kind as tag (tag)}
			<a href={resolve(link({ tag }))} aria-current={data.filter.tag === tag ? 'true' : undefined}>
				{tagLabels[tag]()}
			</a>
		{/each}
	</div>
	<div class="group">
		<span class="eyebrow">{m.filter_region()}</span>
		<a
			href={resolve(link({ region: null }))}
			aria-current={data.filter.region === null ? 'true' : undefined}
		>
			{m.filter_all()}
		</a>
		{#each regions as region (region)}
			<a
				href={resolve(link({ region }))}
				aria-current={data.filter.region === region ? 'true' : undefined}
			>
				{regionLabels[region]()}
			</a>
		{/each}
	</div>
	{#if data.user}
		<div class="group">
			<span class="eyebrow">{m.filter_mine()}</span>
			<a
				href={resolve(link({ merken: data.filter.merken ? null : '1' }))}
				aria-current={data.filter.merken ? 'true' : undefined}
			>
				{m.filter_bookmarked()}
			</a>
		</div>
	{/if}
</nav>

{#if days.length === 0}
	<p class="empty">{m.feed_empty()}</p>
{/if}

{#each days as { day, items } (day)}
	<section class="day">
		<h2 class="dateline">{formatLongDate(day, data.locale)}</h2>
		<ol>
			{#each items as item (item.id)}
				<li class="item" data-tier={item.source.tier}>
					<p class="meta">
						<a class="source" href={resolve(link({ quelle: item.source.slug }))}>
							{item.source.name}
						</a>
						<span class="sep">·</span>
						<span class="region">{regionLabels[item.source.region]()}</span>
						<span class="sep">·</span>
						<time datetime={item.publishedAt}>{time(item.publishedAt)}</time>
						{#if item.lang !== data.locale}
							<span class="sep">·</span>
							<span class="lang">{item.lang.toUpperCase()}</span>
						{/if}
					</p>
					<h3>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external article URL from the source -->
						<a href={item.url} rel="noopener noreferrer external" target="_blank">{item.title}</a>
					</h3>
					{#if item.excerpt}
						<p class="excerpt measure">{item.excerpt}</p>
					{/if}
					<div class="tags">
						{#each item.tags as tag (tag)}
							<a class="tag" href={resolve(link({ tag }))}>{tagLabels[tag]?.() ?? tag}</a>
						{/each}
						{#if data.user}
							<form method="post" action={bookmarkAction} use:enhance class="bookmark">
								<input type="hidden" name="item" value={item.id} />
								<button type="submit" aria-pressed={item.bookmarked}>
									{item.bookmarked ? m.bookmark_remove() : m.bookmark_add()}
								</button>
							</form>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	</section>
{/each}

{#if oldest && data.items.length > 0}
	<p class="older no-print">
		<a href={resolve(link({ vor: oldest }))}>{m.feed_older()} →</a>
	</p>
{/if}

<aside class="sources no-print">
	<h2 class="eyebrow">{m.feed_sources()}</h2>
	<ul>
		{#each data.sources as source (source.slug)}
			<li>
				<a href={resolve(link({ quelle: source.slug }))}>{source.name}</a>
				{#if source.lastError}<span class="error" title={source.lastError}>!</span>{/if}
			</li>
		{/each}
	</ul>
</aside>

<style>
	.head {
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--rule);

		& h1 {
			font-size: clamp(30px, 4vw, 40px);
		}

		& .lead {
			margin-top: 0.75rem;
			font-size: 16px;
			color: var(--ink2);
		}
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem 2.5rem;
		padding: 1rem 0;
		border-bottom: 1px solid var(--rule2);
		font-family: var(--mono);
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;

		& .group {
			display: flex;
			flex-wrap: wrap;
			align-items: baseline;
			gap: 0.9rem;
		}

		& a {
			color: var(--ink3);
			padding-bottom: 1px;
			border-bottom: 1px solid transparent;

			&:hover {
				color: var(--ink);
				text-decoration: none;
			}

			&[aria-current='true'] {
				color: var(--ink);
				border-bottom-color: var(--ink);
			}
		}
	}

	.empty {
		padding: 3rem 0;
		color: var(--ink3);
		font-style: italic;
	}

	.day {
		padding-top: 2rem;

		& .dateline {
			font-size: 16px;
			font-weight: 600;
			color: var(--ink2);
			padding-bottom: 0.5rem;
			border-bottom: 1px solid var(--rule);
		}

		& ol {
			list-style: none;
		}
	}

	.item {
		padding: 1.1rem 0;
		border-bottom: 1px solid var(--rule2);

		& .meta {
			font-family: var(--mono);
			font-size: 11px;
			letter-spacing: 0.06em;
			text-transform: uppercase;
			color: var(--ink3);

			& .source {
				color: var(--ink2);
			}
		}

		&[data-tier='1'] .meta .source {
			color: var(--navy);
		}

		& .sep {
			margin: 0 0.4rem;
		}

		& h3 {
			margin-top: 0.3rem;
			font-size: 19px;
			font-weight: 600;
			max-width: var(--measure);

			& a {
				color: var(--ink);

				&:hover {
					text-decoration: underline;
				}
			}
		}

		& .excerpt {
			margin-top: 0.35rem;
			font-size: 14px;
			color: var(--ink2);
		}

		& .tags {
			display: flex;
			flex-wrap: wrap;
			align-items: baseline;
			gap: 0.75rem;
			margin-top: 0.5rem;
			font-family: var(--mono);
			font-size: 10.5px;
			letter-spacing: 0.1em;
			text-transform: uppercase;

			& .tag {
				color: var(--ink3);

				&:hover {
					color: var(--ink);
					text-decoration: none;
				}
			}
		}

		& .bookmark {
			margin-left: auto;

			& button {
				font: inherit;
				letter-spacing: inherit;
				text-transform: inherit;
				color: var(--navy);
				padding: 0;

				&[aria-pressed='true'] {
					color: var(--khaki);
				}
			}
		}
	}

	.older {
		margin-top: 2rem;
		font-family: var(--mono);
		font-size: 12px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.sources {
		margin-top: 3rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--rule);

		& ul {
			list-style: none;
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem 1.5rem;
			margin-top: 0.5rem;
			font-size: 13px;
		}

		& .error {
			margin-left: 0.3rem;
			color: var(--wax);
			font-family: var(--mono);
		}
	}
</style>
