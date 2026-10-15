import { auditSections, count, reasonFor } from '../checklist.js';
import { DATES as AI_ACT } from '../risikoklassifizierung/engine.js';
import type { Answers, Localized, QuestionnaireCatalog, QuestionnaireResult } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const REQUIREMENTS = ['operation', 'people', 'records'] as const;

// Art. 4 sits in Chapter I, which applies from the same day as the prohibitions
const DATES = L(
	`Geltungsbeginn der Betreiberpflichten: ${AI_ACT.annexIII.de} für Hochrisiko-Systeme nach Anhang III, ${AI_ACT.annexI.de} für Systeme nach Anhang I (Verordnung (EU) 2026/1744). KI-Kompetenz nach Art. 4 gilt bereits seit dem ${AI_ACT.prohibited.de}.`,
	`Deployer obligations apply from ${AI_ACT.annexIII.en} for Annex III high-risk systems and from ${AI_ACT.annexI.en} for Annex I systems (Regulation (EU) 2026/1744). AI literacy under Art. 4 already applies since ${AI_ACT.prohibited.en}.`
);

/**
 * Art. 26 checklist. Applies only to deployers of high-risk systems; then
 * every "no" is a gap with its remedy and every "unclear" an open point.
 */
export function evaluate(catalog: QuestionnaireCatalog, answers: Answers): QuestionnaireResult {
	const citations = catalog.sources;

	for (const id of ['s_highrisk', 's_deployer'] as const) {
		if (answers[id] === 'no') {
			return {
				verdict: 'negative',
				headline: L('Art. 26 ist nicht anwendbar.', 'Art. 26 does not apply.'),
				explanation:
					id === 's_highrisk'
						? L(
								'Die Betreiberpflichten des Art. 26 gelten nur für Hochrisiko-KI-Systeme. Transparenzpflichten nach Art. 50 und KI-Kompetenz nach Art. 4 können trotzdem bestehen.',
								'The deployer obligations of Art. 26 apply only to high-risk AI systems. Transparency obligations under Art. 50 and AI literacy under Art. 4 may still apply.'
							)
						: L(
								'Die Pflichten des Art. 26 treffen den Betreiber. Als Anbieter gelten die Pflichten der Art. 16 ff.',
								'Art. 26 addresses the deployer. Providers are bound by Art. 16 et seq. instead.'
							),
				reasons: [reasonFor(catalog, id)],
				citations
			};
		}
	}

	const { gaps, open, remedies } = auditSections(catalog, answers, REQUIREMENTS);
	const scopeOpen = (['s_highrisk', 's_deployer'] as const)
		.filter((id) => answers[id] !== 'yes')
		.map((id) => reasonFor(catalog, id));

	if (gaps.length > 0) {
		const n = count(gaps.length, L('Lücke', 'gap'), L('Lücken', 'gaps'));
		return {
			verdict: 'positive',
			headline: L(`${n.de} bei den Betreiberpflichten.`, `${n.en} in deployer obligations.`),
			explanation: L(
				`Zu schließen, bevor die Pflichten gelten oder das System weiter eingesetzt wird: ${n.de}.` +
					(open.length ? ` Zusätzlich sind ${open.length} Punkt(e) offen.` : ''),
				`To be closed before the obligations apply or the system is used further: ${n.en}.` +
					(open.length ? ` In addition, ${open.length} point(s) are open.` : '')
			),
			reasons: gaps,
			notes: [...remedies, DATES],
			citations
		};
	}

	if (open.length > 0 || scopeOpen.length > 0) {
		return {
			verdict: 'conditional',
			headline: L('Offene Punkte.', 'Open points.'),
			explanation: L(
				'Keine Lücke ist festgestellt, aber einzelne Pflichten oder die Anwendbarkeit sind noch ungeklärt.',
				'No gap was found, but individual obligations or applicability are not yet settled.'
			),
			reasons: [...scopeOpen, ...open],
			notes: [DATES],
			citations
		};
	}

	return {
		verdict: 'negative',
		headline: L('Betreiberpflichten erfüllt.', 'Deployer obligations met.'),
		explanation: L(
			'Alle geprüften Pflichten sind nach Ihren Angaben erfüllt oder nicht einschlägig. Bewahren Sie die Nachweise auf und wiederholen Sie die Prüfung bei Änderungen am System oder seiner Verwendung.',
			'All checked obligations are met or not applicable according to your answers. Keep the evidence and repeat the check when the system or its use changes.'
		),
		reasons: [],
		notes: [DATES],
		citations
	};
}
