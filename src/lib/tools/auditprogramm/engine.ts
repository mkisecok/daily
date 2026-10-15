import { dateAfterMonths, dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { CRITERIA, definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const str = (record: RecordView, field: string) => {
	const value = record.data[field];
	return typeof value === 'string' && value !== '' ? value : null;
};

/**
 * the audit date while planned, the report one month after the audit
 * (internal target), and the next audit once one is entered.
 */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const planned = str(record, 'geplant_am');
	const conducted = str(record, 'durchgefuehrt_am');
	if (planned && (record.state === 'geplant' || record.state === 'vorbereitung')) {
		specs.push({
			kind: 'audit',
			label: L('Audit durchführen', 'Conduct the audit'),
			dueAt: dayAt(planned)
		});
	}
	if (conducted && record.state === 'durchgefuehrt') {
		specs.push({
			kind: 'bericht',
			label: L(
				'Auditbericht fertigstellen (interne Zielmarke)',
				'Finish the audit report (internal target)'
			),
			dueAt: dayAt(dateAfterMonths(conducted, 1))
		});
	}
	const next = str(record, 'naechstes_audit');
	if (next)
		specs.push({ kind: 'naechstes', label: L('Nächstes Audit', 'Next audit'), dueAt: dayAt(next) });
	return specs;
}

function assess(record: RecordView): QuestionnaireResult {
	const reasons: Reason[] = [];
	const notes: Localized[] = [];
	const citations: LegalBasis[] = [{ law: 'ISO 27001', ref: 'Kap. 9.2' }];

	if (isEmpty(record.data.gegenstand)) {
		reasons.push({
			questionId: 'gegenstand',
			text: L('Gegenstand und Umfang fehlen', 'Subject and scope missing')
		});
	}
	if (isEmpty(record.data.kriterien)) {
		reasons.push({
			questionId: 'kriterien',
			text: L('Auditkriterien fehlen', 'Audit criteria missing')
		});
	}
	if (record.data.unabhaengig === false) {
		reasons.push({
			questionId: 'unabhaengig',
			text: L(
				'Auditoren sind nicht unabhängig vom geprüften Bereich',
				'Auditors are not independent of the area audited'
			),
			cite: { law: 'ISO 27001', ref: 'Kap. 9.2.2' }
		});
	}
	if (record.data.art === 'dienstleister') {
		notes.push(
			L(
				'Audit beim Auftragsverarbeiter: Das Recht auf Überprüfungen einschließlich Inspektionen folgt aus Art. 28 Abs. 3 lit. h DSGVO und dem Vertrag; Termin und Umfang vorher abstimmen.',
				'Audit at a processor: the right to audits including inspections follows from Art. 28(3)(h) GDPR and the contract; agree date and scope beforehand.'
			)
		);
		citations.push({ law: 'DSGVO', ref: 'Art. 28 Abs. 3 lit. h' });
	}
	if (isEmpty(record.data.risiko)) {
		notes.push(
			L(
				'Die Auswahl des Audits nach Risiko begründen; das Programm soll die wichtigsten Prozesse und die Ergebnisse früherer Audits berücksichtigen.',
				'Give a risk-based reason for the audit; the programme should cover the most important processes and the results of earlier audits.'
			)
		);
	}
	if (isEmpty(record.data.methoden)) {
		notes.push(
			L(
				'Methoden festlegen: Feststellungen sollen auf Nachweisen beruhen, etwa aus Dokumenten, Interviews und Stichproben.',
				'Set the methods: findings should rest on evidence, e.g. from documents, interviews and samples.'
			)
		);
	}
	const criteria = Array.isArray(record.data.kriterien) ? record.data.kriterien : [];
	if (criteria.length > 0) {
		const names = CRITERIA.filter((c) => criteria.includes(c.value)).map((c) => c.label);
		notes.push(
			L(
				`Prüffragen im Prüfkatalog je Kriterium anlegen: ${names.map((n) => n.de).join(', ')}.`,
				`Create checklist questions per criterion in the audit checklist: ${names.map((n) => n.en).join(', ')}.`
			)
		);
	}

	if (reasons.length > 0) {
		return {
			verdict: 'positive',
			outcome: 'unvollstaendig',
			headline: L('Audit nicht ausreichend festgelegt.', 'Audit not sufficiently defined.'),
			explanation: L(
				'Für jedes Audit sind Kriterien und Umfang festzulegen und Auditoren so auszuwählen, dass Objektivität und Unparteilichkeit gewahrt sind.',
				'Each audit needs defined criteria and scope, and auditors selected so that objectivity and impartiality are ensured.'
			),
			reasons,
			notes,
			citations
		};
	}
	return record.state === 'abgeschlossen' || record.state === 'durchgefuehrt'
		? {
				verdict: 'negative',
				outcome: 'durchgefuehrt',
				headline: L('Audit durchgeführt.', 'Audit conducted.'),
				explanation: L(
					'Feststellungen mit Korrekturmaßnahmen verfolgen und den Bericht an die Leitung geben.',
					'Track findings with corrective actions and give the report to management.'
				),
				reasons: [],
				notes,
				citations
			}
		: {
				verdict: 'conditional',
				outcome: 'geplant',
				headline: L('Audit geplant.', 'Audit planned.'),
				explanation: L(
					'Umfang, Kriterien und Auditoren sind festgelegt.',
					'Scope, criteria and auditors are set.'
				),
				reasons: [],
				notes,
				citations
			};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
