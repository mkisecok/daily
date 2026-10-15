import type { LawId } from './types.js';

export type Segment = { text: string; law?: LawId; id?: string };

const OTHER_ACT: [RegExp, LawId | null][] = [
	[/^\s*(?:der|of)\s+(?:Verordnung|Regulation)\s+\(EU\)\s+2016\/679/, 'dsgvo'],
	[/^\s*(?:der|of)\s+(?:Verordnung|Regulation)\s+\(EU\)\s+2024\/1689/, 'ki-vo'],
	[
		/^\s*(?:der|des|of|dieser|this)\s+(?:Verordnung|Regulation|Richtlinie|Directive|Gesetzes|Beschlusses|Decision|Vertrags|Treaty|AEUV|TFEU|Charta|Charter)/,
		null
	]
];

/**
 * splits text into plain parts and references to provisions: "Artikel 6
 * Absatz 1", "Article 6(1)", "§ 26". A reference followed by a named act
 * points to that act (DSGVO, KI-VO) or is left plain; otherwise it points
 * into the same law. `exists` filters out ids the law does not have.
 */
export function crossReferences(
	text: string,
	law: LawId,
	exists: (law: LawId, id: string) => boolean
): Segment[] {
	const pattern =
		law === 'bdsg' || law === 'tdddg'
			? /(?:Artikel|Article)\s+(\d+[a-z]?)|§\s*(\d+[a-z]?)/g
			: /(?:Artikel|Article)\s+(\d+[a-z]?)/g;
	const segments: Segment[] = [];
	let last = 0;
	for (const match of text.matchAll(pattern)) {
		const start = match.index ?? 0;
		let end = start + match[0].length;
		const isArticle = match[1] !== undefined;
		const number = match[1] ?? match[2];
		// include "Absatz 1" / "(1)" in the link text
		const tail = /^(?:\s+Absatz\s+\d+[a-z]?|\(\d+[a-z]?\))/.exec(text.slice(end));
		if (tail) end += tail[0].length;
		const after = text.slice(end, end + 60);

		let target: LawId | null = isArticle ? (law === 'bdsg' || law === 'tdddg' ? null : law) : law;
		for (const [act, actLaw] of OTHER_ACT) {
			if (act.test(after)) {
				target = actLaw;
				break;
			}
		}
		if (!isArticle && /^\s*(?:Abs\.\s*\d+\s+)?(?:des|der)\s/.test(after)) target = null;
		const id = `${isArticle ? 'art' : 'p'}-${number}`;
		if (!target || !exists(target, id)) continue;

		if (start > last) segments.push({ text: text.slice(last, start) });
		segments.push({ text: text.slice(start, end), law: target, id });
		last = end;
	}
	if (last < text.length) segments.push({ text: text.slice(last) });
	return segments.length > 0 ? segments : [{ text }];
}
