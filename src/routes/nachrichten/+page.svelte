<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_PREVIEW } from '$app/env/public';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteMap, SvelteURLSearchParams } from 'svelte/reactivity';
	import { m } from '#lib/paraglide/messages.js';
	import { countOptions, matches, readNewsFilter } from '#lib/feed/filter.js';
	import {
		dayKey,
		formatDayParts,
		formatLongDate,
		formatShortDate,
		formatTime
	} from '#lib/i18n/date.js';
	import { localized, type RoutePath } from '#lib/i18n/links.js';
	import Icon from '#lib/ui/Icon.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import Tooltip from '#lib/ui/Tooltip.svelte';
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
	const label = (tag: string) => tagLabels[tag]?.() ?? tag;

	/**
	 * the static preview is prerendered without a query string, so it reads
	 * the URL only after hydration. Before that it renders exactly what was
	 * prerendered, so hydration matches.
	 */
	let hydrated = $state(false);
	onMount(() => {
		hydrated = true;
	});
	const search = $derived(PUBLIC_PREVIEW && !hydrated ? '' : page.url.search);

	const filter = $derived(readNewsFilter(new SvelteURLSearchParams(search), data.tags));
	const items = $derived(data.items.filter((item) => matches(item, filter)));
	const kindCounts = $derived(countOptions(data.items, filter, 'art', data.tags.kind));
	const regulationCounts = $derived(
		countOptions(data.items, filter, 'regelwerk', data.tags.regulation)
	);
	const filtered = $derived(filter.art !== null || filter.regelwerk !== null || data.merken);

	/** items grouped by publication day, newest first */
	const days = $derived.by(() => {
		const groups: { day: string; items: typeof data.items }[] = [];
		for (const item of items) {
			const day = dayKey(item.publishedAt);
			const last = groups.at(-1);
			if (last && last.day === day) last.items.push(item);
			else groups.push({ day, items: [item] });
		}
		return groups;
	});

	/** paging needs the database; the preview shows its fixed two-week window */
	const oldest = $derived(PUBLIC_PREVIEW ? null : (data.items.at(-1)?.publishedAt ?? null));

	const bookmarkEndpoint = resolve('/nachrichten/merken');
	/** bookmark state changed on this page since load, by item id */
	const toggled = new SvelteMap<string, boolean>();

	/** toggles without a reload; the form still works as a plain post without JS */
	async function toggleBookmark(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();
		const response = await fetch(bookmarkEndpoint, {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: new FormData(event.currentTarget)
		});
		if (!response.ok) return;
		const { itemId, bookmarked } = (await response.json()) as {
			itemId: string;
			bookmarked: boolean;
		};
		toggled.set(itemId, bookmarked);
	}

	/** current query with some parameters replaced; `null` removes one */
	function link(params: Record<string, string | null>): RoutePath {
		const next = new SvelteURLSearchParams(search);
		for (const [key, value] of Object.entries(params)) {
			if (value === null) next.delete(key);
			else next.set(key, value);
		}
		if (!('vor' in params)) next.delete('vor');
		const query = next.toString();
		return localized(`/nachrichten${query ? `?${query}` : ''}`);
	}

	/** a tag on an item filters by its group */
	function tagLink(tag: string): RoutePath {
		return data.tags.kind.includes(tag as never) ? link({ art: tag }) : link({ regelwerk: tag });
	}

	function pickRegulation(event: Event & { currentTarget: HTMLSelectElement }) {
		const value = event.currentTarget.value;
		void goto(resolve(link({ regelwerk: value || null })), { reset: false });
	}

	const kindOptions = $derived(
		data.tags.kind.filter((tag) => tag === filter.art || (kindCounts.get(tag) ?? 0) > 0)
	);
	const regulationOptions = $derived(
		data.tags.regulation.filter(
			(tag) => tag === filter.regelwerk || (regulationCounts.get(tag) ?? 0) > 0
		)
	);
