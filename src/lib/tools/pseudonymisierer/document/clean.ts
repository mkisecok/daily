import { contentTypes, RELS, relsOf, xmlPart, type Package } from './package.js';
import { byName, children, descendants, is, remove, unwrap, W } from './xml.js';

/** what cleaning a Word file took out, and what it could not check */
export type CleanReport = {
	/** tracked changes accepted */
	revisions: number;
	comments: number;
	/** author, title, company and the like, emptied */
	properties: number;
	/** the preview picture of the first page, which shows its text */
	thumbnail: boolean;
	/** pictures, left in and not checked */
	images: number;
	/** embedded objects, charts and diagrams, left in and not checked */
	embedded: number;
};

const MC = 'http://schemas.openxmlformats.org/markup-compatibility/2006';

const KEEP = new Set(['ins', 'moveTo']);
const DROP = new Set(['del', 'moveFrom', 'cellIns', 'cellDel', 'cellMerge', 'numberingChange']);
const MARKERS = new Set([
	'moveFromRangeStart',
	'moveFromRangeEnd',
	'moveToRangeStart',
	'moveToRangeEnd',
	'commentRangeStart',
	'commentRangeEnd',
	'commentReference'
]);

/** core and extended properties that name people, places or the subject */
const PERSONAL = new Set([
	'creator',
	'lastModifiedBy',
	'title',
	'subject',
	'description',
	'keywords',
	'category',
	'contentStatus',
	'identifier',
	'Company',
	'Manager',
	'HyperlinkBase'
]);

const empty = (el: Element) => {
	while (el.firstChild) el.removeChild(el.firstChild);
};

/** accepts tracked changes; the deleted text would still be in the file */
function acceptRevisions(doc: Document): number {
	let count = 0;
	const found = descendants(
		doc,
		(el) =>
			el.namespaceURI === W &&
			(KEEP.has(el.localName) || DROP.has(el.localName) || /PrChange$/.test(el.localName))
	);
	for (const el of found) {
		count++;
		// in a run's or paragraph mark's properties the change is a bare marker
		if (KEEP.has(el.localName) && !is(el.parentNode, 'rPr')) unwrap(el);
		else remove(el);
	}
	return count;
}

/**
 * cleans a Word file in place, before its text is read: what a reader does
 * not see in the text, but the file passes on, goes or is emptied
 */
export function cleanDocx(docx: Package & { parts: { name: string }[] }): CleanReport {
	const report: CleanReport = {
		revisions: 0,
		comments: 0,
		properties: 0,
		thumbnail: false,
		images: 0,
		embedded: 0
	};

	for (const part of docx.parts) {
		const doc = xmlPart(docx, part.name);
		if (!doc) continue;
		report.revisions += acceptRevisions(doc);
		for (const el of descendants(
			doc,
			(node) => node.namespaceURI === W && MARKERS.has(node.localName)
		)) {
			remove(el);
		}
		// the copy of a shape for old Word versions would keep the text unchanged
		for (const el of byName(doc, 'Fallback', MC)) remove(el);
	}

	for (const [name, type] of contentTypes(docx)) {
		const doc =
			/comments|people/i.test(type) || /properties\+xml$/.test(type) ? xmlPart(docx, name) : null;
		if (!doc) continue;
		const root = doc.documentElement;
		if (/\.comments\+xml$/.test(type)) {
			report.comments += children(root).length;
			empty(root);
		} else if (/comments(Extended|Ids|Extensible)\+xml$|\.people\+xml$/.test(type)) {
			empty(root);
		} else if (/custom-properties\+xml$/.test(type)) {
			report.properties += children(root).length;
			empty(root);
		} else {
			for (const el of descendants(root, (node) => PERSONAL.has(node.localName))) {
				if (!el.firstChild) continue;
				report.properties++;
				empty(el);
			}
			// the document's title again, in the list of its parts
			for (const titles of descendants(root, (node) => node.localName === 'TitlesOfParts')) {
				for (const el of descendants(titles, (node) => node.localName === 'lpstr')) empty(el);
			}
		}
	}

	// a template path such as C:\Users\anna.berg\… names the author
	const settings = xmlPart(docx, 'word/settings.xml');
	if (settings) {
		for (const el of [...byName(settings, 'attachedTemplate'), ...byName(settings, 'docVars')]) {
			report.properties++;
			remove(el);
		}
	}

	const rootRels = xmlPart(docx, relsOf(''));
	if (rootRels) {
		for (const rel of byName(rootRels, 'Relationship', RELS)) {
			if (!/\/metadata\/thumbnail$/.test(rel.getAttribute('Type') ?? '')) continue;
			delete docx.files[(rel.getAttribute('Target') ?? '').replace(/^\//, '')];
			remove(rel);
			report.thumbnail = true;
		}
	}

	for (const name of Object.keys(docx.files)) {
		if (/^word\/media\//.test(name)) report.images++;
		else if (
			/^word\/(embeddings\/|charts\/chart[^/]*\.xml$|diagrams\/data[^/]*\.xml$)/.test(name)
		) {
			report.embedded++;
		}
	}
	return report;
}
