import type { RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import type { LegalBasis, Localized, QuestionnaireResult } from '../types.js';
import { definition, TEMPLATES } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** the template's questions as the checklist, and the result of the review */
function assess(record: RecordView): QuestionnaireResult {
	const template =
		typeof record.data.vorlage === 'string' ? TEMPLATES[record.data.vorlage] : undefined;
	const notes: Localized[] = template ? [...template.questions] : [];
	const citations: LegalBasis[] = [{ law: 'ISO 27001', ref: 'Kap. 9.2' }];
	const base = {
		reasons: [],
		notes,
		notesTitle: L('Prüffragen der Vorlage', 'Template questions'),
		citations
	};
	const evidence = !isEmpty(record.data.nachweise) || !isEmpty(record.data.stichproben);

	switch (record.data.ergebnis) {
		case 'nicht_erfuellt':
			return {
				...base,
				verdict: 'positive',
				outcome: 'nicht-erfuellt',
				headline: L('Anforderungen nicht erfüllt.', 'Requirements not met.'),
				explanation: L(
					'Als Feststellung mit Bezug auf dieses Audit anlegen und eine Korrekturmaßnahme mit Frist festlegen.',
					'Record a finding referring to this audit and set a corrective action with a deadline.'
				)
			};
		case 'teilweise':
			return {
				...base,
				verdict: 'conditional',
				outcome: 'teilweise',
				headline: L('Teilweise erfüllt.', 'Partly met.'),
				explanation: L(
					'Die Lücken als geringfügige Abweichung oder Verbesserungspotenzial in den Feststellungen erfassen.',
					'Record the gaps as a minor nonconformity or an opportunity for improvement among the findings.'
				)
			};
		case 'erfuellt':
			return {
				...base,
				verdict: evidence ? 'negative' : 'conditional',
				outcome: 'erfuellt',
				headline: evidence
					? L('Erfüllt.', 'Met.')
					: L('Erfüllt, aber ohne Nachweis.', 'Met, but without evidence.'),
				explanation: evidence
					? L(
							'Das Ergebnis ist durch Nachweise oder Stichproben belegt.',
							'The result is backed by evidence or samples.'
						)
					: L(
							'Ein Auditergebnis sollte auf überprüfbaren Nachweisen beruhen; Stichproben oder Belege ergänzen.',
							'An audit result should rest on verifiable evidence; add samples or records.'
						)
			};
		default:
			return {
				...base,
				verdict: 'conditional',
				outcome: 'offen',
				headline: L('Prüfung offen.', 'Review open.'),
				explanation: template
					? L(
							'Die Fragen der Vorlage durchgehen und das Ergebnis festhalten.',
							'Go through the template questions and record the result.'
						)
					: L(
							'Eine Vorlage wählen oder eigene Fragen formulieren.',
							'Choose a template or write your own questions.'
						)
			};
	}
}

export const engine: RecordEngine = { assess };
export { definition, TEMPLATES };
