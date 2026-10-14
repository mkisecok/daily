import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import type { LegalBasis, Localized, QuestionnaireResult } from '../types.js';
import { definition, isNonconformity } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** The action deadline until implemented, then the effectiveness check. */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	if (
		(record.state === 'offen' || record.state === 'massnahme') &&
		typeof record.data.frist === 'string'
	) {
		specs.push({
			kind: 'massnahme',
			label: L('Korrekturmaßnahme umsetzen', 'Implement the corrective action'),
			dueAt: dayAt(record.data.frist),
			cite: { law: 'ISO 27001', ref: 'Kap. 10.2' }
		});
	}
	if (record.state === 'umgesetzt' && typeof record.data.pruefen_am === 'string') {
		specs.push({
			kind: 'wirksamkeit',
			label: L('Wirksamkeit der Maßnahme prüfen', 'Check the effectiveness of the action'),
			dueAt: dayAt(record.data.pruefen_am)
		});
	}
	return specs;
}

function assess(record: RecordView): QuestionnaireResult {
	const notes: Localized[] = [];
	const citations: LegalBasis[] = [{ law: 'ISO 27001', ref: 'Kap. 10.2' }];
	const nonconformity = isNonconformity(record);

	if (isEmpty(record.data.nachweis)) {
		notes.push(
			L(
				'Den objektiven Nachweis festhalten, auf dem die Feststellung beruht.',
				'Record the objective evidence the finding rests on.'
			)
		);
	}
	if (nonconformity && isEmpty(record.data.ursache)) {
		notes.push(
			L(
				'Ursache analysieren, damit die Abweichung nicht erneut auftritt.',
				'Analyse the root cause so that the nonconformity does not recur.'
			)
		);
	}
	if (nonconformity && isEmpty(record.data.frist)) {
		notes.push(
			L(
				'Verantwortlichen und Frist für die Korrekturmaßnahme festlegen.',
				'Set an owner and a deadline for the corrective action.'
			)
		);
	}
	if (record.state === 'umgesetzt' && isEmpty(record.data.pruefen_am)) {
		notes.push(
			L(
				'Einen Termin für die Wirksamkeitsprüfung festlegen.',
				'Set a date for the effectiveness check.'
			)
		);
	}
	if (!record.data.audit) {
		notes.push(
			L(
				'Das Audit verknüpfen, damit die Feststellung im Auditbericht erscheint.',
				'Link the audit so that the finding appears in the audit report.'
			)
		);
	}

	if (record.state === 'wirksam') {
		return {
			verdict: 'negative',
			outcome: 'wirksam',
			headline: L('Behoben, Wirksamkeit bestätigt.', 'Resolved, effectiveness confirmed.'),
			explanation: L(
				'Die Korrekturmaßnahme ist umgesetzt und wirksam.',
				'The corrective action is implemented and effective.'
			),
			reasons: [],
			notes,
			citations
		};
	}
	if (!nonconformity) {
		return {
			verdict: 'negative',
			outcome: record.data.kategorie === 'positiv' ? 'positiv' : 'hinweis',
			headline:
				record.data.kategorie === 'positiv'
					? L('Positive Feststellung.', 'Positive finding.')
					: L('Verbesserungspotenzial.', 'Opportunity for improvement.'),
			explanation: L(
				'Keine Abweichung; eine Maßnahme ist freiwillig.',
				'Not a nonconformity; any action is voluntary.'
			),
			reasons: [],
			notes,
			citations
		};
	}
	return record.data.kategorie === 'wesentlich'
		? {
				verdict: 'positive',
				outcome: 'wesentlich',
				headline: L('Wesentliche Abweichung offen.', 'Major nonconformity open.'),
				explanation: L(
					'Eine Anforderung ist nicht oder systematisch nicht erfüllt. Korrekturmaßnahme mit Vorrang umsetzen und ihre Wirksamkeit belegen.',
					'A requirement is not met, or not met systematically. Implement the corrective action with priority and evidence its effectiveness.'
				),
				reasons: [],
				notes,
				citations
			}
		: {
				verdict: 'conditional',
				outcome: 'gering',
				headline: L('Geringfügige Abweichung offen.', 'Minor nonconformity open.'),
				explanation: L(
					'Eine Anforderung ist im Einzelfall nicht erfüllt. Korrekturmaßnahme fristgerecht umsetzen.',
					'A requirement is not met in an individual case. Implement the corrective action in time.'
				),
				reasons: [],
				notes,
				citations
			};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
