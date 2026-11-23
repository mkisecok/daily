import type { RecordView } from '../../records/types.js';
import type { Localized } from '../types.js';
import { activeVorgaenge, EBENEN, levelStatus, VORGAENGE, ZIELE } from './cube.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** a goal that is not yet met on some level, with why it comes first */
export type Focus = {
	goal: string;
	/** its weak levels, the most pressing first */
	levels: { level: string; status: 'luecke' | 'teilweise' }[];
	score: number;
	why: Localized[];
};

/**
 * operations that lean on a goal: where the processing performs them, a weak
 * spot in that goal weighs more (SDM V3.1a, D2.6 a)
 */
const LEANS_ON: Record<string, { ops: string[]; why: Localized }> = {
	transparenz: {
		ops: ['bt', 'zf'],
		why: L(
			'Die Verarbeitung stellt Daten bereit oder führt sie zusammen; Betroffene müssen das nachvollziehen können.',
			'The processing discloses or combines data; data subjects must be able to follow that.'
		)
	},
	nichtverkettung: {
		ops: ['bt', 'zf'],
		why: L(
			'Die Verarbeitung stellt Daten bereit oder führt sie zusammen; die Zweckbindung hängt daran.',
			'The processing discloses or combines data; purpose limitation depends on it.'
		)
	},
	intervenierbarkeit: {
		ops: ['es', 'bs'],
		why: L(
			'Die Verarbeitung schränkt ein oder löscht; dafür braucht es Eingriffsmöglichkeiten.',
			'The processing restricts or erases; that needs ways to intervene.'
		)
	},
	datenminimierung: {
		ops: ['aw', 'bs'],
		why: L(
			'Die Verarbeitung bewahrt auf und löscht; Löschfristen tragen die Datenminimierung.',
			'The processing stores and erases; retention periods carry data minimisation.'
		)
	}
};

/**
 * what to fix first, one entry per goal that is a gap or partly met on some
 * level. Its most pressing level counts (a gap above partly met, the business
 * process above the levels that build on it), each further weak level adds a
 * point, and so do the operations that lean on the goal, gaps recorded for
 * operations and a high risk.
 */
export function priorities(record: RecordView): Focus[] {
	const active = new Set(activeVorgaenge(record));
	const high = record.data.risikostufe === 'hoch';
	const out: Focus[] = [];
	for (const ziel of ZIELE) {
		const weak = EBENEN.map((ebene) => {
			const status = levelStatus(record, ziel.id, ebene.id);
			const base = status === 'luecke' ? 10 : status === 'teilweise' ? 4 : 0;
			return { level: ebene.id, n: ebene.n, status, score: base && base + (ebene.n === 1 ? 2 : 0) };
		})
			.filter((l): l is typeof l & { status: Focus['levels'][number]['status'] } => l.score > 0)
			.sort((a, b) => b.score - a.score);
		if (weak.length === 0) continue;

		const why: Localized[] = [];
		let score = weak[0]!.score + weak.length - 1;
		if (weak.some((l) => l.n === 1)) {
			why.push(
				L(
					'Im Fachverfahren angelegt: Anwendung und Infrastruktur bauen darauf auf.',
					'Set in the business process: the application and infrastructure build on it.'
				)
			);
		}
		const leans = LEANS_ON[ziel.id];
		if (leans && leans.ops.some((op) => active.has(op))) {
			score += 3;
			why.push(leans.why);
		}
		const marked = record.data[`${ziel.id}_luecken`];
		const gaps = VORGAENGE.filter(
			(v) => active.has(v.id) && Array.isArray(marked) && marked.includes(v.id)
		);
		if (gaps.length > 0) {
			score += gaps.length;
			why.push(
				L(
					`Lücke eingetragen bei ${gaps.map((v) => `${v.title.de} (${v.code})`).join(', ')}.`,
					`Gap recorded for ${gaps.map((v) => `${v.title.en} (${v.code})`).join(', ')}.`
				)
			);
		}
		if (high) score *= 1.5;
		out.push({
			goal: ziel.id,
			levels: weak.map(({ level, status }) => ({ level, status })),
			score,
			why
		});
	}
	return out.sort((a, b) => b.score - a.score);
}

/** how many of the goal × level ratings are given */
export function progress(record: RecordView): { rated: number; total: number } {
	const total = ZIELE.length * EBENEN.length;
	let rated = 0;
	for (const ziel of ZIELE) {
		for (const ebene of EBENEN) if (levelStatus(record, ziel.id, ebene.id) !== 'offen') rated++;
	}
	return { rated, total };
}
