/**
 * the text cut into pieces the model can take at once (it reads at most 384
 * tokens), each with its offset in the whole text, so a name found in a
 * piece maps back to its place. Cuts fall after a line break or a sentence
 * end where possible.
 */
export function chunks(text: string, maxWords = 180): { offset: number; text: string }[] {
	const out: { offset: number; text: string }[] = [];
	let start = 0;
	let words = 0;
	let lastBreak = -1;
	for (let i = 0; i < text.length; i++) {
		const char = text[i]!;
		const next = text[i + 1];
		if (char === ' ' || char === '\n' || char === '\t') words++;
		const sentenceEnd =
			(char === '.' || char === '!' || char === '?') && (next === ' ' || next === '\n');
		if (char === '\n' || sentenceEnd) lastBreak = i + 1;
		if (words >= maxWords) {
			const cut = lastBreak > start ? lastBreak : i + 1;
			out.push({ offset: start, text: text.slice(start, cut) });
			start = cut;
			words = 0;
			lastBreak = -1;
		}
	}
	if (start < text.length) out.push({ offset: start, text: text.slice(start) });
	return out.filter((piece) => piece.text.trim().length > 0);
}

const TITLE = /^(?:Herr|Herrn|Frau|Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/u;

/** a found name without the title before it: "Dr. Ruth Albrecht-Bayer" → "Ruth Albrecht-Bayer" */
export function bareName(value: string): string {
	let name = value.trim();
	while (TITLE.test(name)) name = name.replace(TITLE, '');
	return name.replace(/[.,;:]+$/u, '');
}

const LETTER = /[\p{L}\p{N}]/u;

/** whether `value` occurs in `text` as whole words, not as the start of a longer word */
export function standsAlone(text: string, value: string): boolean {
	for (let i = text.indexOf(value); i !== -1; i = text.indexOf(value, i + 1)) {
		const before = text[i - 1];
		const after = text[i + value.length];
		if (
			(before === undefined || !LETTER.test(before)) &&
			(after === undefined || !LETTER.test(after))
		)
			return true;
	}
	return false;
}
