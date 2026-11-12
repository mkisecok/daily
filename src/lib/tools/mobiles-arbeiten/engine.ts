import { gapDeadlines } from '../../records/checks.js';
import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import { checklist, gapReasons, inScope, openNote } from '../_shared/occasion.js';
import type { LegalBasis, Localized, QuestionnaireResult } from '../types.js';
import { BLOCKS, definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const str = (record: RecordView, id: string) => {
	const value = record.data[id];
	return typeof value === 'string' && value ? value : null;
};

/** the start while under review, the review once approved, gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const start = str(record, 'start_am');
	if (start && record.state === 'pruefung') {
		specs.push({
			kind: 'start',
			label: L('Mobiles Arbeiten beginnt: Freigabe nötig', 'Remote work starts: approval needed'),
			dueAt: dayAt(start),
			cite: { law: 'DSGVO', ref: 'Art. 24 Abs. 1' }
		});
	}
	const review = str(record, 'wiedervorlage');
	if (review && record.state === 'freigegeben') {
		specs.push({
			kind: 'wiedervorlage',
			label: L('Wiedervorlage mobiles Arbeiten', 'Remote work review'),
			dueAt: dayAt(review),
			cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. d' }
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/** the state of the rules: gaps are reasons; open points keep them open */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const citations: LegalBasis[] = [
		{ law: 'DSGVO', ref: 'Art. 32' },
		{ law: 'BSI', ref: 'INF.8, INF.9, OPS.1.2.4' }
	];
	const notes: Localized[] = [];
	const state = checklist(data, BLOCKS);
	const reasons = gapReasons(state.gaps);

	const open = openNote(state.open);
	if (open) notes.push(open);
	if (isEmpty(data.umfang)) {
		notes.push(
			L(
				'Kein Umfang angegeben: Die Checkliste gilt so für dienstliche Geräte ohne Betriebsrat, Papier und Ausland.',
				'No scope given: the checklist then fits work devices without a works council, paper or abroad.'
			)
		);
	}
	if (isEmpty(data.tom)) {
		notes.push(L('Den TOM-Katalog verknüpfen.', 'Link the TOM catalogue.'));
	}
	if (inScope(data, ['betriebsrat'])) {
		citations.push({ law: 'BetrVG', ref: '§ 87 Abs. 1 Nr. 14' });
	}

	const figures = L(
		`${state.done.length} von ${state.points.length} Punkten erledigt.`,
		`${state.done.length} of ${state.points.length} points done.`
	);

	if (reasons.length > 0) {
		return {
			verdict: 'positive',
			outcome: 'luecken',
			headline: L('Noch nicht freigabefähig.', 'Not ready for approval.'),
			explanation: L(
				`Die folgenden Punkte sind nicht erfüllt. ${figures.de}`,
				`The points below are not met. ${figures.en}`
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
			headline: L('Prüfung läuft.', 'Review in progress.'),
			explanation: L(
				`Keine Lücke bisher, aber nicht alles ist geprüft. ${figures.de}`,
				`No gap so far, but not everything is checked. ${figures.en}`
			),
			reasons,
			notes,
			citations
		};
	}
	return {
		verdict: 'negative',
		outcome: 'freigabefaehig',
		headline: L('Freigabefähig.', 'Ready for approval.'),
		explanation: L(
			`Alle Punkte sind erledigt. Bei neuen Geräten, Diensten oder Ländern erneut prüfen. ${figures.de}`,
			`Every point is done. Check again when devices, services or countries are added. ${figures.en}`
		),
		reasons,
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
