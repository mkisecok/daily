import * as cheerio from 'cheerio';
import type { RawItem, SourceDefinition } from '../types.js';
import { fetchText } from './http.js';

/**
 * List-page scraper for publishers without a feed. Selectors live on the
 * source definition so each publisher's quirks stay data.
 */
export async function fetchHtml(source: SourceDefinition): Promise<RawItem[]> {
	const config = source.html;
	if (!config) throw new Error(`source ${source.slug} has no html selectors`);
	const html = await fetchText(source.url);
	const $ = cheerio.load(html);
	const items: RawItem[] = [];

	$(config.item).each((_, element) => {
		const node = $(element);
		const title = node.find(config.title).first().text().replace(/\s+/g, ' ').trim();
		const href = node.find(config.link).first().attr('href')?.trim();
		const dateText = node.find(config.date).first().text().trim();
		if (!title || !href) return;
		const publishedAt = parseDate(dateText, config.dateFormat);
		if (!publishedAt) return;
		items.push({ url: new URL(href, source.url).href, title, publishedAt });
	});

	return items;
}

function parseDate(value: string, format: 'dmy' | 'iso'): Date | undefined {
	if (format === 'iso') {
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? undefined : date;
	}
	const match = value.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
	if (!match) return undefined;
	const [, day, month, year] = match;
	return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
}
