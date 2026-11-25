import type { RecordData, RecordToolDefinition } from '../../records/types.js';

const L = (de: string, en: string) => ({ de, en });

const listHas = (data: RecordData, id: string, value: string) =>
	Array.isArray(data[id]) && (data[id] as string[]).includes(value);
const controller = (data: RecordData) => data.rolle !== 'auftragsverarbeiter';

/** the legal bases of Art. 6(1), with the special cases the record most often needs */
export const LEGAL_BASES = [
	{
		value: 'einwilligung',
		label: L('Einwilligung (Art. 6 Abs. 1 lit. a)', 'Consent (Art. 6(1)(a))')
	},
	{
		value: 'vertrag',
		label: L(
			'Vertrag oder vorvertragliche Maßnahmen (lit. b)',
			'Contract or pre-contractual steps ((b))'
		)
	},
	{
		value: 'pflicht',
		label: L('Rechtliche Verpflichtung (lit. c)', 'Legal obligation ((c))')
	},
	{
		value: 'lebenswichtig',
		label: L('Lebenswichtige Interessen (lit. d)', 'Vital interests ((d))')
	},
	{ value: 'oeffentlich', label: L('Öffentliche Aufgabe (lit. e)', 'Public task ((e))') },
	{
		value: 'interesse',
		label: L('Berechtigte Interessen (lit. f)', 'Legitimate interests ((f))')
	},
	{
		value: 'art9',
		label: L(
			'Ausnahme nach Art. 9 Abs. 2 (besondere Kategorien)',
			'Exception under Art. 9(2) (special categories)'
		)
	},
	{
		value: 'art10',
		label: L(
			'Grundlage nach Art. 10 (Daten über Straftaten)',
			'Basis under Art. 10 (criminal offence data)'
		)
	},
	{
		value: 'beschaeftigung',
		label: L(
			'Beschäftigungsverhältnis (Art. 88 DSGVO, § 26 BDSG)',
			'Employment (Art. 88 GDPR, § 26 BDSG)'
		)
	}
];

/**
 * record of processing activities: one record per processing activity,
 * covering Art. 30(1) for controllers and Art. 30(2) for processors.
 */
