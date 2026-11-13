import { gapDeadlines } from '../../records/checks.js';
import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import { checklist, gapReasons, openNote, snapshot } from '../_shared/occasion.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { BLOCKS, definition, dpiaNeeded } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const str = (record: RecordView, id: string) => {
	const value = record.data[id];
	return typeof value === 'string' && value ? value : null;
};

/** the planned start while being set up, the review once live, gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const start = str(record, 'start_am');
	if (start && record.state === 'aufbau') {
		specs.push({
			kind: 'start',
			label: L('Meldestelle: Start geplant', 'Reporting office: planned start'),
			dueAt: dayAt(start),
			cite: { law: 'HinSchG', ref: '§ 12 Abs. 1' }
		});
	}
	const review = str(record, 'wiedervorlage');
	if (review && record.state === 'betrieb') {
		specs.push({
			kind: 'wiedervorlage',
			label: L(
				'Meldestelle überprüfen: Zuständigkeit, Fristen, Löschung',
				'Review the reporting office: who is in charge, deadlines, deletion'
			),
			dueAt: dayAt(review),
			cite: { law: 'HinSchG', ref: '§ 11 Abs. 5, § 17' }
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/**
 * the state of the office: gaps and a required DPIA that is missing are
 * reasons; open points and a screening not yet run keep it open
 */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const citations: LegalBasis[] = [
		{ law: 'HinSchG', ref: '§§ 8, 12, 16, 17' },
		{ law: 'DSGVO', ref: 'Art. 13, 35' }
	];
	const notes: Localized[] = [];
	const state = checklist(data, BLOCKS);
	const reasons: Reason[] = gapReasons(state.gaps);
	const pending: Localized[] = [];

	if (!snapshot(data, 'dsfa_check')) pending.push(L('DSFA-Schwellwertanalyse', 'DPIA screening'));
	if (dpiaNeeded(data) && isEmpty(data.dsfa)) {
		reasons.push({
			questionId: 'dsfa',
			text: L(
				'Die Schwellwertanalyse verlangt eine Datenschutz-Folgenabschätzung; sie ist noch nicht verknüpft.',
				'The screening requires a data protection impact assessment; none is linked yet.'
			),
			cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 1' }
		});
	}

	const staff = data.beschaeftigte;
	if (typeof staff === 'number' && staff < 50) {
		notes.push(
			L(
				'Unter 50 Beschäftigten besteht die Pflicht nur in den Branchen nach § 12 Abs. 3 HinSchG; eine freiwillige Meldestelle sollte trotzdem diesen Regeln folgen.',
				'Below 50 employees the duty applies only in the sectors of § 12(3) HinSchG; a voluntary office should still follow these rules.'
			)
		);
	}

	const open = openNote(state.open);
	if (open) notes.push(open);
	if (pending.length > 0) {
		notes.push(
			L(
				`Noch durchzuführen: ${pending.map((p) => p.de).join(', ')}.`,
				`Still to run: ${pending.map((p) => p.en).join(', ')}.`
			)
		);
	}

	const figures = L(
		`${state.done.length} von ${state.points.length} Punkten erledigt.`,
		`${state.done.length} of ${state.points.length} points done.`
	);

	if (reasons.length > 0) {
		return {
			verdict: 'positive',
			outcome: 'luecken',
			headline: L('Handlungsbedarf bei der Meldestelle.', 'Action needed at the reporting office.'),
			explanation: L(
				`Die folgenden Punkte sind nicht erfüllt. ${figures.de}`,
				`The points below are not met. ${figures.en}`
			),
			reasons,
			notes,
			citations
		};
	}
	if (state.open.length > 0 || pending.length > 0) {
		return {
			verdict: 'conditional',
			outcome: 'offen',
			headline: L('Aufbau läuft.', 'Set-up in progress.'),
			explanation: L(
				`Keine Lücke bisher, aber nicht alles ist erledigt. ${figures.de}`,
				`No gap so far, but not everything is done. ${figures.en}`
			),
			reasons,
			notes,
			citations
		};
	}
	return {
		verdict: 'negative',
		outcome: 'erledigt',
		headline: L('Alles erledigt.', 'All done.'),
		explanation: L(
			`Alle Punkte sind erledigt. ${figures.de}`,
			`Every point is done. ${figures.en}`
		),
		reasons,
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
