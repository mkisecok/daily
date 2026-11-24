/**
 * the few DOM steps the Word code needs, kept to DOM Level 2 so they run on
 * the browser's DOMParser and, in unit tests, on xmldom alike
 */

/** WordprocessingML, the `w:` namespace */
export const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const XML_NS = 'http://www.w3.org/XML/1998/namespace';
const DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n';

export class XmlError extends Error {
	constructor(public readonly part: string) {
		super(`${part}: not well-formed`);
		this.name = 'XmlError';
	}
}

export function parseXml(source: string, part: string): Document {
	const doc = new DOMParser().parseFromString(source.replace(/^\uFEFF/, ''), 'application/xml');
	if (doc.getElementsByTagName('parsererror').length > 0) throw new XmlError(part);
	return doc;
}

/** the part as Word writes it: with its declaration, which serializers drop or keep at will */
export function serializeXml(doc: Document): string {
	const body = new XMLSerializer().serializeToString(doc).replace(/^<\?xml[^>]*\?>\s*/, '');
	return DECLARATION + body;
}

/** whether `node` is the element `name` in `ns` */
export function is(node: Node | null | undefined, name: string, ns = W): boolean {
	return (
		node?.nodeType === 1 &&
		(node as Element).localName === name &&
		(node as Element).namespaceURI === ns
	);
}

/** element children, in order */
export function children(node: Node): Element[] {
	const out: Element[] = [];
	for (let child = node.firstChild; child; child = child.nextSibling) {
		if (child.nodeType === 1) out.push(child as Element);
	}
	return out;
}

/** every element below `root` that passes `test`, in document order */
export function descendants(root: Node, test: (el: Element) => boolean): Element[] {
	const out: Element[] = [];
	const visit = (node: Node) => {
		for (const child of children(node)) {
			if (test(child)) out.push(child);
			visit(child);
		}
	};
	visit(root);
	return out;
}

/** every `w:name` element below `root` */
export function byName(root: Node, name: string, ns = W): Element[] {
	return descendants(root, (el) => is(el, name, ns));
}

export function textOf(el: Element): string {
	let out = '';
	for (let child = el.firstChild; child; child = child.nextSibling) {
		if (child.nodeType === 3 || child.nodeType === 4) out += (child as Text).data;
	}
	return out;
}

/** sets a `w:t`'s text, keeping its spaces: Word drops edge spaces without `xml:space` */
export function setText(el: Element, value: string): void {
	while (el.firstChild) el.removeChild(el.firstChild);
	el.appendChild(el.ownerDocument.createTextNode(value));
	el.setAttributeNS(XML_NS, 'xml:space', 'preserve');
}

export function remove(node: Node): void {
	node.parentNode?.removeChild(node);
}

/** replaces an element by its children */
export function unwrap(el: Element): void {
	const parent = el.parentNode;
	if (!parent) return;
	while (el.firstChild) parent.insertBefore(el.firstChild, el);
	parent.removeChild(el);
}

export function insertAfter(node: Node, after: Node): void {
	after.parentNode!.insertBefore(node, after.nextSibling);
}

/** a new `w:name` element in the document of `near` */
export function create(near: Node, name: string): Element {
	const doc = near.nodeType === 9 ? (near as Document) : near.ownerDocument!;
	return doc.createElementNS(W, `w:${name}`);
}