</script>

<svelte:head>
	<title>{m.nav_feed()} — Daily</title>
	<meta name="description" content={m.feed_intro()} />
</svelte:head>

<PageHeader title={m.nav_feed()} description={m.feed_intro()} />

<nav class="filterbar no-print" aria-label={m.feed_filters()} data-sveltekit-reset="false">
	<div class="row">
		<ul class="kinds" aria-label={m.filter_kind()}>
			<li>
				<a
					href={resolve(link({ art: null }))}
					aria-current={filter.art === null ? 'true' : undefined}>{m.filter_all()}</a
				>
			</li>
			{#each kindOptions as tag (tag)}
				<li>
					<a
						href={resolve(link({ art: tag }))}
						aria-current={filter.art === tag ? 'true' : undefined}
						>{label(tag)} <span class="n">{kindCounts.get(tag)}</span></a
					>
				</li>
			{/each}
		</ul>
		<div class="side">
			<form method="get" class="regulation">
				<label class="visually-hidden" for="feed-regelwerk">{m.filter_regulation()}</label>
				{#if filter.art}<input type="hidden" name="art" value={filter.art} />{/if}
				{#if data.merken}<input type="hidden" name="merken" value="1" />{/if}
				<select
					id="feed-regelwerk"
					name="regelwerk"
					value={filter.regelwerk ?? ''}
					onchange={pickRegulation}
				>
					<option value="">{m.filter_regulation_all()}</option>
					{#each regulationOptions as tag (tag)}
						<option value={tag}>{label(tag)} ({regulationCounts.get(tag)})</option>
					{/each}
				</select>
				<noscript
					><button type="submit" class="button quiet">{m.filter_regulation()}</button></noscript
				>
			</form>
			{#if data.user}
				<a
					class="mine"
					href={resolve(link({ merken: data.merken ? null : '1' }))}
					aria-current={data.merken ? 'true' : undefined}
				>
					<Icon name={data.merken ? 'pinned' : 'pin'} size={16} />
					{m.filter_bookmarked()}
				</a>
			{/if}
		</div>
	</div>

	<div class="status">
		{#if filtered}
			<ul class="chips" aria-label={m.feed_active_filters()}>
				{#if filter.art}
					<li>
						<a
							href={resolve(link({ art: null }))}
							aria-label={m.feed_filter_remove({ label: label(filter.art) })}
							>{label(filter.art)} <Icon name="x" size={14} /></a
						>
					</li>
				{/if}
				{#if filter.regelwerk}
					<li>
						<a
							href={resolve(link({ regelwerk: null }))}
							aria-label={m.feed_filter_remove({ label: label(filter.regelwerk) })}
							>{label(filter.regelwerk)} <Icon name="x" size={14} /></a
						>
					</li>
				{/if}
				{#if data.merken}
					<li>
						<a
							href={resolve(link({ merken: null }))}
							aria-label={m.feed_filter_remove({ label: m.filter_bookmarked() })}
							>{m.filter_bookmarked()} <Icon name="x" size={14} /></a
						>
					</li>
				{/if}
			</ul>
			<a class="clear" href={resolve(link({ art: null, regelwerk: null, merken: null }))}
				>{m.feed_filters_clear()}</a
			>
		{/if}
		<p class="count" aria-live="polite">
			{filter.art || filter.regelwerk
				? m.feed_count_filtered({ shown: items.length, total: data.items.length })
				: m.feed_count({ count: items.length })}
		</p>
	</div>
</nav>

{#if days.length === 0}
	<p class="empty">{m.feed_empty()}</p>
{/if}

{#each days as { day, items } (day)}
	{@const parts = formatDayParts(day, data.locale)}
	<section class="day">
		<h2 class="rail">
			<span class="visually-hidden">{formatLongDate(day, data.locale)}</span>
			<span aria-hidden="true" class="num">{parts.day}</span>
			<span aria-hidden="true" class="when">{parts.weekday} {parts.month}</span>
		</h2>
		<ol class="list">
			{#each items as item (item.id)}
				{@const bookmarked = toggled.get(item.id) ?? item.bookmarked}
				<li class="item" data-tier={item.source.tier}>
					<p class="meta">
						<span class="source">{item.source.name}</span>
						<span class="sep">·</span>
						<span>{regionLabels[item.source.region]?.() ?? item.source.region}</span>
						<span class="sep">·</span>
						<time datetime={item.publishedAt}>{formatTime(item.publishedAt, data.locale)}</time>
						{#if item.lang !== data.locale}
							<span class="sep">·</span>
							<span>{item.lang.toUpperCase()}</span>
						{/if}
					</p>
					<h3>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external article URL from the source -->
						<a href={item.url} rel="noopener noreferrer external" target="_blank">{item.title}</a>
					</h3>
					{#if item.excerpt}
						<p class="excerpt">{item.excerpt}</p>
					{/if}
					<div class="foot">
						<p class="tags">
							{#each item.tags as tag, index (tag)}
								{#if index > 0}<span class="sep" aria-hidden="true">·</span>{/if}
								<a href={resolve(tagLink(tag))} data-sveltekit-reset="false">{label(tag)}</a>
							{/each}
						</p>
						<div class="actions no-print">
							{#if data.user}
								<form method="post" action={bookmarkEndpoint} onsubmit={toggleBookmark}>
									<input type="hidden" name="item" value={item.id} />
									<input type="hidden" name="back" value={page.url.pathname + page.url.search} />
									<button type="submit" aria-pressed={bookmarked}>
										<Icon name={bookmarked ? 'pinned' : 'pin'} size={16} />
										{bookmarked ? m.bookmark_remove() : m.bookmark_add()}
									</button>
								</form>
							{/if}
							{#if data.user || PUBLIC_PREVIEW}
								<a
									href={resolve(
										localized(
											`/notizen?neu=1&titel=${encodeURIComponent(item.title)}&quelle=${encodeURIComponent(item.url)}`
										)
									)}><Icon name="notes" size={16} /> {m.notes_from_feed()}</a
								>
							{/if}
						</div>
					</div>
				</li>
			{/each}
		</ol>
	</section>
{/each}

{#if oldest && data.items.length > 0}
	<p class="older no-print">
		<a class="button quiet" href={resolve(link({ vor: oldest }))}>{m.feed_older()} →</a>
	</p>
{/if}

<aside class="sources no-print">
	<h2>{m.feed_sources()}</h2>
	<ul>
		{#each data.sources as source (source.slug)}
			<li>
				<span class="name">{source.name}</span>
				{#if source.lastItemAt}
					<span class="last"
						>{m.feed_source_last({ date: formatShortDate(source.lastItemAt, data.locale) })}</span
					>
				{/if}
				{#if source.lastError}
					<Tooltip text={source.lastError}>
						<span class="error"
							><Icon name="alert-triangle" size={14} label={source.lastError} /></span
						>
					</Tooltip>
				{/if}
			</li>
		{/each}
	</ul>
</aside>

<style>
	/* a masthead: a heavy rule on top, text tabs, then the active filters and the count */
	.filterbar {
		margin-top: 1.5rem;
		border-top: 2px solid var(--ink);
		border-bottom: 1px solid var(--rule);

		& .row {
			display: flex;
			flex-wrap: wrap;
			align-items: stretch;
			justify-content: space-between;
			gap: 0 1.5rem;
			border-bottom: 1px solid var(--rule2);
		}

		& .kinds {
			list-style: none;
			display: flex;
			gap: 0.25rem;
			margin: 0;
			padding: 0;

			@media (max-width: 40rem) {
				flex: 1 1 100%;
				overflow-x: auto;
				scrollbar-width: none;
			}

			& a {
				display: inline-flex;
				align-items: center;
				gap: 0.35rem;
				min-height: 2.75rem;
				padding: 0 0.6rem;
				font-size: 14px;
				font-weight: 500;
				color: var(--ink2);
				white-space: nowrap;

				&:hover {
					color: var(--ink);
					text-decoration: none;
				}

				&[aria-current='true'] {
					font-weight: 600;
					color: var(--ink);
					box-shadow: inset 0 -3px 0 var(--primary);
				}

				& .n {
					font-size: 12px;
					font-variant-numeric: tabular-nums;
					color: var(--ink3);
				}
			}

			& li:first-child a {
				padding-left: 0;
			}
		}

		& .side {
			display: flex;
			align-items: center;
			gap: 1rem;

			@media (max-width: 40rem) {
				flex: 1 1 100%;
				justify-content: space-between;
				padding: 0.5rem 0;
				border-top: 1px solid var(--rule2);
			}
		}

		& .regulation select {
			padding-block: 0.4rem;
			font-size: 14px;
			border-radius: 4px;

			@media (max-width: 40rem) {
				padding-block: 0.65rem;
			}
		}

		& .mine {
			display: inline-flex;
			align-items: center;
			gap: 0.35rem;
			min-height: 2.25rem;
			font-size: 14px;
			font-weight: 500;
			color: var(--ink2);

			&:hover {
				color: var(--ink);
				text-decoration: none;
			}

			&[aria-current='true'] {
				color: var(--primary);
			}

			@media (max-width: 40rem) {
				min-height: 44px;
			}
		}

		& .status {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.5rem 0.75rem;
			min-height: 3rem;
			padding: 0.5rem 0;
		}

		& .chips {
			list-style: none;
			display: flex;
			flex-wrap: wrap;
			gap: 0.4rem;
			margin: 0;
			padding: 0;

			& a {
				display: inline-flex;
				align-items: center;
				gap: 0.35rem;
				min-height: 2rem;
				padding: 0 0.4rem 0 0.6rem;
				font-size: 13px;
				font-weight: 600;
				color: var(--primary);
				background: var(--primary-soft);
				border-left: 3px solid var(--primary);
				border-radius: 2px;

				&:hover {
					text-decoration: none;
					background: var(--primary);
					color: var(--on-primary);
				}

				@media (max-width: 40rem) {
					min-height: 40px;
				}
			}
		}

		& .clear {
			font-size: 13px;
			color: var(--ink3);
			text-decoration: underline;
			text-underline-offset: 0.2em;

			&:hover {
				color: var(--ink);
			}
		}

		& .count {
			margin-left: auto;
			font-family: var(--serif);
			font-size: 15px;
			color: var(--ink2);
			font-variant-numeric: tabular-nums;
		}
	}

	.empty {
		padding: 3rem 0;
		font-family: var(--serif);
		font-size: 18px;
		color: var(--ink3);
	}

	/* a date rail on the left, the column of the day on the right */
	.day {
		display: grid;
		grid-template-columns: 5.5rem minmax(0, 1fr);
		gap: 0 2rem;
		padding-top: 1.25rem;

		& + .day {
			border-top: 1px solid var(--rule);
		}

		@media (max-width: 40rem) {
			grid-template-columns: minmax(0, 1fr);
		}

		& .rail {
			position: sticky;
			top: 4.75rem;
			align-self: start;
			display: flex;
			flex-direction: column;
			font-family: var(--serif);

			@media (max-width: 40rem) {
				position: static;
				flex-direction: row;
				align-items: baseline;
				gap: 0.5rem;
				margin-bottom: 0.75rem;
			}

			& .num {
				font-size: 2.75rem;
				font-weight: 600;
				line-height: 1;
				color: var(--ink);
				font-variant-numeric: lining-nums;

				@media (max-width: 40rem) {
					font-size: 1.75rem;
				}
			}

			& .when {
				margin-top: 0.35rem;
				font-family: var(--sans);
				font-size: 13px;
				font-weight: 500;
				color: var(--ink3);
			}
		}

		& .list {
			list-style: none;
			margin: 0;
			padding: 0;
		}
	}

	.item {
		max-width: var(--measure);
		padding: 0 0 1.25rem;

		& + .item {
			padding-top: 1.25rem;
			border-top: 1px solid var(--rule2);
		}

		& .meta {
			display: flex;
			flex-wrap: wrap;
			align-items: baseline;
			font-size: 13px;
			color: var(--ink3);

			& .source {
				font-weight: 600;
				color: var(--ink2);
			}

			& .sep {
				margin: 0 0.4rem;
			}
		}

		& h3 {
			margin-top: 0.25rem;
			font-family: var(--serif);
			font-size: 1.125rem;
			font-weight: 500;
			line-height: 1.3;
			overflow-wrap: anywhere;

			& a {
				color: var(--ink);

				&:hover {
					color: var(--primary);
					text-decoration: underline;
					text-decoration-thickness: 1px;
					text-underline-offset: 0.18em;
				}
			}
		}

		& .excerpt {
			display: -webkit-box;
			margin-top: 0.35rem;
			overflow: hidden;
			font-size: 14px;
			line-height: 1.55;
			color: var(--ink2);
			overflow-wrap: anywhere;
			-webkit-line-clamp: 2;
			line-clamp: 2;
			-webkit-box-orient: vertical;
		}

		/* the authorities and courts lead: a short blue rule and a larger headline */
		&[data-tier='1'] {
			&::before {
				content: '';
				display: block;
				width: 1.75rem;
				height: 3px;
				margin-bottom: 0.6rem;
				background: var(--primary);
			}

			& .meta .source {
				color: var(--primary);
			}

			& h3 {
				font-size: 1.375rem;
				font-weight: 600;
				line-height: 1.25;
			}

			& .excerpt {
				-webkit-line-clamp: 4;
				line-clamp: 4;
			}
		}

		& .foot {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			justify-content: space-between;
			gap: 0.25rem 1rem;
			margin-top: 0.5rem;
		}

		& .tags {
			font-size: 13px;
			color: var(--ink3);

			& a {
				font-weight: 500;
				color: var(--ink2);

				&:hover {
					color: var(--primary);
				}
			}

			& .sep {
				margin: 0 0.35rem;
			}
		}

		& .actions {
			display: flex;
			gap: 0.25rem;

			& a,
			& button {
				display: inline-flex;
				align-items: center;
				gap: 0.3rem;
				min-height: 2rem;
				padding: 0 0.45rem;
				font-size: 13px;
				font-weight: 500;
				color: var(--ink3);
				border-radius: 4px;

				&:hover {
					color: var(--ink);
					text-decoration: none;
					background: var(--neutral-soft);
				}

				@media (max-width: 40rem) {
					min-height: 44px;
				}
			}

			& button[aria-pressed='true'] {
				color: var(--primary);
			}
		}
	}

	.older {
		margin-top: 2rem;
		padding-left: 7.5rem;

		@media (max-width: 40rem) {
			padding-left: 0;
		}

		& .button {
			min-height: 44px;
		}
	}

	/* the sources as a colophon: what was read, and when last */
	.sources {
		margin-top: 3rem;
		padding-top: 1rem;
		border-top: 2px solid var(--ink);

		& h2 {
			font-family: var(--sans);
			font-size: 13px;
			font-weight: 600;
			color: var(--ink2);
		}

		& ul {
			list-style: none;
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
			gap: 0.35rem 1.5rem;
			margin: 0.6rem 0 0;
			padding: 0;
			font-size: 13px;

			& li {
				display: flex;
				align-items: baseline;
				gap: 0.4rem;
			}

			& .name {
				color: var(--ink2);
			}

			& .last {
				color: var(--ink3);
			}

			& .error {
				color: var(--wax);
			}
		}
	}
</style>
