import { strToU8, zipSync } from 'fflate';

/** a small Word file put together from its parts, for the tests and the sample document */

const NS =
	'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"';
const HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const CT = 'application/vnd.openxmlformats-officedocument';

export type FixtureParts = {
	/** the inside of `w:body` */
	body: string;
	/** the inside of `w:hdr` */
	header?: string;
	/** `w:comment` elements */
	comments?: string;
	/** relationships of the body, e.g. hyperlinks */
	bodyRels?: string;
	creator?: string;
	thumbnail?: boolean;
	images?: number;
};

export function makeDocx(parts: FixtureParts): Uint8Array {
	const overrides = [
		`<Override PartName="/word/document.xml" ContentType="${CT}.wordprocessingml.document.main+xml"/>`,
		`<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>`
	];
	const bodyRels = [parts.bodyRels ?? ''];
	const files: Record<string, Uint8Array> = {
		'word/document.xml': strToU8(
			`${HEAD}<w:document ${NS}><w:body>${parts.body}</w:body></w:document>`
		),
		'docProps/core.xml': strToU8(
			`${HEAD}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>${parts.creator ?? ''}</dc:creator><cp:lastModifiedBy>${parts.creator ?? ''}</cp:lastModifiedBy></cp:coreProperties>`
		)
	};
	if (parts.header !== undefined) {
		overrides.push(
			`<Override PartName="/word/header1.xml" ContentType="${CT}.wordprocessingml.header+xml"/>`
		);
		files['word/header1.xml'] = strToU8(`${HEAD}<w:hdr ${NS}>${parts.header}</w:hdr>`);
		bodyRels.push(
			'<Relationship Id="rIdH" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>'
		);
	}
	if (parts.comments !== undefined) {
		overrides.push(
			`<Override PartName="/word/comments.xml" ContentType="${CT}.wordprocessingml.comments+xml"/>`
		);
		files['word/comments.xml'] = strToU8(`${HEAD}<w:comments ${NS}>${parts.comments}</w:comments>`);
	}
	const rootRels = [
		'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
	];
	if (parts.thumbnail) {
		files['docProps/thumbnail.jpeg'] = new Uint8Array([0xff, 0xd8, 0xff]);
		rootRels.push(
			'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail" Target="docProps/thumbnail.jpeg"/>'
		);
	}
	for (let i = 1; i <= (parts.images ?? 0); i++)
		files[`word/media/image${i}.png`] = new Uint8Array([1]);
	files['[Content_Types].xml'] = strToU8(
		`${HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>${overrides.join('')}</Types>`
	);
	const rels = (inner: string) =>
		strToU8(
			`${HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${inner}</Relationships>`
		);
	files['_rels/.rels'] = rels(rootRels.join(''));
	files['word/_rels/document.xml.rels'] = rels(bodyRels.join(''));
	return zipSync(files);
}

/** a paragraph of plain runs, one per string */
export const p = (...runs: string[]) =>
	`<w:p>${runs.map((run) => `<w:r><w:t xml:space="preserve">${run}</w:t></w:r>`).join('')}</w:p>`;
