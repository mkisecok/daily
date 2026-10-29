import type { RecordToolDefinition, RecordView } from '../../records/types.js';

const L = (de: string, en: string) => ({ de, en });

/**
 * Art. 27(1): deployers that are bodies governed by public law or private
 * entities providing public services, and deployers of Annex III point
 * 5(b) and (c) systems, for high-risk systems other than Annex III point 2.
 */
export function required(record: RecordView): boolean {
	const kind = record.data.betreiberart;
	return (
		record.data.hochrisiko === true &&
		record.data.infrastruktur !== true &&
		typeof kind === 'string' &&
		kind !== 'keine'
	);
}

/** the elements of Art. 27(1)(a)–(f), in order */
export const ELEMENTS = [
	{ id: 'prozesse', ref: 'Art. 27 Abs. 1 lit. a' },
	{ id: 'zeitraum', ref: 'Art. 27 Abs. 1 lit. b' },
	{ id: 'betroffene', ref: 'Art. 27 Abs. 1 lit. c' },
	{ id: 'risiken', ref: 'Art. 27 Abs. 1 lit. d' },
	{ id: 'aufsicht', ref: 'Art. 27 Abs. 1 lit. e' },
	{ id: 'massnahmen', ref: 'Art. 27 Abs. 1 lit. f' }
] as const;

