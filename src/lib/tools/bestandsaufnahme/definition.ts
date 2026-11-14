import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });

export const SCOPES = [
	{
		value: 'extern',
		label: L('Ich bin externer Datenschutzbeauftragter', 'I am an external data protection officer')
	},
	{
		value: 'standorte',
		label: L('Mehrere Standorte oder Homeoffice', 'Several sites or home office')
	},
	{ value: 'betriebsrat', label: L('Es gibt einen Betriebsrat', 'There is a works council') },
	{ value: 'ki', label: L('KI-Anwendungen sind im Einsatz', 'AI applications are in use') },
	{ value: 'website', label: L('Website oder Onlineshop', 'Website or online shop') }
];

/** the stocktake in the order of a first visit: the organisation, security from the outside in, the departments, the paperwork, the plan */
export const BLOCKS: Block[] = [
	{
		id: 'organisation',
		title: L('Die Organisation kennenlernen', 'Getting to know the organisation'),
		intro: L('Wer macht was, und wer ist ansprechbar?', 'Who does what, and whom can I talk to?'),
		items: [
			{
				id: 'o_organigramm',
				label: L(
					'Organigramm liegt vor; Ansprechpersonen für Leitung, IT und Personal sind bekannt',
					'Org chart at hand; contacts for management, IT and HR known'
				),
				cite: DSGVO('Art. 38 Abs. 1'),
				na: false
			},
			{
				id: 'o_taetigkeit',
				label: L(
					'Tätigkeit, Produkte oder Leistungen, Kundengruppen und Zahl der Beschäftigten erfasst',
					'Business, products or services, customer groups and number of staff recorded'
				),
				cite: DSGVO('Art. 24 Abs. 1'),
				na: false
			},
			{
				id: 'o_bestellpflicht',
				label: L(
					'Benennungspflicht geprüft: in der Regel mindestens 20 Personen ständig mit automatisierter Verarbeitung, oder Verarbeitungen mit DSFA-Pflicht',
					'Duty to appoint checked: usually at least 20 people constantly processing data automatically, or processing that needs a DPIA'
				),
				cite: { law: 'BDSG', ref: '§ 38 Abs. 1' },
				na: false
			},
			{
				id: 'o_benennung',
				label: L(
					'Benennung schriftlich; Kontaktdaten veröffentlicht und der Aufsichtsbehörde mitgeteilt',
					'Appointment in writing; contact details published and reported to the supervisory authority'
				),
				cite: DSGVO('Art. 37 Abs. 7'),
				na: false
			},
			{
				id: 'o_vertrag',
				label: L(
					'Vertrag als externer DSB: Leistungen, Erreichbarkeit, Vertraulichkeit, Berichtsweg zur Leitung',
					'Contract as external DPO: services, availability, confidentiality, reporting line to management'
				),
				cite: DSGVO('Art. 37 Abs. 6, Art. 38 Abs. 3, 5'),
				scope: ['extern']
			},
			{
				id: 'o_betriebsrat',
				label: L(
					'Betriebsrat kennengelernt; Betriebsvereinbarungen zu IT-Systemen gesammelt',
					'Met the works council; works agreements on IT systems collected'
				),
				cite: { law: 'BetrVG', ref: '§ 87 Abs. 1 Nr. 6' },
				scope: ['betriebsrat']
			}
		]
	},
	{
		id: 'sicherheit',
		title: L('Sicherheit von außen nach innen', 'Security from the outside in'),
		intro: L(
			'Erst das Gelände, dann die Geräte, dann die Rechte, dann die Sicherung.',
			'First the premises, then the devices, then the access rights, then the backup.'
		),
		items: [
			{
				id: 't_zutritt',
				label: L(
					'Zutritt: Gelände und Gebäude gesichert, Empfang, Besucher werden erfasst und begleitet',
					'Physical access: premises and building secured, reception, visitors are logged and escorted'
				),
				cite: DSGVO('Art. 32 Abs. 1 lit. b')
			},
			{
				id: 't_zugang',
				label: L(
					'Anmeldung an Geräten mit Passwortregeln und Sperre nach Fehlversuchen; zweiter Faktor für Fernzugriff',
					'Device login with password rules and lockout after failed attempts; second factor for remote access'
				),
				cite: DSGVO('Art. 32 Abs. 1 lit. b'),
				na: false
			},
			{
				id: 't_berechtigung',
				label: L(
					'Berechtigungen nach Aufgabe; beim Austritt werden sie entzogen',
					'Access rights by task; they are removed when someone leaves'
				),
				cite: DSGVO('Art. 25 Abs. 2, Art. 32 Abs. 1 lit. b'),
				na: false
			},
			{
				id: 't_sicherung',
				label: L(
					'Datensicherung vorhanden und die Wiederherstellung schon einmal geprobt',
					'Backups exist and a restore has been tested'
				),
				cite: DSGVO('Art. 32 Abs. 1 lit. c'),
				na: false
			},
			{
				id: 't_standorte',
				label: L(
					'Weitere Standorte und das Arbeiten von zu Hause einbezogen (Werkzeug Homeoffice)',
					'Other sites and working from home covered (home office tool)'
				),
				cite: DSGVO('Art. 32 Abs. 1'),
				scope: ['standorte']
			}
		]
	},
	{
		id: 'verarbeitungen',
		title: L('Abteilungen und Software', 'Departments and software'),
		intro: L(
			'Sich in jeder Abteilung zeigen lassen, welche Daten womit verarbeitet werden.',
			'In each department, have them show which data is processed with what.'
		),
		items: [
			{
				id: 'v_abteilungen',
				label: L(
					'Je Abteilung erfasst, welche Daten womit verarbeitet werden (Werkzeug VVT)',
					'Recorded per department which data is processed with what (record of processing tool)'
				),
				cite: DSGVO('Art. 30 Abs. 1'),
				na: false
			},
			{
				id: 'v_software',
				label: L(
					'Liste der eingesetzten Software und Dienstleister',
					'List of the software and service providers in use'
				),
				cite: DSGVO('Art. 28 Abs. 1'),
				na: false
			},
			{
				id: 'v_ki',
				label: L(
					'KI-Anwendungen erfasst, auch privat genutzte Chatbots (Werkzeug KI-Register)',
					'AI applications recorded, also chatbots used privately at work (AI register tool)'
				),
				cite: { law: 'KI-VO', ref: 'Art. 4, Art. 26 Abs. 1' },
				scope: ['ki']
			},
			{
				id: 'v_website',
				label: L(
					'Website angesehen: Cookies, Einwilligungsbanner, Datenschutzhinweise (Werkzeug Cookie- und Einwilligungs-Check)',
					'Website reviewed: cookies, consent banner, privacy notice (cookie and consent check tool)'
				),
				cite: { law: 'TDDDG', ref: '§ 25' },
				scope: ['website']
			}
		]
	},
	{
		id: 'dokumentation',
		title: L('Vorhandene Dokumentation', 'Existing documentation'),
		intro: L(
			'Was es schon gibt, und ob es noch stimmt.',
			'What already exists, and whether it is still correct.'
		),
		items: [
			{
				id: 'd_vvt',
				label: L(
					'Verzeichnis von Verarbeitungstätigkeiten vorhanden und aktuell',
					'Record of processing activities exists and is up to date'
				),
				cite: DSGVO('Art. 30 Abs. 1'),
				na: false
			},
			{
				id: 'd_tom',
				label: L(
					'Technische und organisatorische Maßnahmen dokumentiert (Werkzeug TOM-Katalog)',
					'Technical and organisational measures documented (TOM catalogue tool)'
				),
				cite: DSGVO('Art. 24 Abs. 1, Art. 32 Abs. 1'),
				na: false
			},
			{
				id: 'd_avv',
				label: L(
					'Verträge zur Auftragsverarbeitung mit den Dienstleistern (Werkzeug AVV-Prüfung)',
					'Processing agreements with the service providers (AVV check tool)'
				),
				cite: DSGVO('Art. 28 Abs. 3')
			},
			{
				id: 'd_loeschung',
				label: L(
					'Löschfristen festgelegt und umgesetzt (Werkzeug Löschkonzept)',
					'Erasure periods set and applied (deletion concept tool)'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. e, Art. 17'),
				na: false
			},
			{
				id: 'd_hinweise',
				label: L(
					'Datenschutzhinweise für Kunden, Bewerber und Beschäftigte',
					'Privacy notices for customers, applicants and staff'
				),
				cite: DSGVO('Art. 13, 14'),
				na: false
			},
			{
				id: 'd_ablaeufe',
				label: L(
					'Abläufe für Anfragen Betroffener und für Datenpannen festgelegt und bekannt',
					'Procedures for data subject requests and breaches set and known'
				),
				cite: DSGVO('Art. 12 Abs. 3, Art. 33 Abs. 1'),
				na: false
			},
			{
				id: 'd_schulung',
				label: L(
					'Beschäftigte geschult und auf Vertraulichkeit verpflichtet (Werkzeug Schulungsnachweis)',
					'Staff trained and bound to confidentiality (training log tool)'
				),
				cite: DSGVO('Art. 32 Abs. 4, Art. 39 Abs. 1 lit. b'),
				na: false
			}
		]
	},
	{
		id: 'plan',
		title: L('Kontrollplan und Bericht', 'Control plan and report'),
		intro: L(
			'Festhalten, wie überwacht wird, und der Leitung berichten.',
			'Write down how monitoring works, and report to management.'
		),
		items: [
			{
				id: 'k_plan',
				label: L(
					'Kontrollplan festgelegt: was wie oft geprüft wird, vor Ort oder schriftlich (Werkzeug Auditprogramm)',
					'Control plan set: what is checked how often, on site or in writing (audit programme tool)'
				),
				cite: DSGVO('Art. 39 Abs. 1 lit. b'),
				na: false
			},
			{
				id: 'k_bericht',
				label: L(
					'Bericht an die höchste Managementebene mit den wichtigsten Lücken und Empfehlungen',
					'Report to the highest management level with the main gaps and recommendations'
				),
				cite: DSGVO('Art. 38 Abs. 3'),
				na: false
			},
			{
				id: 'k_dsms',
				label: L(
					'Erste Schritte zu einem Datenschutzmanagement empfohlen: Leitlinie, Zuständigkeiten, regelmäßige Überprüfung',
					'First steps towards data protection management recommended: policy, responsibilities, regular review'
				),
				cite: DSGVO('Art. 24 Abs. 1, 2')
			}
		]
	}
];

/** a stocktake closes once every point is answered; gaps are its result, not a reason to wait */
export function closingBlocked(data: RecordData): Localized | null {
	return checklist(data, BLOCKS).open.length > 0
		? L(
				'Erst jeden Punkt beantworten; Lücken dürfen bleiben, sie sind das Ergebnis.',
				'Answer every point first; gaps may remain, they are the result.'
			)
		: null;
}

/** the first look at a new organisation or client, from the org chart to the report to management */
export const definition: RecordToolDefinition = {
	slug: 'bestandsaufnahme',
	version: 1,
	intro: L(
		'Ein Eintrag je Organisation, wenn die Arbeit als Datenschutzbeauftragter beginnt, intern oder für einen neuen Mandanten. In der Reihenfolge eines ersten Besuchs: die Organisation, die Sicherheit von außen nach innen, die Abteilungen und ihre Software, die vorhandene Dokumentation, dann Kontrollplan und Bericht an die Leitung. Jede Lücke wird zur Empfehlung; die verlinkten Werkzeuge nehmen sie auf.',
		'One entry per organisation when work as data protection officer begins, internally or for a new client. In the order of a first visit: the organisation, security from the outside in, the departments and their software, the existing documentation, then the control plan and the report to management. Every gap becomes a recommendation; the linked tools take it up.'
	),
	sources: [DSGVO('Art. 24, 30, 32, 37, 38, 39'), { law: 'BDSG', ref: '§ 38 Abs. 1' }],
	titleField: 'organisation',
	sections: [
		{
			id: 'rahmen',
			title: L('Organisation', 'Organisation'),
			columns: 2,
			fields: [
				{
					id: 'organisation',
					type: 'text',
					label: L('Organisation', 'Organisation'),
					required: true,
					listColumn: true
				},
				{
					id: 'vorgang',
					type: 'reference',
					tool: 'vorgang',
					label: L('Vorgang', 'Matter')
				},
				{
					id: 'beschaeftigte',
					type: 'number',
					label: L('Beschäftigte', 'Staff'),
					min: 0,
					integer: true
				},
				{
					id: 'ansprechpartner',
					type: 'text',
					label: L('Ansprechperson in der Leitung', 'Contact in management'),
					listColumn: true
				},
				{ id: 'begonnen_am', type: 'date', label: L('Begonnen am', 'Started on') },
				{
					id: 'termin',
					type: 'date',
					label: L('Termin vor Ort', 'On-site visit'),
					listColumn: true
				},
				{
					id: 'umfang',
					type: 'multiselect',
					label: L('Was trifft zu?', 'What applies?'),
					options: SCOPES
				}
			]
		},
		...blockSections(BLOCKS),
		{
			id: 'abschluss',
			title: L('Abschluss', 'Closing'),
			columns: 2,
			fields: [
				{
					id: 'bericht_am',
					type: 'date',
					label: L('Bericht an die Leitung am', 'Reported to management on'),
					cite: DSGVO('Art. 38 Abs. 3')
				},
				{
					id: 'empfehlungen',
					type: 'textarea',
					label: L('Wichtigste Empfehlungen', 'Main recommendations')
				}
			]
		}
	],
	workflow: {
		states: [
			{ id: 'geplant', label: L('Geplant', 'Planned') },
			{ id: 'laufend', label: L('Laufend', 'In progress') },
			{ id: 'abgeschlossen', label: L('Abgeschlossen', 'Closed'), terminal: true }
		],
		initialState: 'geplant',
		transitions: [
			{
				from: 'geplant',
				to: 'laufend',
				label: L('Bestandsaufnahme beginnen', 'Start the stocktake')
			},
			{
				from: 'laufend',
				to: 'abgeschlossen',
				label: L('Der Leitung berichtet', 'Reported to management'),
				requires: ['bericht_am'],
				check: (record) => closingBlocked(record.data)
			},
			{ from: 'abgeschlossen', to: 'laufend', label: L('Wieder aufnehmen', 'Reopen') }
		]
	},
	example: {
		organisation: 'Muster Logistik GmbH (Beispiel)',
		beschaeftigte: 85,
		ansprechpartner: 'Geschäftsführung, Frau Beispiel',
		begonnen_am: '2026-11-02',
		termin: '2026-11-18',
		umfang: ['extern', 'betriebsrat', 'website'],
		o_organigramm: 'ja',
		o_taetigkeit: 'ja',
		o_bestellpflicht: 'ja',
		o_benennung: 'nein',
		o_benennung_notiz: 'Benennung liegt vor, aber der Aufsichtsbehörde nicht mitgeteilt.',
		o_vertrag: 'ja',
		t_zugang: 'ja',
		t_sicherung: 'nein',
		t_sicherung_notiz: 'Tägliche Sicherung; eine Wiederherstellung wurde nie geprobt.',
		d_vvt: 'nein',
		d_vvt_notiz: 'Ein Verzeichnis von 2019, seitdem nicht gepflegt.'
	}
};
