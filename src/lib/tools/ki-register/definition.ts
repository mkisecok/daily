import type { RecordToolDefinition } from '../../records/types.js';

const L = (de: string, en: string) => ({ de, en });

export const RISK_CLASSES = [
	'verboten',
	'hochriskant',
	'art6_3',
	'art50',
	'minimal',
	'ausserhalb',
	'ungeklaert'
] as const;
export type RiskClass = (typeof RISK_CLASSES)[number];

/** Inventory of AI systems: one record per system, per organisation. */
export const definition: RecordToolDefinition = {
	slug: 'ki-register',
	version: 1,
	intro: L(
		'Ein Eintrag je KI-System, das die Organisation entwickelt, anbietet oder einsetzt. Das Register ist die Grundlage für die Einstufung nach der KI-Verordnung, für die Betreiberpflichten und für die Abstimmung mit dem Datenschutz. Die Risikoklasse lässt sich mit der Risikoklassifizierung belegen.',
		'One entry per AI system the organisation develops, provides or uses. The register is the basis for classification under the AI Act, for deployer duties and for alignment with data protection. The risk class can be backed by the risk classification.'
	),
	sources: [
		{ law: 'KI-VO', ref: 'Art. 3 Nr. 1' },
		{ law: 'KI-VO', ref: 'Art. 4' },
		{ law: 'KI-VO', ref: 'Art. 6' },
		{ law: 'KI-VO', ref: 'Art. 26' },
		{ law: 'KI-VO', ref: 'Art. 50' }
	],
	titleField: 'name',
	sections: [
		{
			id: 'system',
			title: L('Das System', 'The system'),
			fields: [
				{
					id: 'name',
					type: 'text',
					label: L('Bezeichnung', 'Name'),
					required: true,
					listColumn: true
				},
				{
					id: 'zweck',
					type: 'textarea',
					label: L('Zweck und Einsatzbereich', 'Purpose and area of use'),
					help: L(
						'Wofür wird das System eingesetzt, wer nutzt es, wen betreffen die Ergebnisse?',
						'What is the system used for, who uses it, whom do its outputs affect?'
					),
					cite: { law: 'KI-VO', ref: 'Art. 3 Nr. 12' },
					required: true
				},
				{ id: 'anbieter', type: 'text', label: L('Anbieter (Hersteller)', 'Provider (vendor)') },
				{ id: 'modell', type: 'text', label: L('Modell und Version', 'Model and version') },
				{
					id: 'gpai',
					type: 'boolean',
					label: L(
						'Beruht auf einem KI-Modell mit allgemeinem Verwendungszweck',
						'Built on a general-purpose AI model'
					),
					cite: { law: 'KI-VO', ref: 'Art. 3 Nr. 63' }
				}
			]
		},
		{
			id: 'rolle',
			title: L('Rolle und Verantwortung', 'Role and responsibility'),
			fields: [
				{
					id: 'rolle',
					type: 'select',
					label: L('Rolle der Organisation', 'Role of the organisation'),
					options: [
						{ value: 'betreiber', label: L('Betreiber', 'Deployer') },
						{ value: 'anbieter', label: L('Anbieter', 'Provider') },
						{ value: 'beides', label: L('Anbieter und Betreiber', 'Provider and deployer') }
					],
					help: L(
						'Anbieter ist, wer das System entwickelt oder unter eigenem Namen in Verkehr bringt; Betreiber, wer es in eigener Verantwortung verwendet.',
						'A provider develops the system or places it on the market under its own name; a deployer uses it under its own authority.'
					),
					cite: { law: 'KI-VO', ref: 'Art. 3 Nr. 3 und 4' },
					required: true,
					listColumn: true
				},
				{ id: 'abteilung', type: 'text', label: L('Abteilung', 'Department') },
				{
					id: 'verantwortlich',
					type: 'text',
					label: L('Verantwortliche Person', 'Responsible person'),
					listColumn: true
				}
			]
		},
		{
			id: 'daten',
			title: L('Daten', 'Data'),
			fields: [
				{
					id: 'personenbezug',
					type: 'boolean',
					label: L('Verarbeitet personenbezogene Daten', 'Processes personal data'),
					cite: { law: 'DSGVO', ref: 'Art. 4 Nr. 1' }
				},
				{
					id: 'datenkategorien',
					type: 'multiselect',
					label: L('Datenkategorien', 'Data categories'),
					options: [
						{ value: 'stammdaten', label: L('Stamm- und Kontaktdaten', 'Master and contact data') },
						{ value: 'beschaeftigte', label: L('Beschäftigtendaten', 'Employee data') },
						{
							value: 'kunden',
							label: L('Kunden- und Vertragsdaten', 'Customer and contract data')
						},
						{ value: 'nutzung', label: L('Nutzungs- und Protokolldaten', 'Usage and log data') },
						{
							value: 'art9',
							label: L('Besondere Kategorien (Art. 9 DSGVO)', 'Special categories (Art. 9 GDPR)')
						},
						{ value: 'biometrie', label: L('Biometrische Daten', 'Biometric data') },
						{ value: 'minderjaehrige', label: L('Daten Minderjähriger', 'Data of minors') }
					]
				}
			]
		},
		{
			id: 'einstufung',
			title: L('Einstufung und Status', 'Classification and status'),
			fields: [
				{
					id: 'risikoklasse',
					type: 'select',
					label: L('Risikoklasse', 'Risk class'),
					options: [
						{
							value: 'verboten',
							label: L('Verbotene Praxis (Art. 5)', 'Prohibited practice (Art. 5)')
						},
						{ value: 'hochriskant', label: L('Hochrisiko (Art. 6)', 'High-risk (Art. 6)') },
						{
							value: 'art6_3',
							label: L('Nicht hochriskant nach Art. 6 Abs. 3', 'Not high-risk under Art. 6(3)')
						},
						{
							value: 'art50',
							label: L('Transparenzpflichten (Art. 50)', 'Transparency (Art. 50)')
						},
						{ value: 'minimal', label: L('Minimales Risiko', 'Minimal risk') },
						{
							value: 'ausserhalb',
							label: L(
								'Kein KI-System oder außerhalb des Anwendungsbereichs',
								'Not an AI system or outside the scope'
							)
						},
						{ value: 'ungeklaert', label: L('Ungeklärt', 'Unclear') }
					],
					cite: { law: 'KI-VO', ref: 'Art. 6' },
					listColumn: true
				},
				{
					id: 'einstufung',
					type: 'assessment',
					tool: 'risikoklassifizierung',
					label: L('Risikoklassifizierung', 'Risk classification')
				},
				{
					id: 'status',
					type: 'select',
					label: L('Status', 'Status'),
					options: [
						{ value: 'geplant', label: L('Geplant', 'Planned') },
						{ value: 'pruefung', label: L('In Prüfung', 'Under review') },
						{ value: 'aktiv', label: L('Im Einsatz', 'In use') },
						{ value: 'ausser_betrieb', label: L('Außer Betrieb', 'Retired') }
					],
					required: true,
					listColumn: true
				},
				{ id: 'inbetriebnahme', type: 'date', label: L('Im Einsatz seit', 'In use since') },
				{
					id: 'wiedervorlage',
					type: 'date',
					label: L('Wiedervorlage', 'Next review'),
					help: L(
						'Nächste Überprüfung von Einstufung und Angaben, spätestens bei Änderung des Zwecks.',
						'Next review of classification and details, at the latest when the purpose changes.'
					)
				},
				{ id: 'notizen', type: 'textarea', label: L('Notizen', 'Notes') }
			]
		}
	]
};
