import type { PDFDocumentProxy } from 'pdfjs-dist';
import { leftoverIn, tolerantTokenRe } from '../restore.js';
import type { Span } from '../types.js';
import type { ComposedPage } from './compose.js';
import { fingerprint, type KeyContent } from './key.js';

type KeyRegion = NonNullable<KeyContent['regions']>[number];
import {
	evenly,
	layerOf,
	layoutText,
	lineItem,
	regionsOf,
	type LayerItem,
	type Measure,
	type PdfPage,
	type PdfText,
	type Region
} from './pdf-layout.js';
import type { Restored } from './run.js';

/** pages are pictured at twice their size in points, about 144 dpi */
export const RENDER_SCALE = 2;
const JPEG_QUALITY = 0.85;

export class PdfError extends Error {
	constructor(public readonly reason: 'password' | 'not-pdf' | 'no-text') {
		super(reason);
		this.name = 'PdfError';
	}
}

/**
 * a PDF opened with pdf.js, which loads only when a PDF is chosen, kept
 * offline as the text import keeps it
 */
export async function loadPdf(bytes: Uint8Array): Promise<PDFDocumentProxy> {
	const [pdfjs, worker] = await Promise.all([
		import('pdfjs-dist'),
		import('pdfjs-dist/build/pdf.worker.mjs?url')
	]);
	pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
	try {
		// a copy: pdf.js hands the buffer to its worker, which takes it away
		return await pdfjs.getDocument({
			data: bytes.slice(),
			useWorkerFetch: false,
			disableFontFace: true,
			useWasm: false
		}).promise;
	} catch (error) {
		throw new PdfError((error as Error)?.name === 'PasswordException' ? 'password' : 'not-pdf');
	}
}

const multiply = (m: number[], n: number[]) => [
	m[0]! * n[0]! + m[2]! * n[1]!,
	m[1]! * n[0]! + m[3]! * n[1]!,
	m[0]! * n[2]! + m[2]! * n[3]!,
	m[1]! * n[2]! + m[3]! * n[3]!,
	m[0]! * n[4]! + m[2]! * n[5]! + m[4]!,
	m[1]! * n[4]! + m[3]! * n[5]! + m[5]!
];

/** every page's size and text items, in points from the top left of the page as shown */
export async function readPdf(doc: PDFDocumentProxy): Promise<PdfPage[]> {
	const pages: PdfPage[] = [];
	for (let n = 1; n <= doc.numPages; n++) {
		const page = await doc.getPage(n);
		const viewport = page.getViewport({ scale: 1 });
		const content = await page.getTextContent();
		const items: PdfPage['items'] = [];
		for (const item of content.items) {
			if (!('str' in item)) continue;
			const m = multiply(viewport.transform, item.transform);
			items.push({
				str: item.str,
				x: m[4]!,
				base: m[5]!,
				w: item.width,
				size: Math.hypot(m[2]!, m[3]!) || item.height,
				eol: item.hasEOL,
				font: content.styles[item.fontName]?.fontFamily
			});
		}
		pages.push({ width: viewport.width, height: viewport.height, items });
		page.cleanup();
	}
	return pages;
}

/** letter widths from the browser's fonts, close to what the PDF shows */
export function canvasMeasure(): Measure {
	const ctx = document.createElement('canvas').getContext('2d');
	if (!ctx) return evenly;
	return (str, font) => {
		ctx.font = `100px ${font ?? 'sans-serif'}`;
		const ends: number[] = [];
		for (let i = 1; i <= str.length; i++) ends.push(ctx.measureText(str.slice(0, i)).width);
		const total = ends[ends.length - 1] ?? 0;
		if (!total) return evenly(str);
		return ends.map((end, i) => (end - (i > 0 ? ends[i - 1]! : 0)) / total);
	};
}

export type OpenedPdf = { doc: PDFDocumentProxy; pages: PdfPage[]; layout: PdfText };

