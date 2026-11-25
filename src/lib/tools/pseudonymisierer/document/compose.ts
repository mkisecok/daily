import {
	beginText,
	endText,
	PDFDocument,
	setCharacterSqueeze,
	setFontAndSize,
	setTextMatrix,
	setTextRenderingMode,
	showText,
	StandardFonts,
	TextRenderingMode
} from 'pdf-lib';
import type { LayerItem } from './pdf-layout.js';

/** a page to write: its size in points, a picture of it, and the text that lies invisibly over it */
export type ComposedPage = {
	width: number;
	height: number;
	image: { kind: 'jpg' | 'png'; bytes: Uint8Array };
	layer: LayerItem[];
};

/**
 * a new PDF from pictures of the pages and an invisible text layer, so the
 * file shows only what was painted, can still be searched and read by a
 * model, and carries nothing of the old file: no metadata, links, form
 * fields, attachments or bookmarks. The layer is set in Helvetica, so
 * letters outside Latin-1 become "?".
 */
export async function composePdf(pages: ComposedPage[]): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	pdf.setProducer('Daily Pseudonymisierer');
	pdf.setCreator('Daily');
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const known = new Set(font.getCharacterSet());
	const latin = (str: string) =>
		[...str].map((char) => (known.has(char.codePointAt(0)!) ? char : '?')).join('');

	for (const spec of pages) {
		const page = pdf.addPage([spec.width, spec.height]);
		const image =
			spec.image.kind === 'jpg'
				? await pdf.embedJpg(spec.image.bytes)
				: await pdf.embedPng(spec.image.bytes);
		page.drawImage(image, { x: 0, y: 0, width: spec.width, height: spec.height });
		if (spec.layer.length === 0) continue;
		const key = page.node.newFontDictionary(font.name, font.ref);
		for (const item of spec.layer) {
			const str = latin(item.str);
			const natural = font.widthOfTextAtSize(str, item.size);
			const squeeze = item.w && natural > 0 ? (item.w / natural) * 100 : 100;
			page.pushOperators(
				beginText(),
				setFontAndSize(key, item.size),
				setTextRenderingMode(TextRenderingMode.Invisible),
				setCharacterSqueeze(Math.max(10, Math.min(400, squeeze))),
				setTextMatrix(1, 0, 0, 1, item.x, spec.height - item.base),
				showText(font.encodeText(str)),
				endText()
			);
		}
	}
	return pdf.save();
}
