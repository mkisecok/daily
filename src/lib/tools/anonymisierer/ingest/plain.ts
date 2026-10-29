// ported from mkisecok/dataGuard (MIT)
import type { ExtractResult } from '../types.js';

/** text, Markdown, CSV: already text. CRLF becomes LF so offsets match the text field. */
export async function extractPlain(file: File): Promise<ExtractResult> {
	return { text: (await file.text()).replace(/\r\n?/g, '\n').trim() };
}