export const definition: RecordToolDefinition = {
	slug: 'vvt',
	version: 3,
	intro: L(
		'Ein Eintrag je Verarbeitungstätigkeit. Das Verzeichnis enthält die Angaben nach Art. 30 Abs. 1 DSGVO (als Verantwortlicher) oder Abs. 2 (als Auftragsverarbeiter) und ist der Aufsichtsbehörde auf Anfrage vorzulegen. Name und Kontaktdaten des Verantwortlichen und des Datenschutzbeauftragten stehen im Kopf der Druckfassung.',
		'One entry per processing activity. The record holds the information under Art. 30(1) GDPR (as controller) or Art. 30(2) (as processor) and must be made available to the supervisory authority on request. Name and contact details of the controller and the DPO head the print version.'
	),
	sources: [
		{ law: 'DSGVO', ref: 'Art. 30' },
		{ law: 'DSK', ref: 'Hinweise zum Verzeichnis von Verarbeitungstätigkeiten' }
	],
	titleField: 'bezeichnung',
	example: {
		bezeichnung: 'Lohn- und Gehaltsabrechnung',
		beschreibung:
			'Die Personalabteilung erfasst Stamm- und Zeitdaten im Personalsystem; ein Lohnbüro rechnet monatlich ab und meldet an Finanzamt und Sozialversicherung.',
		rolle: 'verantwortlicher',
		fachbereich: 'Personal',
		ansprechpartner: 'Leitung Personal',
		zwecke:
			'Abrechnung von Lohn und Gehalt, Meldungen an Finanzamt und Sozialversicherung, Bescheinigungen für Beschäftigte.',
		rechtsgrundlagen: ['vertrag', 'pflicht'],
		rechtsgrundlagen_details:
			'Arbeitsvertrag; Lohnsteuerabzug nach § 38 und § 41 EStG, Meldungen nach § 28a SGB IV.',
		betroffene: ['beschaeftigte'],
		datenkategorien: ['stammdaten', 'kontakt', 'vertrag', 'zahlung', 'art9'],
		datenkategorien_details:
			'Steuer-ID, Sozialversicherungsnummer, Bankverbindung; Religionszugehörigkeit für die Kirchensteuer.',
		herkunft: 'beides',
		quelle: 'Finanzamt (Lohnsteuerabzugsmerkmale), Krankenkasse.',
		bereitstellung: 'gesetzlich',
		bereitstellung_folgen: 'Ohne die Angaben kann der Lohn nicht ordnungsgemäß abgerechnet werden.',
		automatisiert: false,
		empfaenger: ['intern', 'auftragsverarbeiter', 'behoerden', 'banken'],
		empfaenger_details: 'Lohnbüro als Auftragsverarbeiter, Finanzamt, Krankenkassen, Hausbank.',
		schnittstellen:
			'Personalsystem an das Lohnbüro (monatlicher Export); Meldungen über ELSTER und das SV-Meldeverfahren.',
		drittland: false,
		loeschfristen:
			'Lohnkonto 6 Jahre (§ 41 EStG), Lohnabrechnungen als Buchungsbelege 8 Jahre (§ 147 AO), jeweils ab Ende des Kalenderjahres.',
		tom: 'Zugriff nur Personalabteilung und Lohnbüro, verschlüsselte Übertragung, Protokollierung.',
		dsfa: 'nicht_erforderlich',
		status: 'aktiv'
	},
	sections: [
		{
			id: 'taetigkeit',
			title: L('Verarbeitungstätigkeit', 'Processing activity'),
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Bezeichnung', 'Name'),
					help: L(
						'Z. B. „Lohn- und Gehaltsabrechnung“, „Newsletter“.',
						'E.g. "Payroll", "Newsletter".'
					),
					required: true,
					listColumn: true
				},
				{
					id: 'beschreibung',
					type: 'textarea',
					label: L('Kurzbeschreibung', 'Short description'),
					help: L(
						'Was bei der Verarbeitung geschieht, in zwei, drei Sätzen: womit, von wem, in welchem Ablauf. Die Zwecke stehen unten.',
						'What happens in the processing, in two or three sentences: with what, by whom, in which process. The purposes follow below.'
					),
					cite: { law: 'BfDI', ref: 'Verzeichnis nach Art. 30 DSGVO, 2023' }
				},
				{
					id: 'rolle',
					type: 'select',
					label: L('Rolle', 'Role'),
					options: [
						{
							value: 'verantwortlicher',
							label: L('Verantwortlicher (Art. 30 Abs. 1)', 'Controller (Art. 30(1))')
						},
						{
							value: 'gemeinsam',
							label: L('Gemeinsam Verantwortlicher (Art. 26)', 'Joint controller (Art. 26)')
						},
						{
							value: 'auftragsverarbeiter',
							label: L('Auftragsverarbeiter (Art. 30 Abs. 2)', 'Processor (Art. 30(2))')
						}
					],
					required: true,
					listColumn: true
				},
				{
					id: 'fachbereich',
					type: 'text',
					label: L('Fachbereich', 'Department'),
					listColumn: true
				},
				{
					id: 'ansprechpartner',
					type: 'text',
					label: L('Ansprechpartner im Fachbereich', 'Contact in the department')
				},
				{
					id: 'auftraggeber',
					type: 'textarea',
					label: L(
						'Verantwortliche, in deren Auftrag verarbeitet wird',
						'Controllers on whose behalf processing takes place'
					),
					help: L(
						'Nur als Auftragsverarbeiter: Name und Kontaktdaten, ggf. deren Vertreter und Datenschutzbeauftragte.',
						'Processors only: name and contact details, their representatives and DPOs where applicable.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 30 Abs. 2 lit. a' }
				},
				{
					id: 'gemeinsam_mit',
					type: 'textarea',
					label: L(
						'Gemeinsam Verantwortliche und Vereinbarung',
						'Joint controllers and arrangement'
					),
					cite: { law: 'DSGVO', ref: 'Art. 26 Abs. 1' }
				},
				{
					id: 'zwecke',
					type: 'textarea',
					label: L('Zwecke der Verarbeitung', 'Purposes of the processing'),
					help: L(
						'Als Auftragsverarbeiter: Kategorien von Verarbeitungen im Auftrag.',
						'As processor: categories of processing carried out on behalf.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 30 Abs. 1 lit. b' },
					required: true
				},
				{
					id: 'rechtsgrundlagen',
					type: 'multiselect',
					label: L('Rechtsgrundlagen', 'Legal bases'),
					help: L(
						'Art. 30 verlangt sie nicht ausdrücklich; die Aufsichtsbehörden empfehlen die Angabe, weil sie die Rechenschaftspflicht belegt.',
						'Art. 30 does not require them expressly; authorities recommend including them as evidence of accountability.'
					),
					options: LEGAL_BASES,
					cite: { law: 'DSGVO', ref: 'Art. 6 Abs. 1' }
				},
				{
					id: 'rechtsgrundlagen_details',
					type: 'textarea',
					label: L('Rechtsgrundlage im Einzelnen', 'Legal basis in detail'),
					help: L(
						'Bei rechtlicher Verpflichtung oder öffentlicher Aufgabe die Norm (z. B. § 41 EStG, § 147 AO), bei besonderen Kategorien der Buchstabe des Art. 9 Abs. 2.',
						'For a legal obligation or public task the provision (e.g. § 41 EStG, § 147 AO), for special categories the letter of Art. 9(2).'
					),
					cite: { law: 'DSGVO', ref: 'Art. 6 Abs. 3' },
					when: controller
				},
				{
					id: 'interessen',
					type: 'textarea',
					label: L('Berechtigte Interessen', 'Legitimate interests'),
					help: L(
						'Welche Interessen verfolgt werden und warum sie die Interessen der Betroffenen überwiegen. Erscheint in den Datenschutzhinweisen.',
						'Which interests are pursued and why they override those of the data subjects. Appears in the privacy notice.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 6 Abs. 1 lit. f, Art. 13 Abs. 1 lit. d' },
					when: (data) => listHas(data, 'rechtsgrundlagen', 'interesse')
				}
			]
		},
		{
			id: 'daten',
			title: L('Betroffene und Daten', 'Data subjects and data'),
			fields: [
				{
					id: 'betroffene',
					type: 'multiselect',
					label: L('Kategorien betroffener Personen', 'Categories of data subjects'),
					options: [
						{ value: 'beschaeftigte', label: L('Beschäftigte', 'Employees') },
						{ value: 'bewerber', label: L('Bewerber', 'Applicants') },
						{ value: 'kunden', label: L('Kunden', 'Customers') },
						{ value: 'interessenten', label: L('Interessenten', 'Prospects') },
						{
							value: 'lieferanten',
							label: L('Lieferanten und Dienstleister', 'Suppliers and service providers')
						},
						{ value: 'patienten', label: L('Patienten', 'Patients') },
						{ value: 'mitglieder', label: L('Mitglieder', 'Members') },
						{
							value: 'besucher',
							label: L('Besucher und Websitenutzer', 'Visitors and website users')
						},
						{ value: 'minderjaehrige', label: L('Minderjährige', 'Minors') },
						{ value: 'sonstige', label: L('Sonstige', 'Others') }
					],
					cite: { law: 'DSGVO', ref: 'Art. 30 Abs. 1 lit. c' },
					required: true
				},
				{
					id: 'datenkategorien',
					type: 'multiselect',
					label: L('Kategorien personenbezogener Daten', 'Categories of personal data'),
					options: [
						{
							value: 'stammdaten',
							label: L('Stamm- und Identifikationsdaten', 'Master and identification data')
						},
						{ value: 'kontakt', label: L('Kontaktdaten', 'Contact data') },
						{
							value: 'vertrag',
							label: L('Vertrags- und Abrechnungsdaten', 'Contract and billing data')
						},
						{ value: 'zahlung', label: L('Bank- und Zahlungsdaten', 'Bank and payment data') },
						{ value: 'nutzung', label: L('Nutzungs- und Protokolldaten', 'Usage and log data') },
						{ value: 'standort', label: L('Standortdaten', 'Location data') },
						{ value: 'kommunikation', label: L('Kommunikationsinhalte', 'Communication content') },
						{
							value: 'leistung',
							label: L('Leistungs- und Verhaltensdaten', 'Performance and behaviour data')
						},
						{ value: 'bild', label: L('Bild- und Tonaufnahmen', 'Images and recordings') },
						{
							value: 'art9',
							label: L('Besondere Kategorien (Art. 9)', 'Special categories (Art. 9)')
						},
						{
							value: 'art10',
							label: L('Daten über Straftaten (Art. 10)', 'Criminal offence data (Art. 10)')
						}
					],
					cite: { law: 'DSGVO', ref: 'Art. 30 Abs. 1 lit. c' },
					required: true
				},
				{
					id: 'datenkategorien_details',
					type: 'textarea',
					label: L('Weitere Angaben zu den Daten', 'Further details on the data')
				},
				{
					id: 'herkunft',
					type: 'select',
					label: L('Herkunft der Daten', 'Where the data comes from'),
					options: [
						{
							value: 'betroffene',
							label: L('Von den Betroffenen selbst', 'From the data subjects themselves')
						},
						{ value: 'dritte', label: L('Von Dritten', 'From others') },
						{ value: 'beides', label: L('Von beiden', 'From both') }
					],
					help: L(
						'Bestimmt, ob die Datenschutzhinweise Art. 13 oder Art. 14 folgen.',
						'Decides whether the privacy notice follows Art. 13 or Art. 14.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 13, 14' },
					when: controller
				},
				{
					id: 'quelle',
					type: 'textarea',
					label: L('Quelle der Daten', 'Source of the data'),
					help: L(
						'Von wem die Daten stammen, und ob aus öffentlich zugänglichen Quellen.',
						'Whom the data comes from, and whether from publicly accessible sources.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 14 Abs. 2 lit. f' },
					when: (data) =>
						controller(data) && (data.herkunft === 'dritte' || data.herkunft === 'beides')
				},
				{
					id: 'bereitstellung',
					type: 'select',
					label: L('Pflicht zur Bereitstellung', 'Obligation to provide the data'),
					options: [
						{ value: 'gesetzlich', label: L('Gesetzlich vorgeschrieben', 'Required by law') },
						{
							value: 'vertraglich',
							label: L(
								'Für den Vertrag oder seinen Abschluss erforderlich',
								'Required for the contract or to enter into it'
							)
						},
						{ value: 'freiwillig', label: L('Freiwillig', 'Voluntary') }
					],
					cite: { law: 'DSGVO', ref: 'Art. 13 Abs. 2 lit. e' },
					when: (data) => controller(data) && data.herkunft !== 'dritte'
				},
				{
					id: 'bereitstellung_folgen',
					type: 'textarea',
					label: L(
						'Folgen, wenn die Daten nicht bereitgestellt werden',
						'Consequences if the data is not provided'
					),
					when: (data) => controller(data) && data.herkunft !== 'dritte' && !!data.bereitstellung
				},
				{
					id: 'automatisiert',
					type: 'boolean',
					label: L(
						'Automatisierte Entscheidung einschließlich Profiling',
						'Automated decision-making including profiling'
					),
					cite: { law: 'DSGVO', ref: 'Art. 22 Abs. 1, 4' },
					when: controller
				},
				{
					id: 'automatisiert_logik',
					type: 'textarea',
					label: L(
						'Beteiligte Logik, Tragweite und Auswirkungen',
						'Logic involved, significance and consequences'
					),
					cite: { law: 'DSGVO', ref: 'Art. 13 Abs. 2 lit. f' },
					when: (data) => controller(data) && data.automatisiert === true
				}
			]
		},
		{
			id: 'empfaenger',
			title: L('Empfänger und Übermittlungen', 'Recipients and transfers'),
			fields: [
				{
					id: 'empfaenger',
					type: 'multiselect',
					label: L('Kategorien von Empfängern', 'Categories of recipients'),
					options: [
						{ value: 'intern', label: L('Interne Stellen', 'Internal departments') },
						{ value: 'auftragsverarbeiter', label: L('Auftragsverarbeiter', 'Processors') },
						{ value: 'konzern', label: L('Konzernunternehmen', 'Group companies') },
						{
							value: 'behoerden',
							label: L('Behörden und Sozialversicherungsträger', 'Authorities and social insurance')
						},
						{
							value: 'banken',
							label: L('Banken und Zahlungsdienstleister', 'Banks and payment providers')
						},
						{
							value: 'berater',
							label: L(
								'Steuerberater, Wirtschaftsprüfer, Anwälte',
								'Tax advisers, auditors, lawyers'
							)
						},
						{ value: 'sonstige', label: L('Sonstige', 'Others') }
					],
					help: L(
						'Auch Empfänger, gegenüber denen künftig offengelegt wird. Gibt es keine, im Feld darunter „keine“ vermerken.',
						'Including recipients to whom data will be disclosed. If there are none, note "none" below.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 30 Abs. 1 lit. d' }
				},
				{
					id: 'empfaenger_details',
					type: 'textarea',
					label: L('Empfänger im Einzelnen', 'Recipients in detail'),
					help: L(
						'Auftragsverarbeiter mit Hinweis auf den Vertrag nach Art. 28 Abs. 3.',
						'Processors with reference to the Art. 28(3) contract.'
					)
				},
				{
					id: 'schnittstellen',
					type: 'textarea',
					label: L(
						'Schnittstellen und automatisierte Abrufe',
						'Interfaces and automated retrieval'
					),
					help: L(
						'Zu welchen anderen Systemen Daten fließen, und welche Stellen Daten selbst abrufen, etwa über ein Portal oder eine Schnittstelle.',
						'Which other systems data flows to, and which bodies retrieve data themselves, e.g. through a portal or an interface.'
					),
					cite: { law: 'BfDI', ref: 'Verzeichnis nach Art. 30 DSGVO, 2023' }
				},
				{
					id: 'drittland',
					type: 'boolean',
					label: L(
						'Übermittlung in Drittländer oder an internationale Organisationen',
						'Transfers to third countries or international organisations'
					),
					cite: { law: 'DSGVO', ref: 'Art. 30 Abs. 1 lit. e' }
				},
				{
					id: 'drittland_details',
					type: 'textarea',
					label: L('Drittländer und Empfänger', 'Third countries and recipients')
				},
				{
					id: 'garantien',
					type: 'multiselect',
					label: L('Grundlage der Übermittlung', 'Basis of the transfer'),
					options: [
						{
							value: 'angemessenheit',
							label: L('Angemessenheitsbeschluss (Art. 45)', 'Adequacy decision (Art. 45)')
						},
						{
							value: 'scc',
							label: L(
								'Standardvertragsklauseln (Art. 46 Abs. 2 lit. c)',
								'Standard contractual clauses (Art. 46(2)(c))'
							)
						},
						{
							value: 'bcr',
							label: L(
								'Verbindliche interne Datenschutzvorschriften (Art. 47)',
								'Binding corporate rules (Art. 47)'
							)
						},
						{
							value: 'ausnahme',
							label: L(
								'Ausnahme für bestimmte Fälle (Art. 49)',
								'Derogation for specific situations (Art. 49)'
							)
						}
					],
					cite: { law: 'DSGVO', ref: 'Art. 44' }
				},
				{
					id: 'transfer_check',
					type: 'assessment',
					tool: 'drittland-transfer',
					label: L('Drittlandprüfung', 'Third-country transfer check')
				}
			]
		},
		{
			id: 'loeschung',
			title: L('Löschung und Sicherheit', 'Erasure and security'),
			fields: [
				{
					id: 'loeschfristen',
					type: 'textarea',
					label: L('Fristen für die Löschung', 'Time limits for erasure'),
					help: L(
						'Je Datenkategorie, mit Anlass (z. B. „10 Jahre nach Ende des Geschäftsjahres, § 147 AO“).',
						'Per data category, with trigger (e.g. "10 years after the end of the financial year, § 147 AO").'
					),
					cite: { law: 'DSGVO', ref: 'Art. 30 Abs. 1 lit. f' }
				},
				{
					id: 'tom',
					type: 'textarea',
					label: L(
						'Technische und organisatorische Maßnahmen',
						'Technical and organisational measures'
					),
					help: L(
						'Allgemeine Beschreibung oder Verweis auf das TOM-Konzept.',
						'General description or reference to the TOM document.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 30 Abs. 1 lit. g, Art. 32 Abs. 1' }
				}
			]
		},
		{
			id: 'pruefung',
			title: L('Prüfung und Status', 'Review and status'),
			fields: [
				{
					id: 'dsfa_check',
					type: 'assessment',
					tool: 'dsfa-schwellwert',
					label: L('DSFA-Schwellwertanalyse', 'DPIA screening')
				},
				{
					id: 'dsfa',
					type: 'select',
					label: L('Datenschutz-Folgenabschätzung', 'Data protection impact assessment'),
					options: [
						{ value: 'ungeprueft', label: L('Noch nicht geprüft', 'Not yet screened') },
						{ value: 'nicht_erforderlich', label: L('Nicht erforderlich', 'Not required') },
						{
							value: 'erforderlich',
							label: L('Erforderlich, noch nicht durchgeführt', 'Required, not yet carried out')
						},
						{ value: 'durchgefuehrt', label: L('Durchgeführt', 'Carried out') }
					],
					cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 1' }
				},
				{
					id: 'status',
					type: 'select',
					label: L('Status', 'Status'),
					options: [
						{ value: 'entwurf', label: L('Entwurf', 'Draft') },
						{ value: 'aktiv', label: L('Aktiv', 'Active') },
						{ value: 'eingestellt', label: L('Eingestellt', 'Discontinued') }
					],
					required: true,
					listColumn: true
				},
				{ id: 'geprueft_am', type: 'date', label: L('Zuletzt geprüft', 'Last reviewed') },
				{ id: 'wiedervorlage', type: 'date', label: L('Wiedervorlage', 'Next review') },
				{ id: 'notizen', type: 'textarea', label: L('Notizen', 'Notes') }
			]
		}
	]
};
