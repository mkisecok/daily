import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, inScope, snapshot, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });
const DATA_ACT = (ref: string): LegalBasis => ({ law: 'Data Act', ref });

export const SCOPES = [
	{ value: 'neu', label: L('Ein neuer Dienstleister übernimmt', 'A new provider takes over') },
	{
		value: 'cloud',
		label: L(
			'Cloud- oder anderer Datenverarbeitungsdienst (Data Act)',
			'Cloud or other data processing service (Data Act)'
		)
	},
	{
		value: 'drittland',
		label: L(
			'Der neue Dienstleister sitzt außerhalb des EWR',
			'The new provider is outside the EEA'
		)
	},
	{
		value: 'zugang',
		label: L(
			'Der bisherige Dienstleister hatte Zugänge zu eigenen Systemen',
			'The previous provider had access to own systems'
		)
	},
	{
		value: 'papier',
		label: L(
			'Akten oder Datenträger liegen beim Dienstleister',
			'Files or storage media are held by the provider'
		)
	}
];

/** the checklist in the order of a change of provider */
export const BLOCKS: Block[] = [
	{
		id: 'planung',
		title: L('Vor der Kündigung', 'Before giving notice'),
		intro: L(
			'Was feststehen muss, bevor der Vertrag endet.',
			'What must be settled before the contract ends.'
		),
		items: [
			{
				id: 'k_bestand',
				label: L(
					'Erfasst, welche Daten, Systeme und Unterauftragnehmer beim bisherigen Dienstleister liegen',
					'Listed which data, systems and sub-processors sit with the previous provider'
				),
				cite: DSGVO('Art. 30 Abs. 1')
			},
			{
				id: 'k_vertrag',
				label: L(
					'Kündigungsfrist und Regeln zum Vertragsende in Vertrag und Auftragsverarbeitungsvertrag geprüft',
					'Notice period and end-of-contract terms checked in the contract and processing agreement'
				),
				cite: DSGVO('Art. 28 Abs. 3 lit. g')
			},
			{
				id: 'k_wahl',
				label: L(
					'Entschieden, ob die Daten zurückgegeben oder gelöscht werden',
					'Decided whether the data is returned or deleted'
				),
				cite: DSGVO('Art. 28 Abs. 3 lit. g'),
				help: L(
					'Die Wahl trifft der Verantwortliche. Kopien muss der Dienstleister löschen, es sei denn, eine gesetzliche Pflicht verlangt ihre Speicherung.',
					'The controller chooses. The provider must delete copies unless a legal duty requires them to be kept.'
				),
				na: false
			}
		]
	},
	{
		id: 'cloud',
		title: L('Wechsel nach dem Data Act', 'Switching under the Data Act'),
		intro: L(
			'Rechte beim Wechsel von Cloud- und anderen Datenverarbeitungsdiensten.',
			'Rights when switching cloud and other data processing services.'
		),
		scope: ['cloud'],
		items: [
			{
				id: 'c_frist',
				label: L(
					'Wechsel angezeigt; die Kündigungsfrist beträgt höchstens zwei Monate',
					'Switch announced; the notice period is two months at most'
				),
				cite: DATA_ACT('Art. 25 Abs. 2 lit. d'),
				help: L(
					'Danach läuft die Übergangszeit von höchstens 30 Tagen. Ist das technisch nicht machbar, muss der Anbieter das binnen 14 Arbeitstagen begründen und kann auf höchstens sieben Monate verlängern.',
					'The transitional period of at most 30 days follows. If that is technically unfeasible, the provider must explain within 14 working days and may extend to seven months at most.'
				)
			},
			{
				id: 'c_export',
				label: L(
					'Export aller Daten in einem gängigen, maschinenlesbaren Format vereinbart',
					'Export of all data in a common, machine-readable format agreed'
				),
				cite: DATA_ACT('Art. 25 Abs. 2')
			},
			{
				id: 'c_entgelt',
				label: L(
					'Wechselentgelte geprüft: höchstens die direkten Kosten, ab dem 12. Januar 2027 keine mehr',
					'Switching charges checked: direct costs at most, none from 12 January 2027'
				),
				cite: DATA_ACT('Art. 29')
			}
		]
	},
	{
		id: 'uebergang',
		title: L('Übergang', 'Handover'),
		intro: L('Daten und Zugänge beim Umstellen.', 'Data and access during the switch.'),
		items: [
			{
				id: 'u_sicherung',
				label: L(
					'Vor der Umstellung gesichert, damit beim Übergang nichts verloren geht',
					'Backed up before the switch so nothing is lost in the handover'
				),
				cite: { law: 'BSI', ref: 'CON.3 Datensicherungskonzept' }
			},
			{
				id: 'u_rueckgabe',
				label: L(
					'Zurückgegebene Daten auf Vollständigkeit und Lesbarkeit geprüft',
					'Returned data checked for completeness and readability'
				),
				cite: DSGVO('Art. 28 Abs. 3 lit. g')
			},
			{
				id: 'u_zugaenge',
				label: L(
					'Zugänge des bisherigen Dienstleisters gesperrt: Konten, VPN, Schnittstellen-Schlüssel',
					'The previous provider’s access removed: accounts, VPN, API keys'
				),
				cite: { law: 'BSI', ref: 'ORP.4 Identitäts- und Berechtigungsmanagement' },
				scope: ['zugang'],
				na: false
			},
			{
				id: 'u_datentraeger',
				label: L(
					'Akten und Datenträger zurückgegeben oder nachweislich vernichtet',
					'Files and storage media returned or destroyed with proof'
				),
				cite: DSGVO('Art. 32 Abs. 1'),
				scope: ['papier']
			}
		]
	},
	{
		id: 'loeschung',
		title: L('Löschung beim bisherigen Dienstleister', 'Deletion at the previous provider'),
		intro: L('Der Nachweis, dass nichts zurückbleibt.', 'The proof that nothing is left behind.'),
		items: [
			{
				id: 'l_bestaetigung',
				label: L(
					'Schriftliche Bestätigung der Löschung, auch für Kopien und Sicherungen',
					'Written confirmation of deletion, including copies and backups'
				),
				cite: DSGVO('Art. 28 Abs. 3 lit. g, h'),
				na: false
			},
			{
				id: 'l_unterauftrag',
				label: L(
					'Löschung auch bei den Unterauftragnehmern bestätigt',
					'Deletion also confirmed for the sub-processors'
				),
				cite: DSGVO('Art. 28 Abs. 4')
			}
		]
	},
	{
		id: 'neu',
		title: L('Neuer Dienstleister', 'New provider'),
		intro: L(
			'Bevor der erste Datensatz beim neuen Dienstleister ankommt.',
			'Before the first record reaches the new provider.'
		),
		scope: ['neu'],
		items: [
			{
				id: 'n_avv',
				label: L(
					'Auftragsverarbeitungsvertrag vor dem ersten Datenfluss geschlossen (Werkzeug AVV-Prüfung)',
					'Processing agreement concluded before the first data flows (AVV check tool)'
				),
				cite: DSGVO('Art. 28 Abs. 3'),
				na: false
			},
			{
				id: 'n_garantien',
				label: L(
					'Technische und organisatorische Maßnahmen des neuen Dienstleisters geprüft',
					'The new provider’s technical and organisational measures checked'
				),
				cite: DSGVO('Art. 28 Abs. 1')
			},
			{
				id: 'n_drittland',
				label: L(
					'Grundlage für die Übermittlung festgestellt (Werkzeug Drittland-Transfer)',
					'Basis for the transfer established (third-country transfer tool)'
				),
				cite: DSGVO('Art. 44 bis 46'),
				scope: ['drittland']
			},
			{
				id: 'n_risiko',
				label: L(
					'Geprüft, ob sich das Risiko ändert und eine DSFA nötig wird',
					'Checked whether the risk changes and a DPIA becomes necessary'
				),
				cite: DSGVO('Art. 35 Abs. 1, 11')
			}
		]
	},
	{
		id: 'dokumentation',
		title: L('Dokumentation', 'Documentation'),
		intro: L('Was nach dem Wechsel stimmen muss.', 'What must be right after the change.'),
		items: [
			{
				id: 'd_vvt',
				label: L(
					'Verzeichnis von Verarbeitungstätigkeiten angepasst: Empfänger und Auftragsverarbeiter',
					'Record of processing activities updated: recipients and processors'
				),
				cite: DSGVO('Art. 30 Abs. 1 lit. d')
			},
			{
				id: 'd_hinweise',
				label: L(
					'Datenschutzhinweise angepasst, wo Dienstleister genannt sind',
					'Privacy notices updated where providers are named'
				),
				cite: DSGVO('Art. 13 Abs. 1 lit. e')
			},
			{
				id: 'd_ablage',
				label: L(
					'Kündigung, Löschbestätigung und Übergabeprotokoll abgelegt',
					'Notice, deletion confirmation and handover record filed'
				),
				cite: DSGVO('Art. 5 Abs. 2')
			}
		]
	}
];