/** a fundamental rights impact assessment before a high-risk system is first used (Art. 27) */
export const definition: RecordToolDefinition = {
	slug: 'grundrechte-folgenabschaetzung',
	version: 2,
	intro: L(
		'Eine Grundrechte-Folgenabschätzung je Hochrisiko-KI-System und Einsatz, bevor es erstmals verwendet wird. Pflichtig sind öffentliche Stellen, private Stellen mit öffentlichen Aufgaben sowie Betreiber von Systemen zur Kreditwürdigkeitsprüfung und zur Preisbildung in der Lebens- und Krankenversicherung. Das Ergebnis wird der Marktüberwachungsbehörde mitgeteilt; eine bestehende DSFA wird ergänzt, nicht ersetzt.',
		'One fundamental rights impact assessment per high-risk AI system and use, before it is first used. Required for public bodies, private entities providing public services and deployers of systems for creditworthiness assessment and pricing in life and health insurance. The results are notified to the market surveillance authority; an existing DPIA is complemented, not replaced.'
	),
	sources: [
		{ law: 'KI-VO', ref: 'Art. 27' },
		{ law: 'KI-VO', ref: 'Anhang III Nr. 5' }
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'anwendbarkeit',
			title: L('Anwendbarkeit', 'Applicability'),
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Bezeichnung', 'Title'),
					required: true,
					listColumn: true
				},
				{
					id: 'ki_eintrag',
					type: 'reference',
					tool: 'ki-register',
					label: L('KI-System im Register', 'AI system in the register'),
					help: L(
						'Das Hochrisiko-KI-System aus dem KI-Register, das diese Abschätzung betrifft.',
						'The high-risk AI system from the AI register this assessment concerns.'
					)
				},
				{ id: 'ki_system', type: 'text', label: L('KI-System', 'AI system'), listColumn: true },
				{
					id: 'hochrisiko',
					type: 'boolean',
					label: L(
						'Hochrisiko-KI-System nach Art. 6 Abs. 2 (Anhang III)',
						'High-risk AI system under Art. 6(2) (Annex III)'
					),
					cite: { law: 'KI-VO', ref: 'Art. 6 Abs. 2' }
				},
				{
					id: 'infrastruktur',
					type: 'boolean',
					label: L(
						'Bereich kritische Infrastruktur (Anhang III Nr. 2)',
						'Critical infrastructure area (Annex III point 2)'
					),
					help: L(
						'Diese Systeme sind von Art. 27 ausgenommen.',
						'These systems are excluded from Art. 27.'
					)
				},
				{
					id: 'betreiberart',
					type: 'select',
					label: L('Art des Betreibers', 'Kind of deployer'),
					options: [
						{
							value: 'oeffentlich',
							label: L('Einrichtung des öffentlichen Rechts', 'Body governed by public law')
						},
						{
							value: 'oeffentliche_dienste',
							label: L(
								'Private Einrichtung, die öffentliche Dienste erbringt',
								'Private entity providing public services'
							)
						},
						{
							value: 'kredit',
							label: L(
								'Kreditwürdigkeitsprüfung, Bonität (Anhang III Nr. 5 lit. b)',
								'Creditworthiness, credit score (Annex III point 5(b))'
							)
						},
						{
							value: 'versicherung',
							label: L(
								'Risikobewertung und Preisbildung Lebens- und Krankenversicherung (Anhang III Nr. 5 lit. c)',
								'Risk assessment and pricing in life and health insurance (Annex III point 5(c))'
							)
						},
						{ value: 'keine', label: L('Keine dieser Gruppen', 'None of these') }
					],
					cite: { law: 'KI-VO', ref: 'Art. 27 Abs. 1' }
				}
			]
		},
		{
			id: 'bewertung',
			title: L('Bewertung', 'Assessment'),
			fields: [
				{
					id: 'prozesse',
					type: 'textarea',
					label: L(
						'Prozesse, in denen das System gemäß seiner Zweckbestimmung verwendet wird',
						'Processes in which the system is used in line with its intended purpose'
					),
					cite: { law: 'KI-VO', ref: 'Art. 27 Abs. 1 lit. a' }
				},
				{
					id: 'zeitraum',
					type: 'textarea',
					label: L('Zeitraum und Häufigkeit der Verwendung', 'Period and frequency of use'),
					cite: { law: 'KI-VO', ref: 'Art. 27 Abs. 1 lit. b' }
				},
				{
					id: 'betroffene',
					type: 'textarea',
					label: L(
						'Kategorien betroffener Personen und Gruppen',
						'Categories of persons and groups likely affected'
					),
					cite: { law: 'KI-VO', ref: 'Art. 27 Abs. 1 lit. c' }
				},
				{
					id: 'grundrechte',
					type: 'multiselect',
					label: L('Berührte Grundrechte (Charta)', 'Fundamental rights concerned (Charter)'),
					options: [
						{ value: 'wuerde', label: L('Menschenwürde (Art. 1)', 'Human dignity (Art. 1)') },
						{
							value: 'privatleben',
							label: L('Achtung des Privatlebens (Art. 7)', 'Respect for private life (Art. 7)')
						},
						{
							value: 'datenschutz',
							label: L(
								'Schutz personenbezogener Daten (Art. 8)',
								'Protection of personal data (Art. 8)'
							)
						},
						{
							value: 'meinung',
							label: L(
								'Meinungs- und Informationsfreiheit (Art. 11)',
								'Freedom of expression and information (Art. 11)'
							)
						},
						{
							value: 'diskriminierung',
							label: L('Nichtdiskriminierung (Art. 21)', 'Non-discrimination (Art. 21)')
						},
						{
							value: 'kinder',
							label: L('Rechte des Kindes (Art. 24)', 'Rights of the child (Art. 24)')
						},
						{
							value: 'arbeit',
							label: L('Gerechte Arbeitsbedingungen (Art. 31)', 'Fair working conditions (Art. 31)')
						},
						{
							value: 'sozial',
							label: L(
								'Soziale Sicherheit und Unterstützung (Art. 34)',
								'Social security and assistance (Art. 34)'
							)
						},
						{
							value: 'gesundheit',
							label: L('Gesundheitsschutz (Art. 35)', 'Health care (Art. 35)')
						},
						{
							value: 'rechtsbehelf',
							label: L('Wirksamer Rechtsbehelf (Art. 47)', 'Effective remedy (Art. 47)')
						}
					]
				},
				{
					id: 'risiken',
					type: 'textarea',
					label: L(
						'Spezifische Schadensrisiken für diese Personen und Gruppen',
						'Specific risks of harm to these persons and groups'
					),
					help: L(
						'Unter Berücksichtigung der Informationen des Anbieters nach Art. 13.',
						'Taking into account the provider’s information under Art. 13.'
					),
					cite: { law: 'KI-VO', ref: 'Art. 27 Abs. 1 lit. d' }
				},
				{
					id: 'aufsicht',
					type: 'textarea',
					label: L(
						'Umsetzung der menschlichen Aufsicht nach der Betriebsanleitung',
						'Implementation of human oversight according to the instructions for use'
					),
					cite: { law: 'KI-VO', ref: 'Art. 27 Abs. 1 lit. e' }
				},
				{
					id: 'massnahmen',
					type: 'textarea',
					label: L('Maßnahmen bei Eintritt der Risiken', 'Measures if the risks materialise'),
					help: L(
						'Einschließlich interner Governance und Beschwerdemechanismen.',
						'Including internal governance and complaint mechanisms.'
					),
					cite: { law: 'KI-VO', ref: 'Art. 27 Abs. 1 lit. f' }
				}
			]
		},
		{
			id: 'abschluss',
			title: L('Abschluss', 'Completion'),
			fields: [
				{
					id: 'dsfa',
					type: 'text',
					label: L('Ergänzte DSFA', 'DPIA complemented'),
					cite: { law: 'KI-VO', ref: 'Art. 27 Abs. 4' }
				},
				{
					id: 'erste_verwendung',
					type: 'date',
					label: L('Erste Verwendung geplant am', 'First use planned on'),
					listColumn: true
				},
				{
					id: 'mitgeteilt_am',
					type: 'datetime',
					label: L(
						'Ergebnis der Marktüberwachungsbehörde mitgeteilt am',
						'Results notified to the market surveillance authority on'
					),
					cite: { law: 'KI-VO', ref: 'Art. 27 Abs. 3' }
				},
				{
					id: 'ueberpruefung',
					type: 'date',
					label: L('Nächste Überprüfung', 'Next review'),
					cite: { law: 'KI-VO', ref: 'Art. 27 Abs. 2' }
				}
			]
		}
	],
	workflow: {
		states: [
			{ id: 'entwurf', label: L('Entwurf', 'Draft') },
			{ id: 'bewertet', label: L('Bewertet', 'Assessed') },
			{ id: 'mitgeteilt', label: L('Mitgeteilt', 'Notified') },
			{ id: 'nicht_erforderlich', label: L('Nicht erforderlich', 'Not required'), terminal: true }
		],
		initialState: 'entwurf',
		transitions: [
			{
				from: 'entwurf',
				to: 'bewertet',
				label: L('Bewertung abschließen', 'Complete the assessment'),
				requires: ELEMENTS.map((e) => e.id)
			},
			{
				from: 'entwurf',
				to: 'nicht_erforderlich',
				label: L('Als nicht erforderlich dokumentieren', 'Document as not required'),
				check: (record) =>
					required(record)
						? L(
								'Nach den Angaben zur Anwendbarkeit ist die Abschätzung erforderlich.',
								'According to the applicability details the assessment is required.'
							)
						: null
			},
			{ from: 'bewertet', to: 'entwurf', label: L('Zurück zum Entwurf', 'Back to draft') },
			{
				from: 'bewertet',
				to: 'mitgeteilt',
				label: L('Mitteilung erfasst', 'Notification made'),
				requires: ['mitgeteilt_am']
			},
			{ from: 'mitgeteilt', to: 'bewertet', label: L('Aktualisieren', 'Update') }
		]
	}
};
