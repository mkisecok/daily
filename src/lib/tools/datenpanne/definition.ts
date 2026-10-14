import type { RecordToolDefinition, RecordView } from '../../records/types.js';

const L = (de: string, en: string) => ({ de, en });

const notifiable = (record: RecordView) => record.data.risiko !== 'kein';
const highRisk = (record: RecordView) => record.data.risiko === 'hoch';

/**
 * A personal data breach from awareness to closure: assessment, notification
 * of the authority (Art. 33) and of data subjects (Art. 34), documented as
 * Art. 33(5) requires.
 */
export const definition: RecordToolDefinition = {
	slug: 'datenpanne',
	version: 1,
	intro: L(
		'Ein Eintrag je Verletzung des Schutzes personenbezogener Daten. Ab dem Zeitpunkt der Kenntnis läuft die 72-Stunden-Frist für die Meldung an die Aufsichtsbehörde; sie erscheint unter Fristen. Jeder Vorfall wird dokumentiert, auch wenn keine Meldung nötig ist (Art. 33 Abs. 5 DSGVO).',
		'One entry per personal data breach. From the moment of awareness the 72-hour period for notifying the supervisory authority runs; it appears under Deadlines. Every breach is documented, even when no notification is needed (Art. 33(5) GDPR).'
	),
	sources: [
		{ law: 'DSGVO', ref: 'Art. 4 Nr. 12' },
		{ law: 'DSGVO', ref: 'Art. 33' },
		{ law: 'DSGVO', ref: 'Art. 34' },
		{ law: 'EDPB', ref: 'Leitlinien 9/2022' }
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'vorfall',
			title: L('Der Vorfall', 'The breach'),
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Bezeichnung', 'Title'),
					help: L(
						'Kurz und ohne personenbezogene Daten, z. B. „Fehlversand Kundenliste“.',
						'Short and without personal data, e.g. "Customer list sent to wrong recipient".'
					),
					required: true,
					listColumn: true
				},
				{
					id: 'kenntnis',
					type: 'datetime',
					label: L('Kenntnis am', 'Aware since'),
					help: L(
						'Zeitpunkt, zu dem der Verantwortliche mit hinreichender Gewissheit von der Verletzung erfahren hat. Ab hier laufen 72 Stunden; Daily rechnet ab der Minute, also eher zu früh als zu spät.',
						'When the controller became reasonably certain of the breach. The 72 hours run from here; Daily counts from the minute, erring on the early side.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 33 Abs. 1' },
					required: true,
					listColumn: true
				},
				{ id: 'entdeckt_durch', type: 'text', label: L('Entdeckt durch', 'Discovered by') },
				{
					id: 'beschreibung',
					type: 'textarea',
					label: L('Was ist geschehen?', 'What happened?'),
					cite: { law: 'DSGVO', ref: 'Art. 33 Abs. 3 lit. a' },
					required: true
				},
				{
					id: 'art',
					type: 'multiselect',
					label: L('Art der Verletzung', 'Type of breach'),
					options: [
						{
							value: 'vertraulichkeit',
							label: L(
								'Vertraulichkeit (unbefugte Offenlegung oder Zugriff)',
								'Confidentiality (unauthorised disclosure or access)'
							)
						},
						{
							value: 'integritaet',
							label: L('Integrität (unbefugte Veränderung)', 'Integrity (unauthorised alteration)')
						},
						{
							value: 'verfuegbarkeit',
							label: L(
								'Verfügbarkeit (Verlust oder Vernichtung)',
								'Availability (loss or destruction)'
							)
						}
					],
					cite: { law: 'DSGVO', ref: 'Art. 4 Nr. 12' }
				},
				{
					id: 'auftragsverarbeiter',
					type: 'boolean',
					label: L('Beim Auftragsverarbeiter aufgetreten', 'Occurred at a processor'),
					cite: { law: 'DSGVO', ref: 'Art. 33 Abs. 2' }
				}
			]
		},
		{
			id: 'umfang',
			title: L('Betroffene und Daten', 'Data subjects and data'),
			fields: [
				{
					id: 'datenkategorien',
					type: 'multiselect',
					label: L('Datenkategorien', 'Data categories'),
					options: [
						{
							value: 'identifikation',
							label: L('Identifikations- und Kontaktdaten', 'Identification and contact data')
						},
						{
							value: 'zugang',
							label: L('Zugangsdaten und Passwörter', 'Credentials and passwords')
						},
						{ value: 'finanz', label: L('Bank- und Zahlungsdaten', 'Bank and payment data') },
						{
							value: 'ausweis',
							label: L('Ausweis- und Sozialversicherungsdaten', 'ID and social security data')
						},
						{
							value: 'standort',
							label: L('Standort- und Kommunikationsdaten', 'Location and communication data')
						},
						{
							value: 'art9',
							label: L('Besondere Kategorien (Art. 9 DSGVO)', 'Special categories (Art. 9 GDPR)')
						},
						{
							value: 'art10',
							label: L(
								'Daten über Straftaten (Art. 10 DSGVO)',
								'Criminal offence data (Art. 10 GDPR)'
							)
						},
						{ value: 'sonstige', label: L('Sonstige', 'Other') }
					],
					cite: { law: 'DSGVO', ref: 'Art. 33 Abs. 3 lit. a' }
				},
				{
					id: 'anzahl_betroffene',
					type: 'number',
					label: L('Ungefähre Zahl der Betroffenen', 'Approximate number of data subjects'),
					unit: L('Personen', 'persons'),
					min: 0,
					cite: { law: 'DSGVO', ref: 'Art. 33 Abs. 3 lit. a' },
					listColumn: true
				},
				{
					id: 'anzahl_datensaetze',
					type: 'number',
					label: L('Ungefähre Zahl der Datensätze', 'Approximate number of records'),
					min: 0
				},
				{
					id: 'gruppen',
					type: 'multiselect',
					label: L('Betroffenengruppen', 'Groups of data subjects'),
					options: [
						{ value: 'beschaeftigte', label: L('Beschäftigte', 'Employees') },
						{ value: 'kunden', label: L('Kunden', 'Customers') },
						{ value: 'patienten', label: L('Patienten', 'Patients') },
						{ value: 'minderjaehrige', label: L('Minderjährige', 'Minors') },
						{ value: 'sonstige', label: L('Sonstige', 'Others') }
					]
				},
				{
					id: 'verschluesselt',
					type: 'boolean',
					label: L(
						'Die Daten waren für Unbefugte unzugänglich (z. B. nach dem Stand der Technik verschlüsselt, Schlüssel nicht betroffen)',
						'The data was unintelligible to unauthorised persons (e.g. encrypted to the state of the art, key not affected)'
					),
					cite: { law: 'DSGVO', ref: 'Art. 34 Abs. 3 lit. a' }
				}
			]
		},
		{
			id: 'bewertung',
			title: L('Risikobewertung', 'Risk assessment'),
			fields: [
				{
					id: 'folgen',
					type: 'textarea',
					label: L(
						'Wahrscheinliche Folgen für die Betroffenen',
						'Likely consequences for data subjects'
					),
					cite: { law: 'DSGVO', ref: 'Art. 33 Abs. 3 lit. c' }
				},
				{
					id: 'risiko',
					type: 'select',
					label: L('Risiko für die Rechte und Freiheiten', 'Risk to rights and freedoms'),
					options: [
						{
							value: 'kein',
							label: L('Voraussichtlich kein Risiko', 'Unlikely to result in a risk')
						},
						{ value: 'risiko', label: L('Risiko', 'Risk') },
						{ value: 'hoch', label: L('Voraussichtlich hohes Risiko', 'Likely high risk') }
					],
					help: L(
						'Schwere und Eintrittswahrscheinlichkeit der Folgen; die EDPB-Leitlinien 9/2022 nennen Kriterien.',
						'Severity and likelihood of the consequences; EDPB Guidelines 9/2022 list criteria.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 33 Abs. 1, Art. 34 Abs. 1' },
					listColumn: true
				},
				{
					id: 'begruendung',
					type: 'textarea',
					label: L('Begründung der Bewertung', 'Reasons for the assessment'),
					cite: { law: 'DSGVO', ref: 'Art. 33 Abs. 5' }
				},
				{
					id: 'massnahmen',
					type: 'textarea',
					label: L('Ergriffene und vorgeschlagene Maßnahmen', 'Measures taken and proposed'),
					help: L(
						'Zur Behebung der Verletzung und zur Abmilderung ihrer möglichen nachteiligen Auswirkungen.',
						'To address the breach and to mitigate its possible adverse effects.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 33 Abs. 3 lit. d' }
				}
			]
		},
		{
			id: 'meldung',
			title: L('Meldung an die Aufsichtsbehörde', 'Notification of the supervisory authority'),
			fields: [
				{
					id: 'behoerde',
					type: 'text',
					label: L('Zuständige Aufsichtsbehörde', 'Competent supervisory authority')
				},
				{
					id: 'gemeldet_am',
					type: 'datetime',
					label: L('Gemeldet am', 'Notified on'),
					cite: { law: 'DSGVO', ref: 'Art. 33 Abs. 1' }
				},
				{
					id: 'aktenzeichen',
					type: 'text',
					label: L('Aktenzeichen der Behörde', 'Authority reference')
				},
				{
					id: 'verzoegerung',
					type: 'textarea',
					label: L(
						'Gründe für eine Meldung nach mehr als 72 Stunden',
						'Reasons for notifying after more than 72 hours'
					),
					cite: { law: 'DSGVO', ref: 'Art. 33 Abs. 1 Satz 2' }
				}
			]
		},
		{
			id: 'benachrichtigung',
			title: L('Benachrichtigung der Betroffenen', 'Communication to data subjects'),
			fields: [
				{
					id: 'benachrichtigt_am',
					type: 'datetime',
					label: L('Benachrichtigt am', 'Communicated on'),
					cite: { law: 'DSGVO', ref: 'Art. 34 Abs. 1' }
				},
				{
					id: 'ausnahme',
					type: 'select',
					label: L('Ausnahme von der Benachrichtigung', 'Exception from communication'),
					options: [
						{
							value: 'unzugaenglich',
							label: L(
								'lit. a: Daten für Unbefugte unzugänglich, z. B. verschlüsselt',
								'(a) data unintelligible, e.g. encrypted'
							)
						},
						{
							value: 'nachtraeglich',
							label: L(
								'lit. b: nachträgliche Maßnahmen beseitigen das hohe Risiko',
								'(b) subsequent measures remove the high risk'
							)
						},
						{
							value: 'aufwand',
							label: L(
								'lit. c: unverhältnismäßiger Aufwand, stattdessen öffentliche Bekanntmachung',
								'(c) disproportionate effort, public communication instead'
							)
						}
					],
					cite: { law: 'DSGVO', ref: 'Art. 34 Abs. 3' }
				}
			]
		}
	],
	workflow: {
		states: [
			{ id: 'erfasst', label: L('Erfasst', 'Recorded') },
			{ id: 'bewertet', label: L('Bewertet', 'Assessed') },
			{ id: 'gemeldet', label: L('Gemeldet', 'Notified') },
			{ id: 'nicht_meldepflichtig', label: L('Nicht meldepflichtig', 'Not notifiable') },
			{ id: 'abgeschlossen', label: L('Abgeschlossen', 'Closed'), terminal: true }
		],
		initialState: 'erfasst',
		transitions: [
			{
				from: 'erfasst',
				to: 'bewertet',
				label: L('Bewertung abschließen', 'Complete the assessment'),
				requires: ['risiko', 'begruendung']
			},
			{ from: 'bewertet', to: 'erfasst', label: L('Neu bewerten', 'Reassess') },
			{
				from: 'bewertet',
				to: 'gemeldet',
				label: L('Meldung erfasst', 'Notification made'),
				requires: ['gemeldet_am'],
				check: (record) =>
					notifiable(record)
						? null
						: L(
								'Bei „kein Risiko“ besteht keine Meldepflicht.',
								'No notification duty for "unlikely to result in a risk".'
							)
			},
			{
				from: 'bewertet',
				to: 'nicht_meldepflichtig',
				label: L('Als nicht meldepflichtig dokumentieren', 'Document as not notifiable'),
				check: (record) =>
					notifiable(record)
						? L(
								'Nur bei „voraussichtlich kein Risiko“ möglich.',
								'Only possible for "unlikely to result in a risk".'
							)
						: null
			},
			{
				from: 'gemeldet',
				to: 'abgeschlossen',
				label: L('Abschließen', 'Close'),
				requires: ['massnahmen'],
				check: (record) =>
					highRisk(record) && !record.data.benachrichtigt_am && !record.data.ausnahme
						? L(
								'Bei hohem Risiko erst die Benachrichtigung der Betroffenen oder eine Ausnahme nach Art. 34 Abs. 3 eintragen.',
								'With a high risk, first enter the communication to data subjects or an Art. 34(3) exception.'
							)
						: null
			},
			{
				from: 'nicht_meldepflichtig',
				to: 'abgeschlossen',
				label: L('Abschließen', 'Close'),
				requires: ['massnahmen']
			}
		]
	}
};
