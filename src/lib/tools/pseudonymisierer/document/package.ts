import { strFromU8 } from 'fflate';
import { children, parseXml } from './xml.js';

/** the files of an Office package and the XML parts read so far */
export type Package = {
	files: Record<string, Uint8Array>;
	/** the parsed XML parts, written back on save */
	xml: Map<string, Document>;
};

/** part name → content type, from `[Content_Types].xml` */
export function contentTypes(docx: Package): Map<string, string> {
	const doc = xmlPart(docx, '[Content_Types].xml');
	const out = new Map<string, string>();
	if (!doc) return out;
	for (const el of children(doc.documentElement)) {
		const name = el.getAttribute('PartName');
		const type = el.getAttribute('ContentType');
		if (el.localName === 'Override' && name && type) out.set(name.replace(/^\//, ''), type);
	}
	return out;
}

/** an XML part, parsed once and kept so changes to it are saved */
export function xmlPart(docx: Package, name: string): Document | null {
	const known = docx.xml.get(name);
	if (known) return known;
	const bytes = docx.files[name];
	if (!bytes) return null;
	const doc = parseXml(strFromU8(bytes), name);
	docx.xml.set(name, doc);
	return doc;
}

export const RELS = 'http://schemas.openxmlformats.org/package/2006/relationships';

/** the relationships part of a part: `word/document.xml` → `word/_rels/document.xml.rels` */
export function relsOf(name: string): string {
	const slash = name.lastIndexOf('/');
	return `${name.slice(0, slash + 1)}_rels/${name.slice(slash + 1)}.rels`;
}
