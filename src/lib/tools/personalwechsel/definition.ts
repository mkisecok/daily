import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, inScope, snapshot, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });
const BSI = (ref: string): LegalBasis => ({ law: 'BSI', ref });

export const EVENTS = [
	{ value: 'eintritt', label: L('Eintritt', 'Joining') },
	{ value: 'wechsel', label: L('Wechsel der Aufgabe oder Abteilung', 'Change of role or team') },
	{ value: 'austritt', label: L('Austritt', 'Leaving') }
];

export const SCOPES = [
	{
		value: 'privatnutzung',
		label: L(
			'Private Nutzung von E-Mail und Internet erlaubt',
			'Private use of email and internet allowed'
		)
	},
	{
		value: 'admin',
		label: L(
			'Administrative Rechte oder gemeinsam genutzte Zugänge',
			'Administrative rights or shared accounts'
		)
	},
	{
		value: 'geraete',
		label: L('Fernzugriff oder eigene Geräte', 'Remote access or own devices')
	},
	{
		value: 'fotos',
		label: L(
			'Foto oder Name auf Website, Intranet oder in Broschüren',
			'Photo or name on the website, intranet or in brochures'
		)
	},
	{
		value: 'besondere',
		label: L(
			'Gesundheitsdaten, Schwerbehinderung oder andere Daten des Art. 9',
			'Health data, severe disability or other data of Art. 9'
		)
	},
	{ value: 'ki', label: L('Arbeitet mit KI-Systemen', 'Works with AI systems') }
];

/** the event the entry records */
export const eventOf = (data: RecordData) =>
	typeof data.vorgang === 'string' && data.vorgang ? data.vorgang : null;

const VERTRAULICHKEIT: LegalBasis = { law: 'DSK', ref: 'Kurzpapier Nr. 19' };
const POSTFACH: LegalBasis = {
	law: 'DSK',
	ref: 'Orientierungshilfe E-Mail und Internet am Arbeitsplatz'
};

