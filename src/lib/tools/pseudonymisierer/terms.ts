import type { Span } from './types.js';

/** the browser's own terms and the note setting; never sent anywhere */
export const TERMS_KEY = 'daily.anon.terms.v1';

/**
 * terms the user keeps for every text, one per line as typed: `always` are
 * replaced wherever they occur (client or product names the rules cannot
 * know), `never` stay as they are (the organisation's own name, a law). `note`
 * puts the placeholder note above the outgoing text; `deep` restarts the name
 * model on the next visit, when it is still in the browser's cache.
 */
export type Terms = {
	always: string;
	never: string;
	note: boolean;
	deep: boolean;
	/** the user's own standard: the rules switched on, or none saved */
	mine: string[] | null;
};

const EMPTY: Terms = { always: '', never: '', note: true, deep: false, mine: null };

/** the lines of a term list: trimmed, at least two characters, each once */
export function termList(text: string): string[] {
	return [
		...new Set(
			text
				.split('\n')
				.map((line) => line.trim())
				.filter((line) => line.length >= 2)
		)
	];
}

/** the stored terms, or none where storage is missing or blocked */
export function readTerms(): Terms {
	try {
		const raw = localStorage.getItem(TERMS_KEY);
		if (!raw) return { ...EMPTY };
		const stored = JSON.parse(raw) as Partial<Terms>;
		return {
			always: typeof stored.always === 'string' ? stored.always : '',
			never: typeof stored.never === 'string' ? stored.never : '',
			note: stored.note !== false,
			deep: stored.deep === true,
			mine: Array.isArray(stored.mine)
				? stored.mine.filter((key): key is string => typeof key === 'string')
				: null
		};
	} catch {
		return { ...EMPTY };
	}
}

export function writeTerms(terms: Terms): void {
	try {
		localStorage.setItem(TERMS_KEY, JSON.stringify(terms));
	} catch {
		// without storage the terms hold for this visit only
	}
}

/**
 * drops what a rule found where it matches a never-term, case aside. Marks the
 * user set by hand stay: a hand mark is the latest word on a value.
 */
export function withoutNever(spans: Span[], never: readonly string[]): Span[] {
	if (never.length === 0) return spans;
	const keep = new Set(never.map((term) => term.toLowerCase()));
	return spans.filter((span) => span.manual || !keep.has(span.value.toLowerCase()));
}

/**
 * the note above the outgoing text, so the AI keeps the placeholders as they
 * are. It names no placeholder itself: an AI that repeats the note must not
 * leave a token the mapping does not know.
 */
export const AI_NOTE = {
	de: 'Hinweis: Personenbezogene Daten in diesem Text sind durch Platzhalter in «…» ersetzt. Bitte übernimm die Platzhalter unverändert in deine Antwort.',
	en: 'Note: personal data in this text is replaced by placeholders in «…». Please keep the placeholders exactly as they are in your answer.'
};
