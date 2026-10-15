import { and, desc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { bookmarks, feedItems, feedSources } from '../db/schema.js';

export type FeedFilter = {
	tag?: string;
	region?: 'eu' | 'de' | 'land';
	source?: string;
	/** exclusive upper bound for publishedAt (pagination by day) */
	before?: Date;
	/** only items the given user bookmarked */
	bookmarkedBy?: string;
};

export type FeedRow = {
	id: string;
	url: string;
	title: string;
	excerpt: string | null;
	publishedAt: Date;
	lang: string;
	tags: string[];
	source: { slug: string; name: string; region: string; tier: number };
	bookmarked: boolean;
};

const PAGE_DAYS = 14;
const PAGE_LIMIT = 200;

/** items of the last 14 days before `before`, newest first, with bookmark state */
export async function listFeed(
	db: Database,
	filter: FeedFilter,
	userId?: string
): Promise<FeedRow[]> {
	const before = filter.before ?? new Date();
	const since = new Date(before.getTime() - PAGE_DAYS * 24 * 60 * 60 * 1000);

	const conditions = [lt(feedItems.publishedAt, before), gte(feedItems.publishedAt, since)];
	if (filter.tag) conditions.push(sql`${feedItems.tags} @> ARRAY[${filter.tag}]::text[]`);
	if (filter.region) conditions.push(eq(feedSources.region, filter.region));
	if (filter.source) conditions.push(eq(feedSources.slug, filter.source));
	if (filter.bookmarkedBy) {
		conditions.push(
			inArray(
				feedItems.id,
				db
					.select({ id: bookmarks.itemId })
					.from(bookmarks)
					.where(eq(bookmarks.userId, filter.bookmarkedBy))
			)
		);
	}

	const bookmarked = userId
		? sql<boolean>`exists (select 1 from ${bookmarks} where ${bookmarks.itemId} = ${feedItems.id} and ${bookmarks.userId} = ${userId})`
		: sql<boolean>`false`;

	const rows = await db
		.select({
			id: feedItems.id,
			url: feedItems.url,
			title: feedItems.title,
			excerpt: feedItems.excerpt,
			publishedAt: feedItems.publishedAt,
			lang: feedItems.lang,
			tags: feedItems.tags,
			sourceSlug: feedSources.slug,
			sourceName: feedSources.name,
			sourceRegion: feedSources.region,
			sourceTier: feedSources.tier,
			bookmarked
		})
		.from(feedItems)
		.innerJoin(feedSources, eq(feedSources.id, feedItems.sourceId))
		.where(and(...conditions))
		.orderBy(desc(feedItems.publishedAt))
		.limit(PAGE_LIMIT);

	return rows.map((row) => ({
		id: row.id,
		url: row.url,
		title: row.title,
		excerpt: row.excerpt,
		publishedAt: row.publishedAt,
		lang: row.lang,
		tags: row.tags,
		source: {
			slug: row.sourceSlug,
			name: row.sourceName,
			region: row.sourceRegion,
			tier: row.sourceTier
		},
		bookmarked: row.bookmarked
	}));
}

export async function listSources(db: Database) {
	return db
		.select({
			slug: feedSources.slug,
			name: feedSources.name,
			region: feedSources.region,
			tier: feedSources.tier,
			lastItemAt: feedSources.lastItemAt,
			lastError: feedSources.lastError
		})
		.from(feedSources)
		.where(eq(feedSources.active, true))
		.orderBy(feedSources.tier, feedSources.name);
}

export async function toggleBookmark(
	db: Database,
	userId: string,
	itemId: string
): Promise<boolean> {
	const existing = await db
		.select({ itemId: bookmarks.itemId })
		.from(bookmarks)
		.where(and(eq(bookmarks.userId, userId), eq(bookmarks.itemId, itemId)))
		.limit(1);
	if (existing.length > 0) {
		await db
			.delete(bookmarks)
			.where(and(eq(bookmarks.userId, userId), eq(bookmarks.itemId, itemId)));
		return false;
	}
	await db.insert(bookmarks).values({ userId, itemId }).onConflictDoNothing();
	return true;
}
