import type { Span } from './types.js';

/** where an imported PDF's pages meet in the text: a form feed, the page break of plain text */
export const PAGE_BREAK = '\f';

/** a page of text without page breaks of its own: about a printed page */
export const PAGE_CHARS = 2400;

/** a page as a range of the whole text */
export type Page = { start: number; end: number };

/**
 * the text in pages: at the page breaks a PDF brought along, else cut after
 * about a printed page, at a blank line, a line end or a sentence end where
 * one is near. A short text is one page.
 */
export function pagesOf(text: string, size = PAGE_CHARS): Page[] {
	if (!text) return [];
	const pages: Page[] = [];
	if (text.includes(PAGE_BREAK)) {
		let start = 0;
		for (let i = text.indexOf(PAGE_BREAK); i !== -1; i = text.indexOf(PAGE_BREAK, i + 1)) {
			pages.push({ start, end: i });
			start = i + 1;
		}
		pages.push({ start, end: text.length });
		return pages.filter((page) => text.slice(page.start, page.end).trim());
	}
	let start = 0;
	while (text.length - start > size) {
		const limit = start + size;
		const half = start + size / 2;
		// each candidate cuts after its separator, so the next page starts with text
		const cut = [
			text.lastIndexOf('\n\n', limit) + 2,
			text.lastIndexOf('\n', limit) + 1,
			text.lastIndexOf('. ', limit) + 2
		].find((i) => i > half);
		const end = cut ?? limit;
		pages.push({ start, end });
		start = end;
	}
	pages.push({ start, end: text.length });
	return pages;
}

/** the index of the page that holds `offset` */
export function pageAt(pages: Page[], offset: number): number {
	const index = pages.findIndex((page) => offset < page.end);
	return index === -1 ? Math.max(0, pages.length - 1) : index;
}

/** a piece of a page: plain text, or the part of a finding that falls on it, and where it starts */
export type Segment = { text: string; start: number; span?: Span };

/** one page cut into plain text and findings; a finding across the page edge shows its part */
export function segmentsOf(text: string, spans: Span[], page: Page): Segment[] {
	const out: Segment[] = [];
	let cursor = page.start;
	for (const span of spans) {
		if (span.end <= page.start || span.start >= page.end) continue;
		const start = Math.max(span.start, page.start);
		const end = Math.min(span.end, page.end);
		if (start > cursor) out.push({ text: text.slice(cursor, start), start: cursor });
		out.push({ text: text.slice(start, end), start, span });
		cursor = end;
	}
	if (cursor < page.end) out.push({ text: text.slice(cursor, page.end), start: cursor });
	// the form feed of a PDF page break is not shown
	return out.map((segment) =>
		segment.span ? segment : { ...segment, text: segment.text.replaceAll(PAGE_BREAK, '') }
	);
}

/**
 * the words around a finding, for reviewing it on its own: about a line of
 * text either side, cut at a word, on one line
 */
export function contextOf(
	text: string,
	span: Span,
	radius = 90,
	/** the finding's page: the context stays on it */
	page: Page = { start: 0, end: text.length }
): { before: string; after: string; cutBefore: boolean; cutAfter: boolean } {
	const flat = (value: string) => value.replace(/\s+/g, ' ');
	let from = Math.max(page.start, span.start - radius);
	let to = Math.min(page.end, span.end + radius);
	if (from > page.start) {
		const gap = text.slice(from, span.start).search(/\s/);
		if (gap !== -1) from += gap + 1;
	}
	if (to < page.end) {
		const tail = text.slice(span.end, to);
		const gap = Math.max(tail.lastIndexOf(' '), tail.lastIndexOf('\n'));
		if (gap > 0) to = span.end + gap;
	}
	return {
		before: flat(text.slice(from, span.start)).trimStart(),
		after: flat(text.slice(span.end, to)).trimEnd(),
		cutBefore: from > page.start,
		cutAfter: to < page.end
	};
}