/** a PDF ready to mark: the pdf.js document, its pages and its text with letter places */
export async function openPdf(bytes: Uint8Array): Promise<OpenedPdf> {
	const doc = await loadPdf(bytes);
	const pages = await readPdf(doc);
	const layout = layoutText(pages, canvasMeasure());
	if (!layout.text.replace(/\s/g, '')) {
		await doc.loadingTask.destroy();
		throw new PdfError('no-text');
	}
	return { doc, pages, layout };
}

/** draws a page into a canvas at `scale` pixels per point */
export function drawPage(
	doc: PDFDocumentProxy,
	index: number,
	canvas: HTMLCanvasElement,
	scale: number
) {
	let cancelled = false;
	let cancel = () => {
		cancelled = true;
	};
	const done = (async () => {
		const page = await doc.getPage(index + 1);
		if (cancelled) return;
		const viewport = page.getViewport({ scale });
		canvas.width = Math.ceil(viewport.width);
		canvas.height = Math.ceil(viewport.height);
		const task = page.render({ canvas, viewport });
		cancel = () => task.cancel();
		try {
			await task.promise;
		} catch {
			// a cancelled render rejects; a newer one is on its way
		}
	})();
	return { done, cancel: () => cancel() };
}

async function pagePicture(
	doc: PDFDocumentProxy,
	index: number,
	paint: (ctx: CanvasRenderingContext2D) => void
) {
	const canvas = document.createElement('canvas');
	await drawPage(doc, index, canvas, RENDER_SCALE).done;
	const ctx = canvas.getContext('2d')!;
	paint(ctx);
	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
	);
	if (!blob) throw new Error('no picture');
	return new Uint8Array(await blob.arrayBuffer());
}

/** writes `value` in one line into a box, as large as fits */
function fitText(
	ctx: CanvasRenderingContext2D,
	value: string,
	x: number,
	y: number,
	w: number,
	h: number,
	weight = 400
) {
	let size = h * 0.8;
	ctx.font = `${weight} ${size}px sans-serif`;
	const room = Math.max(1, w - h * 0.2);
	const width = ctx.measureText(value).width;
	if (width > room) {
		size = Math.max(4, size * (room / width));
		ctx.font = `${weight} ${size}px sans-serif`;
	}
	ctx.textBaseline = 'middle';
	ctx.fillText(value, x + h * 0.1, y + h / 2, room);
}

/** covers each region with a grey box, the placeholder in its first line */
function paintCovered(ctx: CanvasRenderingContext2D, regions: Region[]) {
	const s = RENDER_SCALE;
	for (const r of regions) {
		const [x, y, w, h] = [r.x * s - s, r.y * s, r.w * s + 2 * s, r.h * s];
		ctx.fillStyle = '#e6e9f0';
		ctx.fillRect(x, y, w, h);
		ctx.strokeStyle = '#5b6478';
		ctx.lineWidth = s;
		ctx.strokeRect(x, y, w, h);
		if (!r.first) continue;
		ctx.fillStyle = '#1d2740';
		fitText(ctx, r.token, x, y, w, h, 600);
	}
}

/** writes the original text back over each covered line */
function paintRestored(
	ctx: CanvasRenderingContext2D,
	regions: Pick<Region, 'x' | 'y' | 'w' | 'h' | 'text'>[]
) {
	const s = RENDER_SCALE;
	for (const r of regions) {
		const [x, y, w, h] = [r.x * s - 2 * s, r.y * s - s, r.w * s + 4 * s, r.h * s + 2 * s];
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(x, y, w, h);
		ctx.fillStyle = '#000000';
		fitText(ctx, r.text, x + s, y + s, w - 2 * s, h - 2 * s);
	}
}

/** pdf-lib loads only when a PDF is written */
async function compose(pages: ComposedPage[]): Promise<Uint8Array> {
	const { composePdf } = await import('./compose.js');
	return composePdf(pages);
}

/** the text of a PDF as the reader takes it in */
async function textOf(bytes: Uint8Array): Promise<string> {
	const doc = await loadPdf(bytes);
	try {
		return layoutText(await readPdf(doc)).text;
	} finally {
		await doc.loadingTask.destroy();
	}
}

export type PseudonymisedPdf = { bytes: Uint8Array; key: KeyContent; pages: number };

