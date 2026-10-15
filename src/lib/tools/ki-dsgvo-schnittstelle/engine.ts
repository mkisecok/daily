import { auditSections, count, reasonFor } from '../checklist.js';
import type { Answers, Localized, QuestionnaireCatalog, QuestionnaireResult } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const REQUIREMENTS = ['lawfulness', 'principles', 'governance'] as const;

/**
 * GDPR checklist for AI. Out of scope without personal data; the Art. 22
 * requirement only counts when the system decides solely automatically.
 */
export function evaluate(catalog: QuestionnaireCatalog, answers: Answers): QuestionnaireResult {
	const citations = catalog.sources;

	if (answers.k_personal === 'no') {
		return {
			verdict: 'negative',
			headline: L('Die DSGVO ist nicht berührt.', 'The GDPR is not engaged.'),
			explanation: L(
				'Ohne personenbezogene Daten in Training, Eingaben und Ausgaben greift die DSGVO nicht. Prüfen Sie kritisch, ob Daten wirklich anonym sind; Pflichten aus der KI-Verordnung bleiben bestehen.',
				'Without personal data in training, inputs and outputs, the GDPR does not apply. Check critically whether data is really anonymous; AI Act obligations remain.'
			),
			reasons: [reasonFor(catalog, 'k_personal')],
			citations
		};
	}

	// Art. 22 is a requirement only for solely automated decisions
	const effective: Answers = answers.k_automated === 'no' ? { ...answers, k_art22: 'na' } : answers;
	const { gaps, open, remedies } = auditSections(catalog, effective, REQUIREMENTS);
	const scopeOpen = (['k_personal', 'k_automated'] as const)
		.filter((id) => answers[id] === 'unknown')
		.map((id) => reasonFor(catalog, id));

	const art22Note =
		answers.k_automated === 'yes'
			? [
					L(
						'Ausschließlich automatisierte Entscheidungen mit erheblicher Wirkung sind grundsätzlich verboten (Art. 22 Abs. 1); bei Hochrisiko-KI kommen die Pflichten der KI-Verordnung hinzu.',
						'Solely automated decisions with significant effects are prohibited in principle (Art. 22(1)); for high-risk AI the AI Act obligations apply on top.'
					)
				]
			: [];

	if (gaps.length > 0) {
		const n = count(gaps.length, L('Lücke', 'gap'), L('Lücken', 'gaps'));
		return {
			verdict: 'positive',
			headline: L(`${n.de} beim Datenschutz.`, `${n.en} in data protection.`),
			explanation: L(
				`Festgestellt für die KI-Verarbeitung gegenüber der DSGVO: ${n.de}.` +
					(open.length ? ` ${open.length} Punkt(e) sind offen.` : ''),
				`Found for the AI processing against the GDPR: ${n.en}.` +
					(open.length ? ` ${open.length} point(s) are open.` : '')
			),
			reasons: gaps,
			notes: [...art22Note, ...remedies],
			citations
		};
	}

	if (open.length > 0 || scopeOpen.length > 0) {
		return {
			verdict: 'conditional',
			headline: L('Offene Punkte.', 'Open points.'),
			explanation: L(
				'Keine Lücke ist festgestellt, einzelne Punkte sind aber noch ungeklärt.',
				'No gap was found, but some points are not yet settled.'
			),
			reasons: [...scopeOpen, ...open],
			notes: art22Note,
			citations
		};
	}

	return {
		verdict: 'negative',
		headline: L('Keine Lücken festgestellt.', 'No gaps found.'),
		explanation: L(
			'Nach Ihren Angaben sind die geprüften Anforderungen der DSGVO für den KI-Einsatz erfüllt. Wiederholen Sie die Prüfung bei einem neuen Modell, Anbieter oder Zweck.',
			'According to your answers, the checked GDPR requirements for the AI use are met. Repeat the check for a new model, provider or purpose.'
		),
		reasons: [],
		notes: art22Note,
		citations
	};
}
