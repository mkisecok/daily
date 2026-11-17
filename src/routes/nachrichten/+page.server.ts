import { PUBLIC_PREVIEW } from '$app/env/public';
import { db } from '#lib/server/db/index.js';
import { fetchLiveFeed } from '#lib/server/feed/live.js';
import { listFeed, listSources, type FeedFilter } from '#lib/server/feed/query.js';
import { KIND_TAGS, REGULATION_TAGS } from '#lib/server/feed/tagging.js';
import type { PageServerLoad } from './$types';

/** paging and bookmarks need the database; Art and Regelwerk filter on the page */
function readFilter(url: URL, userId?: string): FeedFilter {
	const before = url.searchParams.get('vor');
	const merken = url.searchParams.get('merken') === '1';
	const beforeDate = before ? new Date(before) : undefined;
	return {
		before: beforeDate && !Number.isNaN(beforeDate.getTime()) ? beforeDate : undefined,
		bookmarkedBy: merken && userId ? userId : undefined
	};
}

const tags = { regulation: REGULATION_TAGS, kind: KIND_TAGS };

export const load: PageServerLoad = async ({ url, locals }) => {
	if (PUBLIC_PREVIEW) {
		// prerendered: no query string, no database. The page filters in the browser.
		const { items, sources } = await fetchLiveFeed();
		return {
			items: items.map((item) => ({ ...item, publishedAt: item.publishedAt.toISOString() })),
			sources,
			merken: false,
			tags
		};
	}

	const filter = readFilter(url, locals.user?.id);
	const [items, sources] = await Promise.all([
		listFeed(db, filter, locals.user?.id),
		listSources(db)
	]);
	return {
		items: items.map((item) => ({ ...item, publishedAt: item.publishedAt.toISOString() })),
		sources: sources.map((s) => ({ ...s, lastItemAt: s.lastItemAt?.toISOString() ?? null })),
		merken: Boolean(filter.bookmarkedBy),
		tags
	};
};
