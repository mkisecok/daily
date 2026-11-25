import { PAGE_BREAK, type Page } from '../pages.js';
import type { Span } from '../types.js';

/**
 * a piece of text on a PDF page as pdf.js reports it, in points from the
 * page's top left: where it starts, its baseline, width and font size
 */
export type PdfItem = {
	str: string;
	x: number;
	base: number;
	w: number;
	size: number;
	eol: boolean;
	/** the CSS font family pdf.js matched, for measuring letters */
	font?: string;
};

export type PdfPage = { width: number; height: number; items: PdfItem[] };

/** where a character sits on its page, in points from the top left */
export type Glyph = { page: number; x: number; y: number; w: number; h: number; item: number };

/** the letters of a run of text, each as a share of the run's width */
export type Measure = (str: string, font?: string) => number[];

/** without fonts at hand, every letter takes the same share */
export const evenly: Measure = (str) =>
	Array.from({ length: str.length }, () => 1 / (str.length || 1));

export type PdfText = {
	text: string;
	/** one per character; null for line ends and page breaks */
	origins: (Glyph | null)[];
	/** the text of each PDF page, empty pages included, so page n is pages[n] */
	pages: Page[];
	/** where each item's text starts and ends, per page */
	runs: { start: number; end: number }[][];
};

/** a box over glyphs from the baseline's font size: a little above for capitals, below for descenders */
const ASCENT = 0.92;
const DESCENT = 0.26;

/**
 * the text of a PDF with the place of every letter: items in reading order
 * as pdf.js gives them, a line end where pdf.js marks one, a page break
 * between pages
 */
export function layoutText(pages: PdfPage[], measure: Measure = evenly): PdfText {
	const chars: string[] = [];
	const origins: (Glyph | null)[] = [];
	const ranges: Page[] = [];
	const runs: { start: number; end: number }[][] = [];
	pages.forEach((page, index) => {
		if (index > 0) {
			chars.push(PAGE_BREAK);
			origins.push(null);
		}
		const start = chars.length;
		const pageRuns: { start: number; end: number }[] = [];
		page.items.forEach((item, itemIndex) => {
			const runStart = chars.length;
			const shares = measure(item.str, item.font);
			let x = item.x;
			for (let i = 0; i < item.str.length; i++) {
				const w = (shares[i] ?? 0) * item.w;
				chars.push(item.str[i]!);
				origins.push({
					page: index,
					x,
					y: item.base - item.size * ASCENT,
					w,
					h: item.size * (ASCENT + DESCENT),
					item: itemIndex
				});
				x += w;
			}
			pageRuns.push({ start: runStart, end: chars.length });
			if (item.eol) {
				chars.push('\n');
				origins.push(null);
			}
		});
		ranges.push({ start, end: chars.length });
		runs.push(pageRuns);
	});
	return { text: chars.join(''), origins, pages: ranges, runs };
}

/** a box on a page, in points from the top left */
export type Rect = { page: number; x: number; y: number; w: number; h: number };

/** a line of a stretch: its box, and where in the text it starts and ends */
export type LineRect = Rect & { start: number; end: number };

/**
 * the boxes a stretch of text covers, one per line: a new line starts where
 * the page changes, the text jumps up or down, or goes back to the left
 */
export function lineRects(origins: (Glyph | null)[], start: number, end: number): LineRect[] {
	const out: LineRect[] = [];
	let current: LineRect | null = null;
	for (let i = start; i < end; i++) {
		const glyph = origins[i];
		if (!glyph) continue;
		const sameLine =
			current !== null &&
			current.page === glyph.page &&
			Math.abs(current.y - glyph.y) < glyph.h / 2 &&
			glyph.x > current.x + current.w - glyph.h;
		if (current && sameLine) {
			const right = Math.max(current.x + current.w, glyph.x + glyph.w);
			const bottom = Math.max(current.y + current.h, glyph.y + glyph.h);
			current.x = Math.min(current.x, glyph.x);
			current.y = Math.min(current.y, glyph.y);
			current.w = right - current.x;
			current.h = bottom - current.y;
			current.end = i + 1;
		} else {
			current = {
				page: glyph.page,
				x: glyph.x,
				y: glyph.y,
				w: glyph.w,
				h: glyph.h,
				start: i,
				end: i + 1
			};
			out.push(current);
		}
	}
	return out;
}

/** the stretch of text whose letters have their middle inside a box drawn on a page */
export function rangeInBox(
	origins: (Glyph | null)[],
	box: Rect
): { start: number; end: number } | null {
	let start = Infinity;
	let end = -Infinity;
	origins.forEach((glyph, i) => {
		if (!glyph || glyph.page !== box.page) return;
		const cx = glyph.x + glyph.w / 2;
		const cy = glyph.y + glyph.h / 2;
		if (cx < box.x || cx > box.x + box.w || cy < box.y || cy > box.y + box.h) return;
		start = Math.min(start, i);
		end = Math.max(end, i + 1);
	});
	return end > start ? { start, end } : null;
}

/** a covered line of a replaced value: where it was, what stood there, and its placeholder */
export type Region = Rect & { token: string; text: string; first: boolean };

/** the lines each live span covers, with the text that stood there, for painting over and back */
export function regionsOf(text: string, origins: (Glyph | null)[], spans: Span[]): Region[] {
	const out: Region[] = [];
	for (const span of spans) {
		if (span.muted || !span.replacement) continue;
		lineRects(origins, span.start, span.end).forEach((line, index) => {
			out.push({
				page: line.page,
				x: line.x,
				y: line.y,
				w: line.w,
				h: line.h,
				token: span.replacement!,
				text: text.slice(line.start, line.end),
				first: index === 0
			});
		});
	}
	return out;
}

/**
 * a piece of the invisible text layer: what to write, where its baseline
 * starts, how large, and how wide the item it stands for was
 */
export type LayerItem = { str: string; x: number; base: number; size: number; w?: number };

/** a text layer item that fills a covered line again: the line's box gives its baseline and size */
export function lineItem(rect: Rect, str: string): LayerItem {
	const size = rect.h / (ASCENT + DESCENT);
	return { str, x: rect.x, base: rect.y + size * ASCENT, size, w: rect.w };
}

/**
 * the text layer of a page with the spans replaced: each item keeps its
 * place and gets its text with a placeholder where a span starts and
 * without what the span covers
 */
export function layerOf(
	page: PdfPage,
	runs: { start: number; end: number }[],
	text: string,
	spans: Span[]
): LayerItem[] {
	const live = spans.filter((span) => !span.muted && span.replacement);
	const out: LayerItem[] = [];
	page.items.forEach((item, index) => {
		const run = runs[index];
		if (!run) return;
		let str = '';
		for (let i = run.start; i < run.end; i++) {
			const span = live.find((s) => i >= s.start && i < s.end);
			if (!span) str += text[i];
			else if (i === span.start) str += span.replacement;
		}
		if (str.trim()) out.push({ str, x: item.x, base: item.base, size: item.size, w: item.w });
	});
	return out;
}
