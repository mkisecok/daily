import { auditSections, count, reasonFor } from '../checklist.js';
import type { Answers, Localized, QuestionnaireCatalog, QuestionnaireResult } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const REQUIREMENTS = ['annex', 'maintenance'] as const;

const NOTES = [
	L(
		'KMU einschließlich Start-ups dürfen die Angaben nach Anhang IV in vereinfachter Form vorlegen; die Kommission stellt dafür ein Formular bereit (Art. 11 Abs. 1 UAbs. 2).',
		'SMEs including start-ups may provide the Annex IV elements in a simplified form; the Commission provides a form for this (Art. 11(1), second subparagraph).'
	),
	L(
		'Geltungsbeginn: 2. Dezember 2027 für Hochrisiko-Systeme nach Anhang III, 2. August 2028 für Systeme nach Anhang I (Verordnung (EU) 2026/1744).',
		'Application: 2 December 2027 for Annex III high-risk systems, 2 August 2028 for Annex I systems (Regulation (EU) 2026/1744).'
	)
];

/** Annex IV completeness for providers of high-risk systems. */
export function evaluate(catalog: QuestionnaireCatalog, answers: Answers): QuestionnaireResult {
	const citations = catalog.sources;

	for (const id of ['s_provider', 's_highrisk'] as const) {
		if (answers[id] === 'no') {
			return {
				verdict: 'negative',
				headline: L(
					'Keine technische Dokumentation nach Art. 11 erforderlich.',
					'No technical documentation under Art. 11 required.'
				),
				explanation:
					id === 's_provider'
						? L(
								'Art. 11 verpflichtet den Anbieter. Als Betreiber brauchen Sie die Betriebsanleitung und die Informationen nach Art. 13 vom Anbieter.',
								'Art. 11 binds the provider. As a deployer you need the instructions for use and the Art. 13 information from the provider.'
							)
						: L(
								'Die technische Dokumentation nach Anhang IV ist nur für Hochrisiko-KI-Systeme vorgeschrieben. Eine schlanke Systembeschreibung ist trotzdem empfehlenswert.',
								'Technical documentation under Annex IV is mandatory only for high-risk AI systems. A lean system description is still advisable.'
							),
				reasons: [reasonFor(catalog, id)],
				citations
			};
		}
	}

	const { gaps, open, remedies } = auditSections(catalog, answers, REQUIREMENTS);
	const scopeOpen = (['s_provider', 's_highrisk'] as const)
		.filter((id) => answers[id] !== 'yes')
		.map((id) => reasonFor(catalog, id));

	if (gaps.length > 0) {
		const n = count(
			gaps.length,
			L('fehlender Teil', 'missing part'),
			L('fehlende Teile', 'missing parts')
		);
		return {
			verdict: 'positive',
			headline: L(`Dokumentation unvollständig: ${n.de}.`, `Documentation incomplete: ${n.en}.`),
			explanation: L(
				`Ohne vollständige technische Dokumentation ist keine Konformitätsbewertung möglich und das System darf nicht in Verkehr gebracht werden. Zu ergänzen: ${n.de}.`,
				`Without complete technical documentation no conformity assessment is possible and the system must not be placed on the market. To be added: ${n.en}.`
			),
			reasons: gaps,
			notes: [...remedies, ...NOTES],
			citations
		};
	}

	if (open.length > 0 || scopeOpen.length > 0) {
		return {
			verdict: 'conditional',
			headline: L('Offene Punkte.', 'Open points.'),
			explanation: L(
				'Kein Teil fehlt sicher, einzelne Angaben oder die Anwendbarkeit sind aber ungeklärt.',
				'No part is certainly missing, but some elements or applicability are unclear.'
			),
			reasons: [...scopeOpen, ...open],
			notes: NOTES,
			citations
		};
	}

	return {
		verdict: 'negative',
		headline: L('Dokumentation vollständig.', 'Documentation complete.'),
		explanation: L(
			'Alle Abschnitte des Anhangs IV sind nach Ihren Angaben vorhanden, die Pflege und Aufbewahrung sind geregelt.',
			'According to your answers, all Annex IV sections are present and maintenance and retention are settled.'
		),
		reasons: [],
		notes: NOTES,
		citations
	};
}
