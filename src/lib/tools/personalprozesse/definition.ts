import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, inScope, type Block } from '../_shared/occasion.js';
import type { Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });

export const SCOPES = [
	{
		value: 'portal',
		label: L(
			'Bewerberportal oder Software eines Anbieters',
			'Applicant portal or provider software'
		)
	},
	{ value: 'betriebsrat', label: L('Es gibt einen Betriebsrat', 'There is a works council') },
	{
		value: 'pruefung',
		label: L(
			'Führungszeugnis oder andere Hintergrundprüfung',
			'Certificate of conduct or other background check'
		)
	},
	{
		value: 'ki',
		label: L(
			'KI sichtet, filtert oder bewertet Bewerbungen',
			'AI screens, filters or rates applications'
		)
	},
	{
		value: 'ki_arbeit',
		label: L('Beschäftigte arbeiten mit KI-Systemen', 'Staff work with AI systems')
	},
	{ value: 'pool', label: L('Talentpool für spätere Stellen', 'Talent pool for later jobs') },
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
	{ value: 'geraete', label: L('Fernzugriff oder eigene Geräte', 'Remote access or own devices') },
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
	}
];

/** the HR process from application to exit, set up once per organisation */
export const BLOCKS: Block[] = [
	{
		id: 'grundlagen',
		title: L('Grundlagen', 'Basics'),
		intro: L(
			'Was für alle Personaldaten gilt, von der Bewerbung bis nach dem Austritt.',
			'What applies to all HR data, from application to after exit.'
		),
		items: [
			{
				id: 'r_rechtsgrundlage',
				label: L(
					'Rechtsgrundlage für die Personaldaten geprüft (§ 26 Abs. 1 BDSG ist seit EuGH C-34/21 umstritten)',
					'Legal basis for the personnel data checked (§ 26(1) BDSG is disputed since CJEU C-34/21)'
				),
				cite: { law: 'DSGVO', ref: 'Art. 6 Abs. 1 lit. b, c, Art. 88' }
			}
		]
	},
	{
		id: 'bewerbung',
		title: L('Bewerbung', 'Application'),
		intro: L(
			'Ist im Ablauf geregelt? Für jede ausgeschriebene Stelle:',
			'Is it part of the process? For every advertised position:'
		),
		items: [
			{
				id: 'b_hinweise',
				label: L(
					'Datenschutzhinweise für Bewerbende an der Anzeige oder im Portal',
					'Privacy notice for applicants at the ad or in the portal'
				),
				cite: { law: 'DSGVO', ref: 'Art. 13' },
				na: false
			},
			{
				id: 'b_kanal',
				label: L(
					'Sicherer Eingangsweg; keine Weiterleitung an private Postfächer',
					'Secure way in; no forwarding to private mailboxes'
				),
				cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1' }
			},
			{
				id: 'b_fragen',
				label: L(
					'Nur Angaben erfragt, die für die Stelle nötig sind; keine Fragen nach Gesundheit, Religion oder Familienplanung',
					'Only details needed for the job asked; no questions about health, religion or family plans'
				),
				cite: { law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. c, Art. 9 Abs. 1' }
			},
			{
				id: 'b_avv',
				label: L(
					'Auftragsverarbeitungsvertrag mit dem Portalanbieter (Werkzeug AVV-Prüfung)',
					'Processing agreement with the portal provider (AVV check tool)'
				),
				cite: { law: 'DSGVO', ref: 'Art. 28 Abs. 3' },
				scope: ['portal']
			},
			{
				id: 'b_zugriff',
				label: L(
					'Zugriff nur für Personen, die an der Entscheidung beteiligt sind',
					'Access only for people involved in the decision'
				),
				cite: { law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. f' },
				na: false
			},
			{
				id: 'b_recherche',
				label: L(
					'Keine Recherche in privaten sozialen Netzwerken; berufliche Netzwerke nur mit Bezug zur Stelle und mit Hinweis',
					'No research in private social networks; professional networks only with a link to the job and with notice'
				),
				cite: { law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. c, Art. 14' }
			},
			{
				id: 'b_betriebsrat',
				label: L(
					'Betriebsrat vor der Einstellung unterrichtet, mit den erforderlichen Bewerbungsunterlagen',
					'Works council informed before the hire, with the necessary application documents'
				),
				cite: { law: 'BetrVG', ref: '§ 99 Abs. 1' },
				scope: ['betriebsrat']
			},
			{
				id: 'b_loeschung',
				label: L(
					'Unterlagen abgelehnter Bewerbender nach Ablauf der Fristen des AGG gelöscht',
					'Rejected applicants’ documents deleted once the AGG periods have run'
				),
				cite: { law: 'DSGVO', ref: 'Art. 17 Abs. 1 lit. a' },
				help: L(
					'Ansprüche wegen Benachteiligung sind binnen zwei Monaten nach der Absage schriftlich geltend zu machen (§ 15 Abs. 4 AGG), die Klage folgt binnen drei weiteren Monaten (§ 61b ArbGG). Häufig werden daher sechs Monate nach der Absage genannt.',
					'Discrimination claims must be made in writing within two months of the rejection (§ 15(4) AGG), and an action within three further months (§ 61b ArbGG). Six months after the rejection is therefore often given.'
				),
				na: false
			},
			{
				id: 'b_portal',
				label: L(
					'Daten auch im Bewerberportal gelöscht',
					'Data also deleted in the applicant portal'
				),
				cite: { law: 'DSGVO', ref: 'Art. 17 Abs. 1' },
				scope: ['portal']
			}
		]
	},
	{
		id: 'pruefung',
		title: L('Hintergrundprüfung', 'Background check'),
		intro: L(
			'Daten über Straftaten dürfen nur in engen Grenzen verarbeitet werden.',
			'Data on criminal offences may only be processed within narrow limits.'
		),
		scope: ['pruefung'],
		items: [
			{
				id: 'b_p_grundlage',
				label: L(
					'Führungszeugnis nur, wo für die Stelle gesetzlich vorgesehen oder nachweisbar erforderlich',
					'Certificate of conduct only where the law provides for it or it is shown to be necessary'
				),
				cite: { law: 'DSGVO', ref: 'Art. 10' }
			},
			{
				id: 'b_p_einsicht',
				label: L(
					'Einsicht und Vermerk statt Kopie, wo das genügt',
					'Viewing and noting instead of copying, where that is enough'
				),
				cite: { law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. c' }
			}
		]
	},
	{
		id: 'auswahl_ki',
		title: L('KI in der Auswahl', 'AI in selection'),
		intro: L(
			'KI-Systeme, die Bewerbungen sichten, filtern oder bewerten, sind nach Anhang III Nr. 4 KI-VO hochriskant.',
			'AI systems that screen, filter or rate applications are high-risk under Annex III no. 4 AI Act.'
		),
		scope: ['ki'],
		items: [
			{
				id: 'b_k_einstufung',
				label: L(
					'Risikoklasse festgestellt (Werkzeug Risikoklassifizierung)',
					'Risk class established (risk classification tool)'
				),
				cite: { law: 'KI-VO', ref: 'Anhang III Nr. 4 lit. a' },
				na: false
			},
			{
				id: 'b_k_mensch',
				label: L(
					'Keine Absage allein durch das System; ein Mensch entscheidet',
					'No rejection by the system alone; a person decides'
				),
				cite: { law: 'DSGVO', ref: 'Art. 22 Abs. 1' },
				na: false
			},
			{
				id: 'b_k_information',
				label: L(
					'Bewerbende über den Einsatz des Systems informiert',
					'Applicants informed that the system is used'
				),
				cite: { law: 'KI-VO', ref: 'Art. 26 Abs. 11' },
				help: L(
					'Geltungsbeginn der Pflichten für Hochrisiko-Systeme des Anhangs III: 2. Dezember 2027; der Hinweis in den Datenschutzhinweisen ist schon nach Art. 13 DSGVO nötig.',
					'The duties for Annex III high-risk systems apply as of 2 December 2027; the notice in the privacy information is already required under Art. 13 GDPR.'
				)
			}
		]
	},
	{
		id: 'pool',
		title: L('Talentpool', 'Talent pool'),
		intro: L(
			'Wenn Unterlagen für spätere Stellen behalten werden.',
			'When documents are kept for later jobs.'
		),
		scope: ['pool'],
		items: [
			{
				id: 'b_t_einwilligung',
				label: L(
					'Einwilligung für den Talentpool getrennt eingeholt, freiwillig und widerruflich',
					'Consent for the talent pool obtained separately, voluntary and revocable'
				),
				cite: { law: 'DSGVO', ref: 'Art. 6 Abs. 1 lit. a, Art. 7' },
				na: false
			},
			{
				id: 'b_t_dauer',
				label: L(
					'Dauer im Talentpool festgelegt; danach wird gelöscht',
					'Time in the talent pool set; deletion follows'
				),
				cite: { law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. e' }
			}
		]
	},
	{
		id: 'eintritt',
		title: L('Eintritt', 'Joining'),
		intro: L(
			'Ist im Ablauf geregelt? Für jede neue Person:',
			'Is it part of the process? For every new person:'
		),
		items: [
			{
				id: 'e_vertraulichkeit',
				label: L(
					'Schriftlich auf die Vertraulichkeit verpflichtet und über die Datenschutzpflichten unterrichtet',
					'Committed to confidentiality in writing and told about the data protection duties'
				),
				cite: { law: 'DSGVO', ref: 'Art. 29, Art. 32 Abs. 4' },
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
				cite: { law: 'DSGVO', ref: 'Art. 13' },
				na: false
			},
			{
				id: 'e_akte',
				label: L(
					'Personalakte nur mit nötigen Daten angelegt; Zugriff nur für die Personalabteilung',
					'Personnel file created with the data needed only; access for HR only'
				),
				cite: { law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. c, f' }
			},
			{
				id: 'e_bewerbung',
				label: L(
					'Aus den Bewerbungsunterlagen nur Nötiges übernommen, den Rest gelöscht',
					'Only what is needed taken over from the application, the rest deleted'
				),
				cite: { law: 'DSGVO', ref: 'Art. 17 Abs. 1 lit. a' }
			},
			{
				id: 'e_zugaenge',
				label: L(
					'Konten und Berechtigungen nach dem Erforderlichkeitsprinzip eingerichtet',
					'Accounts and permissions set up on a need-to-know basis'
				),
				cite: { law: 'BSI', ref: 'ORP.4 Identitäts- und Berechtigungsmanagement' }
			},
			{
				id: 'e_ausgabe',
				label: L(
					'Ausgegebene Geräte, Schlüssel und Ausweise in einer Liste festgehalten',
					'Devices, keys and badges handed out recorded in a list'
				),
				cite: { law: 'BSI', ref: 'ORP.2 Personal' },
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
				cite: { law: 'BSI', ref: 'ORP.2 Personal' }
			},
			{
				id: 'e_privat',
				label: L(
					'Regel zur privaten Nutzung von E-Mail und Internet ausgehändigt, auch zum Zugriff bei Abwesenheit',
					'Rule on private use of email and internet handed over, including access during absence'
				),
				cite: { law: 'DSK', ref: 'Orientierungshilfe E-Mail und Internet am Arbeitsplatz' },
				scope: ['privatnutzung']
			},
			{
				id: 'e_foto',
				label: L(
					'Einwilligung für Foto und Veröffentlichung freiwillig, schriftlich oder elektronisch, mit Hinweis auf den Widerruf (Werkzeug Einwilligungs-Check)',
					'Consent to the photo and publication voluntary, in writing or electronically, with a note on withdrawal (consent check tool)'
				),
				cite: { law: 'DSGVO', ref: 'Art. 7' },
				scope: ['fotos']
			},
			{
				id: 'e_schulung',
				label: L(
					'Datenschutz-Unterweisung durchgeführt oder terminiert (Werkzeug Schulungsnachweis)',
					'Data protection instruction held or scheduled (training record tool)'
				),
				cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 4, Art. 39 Abs. 1 lit. b' }
			},
			{
				id: 'e_ki',
				label: L(
					'Maßnahmen zur KI-Kompetenz eingeplant (Werkzeug Schulungsnachweis)',
					'AI literacy measures planned (training log tool)'
				),
				cite: { law: 'KI-VO', ref: 'Art. 4 Abs. 1' },
				scope: ['ki_arbeit']
			}
		]
	},
	{
		id: 'wechsel',
		title: L('Wechsel der Aufgabe', 'Change of role'),
		intro: L(
			'Ist im Ablauf geregelt? Für jeden Wechsel:',
			'Is it part of the process? For every change:'
		),
		items: [
			{
				id: 'w_rechte',
				label: L(
					'Berechtigungen der alten Aufgabe entzogen, die der neuen nach Erforderlichkeit vergeben',
					'Permissions of the old role removed, those of the new one granted as needed'
				),
				cite: { law: 'BSI', ref: 'ORP.4 Identitäts- und Berechtigungsmanagement' },
				na: false
			},
			{
				id: 'w_unterweisung',
				label: L(
					'In die Datenschutzregeln der neuen Aufgabe eingewiesen',
					'Instructed in the data protection rules of the new role'
				),
				cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 4' }
			},
			{
				id: 'w_verzeichnisse',
				label: L(
					'Verteiler, Telefonliste und Organigramm aktualisiert',
					'Mailing lists, phone list and org chart updated'
				),
				cite: { law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. d' }
			}
		]
	},
	{
		id: 'austritt',
		title: L('Austritt', 'Leaving'),
		intro: L(
			'Ist im Ablauf geregelt? Für jeden Austritt:',
			'Is it part of the process? For every exit:'
		),
		items: [
			{
				id: 'a_konten',
				label: L(
					'Konten und Zugänge zum letzten Arbeitstag gesperrt',
					'Accounts and access blocked by the last working day'
				),
				cite: { law: 'BSI', ref: 'ORP.4 Identitäts- und Berechtigungsmanagement' },
				na: false
			},
			{
				id: 'a_fernzugriff',
				label: L(
					'Fernzugriff entfernt; dienstliche Daten auf eigenen Geräten gelöscht',
					'Remote access removed; work data on own devices deleted'
				),
				cite: { law: 'BSI', ref: 'ORP.2 Personal' },
				scope: ['geraete']
			},
			{
				id: 'a_admin',
				label: L(
					'Gemeinsam genutzte Passwörter und administrative Zugänge geändert',
					'Shared passwords and administrative accounts changed'
				),
				cite: { law: 'BSI', ref: 'ORP.4 Identitäts- und Berechtigungsmanagement' },
				scope: ['admin']
			},
			{
				id: 'a_rueckgabe',
				label: L(
					'Geräte, Datenträger, Unterlagen, Schlüssel und Ausweise nach der Liste zurückgegeben',
					'Devices, storage media, documents, keys and badges returned against the list'
				),
				cite: { law: 'BSI', ref: 'ORP.2 Personal' },
				na: false
			},
			{
				id: 'a_uebergabe',
				label: L(
					'Dienstliche Daten übergeben, persönliche Ablagen geräumt',
					'Work data handed over, personal folders cleared'
				),
				cite: { law: 'BSI', ref: 'ORP.2 Personal' }
			},
			{
				id: 'a_postfach',
				label: L(
					'Postfach: Abwesenheitsnotiz mit neuer Kontaktstelle; keine Weiterleitung ohne Regelung',
					'Mailbox: out-of-office note naming a new contact; no forwarding without a rule'
				),
				cite: { law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. f, Art. 6 Abs. 1 lit. f' }
			},
			{
				id: 'a_privat',
				label: L(
					'Private Inhalte nicht eingesehen; Gelegenheit gegeben, sie mitzunehmen oder zu löschen',
					'Private content not viewed; a chance given to take or delete it'
				),
				cite: { law: 'DSK', ref: 'Orientierungshilfe E-Mail und Internet am Arbeitsplatz' },
				scope: ['privatnutzung']
			},
			{
				id: 'a_verzeichnisse',
				label: L(
					'Aus Telefonliste, Organigramm, Verteilern und Website entfernt',
					'Removed from the phone list, org chart, mailing lists and website'
				),
				cite: { law: 'DSGVO', ref: 'Art. 17 Abs. 1 lit. a' }
			},
			{
				id: 'a_foto',
				label: L(
					'Fotos und Veröffentlichungen entfernt, oder geklärt, ob die Einwilligung fortgilt',
					'Photos and publications removed, or settled whether the consent continues'
				),
				cite: { law: 'DSGVO', ref: 'Art. 7 Abs. 3, Art. 17 Abs. 1 lit. b' },
				scope: ['fotos']
			},
			{
				id: 'a_vertraulichkeit',
				label: L(
					'Darauf hingewiesen, dass die Vertraulichkeit über das Ende hinaus gilt',
					'Reminded that confidentiality continues after leaving'
				),
				cite: { law: 'DSK', ref: 'Kurzpapier Nr. 19' }
			},
			{
				id: 'a_sofort',
				label: L(
					'Was nicht aufbewahrt werden muss, gelöscht, etwa Kopien, Zugangsdaten, Notizen',
					'What need not be kept deleted, such as copies, credentials, notes'
				),
				cite: { law: 'DSGVO', ref: 'Art. 17 Abs. 1 lit. a' }
			},
			{
				id: 'a_fristen',
				label: L(
					'Aufbewahrungs- und Löschfristen der Personalakte festgelegt (Werkzeug Löschkonzept)',
					'Retention and deletion periods for the personnel file set (deletion concept tool)'
				),
				cite: { law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. e, Art. 17 Abs. 3 lit. b' },
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
				cite: { law: 'DSGVO', ref: 'Art. 9 Abs. 2 lit. b' }
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

/** what still stands in the way of introducing the process, or null */
export function introductionBlocked(data: RecordData): Localized | null {
	const state = checklist(data, BLOCKS);
	return state.gaps.length > 0 || state.open.length > 0
		? L(
				'Erst alle Punkte der Checkliste erledigen.',
				'Complete every point of the checklist first.'
			)
		: null;
}

/**
 * the HR process of an organisation, from application to exit, set up once.
 * Merges what were the tools Bewerbungsverfahren (one entry per position)
 * and Eintritt und Austritt (one entry per person): a data protection
 * officer sets the process up and checks it, but does not keep an entry for
 * every hire.
 */
export const definition: RecordToolDefinition = {
	slug: 'personalprozesse',
	version: 1,
	intro: L(
		'Ein Eintrag je Organisation oder Standort: der Ablauf von der Bewerbung über Eintritt und Wechsel bis zum Austritt, einmal festgelegt und regelmäßig überprüft. Jeder Punkt fragt, ob der Schritt im Ablauf geregelt ist. Der Umfang bestimmt, welche Teile gelten. Löschfristen und Schulungen liegen in ihren eigenen Werkzeugen und werden verknüpft.',
		'One entry per organisation or site: the process from application through joining and changes of role to leaving, set once and reviewed regularly. Each point asks whether the step is part of the process. The scope decides which parts apply. Erasure periods and training live in their own tools and are linked.'
	),
	sources: [
		{ law: 'DSGVO', ref: 'Art. 5, 6, 9, 13, 17, 32, 88' },
		{ law: 'BDSG', ref: '§ 26' },
		{ law: 'BetrVG', ref: '§ 99' },
		{ law: 'AGG', ref: '§ 15 Abs. 4' }
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'rahmen',
			title: L('Ablauf', 'Process'),
			columns: 2,
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Bezeichnung', 'Name'),
					help: L('Z. B. „Personalprozesse Hauptverwaltung“.', 'E.g. "HR processes head office".'),
					required: true,
					listColumn: true
				},
				{
					id: 'verantwortlich',
					type: 'text',
					label: L('Verantwortlich', 'In charge'),
					listColumn: true
				},
				{
					id: 'ablage',
					type: 'text',
					label: L('Wo liegt die Checkliste je Person?', 'Where is the checklist per person?'),
					help: L(
						'Die Liste, nach der die Personalabteilung jeden Eintritt und Austritt abarbeitet.',
						'The list HR works through for every joining and leaving.'
					)
				},
				{
					id: 'ueberpruefen_am',
					type: 'date',
					label: L('Nächste Überprüfung', 'Next review'),
					help: L('Etwa jährlich.', 'About once a year.'),
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
		{
			id: 'pruefungen',
			title: L('Prüfungen und Verknüpfungen', 'Checks and links'),
			fields: [
				{
					id: 'einstufung',
					type: 'assessment',
					tool: 'risikoklassifizierung',
					label: L(
						'Risikoklassifizierung der KI in der Auswahl',
						'Risk classification of AI in selection'
					),
					when: (data) => inScope(data, ['ki'])
				},
				{
					id: 'foto_check',
					type: 'assessment',
					tool: 'einwilligung-check',
					label: L('Einwilligung für Fotos', 'Consent for photos'),
					when: (data) => inScope(data, ['fotos'])
				},
				{
					id: 'avv',
					type: 'reference',
					tool: 'avv-pruefung',
					label: L('AVV mit dem Bewerberportal', 'Processing agreement with the applicant portal')
				},
				{
					id: 'schulung',
					type: 'reference',
					tool: 'schulungsnachweis',
					label: L('Unterweisung', 'Instruction')
				},
				{
					id: 'loeschkonzept',
					type: 'reference',
					tool: 'loeschkonzept',
					label: L(
						'Löschfristen für Bewerbungen und Personalakten',
						'Erasure periods for applications and personnel files'
					)
				},
				{
					id: 'vvt',
					type: 'reference',
					tool: 'vvt',
					label: L(
						'VVT: Bewerbung und Personalverwaltung',
						'Record of processing: applications and HR'
					)
				}
			]
		},
		...blockSections(BLOCKS),
		{
			id: 'einfuehrung',
			title: L('Einführung', 'Introduction'),
			columns: 2,
			fields: [
				{ id: 'eingefuehrt_am', type: 'date', label: L('Eingeführt am', 'Introduced on') },
				{ id: 'freigabe_durch', type: 'text', label: L('Freigegeben durch', 'Approved by') }
			]
		}
	],
	workflow: {
		states: [
			{ id: 'entwurf', label: L('Entwurf', 'Draft') },
			{ id: 'eingefuehrt', label: L('Eingeführt', 'In place') }
		],
		initialState: 'entwurf',
		transitions: [
			{
				from: 'entwurf',
				to: 'eingefuehrt',
				label: L('Ablauf einführen', 'Put the process in place'),
				requires: ['eingefuehrt_am'],
				check: (record) => introductionBlocked(record.data)
			},
			{ from: 'eingefuehrt', to: 'entwurf', label: L('Überarbeiten', 'Revise') }
		]
	},
	example: {
		bezeichnung: 'Personalprozesse Hauptverwaltung (Beispiel)',
		verantwortlich: 'Leitung Personal',
		ablage: 'Laufwerk Personal, Checkliste Eintritt und Austritt',
		umfang: ['portal', 'betriebsrat', 'privatnutzung', 'geraete'],
		r_rechtsgrundlage: 'ja',
		b_hinweise: 'ja',
		b_fragen: 'nein',
		b_fragen_notiz: 'Das Bewerbungsformular fragt nach dem Familienstand.',
		e_vertraulichkeit: 'ja',
		e_zugaenge: 'ja',
		a_konten: 'nein',
		a_konten_notiz:
			'Konten im Kundensystem bleiben nach dem Austritt aktiv; die IT erfährt nur vom zentralen Konto.',
		a_rueckgabe: 'ja'
	}
};
