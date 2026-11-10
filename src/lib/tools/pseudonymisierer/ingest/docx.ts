// ported from mkisecok/dataGuard (MIT)
import type { ExtractResult } from '../types.js';

/**
 * Word documents as raw text via mammoth, loaded only when a DOCX is chosen.
 * Formatting is dropped on purpose: markup between a label and its value would
 * break the lookbehind rules.
 */
export async function extractDocx(file: File): Promise<ExtractResult> {
	const mammoth = await import('mammoth');
	const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
	return { text: result.value.replace(/\r\n?/g, '\n').trim() };
}
