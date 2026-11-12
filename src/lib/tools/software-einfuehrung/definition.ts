import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, inScope, snapshot, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });
const BSI = (ref: string): LegalBasis => ({ law: 'BSI', ref });

export const SCOPES = [
	{
		value: 'personenbezug',
		label: L('Verarbeitet personenbezogene Daten', 'Processes personal data')
	},
	{
		value: 'cloud',
		label: L('Läuft beim Anbieter (Cloud, SaaS)', 'Runs at the provider (cloud, SaaS)')
	},
	{
		value: 'drittland',
		label: L(
			'Anbieter oder Unterauftragnehmer außerhalb des EWR',
			'Provider or sub-processor outside the EEA'
		)
	},
	{
		value: 'beschaeftigte',
		label: L(
			'Betrifft Daten oder Verhalten von Beschäftigten',
			'Concerns data or behaviour of staff'
		)
	},
	{
		value: 'besondere',
		label: L('Besondere Kategorien (Art. 9 DSGVO)', 'Special categories (Art. 9 GDPR)')
	},
	{ value: 'ki', label: L('Enthält KI-Funktionen', 'Contains AI functions') }
];

/** the checklist in the order of an introduction */
export const BLOCKS: Block[] = [
	{
		id: 'datenschutz',
		title: L('Datenschutz', 'Data protection'),
		intro: L(
			'Was feststehen muss, bevor die Software personenbezogene Daten verarbeitet.',
			'What must be settled before the software processes personal data.'
		),
		scope: ['personenbezug'],
		items: [
			{
				id: 'd_zweck',
				label: L('Zweck und Rechtsgrundlage festgelegt', 'Purpose and legal basis set'),
				cite: DSGVO('Art. 5 Abs. 1 lit. b, Art. 6 Abs. 1')
			},
			{
				id: 'd_minimierung',
				label: L(
					'Nur nötige Daten und Funktionen; datenschutzfreundliche Voreinstellungen gewählt',
					'Only the data and functions needed; privacy-friendly defaults chosen'
				),
				cite: DSGVO('Art. 25 Abs. 2')
			},
			{
				id: 'd_avv',
				label: L(
					'Auftragsverarbeitungsvertrag geschlossen und geprüft (Werkzeug AVV-Prüfung)',
					'Processing agreement concluded and checked (AVV check tool)'
				),
				cite: DSGVO('Art. 28 Abs. 3'),
				scope: ['cloud']
			},
			{
				id: 'd_vvt',
				label: L(
					'Eintrag im Verzeichnis von Verarbeitungstätigkeiten angelegt oder ergänzt',
					'Entry in the record of processing activities created or updated'
				),
				cite: DSGVO('Art. 30 Abs. 1')
			},
			{
				id: 'd_loeschung',
				label: L(
					'Löschfristen lassen sich in der Software umsetzen und sind eingestellt',
					'Retention periods can be applied in the software and are set'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. e, Art. 17')
			},
			{
				id: 'd_rechte',
				label: L(
					'Auskunft, Berichtigung, Löschung und Export lassen sich erfüllen',
					'Access, rectification, erasure and export can be fulfilled'
				),
				cite: DSGVO('Art. 15 bis 20')
			},
			{
				id: 'd_information',
				label: L(
					'Betroffene informiert, Datenschutzhinweise angepasst',
					'Data subjects informed, privacy notices updated'
				),
				cite: DSGVO('Art. 13, 14')
			}
		]
	},
	{
		id: 'sicherheit',
		title: L('Sicherheit', 'Security'),
		intro: L('Technische Maßnahmen für den Betrieb.', 'Technical measures for operation.'),
		items: [
			{
				id: 's_rollen',
				label: L(
					'Rollen und Berechtigungen nach dem Erforderlichkeitsprinzip vergeben',
					'Roles and permissions granted on a need-to-know basis'
				),
				cite: BSI('ORP.4 Identitäts- und Berechtigungsmanagement')
			},
			{
				id: 's_anmeldung',
				label: L(
					'Anmeldung mit zweitem Faktor oder über die zentrale Anmeldung (SSO)',
					'Sign-in with a second factor or through single sign-on'
				),
				cite: BSI('ORP.4 Identitäts- und Berechtigungsmanagement')
			},
			{
				id: 's_verschluesselung',
				label: L(
					'Verschlüsselung bei Übertragung und Speicherung',
					'Encryption in transit and at rest'
				),
				cite: DSGVO('Art. 32 Abs. 1 lit. a')
			},
			{
				id: 's_protokoll',
				label: L('Zugriffe und Änderungen werden protokolliert', 'Access and changes are logged'),
				cite: BSI('OPS.1.1.5 Protokollierung')
			},
			{
				id: 's_sicherung',
				label: L('Datensicherung und Wiederherstellung geklärt', 'Backup and restore settled'),
				cite: BSI('CON.3 Datensicherungskonzept')
			},
			{
				id: 's_updates',
				label: L(
					'Updates und Sicherheitsmeldungen des Anbieters werden verfolgt und eingespielt',
					'Provider updates and security notices are tracked and applied'
				),
				cite: BSI('OPS.1.1.3 Patch- und Änderungsmanagement')
			},
			{
				id: 's_ausstieg',
				label: L(
					'Ausstieg geregelt: Datenexport und Löschung beim Anbieter am Vertragsende',
					'Exit settled: data export and deletion at the provider when the contract ends'
				),
				cite: BSI('OPS.2.2 Cloud-Nutzung'),
				scope: ['cloud']
			}
		]
	},
	{
		id: 'drittland',
		title: L('Drittland', 'Third country'),
		intro: L(
			'Wenn Daten den EWR verlassen oder von außerhalb zugänglich sind.',
			'When data leaves the EEA or can be accessed from outside it.'
		),
		scope: ['drittland'],
		items: [
			{
				id: 't_grundlage',
				label: L(
					'Grundlage nach Kapitel V festgestellt: Angemessenheitsbeschluss, Zertifizierung oder Standardvertragsklauseln (Werkzeug Drittland-Transfer)',
					'Chapter V basis established: adequacy decision, certification or standard contractual clauses (third-country transfer tool)'
				),
				cite: DSGVO('Art. 44 bis 46')
			},
			{
				id: 't_tia',
				label: L(
					'Bei Standardvertragsklauseln: Transfer Impact Assessment dokumentiert',
					'With standard contractual clauses: transfer impact assessment documented'
				),
				cite: { law: 'EuGH', ref: 'C-311/18 (Schrems II)' }
			},
			{
				id: 't_unterauftrag',
				label: L(
					'Unterauftragsverarbeiter und ihre Standorte bekannt',
					'Sub-processors and their locations known'
				),
				cite: DSGVO('Art. 28 Abs. 2, 4')
			}
		]
	},
	{
		id: 'beschaeftigte',
		title: L('Beschäftigte', 'Staff'),
		intro: L(
			'Wenn die Software Daten oder Verhalten von Beschäftigten erfasst.',
			'When the software records data or behaviour of staff.'
		),
		scope: ['beschaeftigte'],
		items: [
			{
				id: 'b_betriebsrat',
				label: L(
					'Betriebsrat beteiligt; Betriebsvereinbarung geschlossen oder nicht nötig',
					'Works council involved; works agreement concluded or not needed'
				),
				cite: { law: 'BetrVG', ref: '§ 87 Abs. 1 Nr. 6' }
			},
			{
				id: 'b_rechtsgrundlage',
				label: L(
					'Rechtsgrundlage für die Beschäftigtendaten geprüft (§ 26 Abs. 1 BDSG ist seit EuGH C-34/21 umstritten)',
					'Legal basis for staff data checked (§ 26(1) BDSG is disputed since CJEU C-34/21)'
				),
				cite: DSGVO('Art. 6, Art. 88')
			},
			{
				id: 'b_kontrolle',
				label: L(
					'Keine Leistungs- oder Verhaltenskontrolle über das Vereinbarte hinaus',
					'No monitoring of performance or behaviour beyond what was agreed'
				),
				cite: { law: 'BetrVG', ref: '§ 87 Abs. 1 Nr. 6' }
			},
			{
				id: 'b_information',
				label: L('Beschäftigte informiert', 'Staff informed'),
				cite: DSGVO('Art. 13')
			}
		]
	},
	{
		id: 'besondere',
		title: L('Besondere Kategorien', 'Special categories'),
		intro: L(
			'Gesundheit, Religion, Biometrie und die anderen Daten des Art. 9.',
			'Health, religion, biometrics and the other data of Art. 9.'
		),
		scope: ['besondere'],
		items: [
			{
				id: 'k_ausnahme',
				label: L(
					'Ausnahme nach Art. 9 Abs. 2 festgestellt',
					'Exception under Art. 9(2) established'
				),
				cite: DSGVO('Art. 9 Abs. 2')
			},
			{
				id: 'k_schutz',
				label: L(
					'Zusätzliche Schutzmaßnahmen: enger Zugriff, Verschlüsselung, Protokollierung',
					'Additional safeguards: narrow access, encryption, logging'
				),
				cite: { law: 'BDSG', ref: '§ 22 Abs. 2' }
			}
		]
	},
	{
		id: 'freigabe',
		title: L('Vor der Freigabe', 'Before approval'),
		intro: L('Der letzte Schritt vor dem Einsatz.', 'The last step before use.'),
		items: [
			{
				id: 'f_dsb',
				label: L('Datenschutzbeauftragter eingebunden', 'Data protection officer involved'),
				cite: DSGVO('Art. 38 Abs. 1, Art. 39 Abs. 1 lit. a')
			},
			{
				id: 'f_test',
				label: L(
					'Getestet mit Testdaten statt echten Daten',
					'Tested with test data instead of real data'
				),
				cite: DSGVO('Art. 25 Abs. 1')
			},
			{
				id: 'f_einweisung',
				label: L('Nutzende eingewiesen', 'Users instructed'),
				cite: DSGVO('Art. 32 Abs. 4')
			}
		]
	}
];

/** the attached screening result says a DPIA is needed */
export const dpiaNeeded = (data: RecordData) =>
	snapshot(data, 'dsfa_check')?.verdict === 'positive';

/** what still stands in the way of approval, or null */
export function approvalBlocked(data: RecordData): Localized | null {
	const state = checklist(data, BLOCKS);
	if (state.gaps.length > 0 || state.open.length > 0) {
		return L(
			'Erst alle Punkte der Checkliste erledigen.',
			'Complete every point of the checklist first.'
		);
	}
	if (inScope(data, ['personenbezug']) && !snapshot(data, 'dsfa_check')) {
		return L('Erst die DSFA-Schwellwertanalyse durchführen.', 'Run the DPIA screening first.');
	}
	if (dpiaNeeded(data) && !data.dsfa) {
		return L(
			'Die Schwellwertanalyse verlangt eine DSFA; erst die DSFA verknüpfen.',
			'The screening requires a DPIA; link the DPIA first.'
		);
	}
	if (inScope(data, ['drittland']) && !snapshot(data, 'transfer_check')) {
		return L('Erst die Drittlandprüfung durchführen.', 'Run the third-country check first.');
	}
	return null;
}

/** introducing a software or cloud service, from the first check to approval */
export const definition: RecordToolDefinition = {
	slug: 'software-einfuehrung',
	version: 1,
	intro: L(
		'Ein Eintrag je Software oder Cloud-Dienst, der eingeführt werden soll. Der Umfang bestimmt, welche Teile der Checkliste gelten. Die vorhandenen Prüfungen werden nicht wiederholt, sondern verknüpft: DSFA-Schwellwertanalyse, Drittlandprüfung, Auftragsverarbeitung, VVT und TOM.',
		'One entry per software or cloud service to be introduced. The scope decides which parts of the checklist apply. The existing checks are linked, not repeated: DPIA screening, third-country check, processing agreement, record of processing and measures.'
	),
	sources: [
		DSGVO('Art. 5, 24, 25, 28, 30, 32'),
		{ law: 'BetrVG', ref: '§ 87 Abs. 1 Nr. 6' },
		BSI('IT-Grundschutz-Kompendium, Edition 2023')
	],
	titleField: 'bezeichnung',
	example: {
		bezeichnung: 'Bewerbermanagement (Beispiel)',
		anbieter: 'Beispiel Software GmbH',
		zweck:
			'Stellenanzeigen veröffentlichen, Bewerbungen sammeln und mit den Fachbereichen abstimmen.',
		verantwortlich: 'Leitung Personal',
		umfang: ['personenbezug', 'cloud', 'beschaeftigte'],
		d_zweck: 'ja',
		d_minimierung: 'ja',
		d_avv: 'nein',
		d_avv_notiz: 'Vertragsentwurf liegt beim Anbieter.',
		b_betriebsrat: 'ja'
	},
	sections: [
		{
			id: 'vorhaben',
			title: L('Vorhaben', 'The introduction'),
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Software oder Dienst', 'Software or service'),
					help: L('Z. B. „Bewerbermanagement Personio“.', 'E.g. "Applicant management Personio".'),
					required: true,
					listColumn: true
				},
				{ id: 'anbieter', type: 'text', label: L('Anbieter', 'Provider'), listColumn: true },
				{
					id: 'zweck',
					type: 'textarea',
					label: L('Wofür sie eingesetzt wird', 'What it is used for')
				},
				{
					id: 'einsatz_ab',
					type: 'date',
					label: L('Geplanter Einsatz ab', 'Planned use from'),
					listColumn: true
				},
				{ id: 'verantwortlich', type: 'text', label: L('Verantwortlich', 'In charge') },
				{
					id: 'umfang',
					type: 'multiselect',
					label: L('Was trifft zu?', 'What applies?'),
					help: L(
						'Bestimmt, welche Teile der Checkliste und welche Prüfungen gelten.',
						'Decides which parts of the checklist and which checks apply.'
					),
					options: SCOPES
				}
			]
		},
		{
			id: 'pruefungen',
			title: L('Prüfungen und Verknüpfungen', 'Checks and links'),
			intro: L(
				'Die Ergebnisse der vorhandenen Werkzeuge; sie werden hier nicht noch einmal abgefragt.',
				'The results of the existing tools; they are not asked again here.'
			),
			fields: [
				{
					id: 'dsfa_check',
					type: 'assessment',
					tool: 'dsfa-schwellwert',
					label: L('DSFA-Schwellwertanalyse', 'DPIA screening'),
					cite: DSGVO('Art. 35 Abs. 1')
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
					label: L('Eintrag im VVT', 'Record of processing entry')
				},
				{
					id: 'avv',
					type: 'reference',
					tool: 'avv-pruefung',
					label: L('AVV-Prüfung', 'Processing agreement check')
				},
				{
					id: 'tom',
					type: 'reference',
					tool: 'tom-katalog',
					label: L('TOM-Katalog', 'TOM catalogue')
				},
				{
					id: 'dsfa',
					type: 'reference',
					tool: 'dsfa',
					label: L('DSFA (falls nötig)', 'DPIA (if needed)')
				}
			]
		},
		...blockSections(BLOCKS),
		{
			id: 'abschluss',
			title: L('Freigabe', 'Approval'),
			fields: [
				{ id: 'freigabe_am', type: 'date', label: L('Freigegeben am', 'Approved on') },
				{ id: 'freigabe_durch', type: 'text', label: L('Freigegeben durch', 'Approved by') },
				{
					id: 'wiedervorlage',
					type: 'date',
					label: L('Wiedervorlage', 'Next review'),
					help: L(
						'Spätestens bei größeren Updates oder einem Wechsel des Anbieters erneut prüfen.',
						'Check again at the latest after major updates or a change of provider.'
					)
				}
			]
		}
	],
	workflow: {
		states: [
			{ id: 'pruefung', label: L('In Prüfung', 'Under review') },
			{ id: 'freigegeben', label: L('Freigegeben', 'Approved') },
			{ id: 'abgelehnt', label: L('Abgelehnt', 'Rejected'), terminal: true }
		],
		initialState: 'pruefung',
		transitions: [
			{
				from: 'pruefung',
				to: 'freigegeben',
				label: L('Freigeben', 'Approve'),
				requires: ['umfang', 'freigabe_am'],
				check: (record) => approvalBlocked(record.data)
			},
			{ from: 'pruefung', to: 'abgelehnt', label: L('Ablehnen', 'Reject') },
			{ from: 'freigegeben', to: 'pruefung', label: L('Erneut prüfen', 'Review again') },
			{ from: 'abgelehnt', to: 'pruefung', label: L('Wieder aufnehmen', 'Reopen') }
		]
	}
};
