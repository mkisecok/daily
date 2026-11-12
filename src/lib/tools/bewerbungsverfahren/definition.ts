import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, inScope, snapshot, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });

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
	{ value: 'pool', label: L('Talentpool für spätere Stellen', 'Talent pool for later jobs') }
];

/** the checklist in the order of a hiring procedure */
export const BLOCKS: Block[] = [
	{
		id: 'eingang',
		title: L('Ausschreibung und Eingang', 'Job ad and receipt'),
		intro: L('Bevor die erste Bewerbung ankommt.', 'Before the first application arrives.'),
		items: [
			{
				id: 'a_hinweise',
				label: L(
					'Datenschutzhinweise für Bewerbende an der Anzeige oder im Portal',
					'Privacy notice for applicants at the ad or in the portal'
				),
				cite: DSGVO('Art. 13'),
				na: false
			},
			{
				id: 'a_kanal',
				label: L(
					'Sicherer Eingangsweg; keine Weiterleitung an private Postfächer',
					'Secure way in; no forwarding to private mailboxes'
				),
				cite: DSGVO('Art. 32 Abs. 1')
			},
			{
				id: 'a_fragen',
				label: L(
					'Nur Angaben erfragt, die für die Stelle nötig sind; keine Fragen nach Gesundheit, Religion oder Familienplanung',
					'Only details needed for the job asked; no questions about health, religion or family plans'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. c, Art. 9 Abs. 1')
			},
			{
				id: 'a_avv',
				label: L(
					'Auftragsverarbeitungsvertrag mit dem Portalanbieter (Werkzeug AVV-Prüfung)',
					'Processing agreement with the portal provider (AVV check tool)'
				),
				cite: DSGVO('Art. 28 Abs. 3'),
				scope: ['portal']
			}
		]
	},
	{
		id: 'auswahl',
		title: L('Auswahl', 'Selection'),
		intro: L(
			'Wer die Unterlagen sieht und was sonst einfließt.',
			'Who sees the documents and what else goes in.'
		),
		items: [
			{
				id: 's_zugriff',
				label: L(
					'Zugriff nur für Personen, die an der Entscheidung beteiligt sind',
					'Access only for people involved in the decision'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. f'),
				na: false
			},
			{
				id: 's_rechtsgrundlage',
				label: L(
					'Rechtsgrundlage geprüft (§ 26 Abs. 1 BDSG ist seit EuGH C-34/21 umstritten)',
					'Legal basis checked (§ 26(1) BDSG is disputed since CJEU C-34/21)'
				),
				cite: DSGVO('Art. 6 Abs. 1 lit. b, Art. 88')
			},
			{
				id: 's_recherche',
				label: L(
					'Keine Recherche in privaten sozialen Netzwerken; berufliche Netzwerke nur mit Bezug zur Stelle und mit Hinweis',
					'No research in private social networks; professional networks only with a link to the job and with notice'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. c, Art. 14')
			},
			{
				id: 's_betriebsrat',
				label: L(
					'Betriebsrat vor der Einstellung unterrichtet, mit den erforderlichen Bewerbungsunterlagen',
					'Works council informed before the hire, with the necessary application documents'
				),
				cite: { law: 'BetrVG', ref: '§ 99 Abs. 1' },
				scope: ['betriebsrat']
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
				id: 'p_grundlage',
				label: L(
					'Führungszeugnis nur, wo für die Stelle gesetzlich vorgesehen oder nachweisbar erforderlich',
					'Certificate of conduct only where the law provides for it or it is shown to be necessary'
				),
				cite: DSGVO('Art. 10')
			},
			{
				id: 'p_einsicht',
				label: L(
					'Einsicht und Vermerk statt Kopie, wo das genügt',
					'Viewing and noting instead of copying, where that is enough'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. c')
			}
		]
	},
	{
		id: 'ki',
		title: L('KI in der Auswahl', 'AI in selection'),
		intro: L(
			'KI-Systeme, die Bewerbungen sichten, filtern oder bewerten, sind nach Anhang III Nr. 4 KI-VO hochriskant.',
			'AI systems that screen, filter or rate applications are high-risk under Annex III no. 4 AI Act.'
		),
		scope: ['ki'],
		items: [
			{
				id: 'k_einstufung',
				label: L(
					'Risikoklasse festgestellt (Werkzeug Risikoklassifizierung)',
					'Risk class established (risk classification tool)'
				),
				cite: { law: 'KI-VO', ref: 'Anhang III Nr. 4 lit. a' },
				na: false
			},
			{
				id: 'k_mensch',
				label: L(
					'Keine Absage allein durch das System; ein Mensch entscheidet',
					'No rejection by the system alone; a person decides'
				),
				cite: DSGVO('Art. 22 Abs. 1'),
				na: false
			},
			{
				id: 'k_information',
				label: L(
					'Bewerbende über den Einsatz des Systems informiert',
					'Applicants informed that the system is used'
				),
				cite: { law: 'KI-VO', ref: 'Art. 26 Abs. 11' },
				help: L(
					'Die Pflichten für Hochrisiko-Systeme des Anhangs III gelten ab dem 2. Dezember 2027; der Hinweis in den Datenschutzhinweisen ist schon nach Art. 13 DSGVO nötig.',
					'The duties for Annex III high-risk systems apply from 2 December 2027; the notice in the privacy information is already required under Art. 13 GDPR.'
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
				id: 't_einwilligung',
				label: L(
					'Einwilligung für den Talentpool getrennt eingeholt, freiwillig und widerruflich',
					'Consent for the talent pool obtained separately, voluntary and revocable'
				),
				cite: DSGVO('Art. 6 Abs. 1 lit. a, Art. 7'),
				na: false
			},
			{
				id: 't_dauer',
				label: L(
					'Dauer im Talentpool festgelegt; danach wird gelöscht',
					'Time in the talent pool set; deletion follows'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. e')
			}
		]
	},
	{
		id: 'ende',
		title: L('Nach der Entscheidung', 'After the decision'),
		intro: L('Übernahme und Löschung.', 'Taking over and deleting.'),
		items: [
			{
				id: 'e_uebernahme',
				label: L(
					'Bei Einstellung nur Nötiges in die Personalakte übernommen (Werkzeug Eintritt und Austritt)',
					'On hiring, only what is needed taken into the personnel file (staff joining and leaving tool)'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. c')
			},
			{
				id: 'e_loeschung',
				label: L(
					'Unterlagen abgelehnter Bewerbender nach Ablauf der Fristen des AGG gelöscht',
					'Rejected applicants’ documents deleted once the AGG periods have run'
				),
				cite: DSGVO('Art. 17 Abs. 1 lit. a'),
				help: L(
					'Ansprüche wegen Benachteiligung sind binnen zwei Monaten nach der Absage schriftlich geltend zu machen (§ 15 Abs. 4 AGG), die Klage folgt binnen drei weiteren Monaten (§ 61b ArbGG). Häufig werden daher sechs Monate nach der Absage genannt.',
					'Discrimination claims must be made in writing within two months of the rejection (§ 15(4) AGG), and an action within three further months (§ 61b ArbGG). Six months after the rejection is therefore often given.'
				),
				na: false
			},
			{
				id: 'e_portal',
				label: L(
					'Daten auch im Bewerberportal gelöscht',
					'Data also deleted in the applicant portal'
				),
				cite: DSGVO('Art. 17 Abs. 1'),
				scope: ['portal']
			}
		]
	}
];

/** what still stands in the way of closing the procedure, or null */
export function closingBlocked(data: RecordData): Localized | null {
	const state = checklist(data, BLOCKS);
	if (state.gaps.length > 0 || state.open.length > 0) {
		return L(
			'Erst alle Punkte der Checkliste erledigen.',
			'Complete every point of the checklist first.'
		);
	}
	if (inScope(data, ['ki']) && !snapshot(data, 'einstufung')) {
		return L(
			'Erst die Risikoklassifizierung des KI-Systems durchführen.',
			'Run the AI system’s risk classification first.'
		);
	}
	return null;
}

/** one hiring procedure, from the job ad to deleting the rejected applications */
export const definition: RecordToolDefinition = {
	slug: 'bewerbungsverfahren',
	version: 1,
	intro: L(
		'Ein Eintrag je ausgeschriebener Stelle. Der Umfang bestimmt, welche Teile gelten. Die Unterlagen abgelehnter Bewerbender werden gelöscht, sobald mögliche Ansprüche nach dem AGG nicht mehr geltend gemacht werden können; Daily rechnet die Frist ab der Absage.',
		'One entry per advertised job. The scope decides which parts apply. Rejected applicants’ documents are deleted once possible claims under the AGG can no longer be made; Daily counts the period from the rejection.'
	),
	sources: [
		DSGVO('Art. 5, 6, 10, 13, 17, 22, 88'),
		{ law: 'BetrVG', ref: '§ 99 Abs. 1' },
		{ law: 'AGG', ref: '§ 15 Abs. 4' },
		{ law: 'ArbGG', ref: '§ 61b Abs. 1' },
		{ law: 'KI-VO', ref: 'Anhang III Nr. 4, Art. 26 Abs. 11' }
	],
	titleField: 'stelle',
	sections: [
		{
			id: 'vorhaben',
			title: L('Stelle', 'The job'),
			columns: 2,
			fields: [
				{
					id: 'stelle',
					type: 'text',
					label: L('Stelle', 'Job'),
					help: L(
						'Z. B. „Buchhaltung, Teilzeit, 2026-14“.',
						'E.g. "Accounting, part-time, 2026-14".'
					),
					required: true,
					listColumn: true
				},
				{ id: 'bereich', type: 'text', label: L('Bereich', 'Department') },
				{
					id: 'ausgeschrieben_am',
					type: 'date',
					label: L('Ausgeschrieben am', 'Advertised on')
				},
				{
					id: 'absagen_am',
					type: 'date',
					label: L('Absagen versandt am', 'Rejections sent on'),
					help: L(
						'Daraus berechnet Daily, ab wann die Unterlagen zu löschen sind.',
						'Daily works out from this when the documents are to be deleted.'
					),
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
					id: 'einstufung',
					type: 'assessment',
					tool: 'risikoklassifizierung',
					label: L('Risikoklassifizierung (bei KI)', 'Risk classification (with AI)'),
					cite: { law: 'KI-VO', ref: 'Art. 6' }
				},
				{
					id: 'avv',
					type: 'reference',
					tool: 'avv-pruefung',
					label: L('AVV-Prüfung (Portal)', 'Processing agreement check (portal)')
				},
				{
					id: 'vvt',
					type: 'reference',
					tool: 'vvt',
					label: L('VVT: Bewerbungsverfahren', 'Record of processing: hiring')
				}
			]
		},
		...blockSections(BLOCKS),
		{
			id: 'abschluss',
			title: L('Abschluss', 'Closing'),
			columns: 2,
			fields: [
				{ id: 'geloescht_am', type: 'date', label: L('Gelöscht am', 'Deleted on') },
				{ id: 'geloescht_durch', type: 'text', label: L('Gelöscht durch', 'Deleted by') }
			]
		}
	],
	workflow: {
		states: [
			{ id: 'laeuft', label: L('Läuft', 'Running') },
			{ id: 'entschieden', label: L('Entschieden', 'Decided') },
			{ id: 'abgeschlossen', label: L('Abgeschlossen', 'Closed'), terminal: true }
		],
		initialState: 'laeuft',
		transitions: [
			{
				from: 'laeuft',
				to: 'entschieden',
				label: L('Absagen versandt', 'Rejections sent'),
				requires: ['absagen_am']
			},
			{ from: 'entschieden', to: 'laeuft', label: L('Wieder öffnen', 'Reopen') },
			{
				from: 'entschieden',
				to: 'abgeschlossen',
				label: L('Unterlagen gelöscht', 'Documents deleted'),
				requires: ['geloescht_am'],
				check: (record) => closingBlocked(record.data)
			}
		]
	},
	example: {
		stelle: 'Buchhaltung, Teilzeit (Beispiel)',
		bereich: 'Finanzen',
		ausgeschrieben_am: '2026-10-01',
		verantwortlich: 'Personal',
		umfang: ['portal', 'betriebsrat', 'pool'],
		a_hinweise: 'ja',
		a_avv: 'ja',
		s_zugriff: 'ja',
		t_einwilligung: 'nein',
		t_einwilligung_notiz: 'Portal fragt den Talentpool bisher mit der Bewerbung zusammen ab.'
	}
};
