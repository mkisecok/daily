import type { RecordToolDefinition } from '../../records/types.js';

const L = (de: string, en: string) => ({ de, en });

/**
 * record of processing activities: one record per processing activity,
 * covering Art. 30(1) for controllers and Art. 30(2) for processors.
 */
export const definition: RecordToolDefinition = {
	slug: 'vvt',
	version: 1,
	intro: L(
		'Ein Eintrag je Verarbeitungstätigkeit. Das Verzeichnis enthält die Angaben nach Art. 30 Abs. 1 DSGVO (als Verantwortlicher) oder Abs. 2 (als Auftragsverarbeiter) und ist der Aufsichtsbehörde auf Anfrage vorzulegen. Name und Kontaktdaten des Verantwortlichen und des Datenschutzbeauftragten stehen im Kopf der Druckfassung.',
		'One entry per processing activity. The record holds the information under Art. 30(1) GDPR (as controller) or Art. 30(2) (as processor) and must be made available to the supervisory authority on request. Name and contact details of the controller and the DPO head the print version.'
	),
	sources: [
		{ law: 'DSGVO', ref: 'Art. 30' },
		{ law: 'DSK', ref: 'Hinweise zum Verzeichnis von Verarbeitungstätigkeiten' }
	],
	titleField: 'bezeichnung',
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
					options: [
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
							value: 'beschaeftigung',
							label: L(
								'Beschäftigungsverhältnis (Art. 88 DSGVO, § 26 BDSG)',
								'Employment (Art. 88 GDPR, § 26 BDSG)'
							)
						}
					],
					cite: { law: 'DSGVO', ref: 'Art. 6 Abs. 1' }
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
