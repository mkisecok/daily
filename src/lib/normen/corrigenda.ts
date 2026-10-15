/**
 * corrigenda (Berichtigungen) to EU acts, applied to recitals by the
 * importer. Consolidated texts already contain corrected articles and
 * annexes but no recitals, so recitals come from the original Official
 * Journal text and need the corrections applied here.
 */

export type Correction = { recital: string; from: string; to: string };

/** strips quotes, the "(71)" number and the "…" that mark an excerpt in a corrigendum */
const excerpt = (lines: string[]) =>
	lines
		.join(' ')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/[“’"]\s*[.,]?\s*$/, '')
		.replace(/^[„‘"]\s*/, '')
		.replace(/^\(\d+\)\s*/, '')
		.replace(/^…\s*/, '')
		.replace(/\s*…$/, '');

/**
 * recital corrections from the text lines of a corrigendum ("Seite 9,
 * Erwägungsgrund 47 … Anstatt: „…“ muss es heißen: „…“", in English "On
 * page 9, recital 47 … for: ‘…’ read: ‘…’"). Corrections to articles are
 * skipped: the consolidated text already contains them.
 */
export function recitalCorrections(lines: string[]): Correction[] {
	const out: Correction[] = [];
	let current: {
		recital: string | null;
		mode: 'from' | 'to' | null;
		from: string[];
		to: string[];
	} = { recital: null, mode: null, from: [], to: [] };
	const flush = () => {
		if (current.recital && current.from.length > 0 && current.to.length > 0) {
			out.push({ recital: current.recital, from: excerpt(current.from), to: excerpt(current.to) });
		}
	};
	for (const line of lines) {
		// numbered entries ("1.", "2.") carry no text
		if (/^\d+\.$/.test(line)) continue;
		if (/^(On )?(Seite|page) \d+/i.test(line)) {
			flush();
			const recital = /^(?:On )?(?:Seite|page) \d+, (?:Erwägungsgrund|recital) (\d+)/i.exec(line);
			current = { recital: recital ? recital[1] : null, mode: null, from: [], to: [] };
		} else if (/^(Anstatt|for):?$/i.test(line)) {
			current.mode = 'from';
		} else if (/^(muss es heißen|read):?$/i.test(line)) {
			current.mode = 'to';
		} else if (current.mode) {
			current[current.mode].push(line);
		}
	}
	flush();
	return out;
}

const occurrences = (text: string, part: string) => text.split(part).length - 1;

/**
 * corrigenda sometimes quote the context around the change inexactly
 * (recital 50 DSGVO quotes "dabei sind die …" where the text reads
 * "insbesondere die …"). Unchanged words are trimmed from both ends of the
 * quote, shortest trim first, until the passage occurs exactly once.
 */
export function locate(
	text: string,
	from: string,
	to: string
): { from: string; to: string } | null {
	if (occurrences(text, from) === 1) return { from, to };
	const a = from.split(' ');
	const b = to.split(' ');
	let prefix = 0;
	while (prefix < Math.min(a.length, b.length) && a[prefix] === b[prefix]) prefix += 1;
	let suffix = 0;
	while (
		suffix < Math.min(a.length, b.length) - prefix &&
		a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
	) {
		suffix += 1;
	}
	for (let trim = 1; trim <= prefix + suffix; trim += 1) {
		for (let head = Math.min(trim, prefix); head >= 0 && trim - head <= suffix; head -= 1) {
			const tail = trim - head;
			const part = a.slice(head, a.length - tail).join(' ');
			if (occurrences(text, part) === 1) {
				return { from: part, to: b.slice(head, b.length - tail).join(' ') };
			}
		}
	}
	return null;
}

/** applies corrections; fails loudly when a corrected passage is in neither form */
export function applyCorrections(
	recitals: Map<string, string>,
	corrections: Correction[],
	where: string
): number {
	let applied = 0;
	for (const correction of corrections) {
		const text = recitals.get(correction.recital);
		if (text === undefined) throw new Error(`${where}: recital ${correction.recital} missing`);
		if (text.includes(correction.to)) continue;
		const found = locate(text, correction.from, correction.to);
		if (!found) {
			throw new Error(
				`${where}: recital ${correction.recital} passage not found: ${correction.from.slice(0, 80)}`
			);
		}
		if (found.from !== correction.from) {
			console.warn(`${where}: recital ${correction.recital} matched on "${found.from}"`);
		}
		recitals.set(correction.recital, text.replace(found.from, found.to));
		applied += 1;
	}
	return applied;
}
