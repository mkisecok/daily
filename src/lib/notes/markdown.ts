import { citationPath } from '../normen/cite.js';
import type { Law } from '../tools/types.js';

/**
 * a small, safe subset of Markdown for notes: headings, paragraphs, lists,
 * quotes, emphasis, code, links. Parsed into a tree that the page renders
 * with components, so no HTML from a note ever reaches the DOM. Legal
 * citations such as "Art. 6 Abs. 1 DSGVO" become links into the Navigator.
 */

export type Inline =
	| { type: 'text'; text: string }
	| { type: 'strong'; children: Inline[] }
	| { type: 'em'; children: Inline[] }
	| { type: 'code'; text: string }
	| { type: 'link'; href: string; external: boolean; children: Inline[] }
	| { type: 'norm'; path: string; text: string };

export type MdBlock =
	| { type: 'heading'; level: 1 | 2 | 3; children: Inline[] }
	| { type: 'paragraph'; children: Inline[] }
	| { type: 'list'; ordered: boolean; items: Inline[][] }
	| { type: 'quote'; children: Inline[] };

const SAFE_URL = /^(https?:\/\/|mailto:|\/(?!\/))/i;

/** the leading `(^|\W)` stands in for a lookbehind, which Safari before 16.4 cannot parse */
const CITATION =
	/(^|\W)(Art\.|Artikel|§)\s*(\d+[a-z]?(?:\s+Abs\.\s*\d+[a-z]?)?(?:\s+(?:lit\.|S\.|Satz|Nr\.|UAbs\.)\s*[\w]+)?)\s+(DSGVO|KI-VO|BDSG|TDDDG)\b/g;
const URL = /\bhttps?:\/\/[^\s<>()]+[^\s<>().,;:!?'"]/g;

/** citations and bare URLs inside plain text */
function links(text: string): Inline[] {
	const out: Inline[] = [];
	const matches = [
		...[...text.matchAll(CITATION)].map((m) => {
			const prefix = m[2] === '§' ? '§' : 'Art.';
			const path = citationPath({ law: m[4] as Law, ref: `${prefix} ${m[3]}` });
			const start = (m.index ?? 0) + m[1].length;
			return {
				start,
				end: (m.index ?? 0) + m[0].length,
				node: path ? ({ type: 'norm', path, text: m[0].slice(m[1].length) } as Inline) : null
			};
		}),
		...[...text.matchAll(URL)].map((m) => ({
			start: m.index ?? 0,
			end: (m.index ?? 0) + m[0].length,
			node: {
				type: 'link',
				href: m[0],
				external: true,
				children: [{ type: 'text', text: m[0] }]
			} as Inline
		}))
	]
		.filter((m) => m.node)
		.sort((a, b) => a.start - b.start);
	let last = 0;
	for (const m of matches) {
		if (m.start < last) continue;
		if (m.start > last) out.push({ type: 'text', text: text.slice(last, m.start) });
		out.push(m.node!);
		last = m.end;
	}
	if (last < text.length) out.push({ type: 'text', text: text.slice(last) });
	return out;
}

/** inline syntax: `code`, [text](url), **strong**, *em* / _em_ */
export function inline(text: string): Inline[] {
	const out: Inline[] = [];
	const pattern = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_/g;
	let last = 0;
	for (const m of text.matchAll(pattern)) {
		const start = m.index ?? 0;
		if (start > last) out.push(...links(text.slice(last, start)));
		if (m[1] !== undefined) out.push({ type: 'code', text: m[1] });
		else if (m[2] !== undefined) {
			const href = m[3];
			if (SAFE_URL.test(href)) {
				out.push({ type: 'link', href, external: !href.startsWith('/'), children: inline(m[2]) });
			} else out.push({ type: 'text', text: m[2] });
		} else if (m[4] !== undefined) out.push({ type: 'strong', children: inline(m[4]) });
		else out.push({ type: 'em', children: inline(m[5] ?? m[6]) });
		last = start + m[0].length;
	}
	if (last < text.length) out.push(...links(text.slice(last)));
	return out;
}

export function parse(source: string): MdBlock[] {
	const blocks: MdBlock[] = [];
	const lines = source.replace(/\r\n?/g, '\n').split('\n');
	let paragraph: string[] = [];
	let list: { ordered: boolean; items: string[] } | null = null;

	const flush = () => {
		if (paragraph.length > 0)
			blocks.push({ type: 'paragraph', children: inline(paragraph.join(' ')) });
		if (list) blocks.push({ type: 'list', ordered: list.ordered, items: list.items.map(inline) });
		paragraph = [];
		list = null;
	};

	for (const raw of lines) {
		const line = raw.trimEnd();
		const heading = /^(#{1,3})\s+(.*)$/.exec(line);
		const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
		const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
		const quote = /^>\s?(.*)$/.exec(line);
		if (line.trim() === '') {
			flush();
		} else if (heading) {
			flush();
			blocks.push({
				type: 'heading',
				level: heading[1].length as 1 | 2 | 3,
				children: inline(heading[2])
			});
		} else if (bullet || numbered) {
			const ordered = Boolean(numbered);
			if (paragraph.length > 0 || (list && list.ordered !== ordered)) flush();
			list ??= { ordered, items: [] };
			list.items.push((bullet ?? numbered)![1]);
		} else if (quote) {
			flush();
			blocks.push({ type: 'quote', children: inline(quote[1]) });
		} else if (list) {
			list.items[list.items.length - 1] += ` ${line.trim()}`;
		} else {
			paragraph.push(line.trim());
		}
	}
	flush();
	return blocks;
}

/** plain text of a note for lists and search: no Markdown syntax */
export function plain(source: string, max = 160): string {
	const text = source
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/[#>*_`]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	return text.length > max ? `${text.slice(0, max)}…` : text;
}
