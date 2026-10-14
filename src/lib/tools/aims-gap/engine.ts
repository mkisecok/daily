import { auditSections, count } from '../checklist.js';
import type { Answers, Localized, QuestionnaireCatalog, QuestionnaireResult } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const SECTIONS = ['kontext', 'planung', 'anhang', 'leistung'] as const;

const NOTE = L(
	'Die Fragen fassen die Anforderungen in eigenen Worten zusammen und ersetzen weder den Normtext noch ein Zertifizierungsaudit. Viele Maßnahmen lassen sich mit einem bestehenden ISMS nach ISO/IEC 27001 gemeinsam umsetzen.',
	'The questions summarise the requirements in Daily’s own words and replace neither the standard’s text nor a certification audit. Many measures can be implemented together with an existing ISMS under ISO/IEC 27001.'
);

/** Gaps against ISO/IEC 42001 with the AI Act obligations each remedy also covers. */
export function evaluate(catalog: QuestionnaireCatalog, answers: Answers): QuestionnaireResult {
	const { gaps, open, remedies } = auditSections(catalog, answers, SECTIONS);
	const citations = catalog.sources;

	if (gaps.length > 0) {
		const n = count(gaps.length, L('Lücke', 'gap'), L('Lücken', 'gaps'));
		return {
			verdict: 'positive',
			outcome: 'luecken',
			headline: L(`AIMS mit ${n.de}.`, `AIMS with ${n.en}.`),
			explanation: L(
				'Die folgenden Anforderungen sind nicht erfüllt. Die Maßnahmen unten nennen auch die Pflichten der KI-Verordnung, die mit ihnen abgedeckt werden.',
				'The requirements below are not met. The measures below also name the AI Act obligations they cover.'
			),
			reasons: gaps,
			notes: [...remedies, NOTE],
			notesTitle: L('Maßnahmen und Bezüge zur KI-VO', 'Measures and links to the AI Act'),
			citations
		};
	}
	if (open.length > 0) {
		return {
			verdict: 'conditional',
			outcome: 'offen',
			headline: L(
				'Keine sicheren Lücken, einzelne Punkte offen.',
				'No certain gaps, some points open.'
			),
			explanation: L(
				'Die folgenden Anforderungen sind ungeklärt; ihr Stand sollte vor einem Audit festgestellt werden.',
				'The requirements below are unclear; their status should be established before an audit.'
			),
			reasons: open,
			notes: [NOTE],
			citations
		};
	}
	return {
		verdict: 'negative',
		outcome: 'erfuellt',
		headline: L('Keine Lücken festgestellt.', 'No gaps found.'),
		explanation: L(
			'Alle abgefragten Anforderungen sind nach eigener Einschätzung erfüllt oder nicht anwendbar. Ein internes Audit sollte die Einschätzung mit Nachweisen bestätigen.',
			'All requirements asked about are met or not applicable by your own assessment. An internal audit should confirm this with evidence.'
		),
		reasons: [],
		notes: [NOTE],
		citations
	};
}
