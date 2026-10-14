import { auditSections, count, reasonFor } from '../checklist.js';
import type { Answers, Localized, QuestionnaireCatalog, QuestionnaireResult } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const REQUIREMENTS = ['before', 'banner', 'after'] as const;

const GDPR_STILL = L(
	'Für die anschließende Verarbeitung personenbezogener Daten bleibt unabhängig davon eine Rechtsgrundlage nach Art. 6 DSGVO erforderlich.',
	'A legal basis under Art. 6 GDPR is still required for any subsequent processing of personal data.'
);

/**
 * § 25 TDDDG checklist. Out of scope without device access; no consent
 * needed when every access is strictly necessary; otherwise every "no" is a
 * defect with its remedy.
 */
export function evaluate(catalog: QuestionnaireCatalog, answers: Answers): QuestionnaireResult {
	const citations = catalog.sources;

	if (answers.s_access === 'no') {
		return {
			verdict: 'negative',
			headline: L('§ 25 TDDDG ist nicht berührt.', '§ 25 TDDDG is not engaged.'),
			explanation: L(
				'Ohne Speichern oder Auslesen von Informationen auf dem Endgerät ist keine Einwilligung nach § 25 TDDDG nötig. Prüfen Sie, ob auch eingebettete Inhalte und Bibliotheken Dritter nichts speichern.',
				'Without storing or reading information on the device, no consent under § 25 TDDDG is required. Check that embedded content and third-party libraries do not store anything either.'
			),
			reasons: [reasonFor(catalog, 's_access')],
			notes: [GDPR_STILL],
			citations
		};
	}

	if (answers.s_access === 'yes' && answers.s_optional === 'no') {
		const { gaps, remedies } = auditSections(catalog, answers, ['before']);
		const undocumented = gaps.some((g) => g.questionId === 'c_necessary');
		return {
			verdict: undocumented ? 'conditional' : 'negative',
			headline: L(
				'Keine Einwilligung nach § 25 TDDDG erforderlich.',
				'No consent required under § 25 TDDDG.'
			),
			explanation: L(
				'Alle Zugriffe sind nach Ihren Angaben unbedingt erforderlich (§ 25 Abs. 2 Nr. 2). Ein Banner ist dann nicht nötig, die Erforderlichkeit muss aber für jeden Zugriff begründet sein.',
				'According to your answers, every access is strictly necessary (§ 25(2) no. 2). No banner is needed, but necessity must be justified for each access.'
			),
			reasons: undocumented ? [reasonFor(catalog, 'c_necessary')] : [],
			notes: [...remedies, GDPR_STILL],
			citations
		};
	}

	const { gaps, open, remedies } = auditSections(catalog, answers, REQUIREMENTS);
	const scopeOpen = (['s_access', 's_optional'] as const)
		.filter((id) => answers[id] === 'unknown')
		.map((id) => reasonFor(catalog, id));

	if (gaps.length > 0) {
		const n = count(gaps.length, L('Mangel', 'defect'), L('Mängel', 'defects'));
		return {
			verdict: 'positive',
			headline: L(`${n.de} im Einwilligungsverfahren.`, `${n.en} in the consent process.`),
			explanation: L(
				`Einwilligungen, die unter diesen Mängeln eingeholt werden, sind voraussichtlich unwirksam; die betroffenen Zugriffe wären dann rechtswidrig. Zu beheben: ${n.de}.` +
					(open.length ? ` ${open.length} Punkt(e) sind offen.` : ''),
				`Consents obtained with these defects are likely invalid, which would make the affected accesses unlawful. To be fixed: ${n.en}.` +
					(open.length ? ` ${open.length} point(s) are open.` : '')
			),
			reasons: gaps,
			notes: remedies,
			citations
		};
	}

	if (open.length > 0 || scopeOpen.length > 0) {
		return {
			verdict: 'conditional',
			headline: L('Offene Punkte.', 'Open points.'),
			explanation: L(
				'Kein Mangel ist festgestellt, einzelne Anforderungen sind aber noch ungeklärt.',
				'No defect was found, but individual requirements are not yet settled.'
			),
			reasons: [...scopeOpen, ...open],
			citations
		};
	}

	return {
		verdict: 'negative',
		headline: L(
			'Einwilligungsverfahren erfüllt die geprüften Anforderungen.',
			'Consent process meets the checked requirements.'
		),
		explanation: L(
			'Nach Ihren Angaben sind alle geprüften Anforderungen erfüllt. Prüfen Sie nach jeder Änderung an eingebundenen Diensten erneut, ob neue Zugriffe hinzugekommen sind.',
			'According to your answers, all checked requirements are met. After every change to embedded services, check again whether new accesses were added.'
		),
		reasons: [],
		notes: [GDPR_STILL],
		citations
	};
}
