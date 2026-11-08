import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import {
	activeVorgaenge,
	countCells,
	EBENEN,
	levelStatus,
	reader,
	VORGAENGE,
	ZIELE
} from './cube.js';
import { definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });
const CITE: LegalBasis = { law: 'DSK', ref: 'SDM V3.1a, D2.6' };

function deadlines(record: RecordView): DeadlineSpec[] {
	const date = record.data.wiedervorlage;
	if (typeof date !== 'string') return [];
	return [
		{
			kind: 'wiedervorlage',
			label: L('Überprüfung des SDM-Würfels', 'Review of the SDM cube'),
			dueAt: dayAt(date),
			cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. d' }
		}
	];
}

const join = (items: Localized[], lang: 'de' | 'en') => items.map((i) => i[lang]).join(', ');

/**
 * gaps on a level or for an operation are reasons; levels not yet assessed
 * leave the cube incomplete; partly met goals are points to follow up
 */
function assess(record: RecordView): QuestionnaireResult {
	const citations: LegalBasis[] = [CITE, { law: 'DSGVO', ref: 'Art. 25' }];
	const active = activeVorgaenge(record);
	const read = reader(record);
	const reasons: Reason[] = [];
	const notes: Localized[] = [];
	const open: Localized[] = [];
	const partly: Localized[] = [];

	for (const ziel of ZIELE) {
		const levels = EBENEN.map((e) => ({ ebene: e, status: levelStatus(record, ziel.id, e.id) }));
		for (const { ebene, status } of levels) {
			const where = L(
				`${ziel.title.de} auf Ebene ${ebene.n}`,
				`${ziel.title.en} on level ${ebene.n}`
			);
			if (status === 'luecke') {
				reasons.push({
					questionId: `${ziel.id}_${ebene.id}`,
					text: L(
						`${ziel.title.de}: Lücke auf Ebene ${ebene.n} (${ebene.title.de})`,
						`${ziel.title.en}: gap on level ${ebene.n} (${ebene.title.en.toLowerCase()})`
					),
					cite: CITE
				});
			}
			if (status === 'offen') open.push(where);
			if (status === 'teilweise') partly.push(where);
		}
		const backed: Localized[] = [];
		for (const v of VORGAENGE) {
			// the same check as the cube: performed, a relevant level, a gap recorded
			if (!read.marked(v.id, ziel.id)) continue;
			reasons.push({
				questionId: `${ziel.id}_luecken_${v.id}`,
				text: L(
					`${ziel.title.de}: Lücke beim ${v.title.de} (${v.code})`,
					`${ziel.title.en}: gap for the operation ${v.title.en} (${v.code})`
				),
				cite: { law: 'DSK', ref: 'SDM V3.1a, D2.6 a' }
			});
			if (EBENEN.every((e) => read.cell(v.id, e.id, ziel.id) !== 'luecke')) {
				backed.push(L(`${v.title.de} (${v.code})`, `${v.title.en} (${v.code})`));
			}
		}
		if (backed.length > 0) {
			notes.push(
				L(
					`${ziel.title.de}: Lücke bei ${join(backed, 'de')}, obwohl alle Ebenen als umgesetzt bewertet sind; die betroffene Ebene prüfen.`,
					`${ziel.title.en}: gap for ${join(backed, 'en')} although every level is rated as in place; check which level it concerns.`
				)
			);
		}
	}

	if (open.length > 0) {
		notes.unshift(
			L(`Noch nicht bewertet: ${join(open, 'de')}.`, `Not yet assessed: ${join(open, 'en')}.`)
		);
	}

	if (active.length === 0) {
		notes.push(
			L(
				'Die Vorgänge der Verarbeitung auswählen; erst dann ergibt sich der Würfel (SDM V3.1a, D2.1).',
				'Choose the operations of the processing; only then does the cube take shape (SDM V3.1a, D2.1).'
			)
		);
	}
	if (partly.length > 0) {
		notes.push(
			L(`Teilweise umgesetzt: ${join(partly, 'de')}.`, `Partly in place: ${join(partly, 'en')}.`)
		);
	}
	if (record.data.risikostufe === 'hoch' && isEmpty(record.data.dsfa)) {
		notes.push(
			L(
				'Bei hoher Risikostufe die Datenschutz-Folgenabschätzung verknüpfen, deren Risiken der Würfel abdecken soll.',
				'With a high risk, link the DPIA whose risks the cube should cover.'
			)
		);
	}
	if (isEmpty(record.data.tom)) {
		notes.push(
			L(
				'Den Eintrag im TOM-Katalog verknüpfen, der die Maßnahmen der Ebenen 2 und 3 belegt.',
				'Link the TOM catalogue entry that evidences the measures on levels 2 and 3.'
			)
		);
	}

	const counts = countCells(record);
	const relevant = counts.umgesetzt + counts.teilweise + counts.luecke + counts.offen;
	const figures = L(
		`${relevant} von ${VORGAENGE.length * EBENEN.length * ZIELE.length} Zellen sind relevant, davon ${counts.luecke} mit Lücke und ${counts.offen} noch offen.`,
		`${relevant} of ${VORGAENGE.length * EBENEN.length * ZIELE.length} cells apply, ${counts.luecke} of them with a gap and ${counts.offen} still open.`
	);

	if (reasons.length > 0) {
		return {
			verdict: 'positive',
			outcome: 'luecken',
			headline: L('Lücken im SDM-Würfel.', 'Gaps in the SDM cube.'),
			explanation: L(
				`Für die folgenden Gewährleistungsziele fehlen Maßnahmen auf einer Ebene oder bei einem Vorgang. ${figures.de}`,
				`Measures are missing for the goals below on a level or for an operation. ${figures.en}`
			),
			reasons,
			notes,
			citations
		};
	}
	if (open.length > 0 || active.length === 0) {
		return {
			verdict: 'conditional',
			outcome: 'unvollstaendig',
			headline: L('Würfel noch nicht vollständig.', 'Cube not yet complete.'),
			explanation: L(
				`Jede Zelle des Würfels ist zu analysieren, auch wenn nicht jede eine eigene Maßnahme braucht. ${figures.de}`,
				`Every cell of the cube should be analysed, even if not each needs a measure of its own. ${figures.en}`
			),
			reasons: [],
			notes,
			citations
		};
	}
	return partly.length > 0
		? {
				verdict: 'conditional',
				outcome: 'teilweise',
				headline: L('Keine Lücken, einiges erst teilweise.', 'No gaps, some only partly.'),
				explanation: L(
					`Alle Zellen sind bewertet. ${figures.de}`,
					`Every cell is assessed. ${figures.en}`
				),
				reasons: [],
				notes,
				citations
			}
		: {
				verdict: 'negative',
				outcome: 'vollstaendig',
				headline: L(
					'Alle Gewährleistungsziele auf allen Ebenen umgesetzt.',
					'Every protection goal met on every level.'
				),
				explanation: L(
					`Den Würfel bei Änderungen der Verarbeitung fortschreiben. ${figures.de}`,
					`Update the cube whenever the processing changes. ${figures.en}`
				),
				reasons: [],
				notes,
				citations
			};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
