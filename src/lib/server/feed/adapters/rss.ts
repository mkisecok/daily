import Parser from 'rss-parser';
import type { RawItem, SourceDefinition } from '../types.js';
import { fetchText, stripHtml } from './http.js';

const parser = new Parser({ timeout: 15_000 });

/** RSS 2.0 and Atom, normalised to RawItem. Items without a link are dropped. */
export async function fetchRss(source: SourceDefinition): Promise<RawItem[]> {
	const xml = await fetchText(source.url);
	const feed = await parser.parseString(xml);
	const items: RawItem[] = [];
	for (const entry of feed.items) {
		const url = entry.link?.trim();
		const title = entry.title?.trim();
		if (!url || !title) continue;
		const published = entry.isoDate ?? entry.pubDate;
		const publishedAt = published ? new Date(published) : new Date();
		if (Number.isNaN(publishedAt.getTime())) continue;
		items.push({
			url,
			title: stripHtml(title),
			excerpt: excerptOf(entry.contentSnippet ?? entry.summary ?? entry.content),
			publishedAt
		});
	}
	return items;
}

function excerptOf(value: string | undefined): string | undefined {
	if (!value) return undefined;
	const text = stripHtml(value).replace(/\s+/g, ' ').trim();
	if (!text) return undefined;
	return text.length > 320 ? text.slice(0, 317).trimEnd() + '…' : text;
}
