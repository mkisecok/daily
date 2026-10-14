import type { SearchEntry } from '../server/normen.js';

export type SearchHit = { entry: SearchEntry; score: number; snippet: string };

const fold = (s: string) =>
	s
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/ß/g, 'ss');

/** "Art. 22" or "§ 26" typed directly: match the label, not the text. */
const REFERENCE = /^(art\.?|artikel|article|§|erwg|recital|anhang|annex)\s*([0-9ivxlc]+[a-z]?)$/i;

/**
 * All terms must occur; hits in the label or title rank above hits in the
 * text. The snippet shows the text around the first term.
 */
export function search(index: SearchEntry[], query: string): SearchHit[] {
	const raw = query.trim();
	const reference = REFERENCE.exec(raw);
	if (reference) {
		const wanted = fold(`${reference[2]}`);
		return index
			.filter(
				(e) =>
					fold(e.label).split(' ').pop() === wanted &&
					fold(e.label).startsWith(fold(reference[1]).slice(0, 2))
			)
			.map((entry) => ({ entry, score: 100, snippet: entry.text.slice(0, 160) }));
	}
	// Match on the stem so inflected forms meet: "berechtigtes" finds "berechtigten".
	const terms = fold(raw)
		.split(/\s+/)
		.filter((t) => t.length > 1)
		.map((t) => (t.length > 6 ? t.slice(0, -2) : t));
	if (terms.length === 0) return [];
	const hits: SearchHit[] = [];
	for (const entry of index) {
		const head = fold(`${entry.label} ${entry.title}`);
		const body = fold(entry.text);
		if (!terms.every((t) => head.includes(t) || body.includes(t))) continue;
		const score = terms.reduce(
			(sum, t) => sum + (head.includes(t) ? 10 : 0) + (body.includes(t) ? 1 : 0),
			0
		);
		const at = body.indexOf(terms[0]);
		const start = Math.max(0, at - 60);
		const snippet =
			(start > 0 ? '…' : '') +
			entry.text.slice(start, start + 180) +
			(entry.text.length > start + 180 ? '…' : '');
		hits.push({ entry, score, snippet });
	}
	return hits.sort((a, b) => b.score - a.score);
}
