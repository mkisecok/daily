// ported from mkisecok/dataGuard (MIT)
import type { ExtractResult } from '../types.js';
import { extractDocx } from './docx.js';
import { extractPdf } from './pdf.js';
import { extractPlain } from './plain.js';

export type FileKind = 'pdf' | 'docx' | 'text';

/** 25 MB; past this the browser struggles */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

const PLAIN_EXT = ['txt', 'md', 'markdown', 'csv', 'tsv', 'log', 'json', 'xml'];

/**
 * by extension first, MIME second: Windows hands over `application/octet-stream`
 * for plenty of files, and a file dragged out of a mail client may have no type
 */
export function kindOf(file: Pick<File, 'name' | 'type'>): FileKind | null {
	const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
	const mime = file.type.toLowerCase();
	if (ext === 'pdf' || mime === 'application/pdf') return 'pdf';
	if (ext === 'docx' || mime.includes('wordprocessingml')) return 'docx';
	if (PLAIN_EXT.includes(ext) || mime.startsWith('text/')) return 'text';
	return null;
}

export class ExtractError extends Error {
	constructor(
		public readonly reason: 'unsupported' | 'too-large',
		public readonly fileName: string
	) {
		super(`${fileName}: ${reason}`);
		this.name = 'ExtractError';
	}
}

/** the text of a PDF, DOCX or plain text file; images and .doc are not supported */
export async function extract(file: File): Promise<ExtractResult> {
	if (file.size > MAX_FILE_BYTES) throw new ExtractError('too-large', file.name);
	switch (kindOf(file)) {
		case 'pdf':
			return extractPdf(file);
		case 'docx':
			return extractDocx(file);
		case 'text':
			return extractPlain(file);
		default:
			throw new ExtractError('unsupported', file.name);
	}
}
