import type {
	Answers,
	Localized,
	QuestionnaireCatalog,
	QuestionnaireResult,
	Reason
} from '../types.js';

/**
 * application dates after the Digital Omnibus on AI, Regulation (EU)
 * 2026/1744 (OJ L, 24 July 2026). Data, not code: review when the feed
 * reports a further amendment.
 */
export const DATES = {
	prohibited: { de: '2. Februar 2025', en: '2 February 2025', iso: '2025-02-02' },
	prohibitedNcii: { de: '2. Dezember 2026', en: '2 December 2026', iso: '2026-12-02' },
	transparency: { de: '2. August 2026', en: '2 August 2026', iso: '2026-08-02' },
	transparencyExisting: { de: '2. Dezember 2026', en: '2 December 2026', iso: '2026-12-02' },
	annexIII: { de: '2. Dezember 2027', en: '2 December 2027', iso: '2027-12-02' },
	annexI: { de: '2. August 2028', en: '2 August 2028', iso: '2028-08-02' },
	source: 'Verordnung (EU) 2026/1744, Art. 113 KI-VO n. F.'
} as const;

const PROHIBITED = [
	'p_subliminal',
	'p_vulnerable',
	'p_socialscoring',
	'p_crimerisk',
	'p_scraping',
	'p_emotionwork',
	'p_biocategorisation',
	'p_rbi',
	'p_ncii'
];
const ANNEX_III = [
	'h_biometrics',
	'h_infrastructure',
	'h_education',
	'h_employment',
	'h_services',
	'h_lawenforcement',
	'h_migration',
	'h_justice'
];
const EXCEPTIONS = ['x_procedural', 'x_improve', 'x_patterns', 'x_preparatory'];
const TRANSPARENCY = ['t_interaction', 't_synthetic', 't_emotion', 't_deepfake'];

const L = (de: string, en: string): Localized => ({ de, en });

/** outcome codes, taken over by the AI register */
export type RiskOutcome =
	'kein-ki' | 'ausserhalb' | 'verboten' | 'hochrisiko' | 'art6-3' | 'art50' | 'minimal';

/**
 * classification in the order the Regulation applies it:
 *   0. not an AI system / excluded use          → out of scope
 *   1. any Art. 5 practice                        → prohibited
 *   2. Annex I product                            → high-risk (2 Aug 2028)
 *   3. Annex III area, no valid Art. 6(3) escape  → high-risk (2 Dec 2027)
 *   4. Annex III area with Art. 6(3) escape       → not high-risk, document + register
 *   5. any Art. 50 case                           → transparency duties (2 Aug 2026)
 *   6. otherwise                                  → minimal risk
 */