/** the checklist: one part per event, and the parts that apply to every event */
export const BLOCKS: Block[] = [
	{
		id: 'eintritt',
		title: L('Eintritt', 'Joining'),
		intro: L(
			'Bis zum ersten Arbeitstag oder in der ersten Woche.',
			'By the first working day or in the first week.'
		),
		when: (data) => eventOf(data) === 'eintritt',
		items: [
			{
				id: 'e_vertraulichkeit',
				label: L(
					'Schriftlich auf die Vertraulichkeit verpflichtet und über die Datenschutzpflichten unterrichtet',
					'Committed to confidentiality in writing and told about the data protection duties'
				),
				cite: DSGVO('Art. 29, Art. 32 Abs. 4'),
				help: L(
					'Ein Muster enthält das Kurzpapier Nr. 19 der DSK. Das frühere „Datengeheimnis“ nach § 5 BDSG a. F. gibt es nicht mehr.',
					'The DSK’s Kurzpapier No. 19 contains a template. The former "Datengeheimnis" under § 5 BDSG (old) no longer exists.'
				),
				na: false
			},
			{
				id: 'e_information',
				label: L(
					'Datenschutzhinweise für Beschäftigte ausgehändigt',
					'Privacy notice for staff handed over'
				),
				cite: DSGVO('Art. 13'),
				na: false
			},
			{
				id: 'e_rechtsgrundlage',
				label: L(
					'Rechtsgrundlage für die Personaldaten geprüft (§ 26 Abs. 1 BDSG ist seit EuGH C-34/21 umstritten)',
					'Legal basis for the personnel data checked (§ 26(1) BDSG is disputed since CJEU C-34/21)'
				),
				cite: DSGVO('Art. 6 Abs. 1 lit. b, c, Art. 88')
			},
			{
				id: 'e_akte',
				label: L(
					'Personalakte nur mit nötigen Daten angelegt; Zugriff nur für die Personalabteilung',
					'Personnel file created with the data needed only; access for HR only'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. c, f')
			},
			{
				id: 'e_bewerbung',
				label: L(
					'Aus den Bewerbungsunterlagen nur Nötiges übernommen, den Rest gelöscht',
					'Only what is needed taken over from the application, the rest deleted'
				),
				cite: DSGVO('Art. 17 Abs. 1 lit. a')
			},
			{
				id: 'e_zugaenge',
				label: L(
					'Konten und Berechtigungen nach dem Erforderlichkeitsprinzip eingerichtet',
					'Accounts and permissions set up on a need-to-know basis'
				),
				cite: BSI('ORP.4 Identitäts- und Berechtigungsmanagement')
			},
			{
				id: 'e_ausgabe',
				label: L(
					'Ausgegebene Geräte, Schlüssel und Ausweise in einer Liste festgehalten',
					'Devices, keys and badges handed out recorded in a list'
				),
				cite: BSI('ORP.2 Personal'),
				help: L(
					'Die Liste ist beim Austritt die Grundlage für die Rückgabe.',
					'On leaving, the list is the basis for the return.'
				)
			},
			{
				id: 'e_regeln',
				label: L(
					'Regeln zur IT-Nutzung ausgehändigt und zur Kenntnis genommen',
					'Rules for IT use handed over and acknowledged'
				),
				cite: BSI('ORP.2 Personal')
			},
			{
				id: 'e_privat',
				label: L(
					'Regel zur privaten Nutzung von E-Mail und Internet ausgehändigt, auch zum Zugriff bei Abwesenheit',
					'Rule on private use of email and internet handed over, including access during absence'
				),
				cite: POSTFACH,
				scope: ['privatnutzung']
			},
			{
				id: 'e_foto',
				label: L(
					'Einwilligung für Foto und Veröffentlichung freiwillig, schriftlich oder elektronisch, mit Hinweis auf den Widerruf (Werkzeug Einwilligungs-Check)',
					'Consent to the photo and publication voluntary, in writing or electronically, with a note on withdrawal (consent check tool)'
				),
				cite: DSGVO('Art. 7'),
				scope: ['fotos']
			},
			{
				id: 'e_schulung',
				label: L(
					'Datenschutz-Unterweisung durchgeführt oder terminiert (Werkzeug Schulungsnachweis)',
					'Data protection instruction held or scheduled (training record tool)'
				),
				cite: DSGVO('Art. 32 Abs. 4, Art. 39 Abs. 1 lit. b')
			},
			{
				id: 'e_ki',
				label: L(
					'Maßnahmen zur KI-Kompetenz eingeplant (Werkzeug KI-Kompetenz)',
					'AI literacy measures planned (AI literacy tool)'
				),
				cite: { law: 'KI-VO', ref: 'Art. 4 Abs. 1' },
				scope: ['ki']
			}
		]
	},
	{
		id: 'wechsel',
		title: L('Wechsel', 'Change of role'),
		intro: L(
			'Wenn jemand im Haus eine andere Aufgabe übernimmt.',
			'When someone takes on another role in the organisation.'
		),
		when: (data) => eventOf(data) === 'wechsel',
		items: [
			{
				id: 'w_rechte',
				label: L(
					'Berechtigungen der alten Aufgabe entzogen, die der neuen nach Erforderlichkeit vergeben',
					'Permissions of the old role removed, those of the new one granted as needed'
				),
				cite: BSI('ORP.4 Identitäts- und Berechtigungsmanagement'),
				na: false
			},
			{
				id: 'w_unterweisung',
				label: L(
					'In die Datenschutzregeln der neuen Aufgabe eingewiesen',
					'Instructed in the data protection rules of the new role'
				),
				cite: DSGVO('Art. 32 Abs. 4')
			},
			{
				id: 'w_verzeichnisse',
				label: L(
					'Verteiler, Telefonliste und Organigramm aktualisiert',
					'Mailing lists, phone list and org chart updated'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. d')
			}
		]
	},
	{
		id: 'austritt',
		title: L('Austritt', 'Leaving'),
		intro: L(
			'Zum letzten Arbeitstag, bei einer Freistellung zu ihrem Beginn.',
			'By the last working day, or when leave of absence starts.'
		),
		when: (data) => eventOf(data) === 'austritt',
		items: [
			{
				id: 'a_konten',
				label: L(
					'Konten und Zugänge zum letzten Arbeitstag gesperrt',
					'Accounts and access blocked by the last working day'
				),
				cite: BSI('ORP.4 Identitäts- und Berechtigungsmanagement'),
				na: false
			},
			{
				id: 'a_fernzugriff',
				label: L(
					'Fernzugriff entfernt; dienstliche Daten auf eigenen Geräten gelöscht',
					'Remote access removed; work data on own devices deleted'
				),
				cite: BSI('ORP.2 Personal'),
				scope: ['geraete']
			},
			{
				id: 'a_admin',
				label: L(
					'Gemeinsam genutzte Passwörter und administrative Zugänge geändert',
					'Shared passwords and administrative accounts changed'
				),
				cite: BSI('ORP.4 Identitäts- und Berechtigungsmanagement'),
				scope: ['admin']
			},
			{
				id: 'a_rueckgabe',
				label: L(
					'Geräte, Datenträger, Unterlagen, Schlüssel und Ausweise nach der Liste zurückgegeben',
					'Devices, storage media, documents, keys and badges returned against the list'
				),
				cite: BSI('ORP.2 Personal'),
				na: false
			},
			{
				id: 'a_uebergabe',
				label: L(
					'Dienstliche Daten übergeben, persönliche Ablagen geräumt',
					'Work data handed over, personal folders cleared'
				),
				cite: BSI('ORP.2 Personal')
			},
			{
				id: 'a_postfach',
				label: L(
					'Postfach: Abwesenheitsnotiz mit neuer Kontaktstelle; keine Weiterleitung ohne Regelung',
					'Mailbox: out-of-office note naming a new contact; no forwarding without a rule'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. f, Art. 6 Abs. 1 lit. f')
			},
			{
				id: 'a_privat',
				label: L(
					'Private Inhalte nicht eingesehen; Gelegenheit gegeben, sie mitzunehmen oder zu löschen',
					'Private content not viewed; a chance given to take or delete it'
				),
				cite: POSTFACH,
				scope: ['privatnutzung']
			},
			{
				id: 'a_verzeichnisse',
				label: L(
					'Aus Telefonliste, Organigramm, Verteilern und Website entfernt',
					'Removed from the phone list, org chart, mailing lists and website'
				),
				cite: DSGVO('Art. 17 Abs. 1 lit. a')
			},
			{
				id: 'a_foto',
				label: L(
					'Fotos und Veröffentlichungen entfernt, oder geklärt, ob die Einwilligung fortgilt',
					'Photos and publications removed, or settled whether the consent continues'
				),
				cite: DSGVO('Art. 7 Abs. 3, Art. 17 Abs. 1 lit. b'),
				scope: ['fotos']
			},
			{
				id: 'a_vertraulichkeit',
				label: L(
					'Darauf hingewiesen, dass die Vertraulichkeit über das Ende hinaus gilt',
					'Reminded that confidentiality continues after leaving'
				),
				cite: VERTRAULICHKEIT
			},
			{
				id: 'a_sofort',
				label: L(
					'Was nicht aufbewahrt werden muss, gelöscht, etwa Kopien, Zugangsdaten, Notizen',
					'What need not be kept deleted, such as copies, credentials, notes'
				),
				cite: DSGVO('Art. 17 Abs. 1 lit. a')
			},
			{
				id: 'a_fristen',
				label: L(
					'Aufbewahrungs- und Löschfristen der Personalakte festgelegt (Werkzeug Löschkonzept)',
					'Retention and deletion periods for the personnel file set (deletion concept tool)'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. e, Art. 17 Abs. 3 lit. b'),
				help: L(
					'Zum Beispiel Lohnkonto 6 Jahre (§ 41 Abs. 1 EStG), Buchungsbelege wie Lohnabrechnungen 8 Jahre (§ 147 Abs. 3 AO, § 257 Abs. 4 HGB), im Übrigen bis zum Ende möglicher Ansprüche (regelmäßige Verjährung 3 Jahre, § 195 BGB).',
					'For example the payroll account 6 years (§ 41(1) EStG), accounting records such as payslips 8 years (§ 147(3) AO, § 257(4) HGB), otherwise until possible claims end (regular limitation 3 years, § 195 BGB).'
				),
				na: false
			}
		]
	},
	{
		id: 'besondere',
		title: L('Besondere Kategorien', 'Special categories'),
		intro: L(
			'Krankmeldungen, Wiedereingliederung, Schwerbehinderung, Religion für die Kirchensteuer.',
			'Sick notes, return-to-work, severe disability, religion for church tax.'
		),
		scope: ['besondere'],
		items: [
			{
				id: 'k_ausnahme',
				label: L(
					'Ausnahme nach Art. 9 Abs. 2 festgestellt, meist Pflichten aus dem Arbeits- und Sozialrecht',
					'Exception under Art. 9(2) established, usually duties under employment and social law'
				),
				cite: DSGVO('Art. 9 Abs. 2 lit. b')
			},
			{
				id: 'k_getrennt',
				label: L(
					'Getrennt von der Personalakte und mit engerem Zugriff abgelegt',
					'Kept apart from the personnel file with narrower access'
				),
				cite: { law: 'BDSG', ref: '§ 22 Abs. 2' }
			}
		]
	}
];

/** what still stands in the way of closing the entry, or null */
export function closingBlocked(data: RecordData): Localized | null {
	const state = checklist(data, BLOCKS);
	if (state.gaps.length > 0 || state.open.length > 0) {
		return L(
			'Erst alle Punkte der Checkliste erledigen.',
			'Complete every point of the checklist first.'
		);
	}
	if (needsConsentCheck(data) && !snapshot(data, 'foto_check')) {
		return L('Erst die Einwilligung für das Foto prüfen.', 'Check the consent to the photo first.');
	}
	return null;
}

/** a new starter whose photo or name is published needs a checked consent */
export const needsConsentCheck = (data: RecordData) =>
	eventOf(data) === 'eintritt' && inScope(data, ['fotos']);

/** joining, a change of role or leaving: one entry per person and event */
export const definition: RecordToolDefinition = {
	slug: 'personalwechsel',
	version: 1,
	intro: L(
		'Ein Eintrag je Person und Vorgang: Eintritt, Wechsel der Aufgabe oder Austritt. Vorgang und Umfang bestimmen, welche Punkte gelten. Unterweisung, Löschfristen und Einwilligung werden nicht hier geprüft, sondern mit den vorhandenen Werkzeugen verknüpft.',
		'One entry per person and event: joining, a change of role or leaving. The event and the scope decide which points apply. Instruction, deletion periods and consent are not checked here but linked to the existing tools.'
	),
	sources: [
		DSGVO('Art. 5, 9, 13, 17, 29, 32, 88'),
		VERTRAULICHKEIT,
		BSI('IT-Grundschutz-Kompendium, Edition 2023: ORP.2, ORP.4')
	],
	titleField: 'person',
	sections: [
		{
			id: 'vorgang',
			title: L('Vorgang', 'The event'),
			columns: 2,
			fields: [
				{
					id: 'person',
					type: 'text',
					label: L('Person', 'Person'),
					help: L(
						'Name oder Personalnummer; die Personalnummer genügt.',
						'Name or staff number; the staff number is enough.'
					),
					required: true,
					listColumn: true
				},
				{
					id: 'vorgang',
					type: 'select',
					label: L('Vorgang', 'Event'),
					required: true,
					options: EVENTS,
					listColumn: true
				},
				{
					id: 'stichtag',
					type: 'date',
					label: L('Erster oder letzter Arbeitstag', 'First or last working day'),
					help: L(
						'Beim Wechsel der Tag, an dem die neue Aufgabe beginnt.',
						'For a change of role, the day the new role starts.'
					),
					listColumn: true
				},
				{ id: 'bereich', type: 'text', label: L('Abteilung oder Aufgabe', 'Team or role') },
				{ id: 'verantwortlich', type: 'text', label: L('Verantwortlich', 'In charge') },
				{
					id: 'umfang',
					type: 'multiselect',
					label: L('Was trifft zu?', 'What applies?'),
					help: L(
						'Bestimmt, welche weiteren Punkte gelten.',
						'Decides which further points apply.'
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
					id: 'foto_check',
					type: 'assessment',
					tool: 'einwilligung-check',
					label: L('Einwilligung für das Foto (falls zutreffend)', 'Consent to the photo (if any)'),
					cite: DSGVO('Art. 7')
				},
				{
					id: 'schulung',
					type: 'reference',
					tool: 'schulungsnachweis',
					label: L('Schulungsnachweis', 'Training record')
				},
				{
					id: 'loeschkonzept',
					type: 'reference',
					tool: 'loeschkonzept',
					label: L('Löschkonzept: Personalakte', 'Deletion concept: personnel file')
				},
				{
					id: 'vvt',
					type: 'reference',
					tool: 'vvt',
					label: L('VVT: Personalverwaltung', 'Record of processing: HR')
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
				{ id: 'abschluss_durch', type: 'text', label: L('Abgeschlossen durch', 'Closed by') },
				{
					id: 'loeschung_ab',
					type: 'date',
					label: L('Löschung prüfen ab', 'Review deletion from'),
					help: L(
						'Beim Austritt: wann die erste Aufbewahrungsfrist endet.',
						'On leaving: when the first retention period ends.'
					)
				}
			]
		}
	],
	workflow: {
		states: [
			{ id: 'offen', label: L('In Bearbeitung', 'In progress') },
			{ id: 'abgeschlossen', label: L('Abgeschlossen', 'Closed') },
			{ id: 'abgebrochen', label: L('Abgebrochen', 'Cancelled'), terminal: true }
		],
		initialState: 'offen',
		transitions: [
			{
				from: 'offen',
				to: 'abgeschlossen',
				label: L('Abschließen', 'Close'),
				requires: ['vorgang', 'abschluss_am'],
				check: (record) => closingBlocked(record.data)
			},
			{ from: 'offen', to: 'abgebrochen', label: L('Abbrechen', 'Cancel') },
			{ from: 'abgeschlossen', to: 'offen', label: L('Wieder öffnen', 'Reopen') },
			{ from: 'abgebrochen', to: 'offen', label: L('Wieder aufnehmen', 'Resume') }
		]
	}
};
