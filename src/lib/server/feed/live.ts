import { fetchHtml } from './adapters/html.js';
import { fetchRss } from './adapters/rss.js';
import { hashUrl } from './ingest.js';
import type { FeedRow } from './query.js';
import { SOURCES } from './sources.js';
import { isRelevant, tagText } from './tagging.js';

const WINDOW_DAYS = 14;
const LIMIT = 300;

export type LiveSource = {
	slug: string;
	name: string;
	region: string;
	tier: number;
	lastItemAt: string | null;
	lastError: string | null;
};

let cached: Promise<{ items: FeedRow[]; sources: LiveSource[] }> | undefined;

/**
 * fetches every source directly, without the database: used by the static
 * preview at build time. Cached for the process, so the German and English
 * pages of one build show the same items.
 */
export function fetchLiveFeed(): Promise<{ items: FeedRow[]; sources: LiveSource[] }> {
	cached ??= load();
	return cached;
}

async function load() {
	const since = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
	const results = await Promise.all(
		SOURCES.map(async (source) => {
			try {
				const raw = source.kind === 'rss' ? await fetchRss(source) : await fetchHtml(source);
				return { source, raw, error: null };
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				console.warn(`[preview feed] ${source.slug}: ${message}`);
				return { source, raw: [], error: message };
			}
		})
	);

	const seen = new Set<string>();
	const items: FeedRow[] = [];
	const sources: LiveSource[] = [];

	for (const { source, raw, error } of results) {
		let newest: Date | undefined;
		for (const item of raw) {
			if (item.publishedAt.getTime() < since) continue;
			const id = hashUrl(item.url);
			if (seen.has(id)) continue;
			const tags = tagText(item.title, item.excerpt);
			if (source.filtered && !isRelevant(tags)) continue;
			seen.add(id);
			if (!newest || item.publishedAt > newest) newest = item.publishedAt;
			items.push({
				id: id.slice(0, 32),
				url: item.url,
				title: item.title,
				excerpt: item.excerpt ?? null,
				publishedAt: item.publishedAt,
				lang: source.lang,
				tags,
				source: { slug: source.slug, name: source.name, region: source.region, tier: source.tier },
				bookmarked: false
			});
		}
		sources.push({
			slug: source.slug,
			name: source.name,
			region: source.region,
			tier: source.tier,
			lastItemAt: newest?.toISOString() ?? null,
			lastError: error
		});
	}

	items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
	sources.sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
	return { items: items.slice(0, LIMIT), sources };
}
