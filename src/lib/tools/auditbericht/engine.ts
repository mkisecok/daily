import type { RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import type { LegalBasis, Localized, QuestionnaireResult } from '../types.js';
import { definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

function assess(record: RecordView): QuestionnaireResult {
	const notes: Localized[] = [];
	const citations: LegalBasis[] = [{ law: 'ISO 27001', ref: 'Kap. 9.2.2' }];

	if (isEmpty(record.data.gesamturteil)) {
		notes.push(L('Ein Gesamturteil festhalten.', 'Record an overall conclusion.'));
	}
	if (record.data.gesamturteil !== 'konform' && isEmpty(record.data.empfehlungen)) {
		notes.push(
			L(
				'Empfehlungen für die Behebung der Abweichungen ergänzen.',
				'Add recommendations for resolving the nonconformities.'
			)
		);
	}
	if (isEmpty(record.data.verteiler)) {
		notes.push(
			L(
				'Den Verteiler festlegen: Die Ergebnisse interner Audits sind der zuständigen Leitung zu berichten.',
				'Set the distribution: results of internal audits must be reported to relevant management.'
			)
		);
	}

	if (isEmpty(record.data.freigegeben_am)) {
		return {
			verdict: 'conditional',
			outcome: 'entwurf',
			headline: L('Berichtsentwurf.', 'Draft report.'),
			explanation: L(
				'Der Bericht ist noch nicht freigegeben. Audit, Prüfkatalog und Feststellungen werden unten angefügt und mitgedruckt.',
				'The report is not yet approved. Audit, checklists and findings are appended below and printed with it.'
			),
			reasons: [],
			notes,
			citations
		};
	}
	return {
		verdict: record.data.gesamturteil === 'nicht_konform' ? 'positive' : 'negative',
		outcome: 'freigegeben',
		headline: L('Bericht freigegeben.', 'Report approved.'),
		explanation: L(
			'Offene Feststellungen werden über ihre Fristen weiterverfolgt.',
			'Open findings are followed up through their deadlines.'
		),
		reasons: [],
		notes,
		citations
	};
}

export const engine: RecordEngine = { assess };
export { definition };
