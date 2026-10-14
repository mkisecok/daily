import type { LegalBasis } from '../tools/types.js';
import { lawByCitation } from './laws.js';
import type { LawId } from './types.js';

export type ProvisionRef = { law: LawId; id: string };

const MAX_RANGE = 40;

/** Numbers after "Art." or "§": "4, 26, 50", "15–22", "35 Abs. 3" (stops at the first non-list token). */
function numbers(list: string): string[] {
	const out: string[] = [];
	for (const part of list.split(/\s*,\s*|\s+(?:und|and|bis)\s+/)) {
		const range = /^(\d+)\s*[–-]\s*(\d+)$/.exec(part.trim());
		if (range) {
			const [from, to] = [Number(range[1]), Number(range[2])];
			for (let n = from; n <= to && n - from < MAX_RANGE; n++) out.push(String(n));
			continue;
		}
		const single = /^(\d+[a-z]?)\b/.exec(part.trim());
		if (single) out.push(single[1]);
		else break;
	}
	return out;
}

/**
 * The provisions a citation points to, if the law is in the Navigator:
 * "Art. 35 Abs. 3 lit. a" → art-35, "Art. 15–22" → art-15 … art-22,
 * "§ 26 Abs. 2" → p-26, "Anhang III Nr. 5" → anhang-iii.
 */
export function provisionsOf(basis: LegalBasis): ProvisionRef[] {
	const meta = lawByCitation(basis.law);
	if (!meta) return [];
	const refs: ProvisionRef[] = [];
	const add = (id: string) => {
		if (!refs.some((r) => r.id === id)) refs.push({ law: meta.id, id });
	};
	for (const match of basis.ref.matchAll(
		/Art\.\s*((?:\d+[a-z]?(?:\s*[–-]\s*\d+)?(?:\s*,\s*|\s+(?:und|and)\s+)?)+)/g
	)) {
		for (const n of numbers(match[1])) add(`art-${n}`);
	}
	for (const match of basis.ref.matchAll(
		/§§?\s*((?:\d+[a-z]?(?:\s*[–-]\s*\d+)?(?:\s*,\s*|\s+(?:und|and)\s+)?)+)/g
	)) {
		for (const n of numbers(match[1])) add(`p-${n}`);
	}
	for (const match of basis.ref.matchAll(/(?:Anhang|Annex)\s+([IVXLC]+)\b/g))
		add(`anhang-${match[1].toLowerCase()}`);
	for (const match of basis.ref.matchAll(/(?:Erwägungsgrund|ErwG|Recital)\s+(\d+)/g))
		add(`erwg-${match[1]}`);
	return refs;
}

/** Route path of the first provision a citation points to, or null. */
export function citationPath(basis: LegalBasis): string | null {
	const [first] = provisionsOf(basis);
	return first ? `/normen/${first.law}/${first.id}` : null;
}
