// ported from mkisecok/dataGuard (MIT)
import { TOKEN_TYPES } from './rules.js';
import type { Mapping, RestoreResult } from './types.js';

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * tolerant matcher for one placeholder core such as `EMAIL_1`: needs a «/[ in
 * front and a »/] behind, but accepts case changes, stray spaces and a space
 * instead of the underscore. Models reformat tokens more often than not.
 */
export function tolerantTokenRe(core: string): RegExp {
	const [type = '', num = ''] = core.split(/_(?=\d+$)/);
	const t = escape(type).replace(/_/g, '[_ ]');
	return new RegExp(`(?:\\u00ab|\\[\\[?)\\s*${t}\\s*[_ ]\\s*${num}\\s*(?:\\u00bb|\\]\\]?)`, 'gi');
}

/**
 * placeholder-shaped text after restoring. Guillemets are ours, so anything in
 * them counts; in square brackets only our own types do, so "[Seite 3]" or
 * "[Abschnitt 2]" in a reply is not reported.
 */
const TYPES = TOKEN_TYPES.map((type) => escape(type).replace(/_/g, '[_ ]')).join('|');
const LEFTOVER_RE = new RegExp(
	`\\u00ab\\s*[A-Z][A-Z_ ]*[_ ]\\s*\\d+\\s*\\u00bb|\\[\\[?\\s*(?:${TYPES})\\s*[_ ]\\s*\\d+\\s*\\]\\]?`,
	'gi'
);

/**
 * writes the real values back into a reply, against the mapping of the text
 * that was actually copied out.
 */
export function restoreFrom(aiText: string, mapping: Mapping): RestoreResult {
	const entries = Object.keys(mapping)
		.map((original) => ({
			original,
			core: mapping[original]!.replacement.replace(/^«|»$/g, '')
		}))
		// longest core first, so NAME_1 cannot take the front of NAME_10
		.sort((a, b) => b.core.length - a.core.length);

	let text = aiText;
	let count = 0;
	for (const { original, core } of entries) {
		text = text.replace(tolerantTokenRe(core), () => {
			count++;
			return original;
		});
	}

	// whatever still looks like a placeholder was invented or mangled by the model
	const leftover = [...new Set((text.match(LEFTOVER_RE) ?? []).map((s) => s.trim()))];

	return { text, count, leftover, total: entries.length };
}
