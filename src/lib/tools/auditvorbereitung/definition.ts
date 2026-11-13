import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });
const ISO = (ref: string): LegalBasis => ({ law: 'ISO 27001', ref });

export const SCOPES = [
	{ value: 'iso27001', label: L('Zertifizierung nach ISO 27001', 'Certification to ISO 27001') },
	{ value: 'iso42001', label: L('Zertifizierung nach ISO 42001', 'Certification to ISO 42001') },
	{
		value: 'kunde',
		label: L('Ein Kunde prüft uns als Auftragsverarbeiter', 'A customer audits us as a processor')
	},
	{
		value: 'vorort',
		label: L('Prüfung vor Ort mit Rundgang', 'On-site audit with a walk-through')
	},
	{
		value: 'folgeaudit',
		label: L(
			'Überwachungs- oder Folgeaudit nach früheren Feststellungen',
			'Surveillance or follow-up audit after earlier findings'
		)
	}
];

/** the checklist from agreeing the audit to recording its findings */
export const BLOCKS: Block[] = [
	{
		id: 'rahmen',
		title: L('Rahmen und Nachweise', 'Frame and evidence'),
		intro: L(
			'Was vor dem Termin mit der prüfenden Stelle feststehen muss.',
			'What must be settled with the auditor before the day.'
		),
		items: [
			{
				id: 'a_umfang',
				label: L(
					'Gegenstand, Kriterien, Standorte und Ablaufplan mit der prüfenden Stelle abgestimmt',
					'Subject, criteria, sites and agenda agreed with the auditor'
				),
				cite: DSGVO('Art. 5 Abs. 2'),
				na: false
			},
			{
				id: 'a_personen',
				label: L(
					'Ansprechpersonen je Thema benannt und vorbereitet; Vertretungen geregelt',
					'Contacts named and prepared for each topic; deputies arranged'
				),
				cite: DSGVO('Art. 24 Abs. 1')
			},
			{
				id: 'a_nachweise',
				label: L(
					'Nachweise aktuell und griffbereit: Verzeichnis, TOM, Richtlinien, Schulungen, Verträge',
					'Evidence current and to hand: record of processing, TOMs, policies, training, contracts'
				),
				cite: DSGVO('Art. 5 Abs. 2, Art. 24 Abs. 1'),
				na: false
			},
			{
				id: 'a_vertraulich',
				label: L(
					'Vertraulichkeit mit den Prüfenden vereinbart; personenbezogene Daten nur so weit nötig, Stichproben möglichst pseudonymisiert',
					'Confidentiality agreed with the auditors; personal data only as far as needed, samples pseudonymised where possible'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. c, f'),
				na: false
			},
			{
				id: 'a_vorbefunde',
				label: L(
					'Feststellungen aus dem letzten Audit abgearbeitet und die Wirksamkeit belegt (Werkzeug Feststellungen)',
					'Findings from the last audit dealt with and their effectiveness shown (findings tool)'
				),
				cite: ISO('Kap. 10.2'),
				scope: ['folgeaudit'],
				na: false
			}
		]
	},
	{
		id: 'managementsystem',
		title: L('Managementsystem', 'Management system'),
		intro: L(
			'Die Kapitelnummern sind in ISO 27001 und ISO 42001 gleich.',
			'The clause numbers are the same in ISO 27001 and ISO 42001.'
		),
		scope: ['iso27001', 'iso42001'],
		items: [
			{
				id: 'i_anwendungsbereich',
				label: L(
					'Anwendungsbereich dokumentiert und mit dem Auditplan deckungsgleich',
					'Scope documented and matching the audit plan'
				),
				cite: ISO('Kap. 4.3'),
				na: false
			},
			{
				id: 'i_risiken',
				label: L(
					'Risikobeurteilung und Behandlungsplan aktuell',
					'Risk assessment and treatment plan current'
				),
				cite: ISO('Kap. 6.1.2, 6.1.3'),
				na: false
			},
			{
				id: 'i_soa',
				label: L(
					'Erklärung zur Anwendbarkeit aktuell, mit Begründung für ausgeschlossene Maßnahmen',
					'Statement of applicability current, with reasons for excluded controls'
				),
				cite: ISO('Kap. 6.1.3 lit. d'),
				na: false
			},
			{
				id: 'i_internes_audit',
				label: L(
					'Internes Audit über den ganzen Anwendungsbereich durchgeführt (Werkzeug Auditprogramm)',
					'Internal audit across the whole scope carried out (audit programme tool)'
				),
				cite: ISO('Kap. 9.2'),
				na: false
			},
			{
				id: 'i_bewertung',
				label: L(
					'Managementbewertung durchgeführt und protokolliert',
					'Management review carried out and recorded'
				),
				cite: ISO('Kap. 9.3'),
				na: false
			},
			{
				id: 'i_ki_folgen',
				label: L(
					'Folgenabschätzung für die KI-Systeme im Anwendungsbereich (Werkzeug AIMS-Gap-Analyse)',
					'Impact assessment for the AI systems in scope (AIMS gap analysis tool)'
				),
				cite: { law: 'ISO 42001', ref: 'Kap. 6.1.4' },
				scope: ['iso42001'],
				na: false
			}
		]
	},
	{
		id: 'kunde',
		title: L('Kundenaudit', 'Customer audit'),
		intro: L(
			'Der Auftragsverarbeiter muss Überprüfungen ermöglichen und dazu beitragen.',
			'The processor must allow and contribute to audits.'
		),
		scope: ['kunde'],
		items: [
			{
				id: 'k_vertrag',
				label: L(
					'Prüfrecht im Auftragsverarbeitungsvertrag nachgelesen: Ankündigung, Häufigkeit, Kosten, wer prüfen darf',
					'Audit right in the processing agreement checked: notice, frequency, costs, who may audit'
				),
				cite: DSGVO('Art. 28 Abs. 3 lit. h'),
				na: false
			},
			{
				id: 'k_zertifikate',
				label: L(
					'Vorhandene Zertifikate und Prüfberichte angeboten, um die Prüfung zu verkürzen',
					'Existing certificates and audit reports offered to shorten the audit'
				),
				cite: DSGVO('Art. 28 Abs. 5')
			},
			{
				id: 'k_andere',
				label: L(
					'Daten anderer Kunden geschützt; nur der eigene Auftrag ist einsehbar',
					"Other customers' data protected; only the customer's own commission is visible"
				),
				cite: DSGVO('Art. 32 Abs. 1 lit. b'),
				na: false
			},
			{
				id: 'k_unterauftrag',
				label: L('Liste der Unterauftragsverarbeiter aktuell', 'List of sub-processors current'),
				cite: DSGVO('Art. 28 Abs. 2, 4')
			}
		]
	},
	{
		id: 'vorort',
		title: L('Rundgang', 'Walk-through'),
		intro: L('Prüfende sehen, was offen liegt.', 'Auditors see whatever is lying around.'),
		scope: ['vorort'],
		items: [
			{
				id: 'o_arbeitsplaetze',
				label: L(
					'Bildschirme, Ausdrucke und Whiteboards auf dem Weg ohne fremde personenbezogene Daten',
					"Screens, printouts and whiteboards along the way free of other people's personal data"
				),
				cite: DSGVO('Art. 32 Abs. 1 lit. b')
			},
			{
				id: 'o_zutritt',
				label: L(
					'Zutritt und Begleitung der Prüfenden geregelt, mit Besucherausweis',
					'Access and escort for the auditors arranged, with visitor badges'
				),
				cite: ISO('Anhang A 7.2')
			}
		]
	},
	{
		id: 'nachher',
		title: L('Nach dem Audit', 'After the audit'),
		intro: L('Aus Feststellungen werden Maßnahmen.', 'Findings turn into actions.'),
		items: [
			{
				id: 'n_feststellungen',
				label: L(
					'Jede Feststellung mit Ursache, Maßnahme, verantwortlicher Person und Frist erfasst (Werkzeug Feststellungen)',
					'Every finding recorded with root cause, action, owner and deadline (findings tool)'
				),
				cite: DSGVO('Art. 24 Abs. 1'),
				na: false
			},
			{
				id: 'n_bericht',
				label: L(
					'Bericht der prüfenden Stelle abgelegt und der Leitung vorgelegt',
					"Auditor's report filed and presented to management"
				),
				cite: DSGVO('Art. 5 Abs. 2')
			}
		]
	}
];

/** the blocks to finish before the audit takes place */
export const PREPARATION = BLOCKS.filter((block) => block.id !== 'nachher');

/** what still stands in the way of holding the audit, or null */
export function auditBlocked(data: RecordData): Localized | null {
	const state = checklist(data, PREPARATION);
	if (state.gaps.length > 0 || state.open.length > 0) {
		return L(
			'Erst die Vorbereitung abschließen: alle Punkte vor „Nach dem Audit“.',
			'Finish the preparation first: every point before "After the audit".'
		);
	}
	return null;
}

/** what still stands in the way of closing the audit, or null */
export function closingBlocked(data: RecordData): Localized | null {
	const state = checklist(data, BLOCKS);
	if (state.gaps.length > 0 || state.open.length > 0) {
		return L(
			'Erst alle Punkte der Checkliste erledigen.',
			'Complete every point of the checklist first.'
		);
	}
	return null;
}

/** being audited: certification, a customer audit or an on-site visit, from agreeing the frame to the findings */
export const definition: RecordToolDefinition = {
	slug: 'auditvorbereitung',
	version: 1,
	intro: L(
		'Ein Eintrag je Audit, bei dem wir geprüft werden: Zertifizierung, Überwachungsaudit oder Kundenaudit. Der Umfang bestimmt, welche Teile gelten. Für ein eigenes, internes Audit gibt es das Auditprogramm; für Anfragen einer Aufsichtsbehörde das Werkzeug „Anfrage der Aufsichtsbehörde“.',
		'One entry per audit in which we are audited: certification, surveillance audit or customer audit. The scope decides which parts apply. For our own internal audits there is the audit programme; for requests from a supervisory authority, the "supervisory authority request" tool.'
	),
	sources: [
		DSGVO('Art. 5 Abs. 2, 24, 28 Abs. 3 lit. h, 32'),
		ISO('Kap. 4.3, 6.1, 9.2, 9.3, 10.2'),
		{ law: 'ISO 42001', ref: 'Kap. 6.1.4' }
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'audit',
			title: L('Audit', 'The audit'),
			columns: 2,
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Bezeichnung', 'Name'),
					help: L(
						'Z. B. „ISO 27001 Stufe 2“ oder „Kundenaudit Muster AG“.',
						'E.g. "ISO 27001 stage 2" or "Customer audit Example Ltd".'
					),
					required: true,
					listColumn: true
				},
				{
					id: 'pruefende_stelle',
					type: 'text',
					label: L('Prüfende Stelle', 'Auditor'),
					listColumn: true
				},
				{ id: 'termin', type: 'date', label: L('Termin', 'Date'), listColumn: true },
				{ id: 'verantwortlich', type: 'text', label: L('Verantwortlich', 'In charge') },
				{
					id: 'umfang',
					type: 'multiselect',
					label: L('Was trifft zu?', 'What applies?'),
					options: SCOPES
				}
			]
		},
		{
			id: 'verknuepfungen',
			title: L('Verknüpfungen', 'Links'),
			fields: [
				{
					id: 'internes_audit',
					type: 'reference',
					tool: 'auditprogramm',
					label: L('Internes Audit (Auditprogramm)', 'Internal audit (audit programme)')
				}
			]
		},
		...blockSections(BLOCKS),
		{
			id: 'ergebnis_teil',
			title: L('Ergebnis', 'Result'),
			columns: 2,
			fields: [
				{
					id: 'ergebnis',
					type: 'select',
					label: L('Ergebnis', 'Result'),
					options: [
						{ value: 'ohne', label: L('Ohne Abweichungen', 'No nonconformities') },
						{
							value: 'geringfuegig',
							label: L('Geringfügige Abweichungen', 'Minor nonconformities')
						},
						{ value: 'wesentlich', label: L('Wesentliche Abweichungen', 'Major nonconformities') }
					]
				},
				{
					id: 'korrektur_bis',
					type: 'date',
					label: L('Korrekturen nachweisen bis', 'Show corrections by'),
					help: L('Die Frist setzt die prüfende Stelle.', 'The auditor sets this deadline.')
				}
			]
		}
	],
	workflow: {
		states: [
			{ id: 'vorbereitung', label: L('Vorbereitung', 'Preparation') },
			{ id: 'durchgefuehrt', label: L('Durchgeführt', 'Held') },
			{ id: 'abgeschlossen', label: L('Abgeschlossen', 'Closed'), terminal: true }
		],
		initialState: 'vorbereitung',
		transitions: [
			{
				from: 'vorbereitung',
				to: 'durchgefuehrt',
				label: L('Audit fand statt', 'Audit held'),
				check: (record) => auditBlocked(record.data)
			},
			{
				from: 'durchgefuehrt',
				to: 'vorbereitung',
				label: L('Zurück zur Vorbereitung', 'Back to preparation')
			},
			{
				from: 'durchgefuehrt',
				to: 'abgeschlossen',
				label: L('Feststellungen erfasst', 'Findings recorded'),
				requires: ['ergebnis'],
				check: (record) => closingBlocked(record.data)
			}
		]
	},
	example: {
		bezeichnung: 'ISO 27001 Überwachungsaudit (Beispiel)',
		pruefende_stelle: 'Zertifizierungsstelle',
		verantwortlich: 'Informationssicherheit',
		umfang: ['iso27001', 'vorort', 'folgeaudit'],
		a_umfang: 'ja',
		a_nachweise: 'ja',
		a_vorbefunde: 'nein',
		a_vorbefunde_notiz:
			'Die Maßnahme zur Rechtevergabe ist umgesetzt, ihre Wirksamkeit aber noch nicht geprüft.',
		i_anwendungsbereich: 'ja',
		i_soa: 'ja',
		i_bewertung: 'nein',
		i_bewertung_notiz: 'Die Managementbewertung für dieses Jahr ist noch nicht terminiert.'
	}
};