/** what still stands in the way of closing the change, or null */
export function closingBlocked(data: RecordData): Localized | null {
	const state = checklist(data, BLOCKS);
	if (state.gaps.length > 0 || state.open.length > 0) {
		return L(
			'Erst alle Punkte der Checkliste erledigen.',
			'Complete every point of the checklist first.'
		);
	}
	if (inScope(data, ['drittland']) && !snapshot(data, 'transfer_check')) {
		return L('Erst die Drittlandprüfung durchführen.', 'Run the third-country check first.');
	}
	return null;
}

/** changing a service provider or ending a processing contract */
export const definition: RecordToolDefinition = {
	slug: 'dienstleisterwechsel',
	version: 1,
	intro: L(
		'Ein Eintrag je Wechsel oder Vertragsende. Am Ende des Auftrags gibt der Dienstleister die Daten zurück oder löscht sie, nach Wahl des Verantwortlichen, und löscht vorhandene Kopien. Für Cloud- und andere Datenverarbeitungsdienste regelt der Data Act zusätzlich Fristen und Entgelte beim Wechsel.',
		'One entry per change of provider or end of contract. At the end of the service the provider returns or deletes the data, as the controller chooses, and deletes existing copies. For cloud and other data processing services, the Data Act also sets deadlines and charges for switching.'
	),
	sources: [
		DSGVO('Art. 28 Abs. 3 lit. g, h, Abs. 4'),
		DATA_ACT('Art. 23 bis 29'),
		{ law: 'BSI', ref: 'OPS.2.3 Nutzung von Outsourcing' }
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'vorhaben',
			title: L('Vorhaben', 'The change'),
			columns: 2,
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Bezeichnung', 'Name'),
					help: L(
						'Z. B. „Lohnabrechnung: Wechsel des Lohnbüros“.',
						'E.g. "Payroll: change of payroll bureau".'
					),
					required: true,
					listColumn: true
				},
				{
					id: 'bisher',
					type: 'text',
					label: L('Bisheriger Dienstleister', 'Previous provider'),
					listColumn: true
				},
				{ id: 'nachfolger', type: 'text', label: L('Neuer Dienstleister', 'New provider') },
				{
					id: 'kuendigung_bis',
					type: 'date',
					label: L('Kündigung spätestens am', 'Give notice by')
				},
				{
					id: 'vertragsende',
					type: 'date',
					label: L('Vertragsende', 'Contract ends'),
					listColumn: true
				},
				{ id: 'verantwortlich', type: 'text', label: L('Verantwortlich', 'In charge') },
				{
					id: 'umfang',
					type: 'multiselect',
					label: L('Was trifft zu?', 'What applies?'),
					help: L(
						'Bestimmt, welche weiteren Teile der Checkliste gelten.',
						'Decides which further parts of the checklist apply.'
					),
					options: SCOPES
				}
			]
		},
		{
			id: 'verknuepfungen',
			title: L('Prüfungen und Verknüpfungen', 'Checks and links'),
			fields: [
				{
					id: 'avv_alt',
					type: 'reference',
					tool: 'avv-pruefung',
					label: L('Bisheriger AVV', 'Previous processing agreement')
				},
				{
					id: 'avv_neu',
					type: 'reference',
					tool: 'avv-pruefung',
					label: L('Neuer AVV', 'New processing agreement')
				},
				{
					id: 'transfer_check',
					type: 'assessment',
					tool: 'drittland-transfer',
					label: L('Drittlandprüfung (bei Drittland)', 'Third-country check (if relevant)'),
					cite: DSGVO('Art. 44')
				},
				{
					id: 'vvt',
					type: 'reference',
					tool: 'vvt',
					label: L('Betroffener Eintrag im VVT', 'Record of processing entry concerned')
				}
			]
		},
		...blockSections(BLOCKS),
		{
			id: 'abschluss',
			title: L('Abschluss', 'Closing'),
			columns: 2,
			fields: [
				{ id: 'abschluss_am', type: 'date', label: L('Abgeschlossen am', 'Closed on') },
				{ id: 'abschluss_durch', type: 'text', label: L('Abgeschlossen durch', 'Closed by') }
			]
		}
	],
	workflow: {
		states: [
			{ id: 'geplant', label: L('Geplant', 'Planned') },
			{ id: 'umstellung', label: L('Umstellung', 'Switching') },
			{ id: 'abgeschlossen', label: L('Abgeschlossen', 'Closed'), terminal: true }
		],
		initialState: 'geplant',
		transitions: [
			{ from: 'geplant', to: 'umstellung', label: L('Umstellung beginnt', 'Switch starts') },
			{ from: 'umstellung', to: 'geplant', label: L('Zurück zur Planung', 'Back to planning') },
			{
				from: 'umstellung',
				to: 'abgeschlossen',
				label: L('Abschließen', 'Close'),
				requires: ['abschluss_am'],
				check: (record) => closingBlocked(record.data)
			}
		]
	},
	example: {
		bezeichnung: 'Lohnabrechnung: Wechsel des Lohnbüros (Beispiel)',
		bisher: 'Lohnbüro Alt GmbH',
		nachfolger: 'Lohnbüro Neu GmbH',
		verantwortlich: 'Leitung Personal',
		umfang: ['neu', 'zugang'],
		k_bestand: 'ja',
		k_wahl: 'ja',
		k_wahl_notiz: 'Rückgabe als Export, danach Löschung.',
		n_avv: 'nein',
		n_avv_notiz: 'Entwurf liegt vor, Unterschrift ausstehend.'
	}
};
