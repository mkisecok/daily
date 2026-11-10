// ported from mkisecok/dataGuard (MIT)
import type { ExtractResult } from '../types.js';

/** below this, a "text layer" is page furniture rather than content */
const MIN_CHARS_PER_PAGE = 8;

/**
 * the text layer of a PDF, page by page. pdf.js and its worker load only when a
 * PDF is chosen. A scan has no text layer and comes back as `needsOcr` instead
 * of an empty document that would look like a failed import.
 */
export async function extractPdf(file: File): Promise<ExtractResult> {
	const [pdfjs, worker] = await Promise.all([
		import('pdfjs-dist'),
		import('pdfjs-dist/build/pdf.worker.mjs?url')
	]);
	pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

	const task = pdfjs.getDocument({
		data: new Uint8Array(await file.arrayBuffer()),
		// keep pdf.js offline: character maps, standard fonts and the wasm decoder
		// would otherwise come from a CDN, and none is needed to read a text layer
		useWorkerFetch: false,
		disableFontFace: true,
		useWasm: false
	});
	const doc = await task.promise;

	try {
		const pages: string[] = [];
		let chars = 0;
		for (let n = 1; n <= doc.numPages; n++) {
			const page = await doc.getPage(n);
			const content = await page.getTextContent();
			// pdf.js emits positioned items; `hasEOL` marks where a visual line ends
			let text = '';
			for (const item of content.items) {
				if (!('str' in item)) continue;
				text += item.str + (item.hasEOL ? '\n' : '');
			}
			text = text.replace(/[ \t]+\n/g, '\n').trim();
			chars += text.length;
			pages.push(text);
			page.cleanup();
		}

		if (chars < MIN_CHARS_PER_PAGE * doc.numPages) {
			return { text: '', pages: doc.numPages, needsOcr: true };
		}
		return { text: pages.join('\n\n'), pages: doc.numPages };
	} finally {
		await task.destroy();
	}
}
