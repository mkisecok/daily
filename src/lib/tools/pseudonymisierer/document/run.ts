import { PAGE_BREAK, PAGE_CHARS, pagesOf, type Page } from '../pages.js';
import { leftoverIn, tolerantTokenRe } from '../restore.js';
import type { Span } from '../types.js';
import type { CleanReport } from './clean.js';
import { openDocx, replaceRanges, replaceStrings, saveDocx } from './docx.js';
import { fingerprint, type KeyContent } from './key.js';

/**
 * a document's text in pages: at the page breaks Word recorded, and between
 * the body and its headers, footers and notes; a stretch without breaks is
 * cut after about a printed page, as plain text is
 */
export function documentPages(text: string): Page[] {
	const pages: Page[] = [];
	let start = 0;
	const add = (end: number) => {
		const piece = text.slice(start, end);
		if (piece.trim()) {
			for (const page of pagesOf(piece, PAGE_CHARS)) {
				if (piece.slice(page.start, page.end).trim()) {
					pages.push({ start: start + page.start, end: start + page.end });
				}
			}
		}
	};
	for (let i = text.indexOf(PAGE_BREAK); i !== -1; i = text.indexOf(PAGE_BREAK, i + 1)) {
		add(i);
		start = i + 1;
	}
	add(text.length);
	return pages;
}

/** a stretch without the white space at its edges, so a placeholder keeps the layout around it */
export function trimmed(text: string, start: number, end: number): { start: number; end: number } {
	while (start < end && /\s/.test(text[start]!)) start++;
	while (end > start && /\s/.test(text[end - 1]!)) end--;
	return { start, end };
}

export type Pseudonymised = {
	bytes: Uint8Array;
	key: KeyContent;
	cleaned: CleanReport;
	/** field codes, alt texts and links that held a value */
	elsewhere: number;
};

/**
 * the Word file with every live span replaced by its placeholder, cleaned,
 * and the key that turns it back. The spans must come from the text of
 * `openDocx(bytes, { clean: true })`.
 */
export async function pseudonymiseDocx(bytes: Uint8Array, spans: Span[]): Promise<Pseudonymised> {
	const docx = openDocx(bytes, { clean: true });
	const live = spans.filter((span) => !span.muted && span.replacement);
	replaceRanges(
		docx,
		live.map((span) => ({ start: span.start, end: span.end, value: span.replacement! }))
	);
	const values: Record<string, string> = {};
	for (const span of live) values[span.replacement!] = span.value;
	const elsewhere = replaceStrings(
		docx,
		Object.entries(values).map(([placeholder, original]) => [original, placeholder])
	);
	const out = saveDocx(docx);
	return {
		bytes: out,
		key: {
			fingerprint: await fingerprint(openDocx(out).text),
			created: new Date().toISOString(),
			values
		},
		cleaned: docx.cleaned!,
		elsewhere
	};
}

export type Restored = {
	bytes: Uint8Array;
	/** placeholders written back */
	count: number;
	/** placeholders in the key */
	total: number;
	/** placeholder-shaped text the key does not know */
	leftover: string[];
	/** the document is not the one the key was made with: edited, or another file */
	changed: boolean;
};

/**
 * writes the original values back into a pseudonymised Word file, also into
 * one that was edited since: placeholders are found in the text, wherever
 * Word split them across runs, and in any spelling `restoreFrom` accepts
 */
export async function restoreDocx(bytes: Uint8Array, key: KeyContent): Promise<Restored> {
	const docx = openDocx(bytes);
	const changed = (await fingerprint(docx.text)) !== key.fingerprint;
	const entries = Object.entries(key.values).sort((a, b) => b[0].length - a[0].length);
	const ranges: { start: number; end: number; value: string }[] = [];
	const free = (start: number, end: number) =>
		ranges.every((range) => end <= range.start || start >= range.end);
	for (const [placeholder, original] of entries) {
		const core = placeholder.replace(/^«|»$/g, '');
		for (const match of docx.text.matchAll(tolerantTokenRe(core))) {
			const start = match.index;
			const end = start + match[0].length;
			if (free(start, end)) ranges.push({ start, end, value: original });
		}
	}
	replaceRanges(docx, ranges);
	replaceStrings(docx, entries);
	const out = saveDocx(docx);
	return {
		bytes: out,
		count: ranges.length,
		total: entries.length,
		leftover: leftoverIn(openDocx(out).text),
		changed
	};
}

/**
 * a name for a variable as placeholders use it: capitals, digits and
 * underscores, umlauts spelled out, at most 24 characters. "Diagnose" stays
 * "DIAGNOSE", "Gesprächsnotiz 2" becomes "GESPRAECHSNOTIZ_2".
 */
export function variableName(input: string): string {
	return input
		.toUpperCase()
		.replace(/Ä/g, 'AE')
		.replace(/Ö/g, 'OE')
		.replace(/Ü/g, 'UE')
		.replace(/ß|ẞ/g, 'SS')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^A-Z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 24)
		.replace(/_+$/, '');
}

/** the file name without what it says about the people in it */
export function scrubbedName(name: string, values: Record<string, string>): string {
	let out = name;
	for (const [placeholder, original] of Object.entries(values).sort(
		(a, b) => b[1].length - a[1].length
	)) {
		if (original.length < 3 || original.includes('\n')) continue;
		const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s_-]+');
		out = out.replace(new RegExp(escaped, 'gi'), placeholder.replace(/^«|»$/g, ''));
	}
	return out;
}