export function evaluate(catalog: QuestionnaireCatalog, answers: Answers): QuestionnaireResult {
	const questions = new Map(catalog.sections.flatMap((s) => s.questions).map((q) => [q.id, q]));
	const yes = (id: string) => answers[id] === 'yes';
	const reasonFor = (id: string): Reason => {
		const question = questions.get(id);
		return { questionId: id, text: question?.text ?? L(id, id), cite: question?.cite };
	};
	const unknownCount = Object.values(answers).filter((value) => value === 'unknown').length;
	const unknownNote =
		unknownCount > 0
			? [
					L(
						`${unknownCount} Frage(n) wurden mit „unklar“ beantwortet. Die Einstufung ist erst belastbar, wenn diese Punkte geklärt sind.`,
						`${unknownCount} question(s) were answered "unclear". The classification is only reliable once these are resolved.`
					)
				]
			: [];
	const citations = catalog.sources;

	// 0. scope
	if (answers.s_ai === 'no') {
		return {
			verdict: 'negative',
			outcome: 'kein-ki',
			headline: L('Kein KI-System.', 'Not an AI system.'),
			explanation: L(
				'Das System erfüllt die Definition in Art. 3 Nr. 1 KI-VO nicht. Die KI-Verordnung ist nicht anwendbar; die DSGVO und das Produktsicherheitsrecht gelten unverändert.',
				'The system does not meet the definition in Art. 3(1) AI Act. The AI Act does not apply; the GDPR and product-safety law apply as before.'
			),
			reasons: [reasonFor('s_ai')],
			notes: [
				L(
					'Die Einstufung ist zu dokumentieren und bei Änderungen der Systemfähigkeiten zu wiederholen.',
					'Document the assessment and repeat it when the system capabilities change.'
				),
				...unknownNote
			],
			citations
		};
	}
	if (yes('s_excluded')) {
		return {
			verdict: 'negative',
			outcome: 'ausserhalb',
			headline: L('Außerhalb des Anwendungsbereichs.', 'Outside the scope.'),
			explanation: L(
				'Art. 2 KI-VO nimmt die genannte Nutzung vom Anwendungsbereich aus. Sobald das System für einen anderen Zweck genutzt wird, ist die Einstufung zu wiederholen.',
				'Art. 2 AI Act excludes the stated use from the scope. Repeat the classification as soon as the system is used for another purpose.'
			),
			reasons: [reasonFor('s_excluded')],
			notes: unknownNote,
			citations
		};
	}

	// 1. prohibited
	const prohibited = PROHIBITED.filter(yes).map(reasonFor);
	if (prohibited.length > 0) {
		return {
			verdict: 'positive',
			outcome: 'verboten',
			headline: L('Verbotene Praxis.', 'Prohibited practice.'),
			explanation: L(
				`Mindestens eine Praktik des Art. 5 Abs. 1 KI-VO trifft zu. Das Inverkehrbringen, die Inbetriebnahme und die Verwendung sind seit dem ${DATES.prohibited.de} untersagt (das durch die Omnibus-Verordnung eingefügte Verbot nach lit. i ab dem ${DATES.prohibitedNcii.de}). Verstöße werden mit Geldbußen bis zu 35 Mio. € oder 7 % des weltweiten Jahresumsatzes geahndet (Art. 99 Abs. 3).`,
				`At least one practice under Art. 5(1) AI Act applies. Placing on the market, putting into service and use have been prohibited since ${DATES.prohibited.en} (the prohibition inserted by the Omnibus Regulation under point (i) from ${DATES.prohibitedNcii.en}). Infringements carry fines of up to EUR 35 million or 7 % of worldwide annual turnover (Art. 99(3)).`
			),
			reasons: prohibited,
			notes: [
				L(
					'Nutzung sofort einstellen oder die Funktion so ändern, dass kein Tatbestand des Art. 5 mehr erfüllt ist; Entscheidung dokumentieren.',
					'Stop the use immediately or change the function so that no Art. 5 element is met; document the decision.'
				),
				L(
					'Prüfen, ob eine der engen Ausnahmen (z. B. Art. 5 Abs. 1 lit. h Ziff. i–iii, medizinische oder Sicherheitsgründe bei lit. f) einschlägig und genehmigt ist.',
					'Check whether one of the narrow exceptions (e.g. Art. 5(1)(h)(i)–(iii), medical or safety reasons under (f)) applies and has been authorised.'
				),
				...unknownNote
			],
			citations
		};
	}

	// 2./3. high-risk
	const annexI = yes('h_annex1');
	const annexIII = ANNEX_III.filter(yes).map(reasonFor);
	const exceptions = EXCEPTIONS.filter(yes).map(reasonFor);
	const profiling = yes('x_profiling');

	if (annexI || (annexIII.length > 0 && (exceptions.length === 0 || profiling))) {
		const date = annexI ? DATES.annexI : DATES.annexIII;
		const reasons = [...(annexI ? [reasonFor('h_annex1')] : []), ...annexIII];
		const escapeBlocked = annexIII.length > 0 && exceptions.length > 0 && profiling;
		return {
			verdict: 'positive',
			outcome: 'hochrisiko',
			headline: L('Hochrisiko-KI-System.', 'High-risk AI system.'),
			explanation: L(
				(annexI
					? 'Das System ist ein Sicherheitsbauteil oder Produkt nach Anhang I (Art. 6 Abs. 1).'
					: 'Das System fällt in einen Bereich des Anhangs III (Art. 6 Abs. 2).') +
					(escapeBlocked
						? ' Die Ausnahme nach Art. 6 Abs. 3 scheidet aus, weil das System Profiling natürlicher Personen vornimmt.'
						: '') +
					` Die Pflichten für Hochrisiko-Systeme gelten ab dem ${date.de} (${DATES.source}).`,
				(annexI
					? 'The system is a safety component or product under Annex I (Art. 6(1)).'
					: 'The system falls within an Annex III area (Art. 6(2)).') +
					(escapeBlocked
						? ' The Art. 6(3) exception is unavailable because the system profiles natural persons.'
						: '') +
					` High-risk obligations apply from ${date.en} (${DATES.source}).`
			),
			reasons,
			notes: [
				L(
					`Geltungsbeginn: ${date.de}. Bis dahin: Lückenanalyse, Risikomanagementsystem (Art. 9), Daten-Governance (Art. 10), technische Dokumentation (Art. 11, Anhang IV), Protokollierung (Art. 12), menschliche Aufsicht (Art. 14).`,
					`Application date: ${date.en}. Until then: gap analysis, risk management system (Art. 9), data governance (Art. 10), technical documentation (Art. 11, Annex IV), logging (Art. 12), human oversight (Art. 14).`
				),
				L(
					'Als Betreiber: Pflichten nach Art. 26 (Betriebsanleitung, Aufsicht, Eingabedaten, Protokolle, Information der Beschäftigten) und ggf. Grundrechte-Folgenabschätzung nach Art. 27.',
					'As a deployer: Art. 26 duties (instructions, oversight, input data, logs, informing workers) and, where applicable, a fundamental rights impact assessment under Art. 27.'
				),
				L(
					'Als Anbieter: Konformitätsbewertung (Art. 43), CE-Kennzeichnung, Registrierung in der EU-Datenbank (Art. 49), Qualitätsmanagementsystem (Art. 17).',
					'As a provider: conformity assessment (Art. 43), CE marking, registration in the EU database (Art. 49), quality management system (Art. 17).'
				),
				L(
					'Verarbeitet das System personenbezogene Daten, ist zusätzlich eine DSFA nach Art. 35 DSGVO zu prüfen; Art. 26 Abs. 9 KI-VO verweist darauf.',
					'Where personal data is processed, a DPIA under Art. 35 GDPR must also be considered; Art. 26(9) AI Act refers to it.'
				),
				...unknownNote
			],
			citations
		};
	}

	if (annexIII.length > 0 && exceptions.length > 0 && !profiling) {
		return {
			verdict: 'conditional',
			outcome: 'art6-3',
			headline: L('Nicht hochriskant (Art. 6 Abs. 3).', 'Not high-risk (Art. 6(3)).'),
			explanation: L(
				'Das System fällt in einen Anhang-III-Bereich, erfüllt aber nur eine der in Art. 6 Abs. 3 genannten Aufgaben und nimmt kein Profiling vor. Es gilt daher nicht als hochriskant. Diese Bewertung ist zu dokumentieren und auf Verlangen der Behörde vorzulegen.',
				'The system falls within an Annex III area but only performs one of the tasks named in Art. 6(3) and does not profile. It is therefore not considered high-risk. This assessment must be documented and provided to the authority on request.'
			),
			reasons: [...annexIII, ...exceptions],
			notes: [
				L(
					'Bewertung nach Art. 6 Abs. 4 dokumentieren, bevor das System in Verkehr gebracht oder in Betrieb genommen wird.',
					'Document the Art. 6(4) assessment before placing the system on the market or putting it into service.'
				),
				L(
					'Als Anbieter das System nach Art. 49 Abs. 2 in der EU-Datenbank registrieren.',
					'As a provider, register the system in the EU database under Art. 49(2).'
				),
				L(
					'Transparenzpflichten nach Art. 50 gesondert prüfen (nächster Abschnitt).',
					'Check Art. 50 transparency obligations separately (next section).'
				),
				...unknownNote
			],
			citations
		};
	}

	// 5. transparency
	const transparency = TRANSPARENCY.filter(yes).map(reasonFor);
	if (transparency.length > 0) {
		return {
			verdict: 'conditional',
			outcome: 'art50',
			headline: L('Transparenzpflichten nach Art. 50.', 'Transparency obligations under Art. 50.'),
			explanation: L(
				`Das System ist weder verboten noch hochriskant, unterliegt aber den Transparenzpflichten des Art. 50 KI-VO. Diese gelten ab dem ${DATES.transparency.de}; für Systeme, die vor diesem Datum in Verkehr gebracht wurden, gilt die Kennzeichnungspflicht für synthetische Inhalte ab dem ${DATES.transparencyExisting.de} (${DATES.source}).`,
				`The system is neither prohibited nor high-risk but is subject to the transparency obligations of Art. 50 AI Act. They apply from ${DATES.transparency.en}; for systems placed on the market before that date, the marking duty for synthetic content applies from ${DATES.transparencyExisting.en} (${DATES.source}).`
			),
			reasons: transparency,
			notes: [
				L(
					'Betroffene Personen klar darüber informieren, dass sie mit einem KI-System interagieren bzw. dass Inhalte künstlich erzeugt sind; synthetische Inhalte maschinenlesbar kennzeichnen.',
					'Clearly inform persons that they are interacting with an AI system or that content is artificially generated; mark synthetic content in a machine-readable way.'
				),
				L(
					'KI-Kompetenz der Beschäftigten sicherstellen (Art. 4, seit 2. Februar 2025).',
					'Ensure AI literacy of staff (Art. 4, since 2 February 2025).'
				),
				...unknownNote
			],
			citations
		};
	}

	// 6. minimal
	return {
		verdict: 'negative',
		outcome: 'minimal',
		headline: L('Minimales Risiko.', 'Minimal risk.'),
		explanation: L(
			'Das System fällt in keine der Kategorien mit besonderen Pflichten. Es bleiben die allgemeinen Pflichten: KI-Kompetenz (Art. 4) und die freiwilligen Verhaltenskodizes (Art. 95). Datenschutzrecht und sonstiges Recht gelten unverändert.',
			'The system falls into none of the categories with specific obligations. The general duties remain: AI literacy (Art. 4) and the voluntary codes of conduct (Art. 95). Data protection and other law apply as before.'
		),
		reasons: [],
		notes: [
			L(
				'Einstufung mit Datum dokumentieren und ins KI-Register aufnehmen; bei Zweckänderung wiederholen.',
				'Document the classification with date and add the system to the AI register; repeat on any change of purpose.'
			),
			...unknownNote
		],
		citations
	};
}
