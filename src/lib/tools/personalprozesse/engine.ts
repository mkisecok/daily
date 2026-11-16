import { gapDeadlines } from '../../records/checks.js';
import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { checklist, gapReasons, openNote } from '../_shared/occasion.js';
import type { LegalBasis, Localized, QuestionnaireResult } from '../types.js';
import { BLOCKS, definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** the yearly review once in place, gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const review = record.data.ueberpruefen_am;
	if (typeof review === 'string' && review && record.state === 'eingefuehrt') {
		specs.push({
			kind: 'ueberpruefung',
			label: L('Personalprozesse überprüfen', 'Review the HR processes'),
			dueAt: dayAt(review),
			cite: { law: 'DSGVO', ref: 'Art. 24 Abs. 1' }
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/** the state of the process: gaps are reasons, open points keep it open */
function assess(record: RecordView): QuestionnaireResult {
	const state = checklist(record.data, BLOCKS);
	const reasons = gapReasons(state.gaps);
	const notes: Localized[] = [];
	const citations: LegalBasis[] = [
		{ law: 'DSGVO', ref: 'Art. 5, 6, 88' },
		{ law: 'BDSG', ref: '§ 26' }
	];
	const open = openNote(state.open);
	if (open) notes.push(open);
	const figures = L(
		`${state.done.length} von ${state.points.length} Punkten erledigt.`,
		`${state.done.length} of ${state.points.length} points done.`
	);
	if (reasons.length > 0) {
		return {
			verdict: 'positive',
			outcome: 'luecken',
			headline: L('Lücken im Personalablauf.', 'Gaps in the HR process.'),
			explanation: L(
				`Die folgenden Schritte sind nicht geregelt. ${figures.de}`,
				`The steps below are not in place. ${figures.en}`
			),
			reasons,
			notes,
			citations
		};
	}
	if (state.open.length > 0) {
		return {
			verdict: 'conditional',
			outcome: 'offen',
			headline: L('Ablauf in Arbeit.', 'Process being set up.'),
			explanation: L(
				`Keine Lücke bisher, aber nicht alles ist geklärt. ${figures.de}`,
				`No gap so far, but not everything is settled. ${figures.en}`
			),
			reasons,
			notes,
			citations
		};
	}
	return {
		verdict: 'negative',
		outcome: 'erledigt',
		headline: L('Ablauf vollständig geregelt.', 'Process fully in place.'),
		explanation: L(
			`Alle Schritte sind geregelt. ${figures.de}`,
			`Every step is in place. ${figures.en}`
		),
		reasons,
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
