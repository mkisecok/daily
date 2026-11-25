import { zlibSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { buildRun, detect } from '../detect.js';
import { PAGE_BREAK } from '../pages.js';
import { RULE_KEYS } from '../rules.js';
import type { RuleKey } from '../types.js';
import { composePdf } from './compose.js';
import {
	layerOf,
	layoutText,
	lineItem,
	lineRects,
	rangeInBox,
	regionsOf,
	type PdfItem,
	type PdfPage
} from './pdf-layout.js';
import { readPdf } from './pdf.js';

const item = (str: string, x: number, base: number, eol = true): PdfItem => ({
	str,
	x,
	base,
	w: str.length * 6,
	size: 10,
	eol
});

/** two pages: a letter head over two lines, then a page with an IBAN */
const pages: PdfPage[] = [
	{
		width: 595,
		height: 842,
		items: [
			item('Frau Katharina ', 50, 100, false),
			item('Brandt wohnt hier.', 140, 100),
			item('Sie wünscht einen Rückruf', 50, 120),
			item('nach dem Urlaub.', 50, 134)
		]
	},
	{ width: 595, height: 842, items: [item('IBAN DE89 3704 0044 0532 0130 00', 50, 100)] }
];

describe('the text of a PDF with its letters placed', () => {
	const layout = layoutText(pages);

	it('reads items in order, with line ends and a page break, and places every letter', () => {
		expect(layout.text).toBe(
			`Frau Katharina Brandt wohnt hier.\nSie wünscht einen Rückruf\nnach dem Urlaub.\n${PAGE_BREAK}IBAN DE89 3704 0044 0532 0130 00\n`
		);
		expect(layout.origins).toHaveLength(layout.text.length);
		const b = layout.text.indexOf('Brandt');
		expect(layout.origins[b]).toMatchObject({ page: 0, x: 140, item: 1 });
		expect(layout.origins[b + 1]!.x).toBeCloseTo(146);
		expect(layout.text.slice(layout.pages[1]!.start, layout.pages[1]!.end)).toContain('IBAN');
	});

	it('makes one box per line of a stretch, and finds the stretch a box was drawn around', () => {
		const start = layout.text.indexOf('Sie');
		const end = layout.text.indexOf('Urlaub.') + 7;
		const lines = lineRects(layout.origins, start, end);
		expect(lines).toHaveLength(2);
		expect(lines[0]).toMatchObject({ page: 0, x: 50, start });
		expect(lines[1]!.y).toBeGreaterThan(lines[0]!.y);
		// a name across two items stays one line
		const name = layout.text.indexOf('Katharina');
		expect(lineRects(layout.origins, name, name + 'Katharina Brandt'.length)).toHaveLength(1);

		const drawn = rangeInBox(layout.origins, { page: 0, x: 45, y: 105, w: 200, h: 35 });
		expect(drawn && layout.text.slice(drawn.start, drawn.end)).toBe(
			'Sie wünscht einen Rückruf\nnach dem Urlaub.'
		);
		expect(rangeInBox(layout.origins, { page: 1, x: 0, y: 0, w: 10, h: 10 })).toBeNull();
	});

	it('gives each covered line its text and placeholder, and a text layer with placeholders', () => {
		const spans = detect(layout.text, new Set<RuleKey>(RULE_KEYS), new Map(), new Set(), [
			{
				start: layout.text.indexOf('Sie'),
				end: layout.text.indexOf('Urlaub.') + 7,
				label: 'NOTIZ'
			}
		]);
		buildRun(layout.text, spans);
		const regions = regionsOf(layout.text, layout.origins, spans);
		expect(regions.filter((r) => r.token === '«NOTIZ_1»').map((r) => [r.text, r.first])).toEqual([
			['Sie wünscht einen Rückruf', true],
			['nach dem Urlaub.', false]
		]);
		const layer = layerOf(pages[0]!, layout.runs[0]!, layout.text, spans);
		expect(layer.map((l) => l.str)).toEqual(['Frau «NAME_1»', ' wohnt hier.', '«NOTIZ_1»']);
		expect(layer[0]).toMatchObject({ x: 50, base: 100, size: 10 });
		// a covered line, written back into the layer, sits where the line stood
		const second = regions.find((r) => r.text === 'nach dem Urlaub.')!;
		const back = lineItem(second, second.text);
		expect(back).toMatchObject({ x: 50, w: second.w });
		expect(back.size).toBeCloseTo(10);
		expect(back.base).toBeCloseTo(134);
		const iban = layerOf(pages[1]!, layout.runs[1]!, layout.text, spans);
		expect(iban.map((l) => l.str)).toEqual(['IBAN «NUMBER_1»']);
	});
});

/** a one-pixel white PNG, put together by hand */
function png(): Uint8Array {
	const table = Array.from({ length: 256 }, (_, n) => {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		return c >>> 0;
	});
	const crc = (bytes: Uint8Array) => {
		let c = 0xffffffff;
		for (const b of bytes) c = table[(c ^ b) & 0xff]! ^ (c >>> 8);
		return (c ^ 0xffffffff) >>> 0;
	};
	const chunk = (type: string, data: Uint8Array) => {
		const body = new Uint8Array([...new TextEncoder().encode(type), ...data]);
		const out = new Uint8Array(12 + data.length);
		const view = new DataView(out.buffer);
		view.setUint32(0, data.length);
		out.set(body, 4);
		view.setUint32(8 + data.length, crc(body));
		return out;
	};
	const header = new Uint8Array(13);
	new DataView(header.buffer).setUint32(0, 1);
	new DataView(header.buffer).setUint32(4, 1);
	header.set([8, 2, 0, 0, 0], 8);
	return new Uint8Array([
		...[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
		...chunk('IHDR', header),
		...chunk('IDAT', zlibSync(new Uint8Array([0, 255, 255, 255]))),
		...chunk('IEND', new Uint8Array())
	]);
}

describe('composing a PDF from page pictures', () => {
	it('writes an invisible text layer that reads back at its place, and nothing about the old file', async () => {
		const bytes = await composePdf([
			{
				width: 595,
				height: 842,
				image: { kind: 'png', bytes: png() },
				layer: [
					{ str: 'Frau «NAME_1» wohnt hier.', x: 50, base: 100, size: 10, w: 150 },
					{ str: 'Straße in Ankara: Kızılay', x: 50, base: 120, size: 10 }
				]
			}
		]);
		const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
		const doc = await pdfjs.getDocument({ data: bytes, useWorkerFetch: false }).promise;
		const [page] = await readPdf(doc);
		expect(page).toMatchObject({ width: 595, height: 842 });
		const text = page!.items.map((i) => i.str).join('|');
		expect(text).toContain('Frau «NAME_1» wohnt hier.');
		// Helvetica has no dotless i: it becomes a question mark rather than breaking the file
		expect(text).toContain('Straße in Ankara: K?z?lay');
		const first = page!.items.find((i) => i.str.startsWith('Frau'))!;
		expect(first.x).toBeCloseTo(50);
		expect(first.base).toBeCloseTo(100);
		// squeezed to the width of the item it stands for; pdf.js measures without the font's own metrics here
		expect(Math.abs(first.w - 150)).toBeLessThan(3);
		const { info } = (await doc.getMetadata()) as { info: Record<string, unknown> };
		expect(info.Producer).toBe('Daily Pseudonymisierer');
		expect(info.Title).toBeUndefined();
		expect(info.Author).toBeUndefined();
		await doc.loadingTask.destroy();
	});
});
