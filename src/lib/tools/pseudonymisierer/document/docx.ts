import { strToU8, unzipSync, zipSync } from 'fflate';
import { PAGE_BREAK } from '../pages.js';
import { cleanDocx, type CleanReport } from './clean.js';
import { contentTypes, RELS, relsOf, xmlPart } from './package.js';
import {
	byName,
	children,
	create,
	descendants,
	insertAfter,
	is,
	remove,
	serializeXml,
	setText,
	textOf,
	W
} from './xml.js';

/**
 * where a character of the document's text comes from: a letter of a `w:t`,
 * an element that stands for one (tab, line break, page break), the end of a
 * paragraph, or the seam between two parts such as the body and a header
 */
export type Origin =
	| { kind: 'text'; node: Element; at: number }
	| { kind: 'element'; node: Element }
	| { kind: 'paragraph'; node: Element }
	| { kind: 'part' };

export type PartKind = 'body' | 'header' | 'footer' | 'footnotes' | 'endnotes';

/** an opened Word file: its parts, and its text with the origin of every character */
export type Docx = {
	files: Record<string, Uint8Array>;
	/** the parsed XML parts, written back on save */
	xml: Map<string, Document>;
	/** the parts that carry text, body first */
	parts: { name: string; kind: PartKind }[];
	text: string;
	/** one per character of `text` */
	origins: Origin[];
	/** what cleaning removed; absent when the file was opened as it is */
	cleaned?: CleanReport;
};

/** a stretch of the text and what to write in its place */
export type Replacement = { start: number; end: number; value: string };

export class DocxError extends Error {
	constructor(public readonly reason: 'not-docx') {
		super(reason);
		this.name = 'DocxError';
	}
}

const PART_KIND: [RegExp, PartKind][] = [
	[/\.document\.main\+xml$|\.document\.macroEnabled\.main\+xml$|\.template\.main\+xml$/, 'body'],
	[/\.header\+xml$/, 'header'],
	[/\.footer\+xml$/, 'footer'],
	[/\.footnotes\+xml$/, 'footnotes'],
	[/\.endnotes\+xml$/, 'endnotes']
];
const KIND_ORDER: PartKind[] = ['body', 'header', 'footer', 'footnotes', 'endnotes'];

/** "word/header2.xml" sorts after "word/header1.xml" and before "word/header10.xml" */
const byNumber = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true });

/**
 * opens a DOCX. With `clean`, what the text does not show but the file still
 * carries goes first: tracked changes are accepted, comments and personal
 * document properties removed. The text and origins are of the cleaned file,
 * so the same bytes always give the same text.
 */
