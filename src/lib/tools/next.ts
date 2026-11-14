import type { Localized, QuestionnaireResult } from './types.js';

/**
 * what usually follows a questionnaire result: another check (`pruefen`) or
 * a new entry in a register or workflow (`neu`), with why. Rules by tool,
 * read from the result's verdict and outcome; no rule means no suggestion.
 */
export type NextStep = { tool: string; mode: 'pruefen' | 'neu'; why: Localized };

const L = (de: string, en: string): Localized => ({ de, en });
const check = (tool: string, why: Localized): NextStep => ({ tool, mode: 'pruefen', why });
const entry = (tool: string, why: Localized): NextStep => ({ tool, mode: 'neu', why });

const RULES: Record<string, (result: QuestionnaireResult) => NextStep[]> = {
	'dsfa-schwellwert': (r) =>
		r.verdict === 'positive'
			? [
					entry(
						'dsfa',
						L(
							'Die Datenschutz-Folgenabschätzung anlegen.',
							'Create the data protection impact assessment.'
						)
					),
					entry(
						'vvt',
						L(
							'Das Ergebnis im VVT-Eintrag festhalten.',
							'Record the result in the record of processing.'
						)
					)
				]
			: [
					entry(
						'vvt',
						L(
							'Das Ergebnis im VVT-Eintrag festhalten.',
							'Record the result in the record of processing.'
						)
					)
				],
	risikoklassifizierung: (r) => {
		const introduce = entry(
			'ki-einfuehrung',
			L(
				'Die Einführung des KI-Tools Schritt für Schritt begleiten.',
				'Take the AI tool’s introduction step by step.'
			)
		);
		const register = entry(
			'ki-register',
			L('Das System im KI-Register erfassen.', 'Add the system to the AI register.')
		);
		switch (r.outcome) {
			case 'verboten':
				return [];
			case 'kein-ki':
			case 'ausserhalb':
				return [
					entry(
						'software-einfuehrung',
						L(
							'Als Software einführen; die KI-Verordnung gilt nicht.',
							'Introduce it as software; the AI Act does not apply.'
						)
					)
				];
			case 'hochrisiko':
				return [
					check(
						'betreiberpflichten',
						L('Die Betreiberpflichten des Art. 26 prüfen.', 'Check the deployer duties of Art. 26.')
					),
					entry(
						'grundrechte-folgenabschaetzung',
						L(
							'Prüfen, ob Art. 27 eine Grundrechte-Folgenabschätzung verlangt.',
							'Check whether Art. 27 requires a fundamental rights impact assessment.'
						)
					),
					register,
					introduce
				];
			case 'art6-3':
				return [
					entry(
						'ki-register',
						L(
							'Die Bewertung nach Art. 6 Abs. 4 im KI-Register dokumentieren.',
							'Document the Art. 6(4) assessment in the AI register.'
						)
					),
					introduce
				];
			case 'art50':
				return [
					check(
						'transparenzpflichten',
						L(
							'Die Hinweise und Kennzeichnungen nach Art. 50 klären.',
							'Settle the notices and labels under Art. 50.'
						)
					),
					register,
					introduce
				];
			default:
				return [register, introduce];
		}
	},
	transparenzpflichten: (r) =>
		r.verdict === 'positive'
			? [
					check(
						'ki-nutzungsrichtlinie',
						L(
							'Hinweise und Kennzeichnung in die KI-Nutzungsrichtlinie aufnehmen.',
							'Put notices and labelling into the AI usage policy.'
						)
					)
				]
			: [],
	betreiberpflichten: (r) =>
		r.verdict === 'negative'
			? []
			: [
					entry(
						'grundrechte-folgenabschaetzung',
						L(
							'Prüfen, ob Art. 27 eine Grundrechte-Folgenabschätzung verlangt.',
							'Check whether Art. 27 requires a fundamental rights impact assessment.'
						)
					),
					entry(
						'schulungsnachweis',
						L(
							'Die Kompetenz der Aufsichtspersonen planen (Art. 26 Abs. 2).',
							'Plan the competence of the oversight staff (Art. 26(2)).'
						)
					)
				],
	interessenabwaegung: (r) =>
		r.verdict === 'positive'
			? [
					check(
						'einwilligung-check',
						L('Eine Einwilligung als Grundlage prüfen.', 'Check consent as the legal basis.')
					)
				]
			: [
					entry(
						'vvt',
						L(
							'Die Rechtsgrundlage im VVT-Eintrag festhalten.',
							'Record the legal basis in the record of processing.'
						)
					)
				],
	'einwilligung-check': () => [
		entry(
			'vvt',
			L(
				'Rechtsgrundlage und Einwilligung im VVT festhalten.',
				'Record legal basis and consent in the record of processing.'
			)
		)
	],
	'drittland-transfer': (r) =>
		r.verdict === 'positive'
			? [
					entry(
						'avv-pruefung',
						L(
							'Den Vertrag mit dem Empfänger prüfen und ergänzen.',
							'Check and supplement the contract with the recipient.'
						)
					)
				]
			: [
					entry(
						'vvt',
						L(
							'Die Übermittlung im VVT-Eintrag vermerken.',
							'Note the transfer in the record of processing.'
						)
					)
				],
	'ki-dsgvo-schnittstelle': () => [
		check(
			'dsfa-schwellwert',
			L('Prüfen, ob eine DSFA nötig ist.', 'Check whether a DPIA is needed.')
		),
		check(
			'interessenabwaegung',
			L(
				'Die Rechtsgrundlage für Training oder Einsatz prüfen.',
				'Check the legal basis for training or use.'
			)
		)
	],
	'technische-dokumentation': (r) =>
		r.verdict === 'negative'
			? []
			: [
					check(
						'aims-gap',
						L(
							'Das KI-Managementsystem nach ISO/IEC 42001 prüfen.',
							'Check the AI management system against ISO/IEC 42001.'
						)
					)
				],
	'ki-nutzungsrichtlinie': () => [
		entry(
			'schulungsnachweis',
			L('Die Schulung der Nutzenden planen.', 'Plan the training of users.')
		)
	],
	'aims-gap': (r) =>
		r.verdict === 'negative'
			? []
			: [
					entry(
						'auditprogramm',
						L('Ein internes Audit für die Lücken planen.', 'Plan an internal audit of the gaps.')
					)
				]
};

export function nextSteps(tool: string, result: QuestionnaireResult): NextStep[] {
	return RULES[tool]?.(result) ?? [];
}
