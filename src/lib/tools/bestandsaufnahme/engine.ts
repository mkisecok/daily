import { gapDeadlines } from '../../records/checks.js';
import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { checklist, gapReasons, openNote } from '../_shared/occasion.js';
import type { LegalBasis, Localized, QuestionnaireResult } from '../types.js';
import { BLOCKS, definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** the on-site visit while planned, gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const visit = record.data.termin;
	if (typeof visit === 'string' && visit && record.state === 'geplant') {
		specs.push({
			kind: 'termin',
			label: L('Bestandsaufnahme: Termin vor Ort', 'Stocktake: on-site visit'),
			dueAt: dayAt(visit),
			cite: { law: 'DSGVO', ref: 'Art. 39 Abs. 1' }
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/** the gaps found are the result: each is a recommendation for the report to management */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const state = checklist(data, BLOCKS);
	const reasons = gapReasons(state.gaps);
	const notes: Localized[] = [];
	const citations: LegalBasis[] = [{ law: 'DSGVO', ref: 'Art. 38 Abs. 3, Art. 39 Abs. 1' }];

	if (typeof data.beschaeftigte === 'number' && data.beschaeftigte >= 20) {
		notes.push(
			L(
				'Ab in der Regel 20 Personen, die ständig mit automatisierter Verarbeitung befasst sind, ist ein Datenschutzbeauftragter zu benennen (§ 38 Abs. 1 BDSG); die Zahl der Beschäftigten allein entscheidet nicht.',
				'From usually 20 people constantly working with automated processing, a data protection officer must be appointed (§ 38(1) BDSG); the headcount alone does not decide.'
			)
		);
		citations.push({ law: 'BDSG', ref: '§ 38 Abs. 1' });
	}
	const open = openNote(state.open);
	if (open) notes.push(open);

	const figures = L(
		`${state.done.length} von ${state.points.length} Punkten erfüllt, ${state.gaps.length} Lücken, ${state.open.length} offen.`,
		`${state.done.length} of ${state.points.length} points met, ${state.gaps.length} gaps, ${state.open.length} open.`
	);
	if (reasons.length > 0) {
		return {
			verdict: 'positive',
			outcome: 'luecken',
			headline: L(
				`${reasons.length} ${reasons.length === 1 ? 'Lücke' : 'Lücken'} gefunden.`,
				`${reasons.length} ${reasons.length === 1 ? 'gap' : 'gaps'} found.`
			),
			explanation: L(
				`Jede Lücke ist eine Empfehlung für den Bericht an die Leitung. ${figures.de}`,
				`Each gap is a recommendation for the report to management. ${figures.en}`
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
			headline: L('Bestandsaufnahme läuft.', 'Stocktake in progress.'),
			explanation: L(`Noch keine Lücke gefunden. ${figures.de}`, `No gap found yet. ${figures.en}`),
			reasons,
			notes,
			citations
		};
	}
	return {
		verdict: 'negative',
		outcome: 'erledigt',
		headline: L('Keine Lücke gefunden.', 'No gap found.'),
		explanation: L(`Alle Punkte sind erfüllt. ${figures.de}`, `Every point is met. ${figures.en}`),
		reasons,
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
