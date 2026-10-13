import { createHash } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { feedItems, feedSources } from '../db/schema.js';
import { fetchHtml } from './adapters/html.js';
import { fetchRss } from './adapters/rss.js';
import { SOURCES } from './sources.js';
import { isRelevant, tagText } from './tagging.js';
import type { RawItem, SourceDefinition } from './types.js';

export type IngestStats = { slug: string; fetched: number; inserted: number; error?: string }[];

/** Mirrors `SOURCES` into the table without touching runtime columns. */
export async function syncSources(db: Database): Promise<void> {
	for (const source of SOURCES) {
		await db
			.insert(feedSources)
			.values({
				slug: source.slug,
				name: source.name,
				kind: source.kind,
				url: source.url,
				region: source.region,
				tier: source.tier,
				lang: source.lang
			})
			.onConflictDoUpdate({
				target: feedSources.slug,
				set: {
					name: source.name,
					kind: source.kind,
					url: source.url,
					region: source.region,
					tier: source.tier,
					lang: source.lang
				}
			});
	}
}

/** Polls every active source once. Never throws for a single source. */
export async function runIngest(
	db: Database,
	log: (line: string) => void = console.log
): Promise<IngestStats> {
	const rows = await db.select().from(feedSources).where(eq(feedSources.active, true));
	const stats: IngestStats = [];

	for (const row of rows) {
		const definition = SOURCES.find((s) => s.slug === row.slug);
		if (!definition) continue;
		try {
			const raw =
				definition.kind === 'rss' ? await fetchRss(definition) : await fetchHtml(definition);
			const inserted = await storeItems(db, row.id, definition, raw);
			await db
				.update(feedSources)
				.set({ lastFetchedAt: new Date(), lastError: null, failureCount: 0 })
				.where(eq(feedSources.id, row.id));
			stats.push({ slug: row.slug, fetched: raw.length, inserted });
			log(`${row.slug}: ${raw.length} fetched, ${inserted} new`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			await db
				.update(feedSources)
				.set({
					lastFetchedAt: new Date(),
					lastError: message.slice(0, 500),
					failureCount: sql`${feedSources.failureCount} + 1`
				})
				.where(eq(feedSources.id, row.id));
			stats.push({ slug: row.slug, fetched: 0, inserted: 0, error: message });
			log(`${row.slug}: FAILED ${message}`);
		}
	}
	return stats;
}

async function storeItems(
	db: Database,
	sourceId: string,
	source: SourceDefinition,
	raw: RawItem[]
): Promise<number> {
	let inserted = 0;
	let newest: Date | undefined;
	for (const item of raw) {
		const tags = tagText(item.title, item.excerpt);
		if (source.filtered && !isRelevant(tags)) continue;
		const result = await db
			.insert(feedItems)
			.values({
				sourceId,
				url: item.url,
				urlHash: hashUrl(item.url),
				title: item.title.slice(0, 500),
				excerpt: item.excerpt ?? null,
				publishedAt: item.publishedAt,
				lang: source.lang,
				tags
			})
			.onConflictDoNothing({ target: feedItems.urlHash })
			.returning({ id: feedItems.id });
		if (result.length > 0) {
			inserted++;
			if (!newest || item.publishedAt > newest) newest = item.publishedAt;
		}
	}
	if (newest) {
		await db.update(feedSources).set({ lastItemAt: newest }).where(eq(feedSources.id, sourceId));
	}
	return inserted;
}

export function hashUrl(url: string): string {
	return createHash('sha256').update(url.trim().toLowerCase()).digest('hex');
}
