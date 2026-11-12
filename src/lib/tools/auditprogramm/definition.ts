import type { RecordToolDefinition } from '../../records/types.js';

const L = (de: string, en: string) => ({ de, en });

/** audit criteria, shared by the audit tools */
export const CRITERIA = [
	{ value: 'dsgvo', label: L('DSGVO', 'GDPR') },
	{ value: 'bdsg', label: L('BDSG', 'BDSG') },
	{ value: 'kivo', label: L('KI-Verordnung', 'AI Act') },
	{ value: 'iso27001', label: L('ISO/IEC 27001', 'ISO/IEC 27001') },
	{ value: 'iso42001', label: L('ISO/IEC 42001', 'ISO/IEC 42001') },
	{ value: 'tisax', label: L('TISAX', 'TISAX') },
	{ value: 'intern', label: L('Interne Richtlinien', 'Internal policies') }
];

/** one audit of the audit programme, from planning to closure */
export const definition: RecordToolDefinition = {
	slug: 'auditprogramm',
	version: 1,
	intro: L(
		'Ein Eintrag je Audit des Programms: Gegenstand, Kriterien, Auditoren, Termine. Prüfkatalog, Feststellungen und Auditbericht verweisen auf das Audit und erscheinen hier als verknüpfte Einträge. Die Auswahl der Audits folgt dem Risiko; Auditoren dürfen ihre eigene Arbeit nicht prüfen.',
		'One entry per audit of the programme: subject, criteria, auditors, dates. Checklist, findings and audit report refer to the audit and appear here as linked entries. Audits are selected by risk; auditors must not audit their own work.'
	),
	sources: [
		{ law: 'ISO 27001', ref: 'Kap. 9.2' },
		{ law: 'ISO 42001', ref: 'Kap. 9.2' },
		{ law: 'DSGVO', ref: 'Art. 39 Abs. 1 lit. b' }
	],
	titleField: 'titel',
	sections: [
		{
			id: 'audit',
			title: L('Audit', 'Audit'),
			fields: [
				{ id: 'titel', type: 'text', label: L('Titel', 'Title'), required: true, listColumn: true },
				{
					id: 'art',
					type: 'select',
					label: L('Art des Audits', 'Kind of audit'),
					options: [
						{
							value: 'datenschutz',
							label: L('Internes Datenschutzaudit', 'Internal data protection audit')
						},
						{ value: 'isms', label: L('Internes ISMS-Audit', 'Internal ISMS audit') },
						{ value: 'aims', label: L('Internes AIMS-Audit', 'Internal AIMS audit') },
						{
							value: 'dienstleister',
							label: L('Audit bei einem Auftragsverarbeiter', 'Audit at a processor')
						},
						{ value: 'ki_system', label: L('Prüfung eines KI-Systems', 'Review of an AI system') }
					],
					listColumn: true
				},
				{
					id: 'gegenstand',
					type: 'textarea',
					label: L('Gegenstand und Umfang', 'Subject and scope'),
					help: L(
						'Was genau geprüft wird: Bereiche, Standorte, Verfahren, Zeitraum. Ein enger Umfang lässt sich besser prüfen als „der ganze Datenschutz“.',
						'What exactly is audited: departments, sites, procedures, period. A narrow scope is easier to audit than “all of data protection”.'
					)
				},
				{
					id: 'kriterien',
					type: 'multiselect',
					label: L('Auditkriterien', 'Audit criteria'),
					options: CRITERIA,
					help: L(
						'Woran gemessen wird: Gesetze, Normen, eigene Richtlinien. Ohne Kriterium keine Feststellung.',
						'What is measured against: laws, standards, own policies. No criterion, no finding.'
					)
				},
				{
					id: 'kriterien_details',
					type: 'textarea',
					label: L('Kriterien im Einzelnen', 'Criteria in detail')
				},
				{
					id: 'risiko',
					type: 'textarea',
					label: L('Begründung der Auswahl nach Risiko', 'Risk-based reason for the selection'),
					help: L(
						'Warum dieses Audit jetzt: neue Verfahren, frühere Abweichungen, Vorfälle, Beschwerden oder hohe Risiken für Betroffene. ISO 19011 empfiehlt ein risikobasiertes Programm.',
						'Why this audit now: new procedures, earlier nonconformities, incidents, complaints or high risks to data subjects. ISO 19011 recommends a risk-based programme.'
					)
				}
			]
		},
		{
			id: 'beteiligte',
			title: L('Beteiligte', 'People'),
			fields: [
				{ id: 'auditoren', type: 'text', label: L('Auditoren', 'Auditors') },
				{
					id: 'unabhaengig',
					type: 'boolean',
					label: L(
						'Auditoren sind vom geprüften Bereich unabhängig',
						'Auditors are independent of the area audited'
					),
					cite: { law: 'ISO 27001', ref: 'Kap. 9.2.2' },
					help: L(
						'Auditoren prüfen nicht ihre eigene Arbeit; ISO/IEC 27001 und 42001 verlangen in Kap. 9.2 Objektivität und Unparteilichkeit.',
						'Auditors do not audit their own work; ISO/IEC 27001 and 42001 require objectivity and impartiality in clause 9.2.'
					)
				},
				{ id: 'auditierte', type: 'text', label: L('Geprüfte Bereiche', 'Areas audited') },
				{ id: 'ansprechpartner', type: 'text', label: L('Ansprechpartner', 'Contact') }
			]
		},
		{
			id: 'durchfuehrung',
			title: L('Durchführung', 'Conduct'),
			fields: [
				{
					id: 'methoden',
					type: 'multiselect',
					label: L('Methoden', 'Methods'),
					options: [
						{ value: 'dokumente', label: L('Dokumentenprüfung', 'Document review') },
						{ value: 'interviews', label: L('Interviews', 'Interviews') },
						{ value: 'stichproben', label: L('Stichproben', 'Sampling') },
						{ value: 'begehung', label: L('Begehung', 'Site walk') },
						{ value: 'technisch', label: L('Technische Prüfung', 'Technical testing') }
					],
					help: L(
						'Methoden kombinieren: Was die Dokumente sagen, mit Interviews und Stichproben gegenprüfen.',
						'Combine methods: check what the documents say against interviews and samples.'
					)
				},
				{
					id: 'geplant_am',
					type: 'date',
					label: L('Geplant am', 'Planned on'),
					required: true,
					listColumn: true
				},
				{ id: 'durchgefuehrt_am', type: 'date', label: L('Durchgeführt am', 'Conducted on') },
				{
					id: 'ergebnis',
					type: 'textarea',
					label: L('Kurzergebnis', 'Summary result'),
					help: L(
						'Zwei, drei Sätze. Einzelheiten stehen im Prüfkatalog, Abweichungen in den Feststellungen, der Text im Auditbericht.',
						'Two or three sentences. Details belong in the audit checklist, nonconformities in the findings, the text in the audit report.'
					)
				},
				{
					id: 'naechstes_audit',
					type: 'date',
					label: L('Nächstes Audit', 'Next audit'),
					help: L(
						'Ergibt sich aus dem Risiko. ISO/IEC 27001 und 42001 verlangen Audits in geplanten Abständen, keinen festen Rhythmus.',
						'Follows from the risk. ISO/IEC 27001 and 42001 require audits at planned intervals, not a fixed rhythm.'
					)
				}
			]
		}
	],
	workflow: {
		states: [
			{ id: 'geplant', label: L('Geplant', 'Planned') },
			{ id: 'vorbereitung', label: L('In Vorbereitung', 'In preparation') },
			{ id: 'durchgefuehrt', label: L('Durchgeführt', 'Conducted') },
			{ id: 'abgeschlossen', label: L('Abgeschlossen', 'Closed'), terminal: true }
		],
		initialState: 'geplant',
		transitions: [
			{
				from: 'geplant',
				to: 'vorbereitung',
				label: L('Vorbereitung beginnen', 'Start preparation'),
				requires: ['gegenstand', 'kriterien', 'auditoren']
			},
			{
				from: 'vorbereitung',
				to: 'durchgefuehrt',
				label: L('Als durchgeführt erfassen', 'Record as conducted'),
				requires: ['durchgefuehrt_am']
			},
			{
				from: 'durchgefuehrt',
				to: 'abgeschlossen',
				label: L('Abschließen', 'Close'),
				requires: ['ergebnis']
			}
		]
	}
};