/**
 * the PDF rebuilt from pictures of its pages, with every live span covered
 * and labelled with its placeholder, and an invisible text layer that holds
 * the placeholders instead of the values. Rebuilding is what makes it safe:
 * a box drawn over a PDF leaves the text under it in the file.
 */
export async function pseudonymisePdf(bytes: Uint8Array, spans: Span[]): Promise<PseudonymisedPdf> {
	const doc = await loadPdf(bytes);
	try {
		const pages = await readPdf(doc);
		const layout = layoutText(pages, canvasMeasure());
		const regions = regionsOf(layout.text, layout.origins, spans);
		const composed: ComposedPage[] = [];
		for (let i = 0; i < pages.length; i++) {
			const page = pages[i]!;
			composed.push({
				width: page.width,
				height: page.height,
				image: {
					kind: 'jpg',
					bytes: await pagePicture(doc, i, (ctx) =>
						paintCovered(
							ctx,
							regions.filter((r) => r.page === i)
						)
					)
				},
				layer: layerOf(page, layout.runs[i] ?? [], layout.text, spans)
			});
		}
		const out = await compose(composed);
		const values: Record<string, string> = {};
		for (const span of spans)
			if (!span.muted && span.replacement) values[span.replacement] = span.value;
		return {
			bytes: out,
			key: {
				fingerprint: await fingerprint(await textOf(out)),
				created: new Date().toISOString(),
				values,
				regions: regions.map(({ first, page, x, y, w, h, token, text }) => ({
					first,
					page,
					x,
					y,
					w,
					h,
					token,
					text
				}))
			},
			pages: pages.length
		};
	} finally {
		await doc.loadingTask.destroy();
	}
}

/**
 * a readable copy of a pseudonymised PDF with the original values: written
 * back over the boxes where they stood, and into the text layer in place of
 * the placeholders
 */
export async function restorePdf(bytes: Uint8Array, key: KeyContent): Promise<Restored> {
	const doc = await loadPdf(bytes);
	try {
		const pages = await readPdf(doc);
		const changed = (await fingerprint(layoutText(pages).text)) !== key.fingerprint;
		const entries = Object.entries(key.values).sort((a, b) => b[0].length - a[0].length);
		// each value's covered lines, in the order its placeholders come up
		const lines = new Map<string, KeyRegion[][]>();
		for (const region of key.regions ?? []) {
			const list = lines.get(region.token) ?? [];
			if (region.first !== false || list.length === 0) list.push([]);
			list[list.length - 1]!.push(region);
			lines.set(region.token, list);
		}
		let count = 0;
		/** an item's text with the values back; a value over several lines adds a layer item per further line */
		const swap = (str: string, extra: LayerItem[]) => {
			let out = str;
			for (const [placeholder, original] of entries) {
				out = out.replace(tolerantTokenRe(placeholder.replace(/^«|»$/g, '')), () => {
					count++;
					const [first, ...rest] = lines.get(placeholder)?.shift() ?? [];
					if (!first || rest.length === 0) return original.replace(/\s*\n\s*/g, ' ');
					extra.push(...rest.map((line) => lineItem(line, line.text)));
					return first.text;
				});
			}
			return out;
		};
		const composed: ComposedPage[] = [];
		const layerText: string[] = [];
		for (let i = 0; i < pages.length; i++) {
			const page = pages[i]!;
			const extra: LayerItem[] = [];
			const layer: LayerItem[] = page.items
				.filter((item) => item.str.trim())
				.map((item) => ({
					str: swap(item.str, extra),
					x: item.x,
					base: item.base,
					size: item.size,
					w: item.w
				}));
			layer.push(...extra);
			layerText.push(...layer.map((item) => item.str));
			composed.push({
				width: page.width,
				height: page.height,
				image: {
					kind: 'jpg',
					bytes: await pagePicture(doc, i, (ctx) =>
						paintRestored(
							ctx,
							(key.regions ?? []).filter((r) => r.page === i)
						)
					)
				},
				layer
			});
		}
		return {
			bytes: await compose(composed),
			count,
			total: entries.length,
			leftover: leftoverIn(layerText.join('\n')),
			changed
		};
	} finally {
		await doc.loadingTask.destroy();
	}
}