export function openDocx(bytes: Uint8Array, options: { clean?: boolean } = {}): Docx {
	let files: Record<string, Uint8Array>;
	try {
		files = unzipSync(bytes);
	} catch {
		throw new DocxError('not-docx');
	}
	const docx: Docx = { files, xml: new Map(), parts: [], text: '', origins: [] };
	const types = contentTypes(docx);
	for (const [name, type] of types) {
		const kind = PART_KIND.find(([re]) => re.test(type))?.[1];
		if (kind) docx.parts.push({ name, kind });
	}
	if (!docx.parts.some((part) => part.kind === 'body') || !files[docx.parts[0]!.name]) {
		throw new DocxError('not-docx');
	}
	docx.parts.sort(
		(a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || byNumber(a.name, b.name)
	);

	if (options.clean) docx.cleaned = cleanDocx(docx);
	readText(docx);
	return docx;
}

export function saveDocx(docx: Docx): Uint8Array {
	const files = { ...docx.files };
	for (const [name, doc] of docx.xml) files[name] = strToU8(serializeXml(doc));
	return zipSync(files, { level: 6 });
}

const MC = 'http://schemas.openxmlformats.org/markup-compatibility/2006';

function readText(docx: Docx): void {
	const chars: string[] = [];
	const origins: Origin[] = [];
	const push = (char: string, origin: Origin) => {
		chars.push(char);
		origins.push(origin);
	};

	const walk = (node: Node) => {
		for (const el of children(node)) {
			// the older copy of a shape for old Word versions; its text is in the newer one
			if (is(el, 'Fallback', MC)) continue;
			if (el.namespaceURI !== W) {
				walk(el);
				continue;
			}
			switch (el.localName) {
				case 't': {
					const value = textOf(el);
					for (let at = 0; at < value.length; at++)
						push(value[at]!, { kind: 'text', node: el, at });
					break;
				}
				case 'tab':
				case 'ptab':
					// a tab stop in a paragraph's properties is not a character
					if (el.parentNode && is(el.parentNode, 'tabs')) break;
					push('\t', { kind: 'element', node: el });
					break;
				case 'br':
					push(el.getAttributeNS(W, 'type') === 'page' ? PAGE_BREAK : '\n', {
						kind: 'element',
						node: el
					});
					break;
				case 'cr':
					push('\n', { kind: 'element', node: el });
					break;
				case 'noBreakHyphen':
					push('-', { kind: 'element', node: el });
					break;
				// where Word last broke the page: the document's own pages
				case 'lastRenderedPageBreak':
					push(PAGE_BREAK, { kind: 'element', node: el });
					break;
				case 'p':
					walk(el);
					push('\n', { kind: 'paragraph', node: el });
					break;
				// deleted text, and field codes, are not what the reader sees
				case 'del':
				case 'moveFrom':
				case 'instrText':
				case 'delText':
				case 'delInstrText':
				case 'pPr':
				case 'rPr':
				case 'sectPr':
					break;
				default:
					walk(el);
			}
		}
	};

	docx.parts.forEach((part, index) => {
		const doc = xmlPart(docx, part.name);
		if (!doc) return;
		if (index > 0) push(PAGE_BREAK, { kind: 'part' });
		walk(doc.documentElement);
	});
	docx.text = chars.join('');
	docx.origins = origins;
}

const paragraphOf = (node: Node): Element | null => {
	for (let at: Node | null = node.parentNode; at; at = at.parentNode)
		if (is(at, 'p')) return at as Element;
	return null;
};

/** an element's empty copy, with its properties (`w:pPr`, `w:rPr`) so the copy looks the same */
function shallow(el: Element): Element {
	const copy = el.cloneNode(false) as Element;
	for (const name of ['paraId', 'textId']) {
		for (const attr of [...Array.from(copy.attributes)])
			if (attr.localName === name) copy.removeAttributeNode(attr);
	}
	const first = children(el)[0];
	if (first && /Pr$/.test(first.localName)) copy.appendChild(first.cloneNode(true));
	return copy;
}

/**
 * splits every element from `node` up to `top` behind `node`: what follows
 * moves into copies, the copy of `top` goes in after it and is returned. A
 * paragraph split this way keeps its look, and a section break stays on the
 * last paragraph of its section.
 */
function splitAfter(node: Node, top: Element): Element {
	let current = node;
	let carry: Element | null = null;
	for (;;) {
		const parent = current.parentNode as Element;
		const copy = shallow(parent);
		if (carry) copy.appendChild(carry);
		while (current.nextSibling) copy.appendChild(current.nextSibling);
		carry = copy;
		if (parent === top) {
			insertAfter(copy, top);
			const props = children(top)[0];
			if (props && is(props, 'pPr')) for (const sect of byName(props, 'sectPr')) remove(sect);
			return copy;
		}
		current = parent;
	}
}

/**
 * writes `value` into a `w:t` between what stays before and after it. Tabs
 * become `w:tab`, line ends new paragraphs, so a boxed section of several
 * paragraphs comes back as paragraphs.
 */
function writeInto(t: Element, before: string, value: string, after: string): void {
	if (!/[\t\n]/.test(value)) {
		setText(t, before + value + after);
		return;
	}
	let cursor = t;
	value.split('\n').forEach((line, lineIndex) => {
		if (lineIndex > 0) {
			const paragraph = paragraphOf(cursor);
			if (paragraph) {
				const next = splitAfter(cursor, paragraph);
				// the first run in the new paragraph is the copy of this one
				const copy = descendants(next, (el) => is(el, 'r'))[0] ?? next;
				const fresh = create(cursor, 't');
				const props = children(copy)[0];
				copy.insertBefore(
					fresh,
					props && /Pr$/.test(props.localName) ? props.nextSibling : copy.firstChild
				);
				cursor = fresh;
			} else {
				const br = create(cursor, 'br');
				insertAfter(br, cursor);
				const fresh = create(cursor, 't');
				insertAfter(fresh, br);
				cursor = fresh;
			}
		}
		line.split('\t').forEach((cell, cellIndex) => {
			if (cellIndex > 0) {
				const tab = create(cursor, 'tab');
				insertAfter(tab, cursor);
				const fresh = create(cursor, 't');
				insertAfter(fresh, tab);
				cursor = fresh;
			}
			setText(cursor, (lineIndex === 0 && cellIndex === 0 ? before : '') + cell);
		});
	});
	setText(cursor, textOf(cursor) + after);
}

/** joins the paragraph after `p` onto it, when the two stand side by side */
function mergeNext(p: Element): void {
	let next = p.nextSibling;
	while (next && next.nodeType !== 1) next = next.nextSibling;
	if (!next || !is(next, 'p')) return;
	const props = children(next)[0];
	const sect = props && is(props, 'pPr') ? byName(props, 'sectPr')[0] : undefined;
	for (const child of [...children(next)]) {
		if (child === props && is(child, 'pPr')) continue;
		p.appendChild(child);
	}
	if (sect) {
		let own = children(p)[0];
		if (!own || !is(own, 'pPr')) {
			own = create(p, 'pPr');
			p.insertBefore(own, p.firstChild);
		}
		own.appendChild(sect);
	}
	remove(next);
}

/**
 * writes each replacement over its stretch of the text, in the file itself:
 * the value goes into the first `w:t` of the stretch with that run's
 * formatting, the rest of the stretch is cut out, and paragraphs it spans are
 * joined. From the end backwards, so the offsets of what comes first hold.
 * Returns how many were written.
 */
export function replaceRanges(docx: Docx, replacements: Replacement[]): number {
	let count = 0;
	for (const { start, end, value } of [...replacements].sort((a, b) => b.start - a.start)) {
		const origins = docx.origins.slice(start, end);
		const cuts = new Map<Element, { from: number; to: number }>();
		for (const origin of origins) {
			if (origin.kind !== 'text') continue;
			const cut = cuts.get(origin.node);
			if (cut) cut.to = origin.at + 1;
			else cuts.set(origin.node, { from: origin.at, to: origin.at + 1 });
		}
		const nodes = [...cuts.keys()];
		const host = nodes[0];
		if (!host) continue;
		for (const node of nodes.reverse()) {
			const { from, to } = cuts.get(node)!;
			const text = textOf(node);
			if (node === host) writeInto(node, text.slice(0, from), value, text.slice(to));
			else setText(node, text.slice(0, from) + text.slice(to));
		}
		for (const origin of origins) if (origin.kind === 'element') remove(origin.node);
		for (const origin of [...origins].reverse())
			if (origin.kind === 'paragraph') mergeNext(origin.node);
		count++;
	}
	return count;
}

/**
 * replaces values outside the text: in field codes (a `HYPERLINK
 * "mailto:…"`), in the alt text of pictures and in link targets, raw and
 * percent-encoded. Longest first, so a name does not take the front of a
 * longer one. Returns how many places changed.
 */
export function replaceStrings(docx: Docx, pairs: [from: string, to: string][]): number {
	const ordered = pairs.filter(([from]) => from).sort((a, b) => b[0].length - a[0].length);
	if (ordered.length === 0) return 0;
	const swap = (value: string, encoded = false) => {
		let out = value;
		for (const [from, to] of ordered) {
			out = out.split(from).join(to);
			if (encoded) out = out.split(encodeURIComponent(from)).join(encodeURIComponent(to));
		}
		return out;
	};
	let count = 0;
	for (const part of docx.parts) {
		const doc = xmlPart(docx, part.name);
		if (!doc) continue;
		for (const el of byName(doc, 'instrText')) {
			const before = textOf(el);
			const after = swap(before);
			if (after !== before) {
				setText(el, after);
				count++;
			}
		}
		for (const el of descendants(
			doc,
			(node) => node.localName === 'docPr' || node.localName === 'cNvPr'
		)) {
			for (const attr of ['descr', 'title']) {
				const before = el.getAttribute(attr);
				if (!before) continue;
				const after = swap(before);
				if (after !== before) {
					el.setAttribute(attr, after);
					count++;
				}
			}
		}
		const rels = xmlPart(docx, relsOf(part.name));
		if (!rels) continue;
		for (const rel of byName(rels, 'Relationship', RELS)) {
			const before = rel.getAttribute('Target');
			if (!before || rel.getAttribute('TargetMode') !== 'External') continue;
			const after = swap(before, true);
			if (after !== before) {
				rel.setAttribute('Target', after);
				count++;
			}
		}
	}
	return count;
}
