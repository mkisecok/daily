import { db } from '#lib/server/db/index.js';
import { listFeed, listSources, type FeedFilter } from '#lib/server/feed/query.js';
import { KIND_TAGS, REGULATION_TAGS } from '#lib/server/feed/tagging.js';
import type { PageServerLoad } from './$types';

const REGIONS = ['eu', 'de', 'land'] as const;
const ALL_TAGS: readonly string[] = [...REGULATION_TAGS, ...KIND_TAGS];

function readFilter(url: URL, userId?: string): FeedFilter {
	const tag = url.searchParams.get('tag') ?? undefined;
	const region = url.searchParams.get('region') ?? undefined;
	const source = url.searchParams.get('quelle') ?? undefined;
	const before = url.searchParams.get('vor');
	const merken = url.searchParams.get('merken') === '1';
	const beforeDate = before ? new Date(before) : undefined;
	return {
		tag: tag && ALL_TAGS.includes(tag) ? tag : undefined,
		region: REGIONS.includes(region as (typeof REGIONS)[number])
			? (region as FeedFilter['region'])
			: undefined,
		source,
		before: beforeDate && !Number.isNaN(beforeDate.getTime()) ? beforeDate : undefined,
		bookmarkedBy: merken && userId ? userId : undefined
	};
}

export const load: PageServerLoad = async ({ url, locals }) => {
	const filter = readFilter(url, locals.user?.id);
	const [items, sources] = await Promise.all([
		listFeed(db, filter, locals.user?.id),
		listSources(db)
	]);
	return {
		items: items.map((item) => ({ ...item, publishedAt: item.publishedAt.toISOString() })),
		sources: sources.map((s) => ({ ...s, lastItemAt: s.lastItemAt?.toISOString() ?? null })),
		filter: {
			tag: filter.tag ?? null,
			region: filter.region ?? null,
			source: filter.source ?? null,
			before: filter.before?.toISOString() ?? null,
			merken: Boolean(filter.bookmarkedBy)
		},
		tags: { regulation: REGULATION_TAGS, kind: KIND_TAGS }
	};
};
