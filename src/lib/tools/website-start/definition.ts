import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, inScope, snapshot, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });
const TDDDG = (ref: string): LegalBasis => ({ law: 'TDDDG', ref });

export const DSK_DIGITAL: LegalBasis = {
	law: 'DSK',
	ref: 'Orientierungshilfe Digitale Dienste, Version 1.2 (2024)'
};

export const SCOPES = [
	{
		value: 'tracking',
		label: L(
			'Analyse- oder Marketing-Werkzeuge, nicht nötige Cookies',
			'Analytics or marketing tools, non-essential cookies'
		)
	},
	{
		value: 'einbindungen',
		label: L(
			'Inhalte von fremden Servern: Videos, Karten, Schriften, Social Media',
			'Content from other servers: videos, maps, fonts, social media'
		)
	},
	{
		value: 'drittland',
		label: L(
			'Dienste mit Sitz oder Servern außerhalb des EWR',
			'Services based or hosted outside the EEA'
		)
	},
	{ value: 'formulare', label: L('Kontakt- oder Bewerbungsformulare', 'Contact or job forms') },
	{ value: 'shop', label: L('Online-Shop mit Bestellungen', 'Online shop with orders') },
	{ value: 'konten', label: L('Kundenkonten mit Anmeldung', 'Customer accounts with sign-in') },
	{ value: 'newsletter', label: L('Newsletter', 'Newsletter') },
	{ value: 'chatbot', label: L('KI-Chatbot', 'AI chatbot') }
];

const THIRD_PARTY = ['tracking', 'einbindungen'];

/** the checklist in the order of a launch */
export const BLOCKS: Block[] = [
	{
		id: 'grundlagen',
		title: L('Pflichtangaben und Betrieb', 'Required information and operation'),
		intro: L('Was jede Website braucht.', 'What every website needs.'),
		items: [
			{
				id: 'g_impressum',
				label: L(
					'Impressum vollständig und von jeder Seite leicht erreichbar',
					'Legal notice complete and easy to reach from every page'
				),
				cite: { law: 'DDG', ref: '§ 5' },
				na: false
			},
			{
				id: 'g_datenschutz',
				label: L(
					'Datenschutzerklärung von jeder Seite erreichbar; sie nennt alle eingesetzten Dienste',
					'Privacy notice reachable from every page; it names every service used'
				),
				cite: DSGVO('Art. 12 Abs. 1, Art. 13'),
				na: false
			},
			{
				id: 'g_inventar',
				label: L(
					'Liste aller Cookies, Skripte und Drittdienste erstellt, etwa mit einem Scan',
					'List of all cookies, scripts and third-party services made, for example with a scan'
				),
				cite: DSGVO('Art. 5 Abs. 2')
			},
			{
				id: 'g_hosting',
				label: L(
					'Auftragsverarbeitungsvertrag mit dem Hoster; Serverstandort bekannt (Werkzeug AVV-Prüfung)',
					'Processing agreement with the host; server location known (AVV check tool)'
				),
				cite: DSGVO('Art. 28 Abs. 3')
			},
			{
				id: 'g_https',
				label: L('Durchgehend über HTTPS erreichbar', 'Served over HTTPS throughout'),
				cite: DSGVO('Art. 32 Abs. 1 lit. a'),
				na: false
			},
			{
				id: 'g_logs',
				label: L(
					'Server-Logs nur kurz gespeichert; Speicherdauer festgelegt',
					'Server logs kept only briefly; storage period set'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. e')
			}
		]
	},
	{
		id: 'einwilligung',
		title: L('Cookies und Einwilligung', 'Cookies and consent'),
		intro: L(
			'Für alles, was auf dem Gerät speichert oder ausliest und nicht unbedingt nötig ist.',
			'For anything that stores on or reads from the device and is not strictly necessary.'
		),
		scope: THIRD_PARTY,
		items: [
			{
				id: 'c_vorher',
				label: L(
					'Ohne Einwilligung nur unbedingt Nötiges; alles andere lädt erst danach',
					'Without consent only what is strictly necessary; everything else loads afterwards'
				),
				cite: TDDDG('§ 25 Abs. 1, Abs. 2 Nr. 2'),
				na: false
			},
			{
				id: 'c_ablehnen',
				label: L(
					'Ablehnen schon auf der ersten Ebene des Banners, so einfach wie Zustimmen',
					'Reject already on the banner’s first layer, as easy as accepting'
				),
				cite: DSK_DIGITAL,
				na: false
			},
			{
				id: 'c_nachweis',
				label: L(
					'Einwilligungen werden nachweisbar gespeichert',
					'Consents are stored so they can be proven'
				),
				cite: DSGVO('Art. 7 Abs. 1')
			},
			{
				id: 'c_widerruf',
				label: L(
					'Widerruf jederzeit über einen dauerhaft sichtbaren Link',
					'Withdrawal at any time through a link that is always visible'
				),
				cite: DSGVO('Art. 7 Abs. 3')
			}
		]
	},
	{
		id: 'drittdienste',
		title: L('Drittdienste', 'Third-party services'),
		intro: L(
			'Wer außer Ihnen Daten der Besuchenden erhält.',
			'Who other than you receives visitors’ data.'
		),
		scope: [...THIRD_PARTY, 'drittland'],
		items: [
			{
				id: 'd_lokal',
				label: L(
					'Schriften und Bibliotheken auf dem eigenen Server statt von fremden',
					'Fonts and libraries on your own server instead of someone else’s'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. c, Art. 6 Abs. 1'),
				scope: ['einbindungen']
			},
			{
				id: 'd_klick',
				label: L(
					'Videos, Karten und Social-Media-Inhalte laden erst nach einem Klick',
					'Videos, maps and social media content load only after a click'
				),
				cite: TDDDG('§ 25 Abs. 1'),
				scope: ['einbindungen']
			},
			{
				id: 'd_rolle',
				label: L(
					'Für jeden Dienst die Rolle geklärt: Auftragsverarbeitung, gemeinsame Verantwortung oder eigener Verantwortlicher',
					'For each service the role settled: processor, joint controller or separate controller'
				),
				cite: DSGVO('Art. 26, 28')
			},
			{
				id: 'd_drittland',
				label: L(
					'Grundlage für die Übermittlung festgestellt (Werkzeug Drittland-Transfer)',
					'Basis for the transfer established (third-country transfer tool)'
				),
				cite: DSGVO('Art. 44 bis 46'),
				scope: ['drittland']
			}
		]
	},
	{
		id: 'formulare',
		title: L('Formulare', 'Forms'),
		intro: L('Kontakt-, Anfrage- und Bewerbungsformulare.', 'Contact, enquiry and job forms.'),
		scope: ['formulare'],
		items: [
			{
				id: 'f_pflicht',
				label: L('Nur nötige Felder sind Pflichtfelder', 'Only necessary fields are required'),
				cite: DSGVO('Art. 5 Abs. 1 lit. c')
			},
			{
				id: 'f_hinweis',
				label: L(
					'Am Formular auf die Datenschutzerklärung hingewiesen',
					'The privacy notice is pointed to at the form'
				),
				cite: DSGVO('Art. 13 Abs. 1')
			},
			{
				id: 'f_loeschung',
				label: L(
					'Anfragen werden nach Erledigung gelöscht; Speicherdauer festgelegt',
					'Enquiries are deleted once dealt with; storage period set'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. e')
			}
		]
	},
	{
		id: 'shop',
		title: L('Shop und Kundenkonten', 'Shop and customer accounts'),
		intro: L('Bestellungen, Zahlung und Konten.', 'Orders, payment and accounts.'),
		scope: ['shop', 'konten'],
		items: [
			{
				id: 's_gast',
				label: L(
					'Bestellung auch als Gast möglich, ohne Kundenkonto',
					'Ordering also possible as a guest, without an account'
				),
				cite: { law: 'DSK', ref: 'Beschluss vom 24.03.2022 zum Online-Handel' },
				help: L(
					'Der Beschluss ist nicht bindend; Gerichte haben Ausnahmen anerkannt, etwa für Marktplätze. Eine Ausnahme hier begründen.',
					'The resolution is not binding; courts have accepted exceptions, for example for marketplaces. Give the reason for an exception here.'
				),
				scope: ['shop']
			},
			{
				id: 's_zahlung',
				label: L(
					'Zahlungs- und Versanddienstleister in der Datenschutzerklärung; Bonitätsprüfung nur mit Hinweis',
					'Payment and shipping providers in the privacy notice; credit checks only with notice'
				),
				cite: DSGVO('Art. 6 Abs. 1 lit. b, Art. 13'),
				scope: ['shop']
			},
			{
				id: 's_aufbewahrung',
				label: L(
					'Bestelldaten nach den handels- und steuerrechtlichen Fristen gelöscht',
					'Order data deleted after the commercial and tax retention periods'
				),
				cite: DSGVO('Art. 17 Abs. 3 lit. b'),
				scope: ['shop']
			},
			{
				id: 's_konto',
				label: L(
					'Kundenkonto selbst löschbar; Passwörter sicher gespeichert',
					'Customer account can be deleted by the customer; passwords stored securely'
				),
				cite: DSGVO('Art. 17 Abs. 1, Art. 32 Abs. 1'),
				scope: ['konten']
			}
		]
	},
	{
		id: 'newsletter',
		title: L('Newsletter', 'Newsletter'),
		intro: L('Werbung per E-Mail.', 'Advertising by email.'),
		scope: ['newsletter'],
		items: [
			{
				id: 'n_doi',
				label: L(
					'Anmeldung mit Bestätigungsmail (Double-Opt-in), protokolliert',
					'Sign-up confirmed by email (double opt-in), logged'
				),
				cite: DSGVO('Art. 7 Abs. 1'),
				na: false
			},
			{
				id: 'n_einwilligung',
				label: L(
					'Werbemails nur mit ausdrücklicher Einwilligung oder in den engen Grenzen der Bestandskundenregel',
					'Advertising emails only with express consent or within the narrow existing-customer rule'
				),
				cite: { law: 'UWG', ref: '§ 7 Abs. 2 Nr. 2, Abs. 3' },
				na: false
			},
			{
				id: 'n_abmelden',
				label: L('Abmeldelink in jeder Mail', 'Unsubscribe link in every email'),
				cite: { law: 'UWG', ref: '§ 7 Abs. 3 Nr. 4' }
			},
			{
				id: 'n_versand',
				label: L(
					'Auftragsverarbeitungsvertrag mit dem Versanddienst',
					'Processing agreement with the mailing service'
				),
				cite: DSGVO('Art. 28 Abs. 3')
			}
		]
	},
	{
		id: 'chatbot',
		title: L('KI-Chatbot', 'AI chatbot'),
		intro: L('Wenn Besuchende mit einer KI schreiben.', 'When visitors chat with an AI.'),
		scope: ['chatbot'],
		items: [
			{
				id: 'k_hinweis',
				label: L(
					'Klarer Hinweis, dass man mit einer KI schreibt (Werkzeug Transparenzpflichten)',
					'Clear notice that one is chatting with an AI (transparency duties tool)'
				),
				cite: { law: 'KI-VO', ref: 'Art. 50 Abs. 1' },
				na: false
			},
			{
				id: 'k_daten',
				label: L(
					'Eingaben dienen nicht dem Training des Anbieters; Speicherdauer festgelegt',
					'Inputs are not used to train the provider’s model; storage period set'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. b, e')
			}
		]
	},
	{
		id: 'freigabe',
		title: L('Vor dem Start', 'Before launch'),
		intro: L('Der letzte Schritt vor dem Livegang.', 'The last step before going live.'),
		items: [
			{
				id: 'r_test',
				label: L(
					'Mit frischem Browser geprüft: Ohne Einwilligung lädt nichts von Dritten',
					'Checked in a fresh browser: nothing from third parties loads without consent'
				),
				cite: TDDDG('§ 25 Abs. 1'),
				scope: THIRD_PARTY
			},
			{
				id: 'r_vvt',
				label: L(
					'Eintrag im Verzeichnis von Verarbeitungstätigkeiten',
					'Entry in the record of processing activities'
				),
				cite: DSGVO('Art. 30 Abs. 1')
			},
			{
				id: 'r_dsb',
				label: L('Datenschutzbeauftragter eingebunden', 'Data protection officer involved'),
				cite: DSGVO('Art. 38 Abs. 1')
			}
		]
	}
];

/** the checks a scope requires, with the field that holds each result */
export const REQUIRED_CHECKS: { field: string; scope: string[]; label: Localized }[] = [
	{
		field: 'consent_check',
		scope: ['tracking'],
		label: L('Einwilligungs-Check für das Banner', 'consent check for the banner')
	},
	{
		field: 'transfer_check',
		scope: ['drittland'],
		label: L('Drittlandprüfung', 'third-country check')
	},
	{
		field: 'ki_check',
		scope: ['chatbot'],
		label: L('Prüfung der Transparenzpflichten', 'transparency duties check')
	}
];

/** the checks the scope requires that are not attached yet */
export const missingChecks = (data: RecordData) =>
	REQUIRED_CHECKS.filter((c) => inScope(data, c.scope) && !snapshot(data, c.field));

/** what still stands in the way of approval, or null */
export function approvalBlocked(data: RecordData): Localized | null {
	const state = checklist(data, BLOCKS);
	if (state.gaps.length > 0 || state.open.length > 0) {
		return L(
			'Erst alle Punkte der Checkliste erledigen.',
			'Complete every point of the checklist first.'
		);
	}
	const missing = missingChecks(data);
	if (missing.length > 0) {
		return L(
			`Erst durchführen: ${missing.map((c) => c.label.de).join(', ')}.`,
			`Run first: ${missing.map((c) => c.label.en).join(', ')}.`
		);
	}
	return null;
}

/** launching or rebuilding a website or shop, from the first check to approval */
export const definition: RecordToolDefinition = {
	slug: 'website-start',
	version: 1,
	intro: L(
		'Ein Eintrag je Website oder Shop, beim Start oder bei einem Umbau. Der Umfang bestimmt, welche Teile gelten. Einwilligungs-Check, Drittlandprüfung, Transparenzpflichten und AVV-Prüfung werden verknüpft, nicht wiederholt.',
		'One entry per website or shop, at launch or when rebuilt. The scope decides which parts apply. The consent check, third-country check, transparency duties and processing agreement check are linked, not repeated.'
	),
	sources: [
		{ law: 'DDG', ref: '§ 5' },
		TDDDG('§ 25'),
		DSGVO('Art. 5, 7, 13, 28, 32, 44'),
		DSK_DIGITAL,
		{ law: 'UWG', ref: '§ 7' }
	],
	titleField: 'bezeichnung',
	example: {
		bezeichnung: 'beispiel.de, Relaunch',
		adresse: 'https://www.beispiel.de',
		verantwortlich: 'Marketing',
		umfang: ['tracking', 'einbindungen', 'formulare', 'newsletter'],
		g_impressum: 'ja',
		g_datenschutz: 'ja',
		g_https: 'ja',
		c_ablehnen: 'nein',
		c_ablehnen_notiz: 'Banner zeigt Ablehnen erst unter „Einstellungen“.',
		d_lokal: 'ja'
	},
	sections: [
		{
			id: 'vorhaben',
			title: L('Website', 'Website'),
			columns: 2,
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Website oder Shop', 'Website or shop'),
					help: L('Z. B. „Shop beispiel.de, Relaunch“.', 'E.g. "Shop example.com, relaunch".'),
					required: true,
					listColumn: true
				},
				{ id: 'adresse', type: 'text', label: L('Adresse', 'Address') },
				{
					id: 'start_am',
					type: 'date',
					label: L('Geplanter Start', 'Planned launch'),
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
					id: 'consent_check',
					type: 'assessment',
					tool: 'einwilligung-check',
					label: L('Einwilligungs-Check (bei Tracking)', 'Consent check (with tracking)'),
					cite: TDDDG('§ 25 Abs. 1')
				},
				{
					id: 'transfer_check',
					type: 'assessment',
					tool: 'drittland-transfer',
					label: L('Drittlandprüfung (bei Drittland)', 'Third-country check (if relevant)'),
					cite: DSGVO('Art. 44')
				},
				{
					id: 'ki_check',
					type: 'assessment',
					tool: 'transparenzpflichten',
					label: L('Transparenzpflichten (bei Chatbot)', 'Transparency duties (with a chatbot)'),
					cite: { law: 'KI-VO', ref: 'Art. 50' }
				},
				{
					id: 'avv',
					type: 'reference',
					tool: 'avv-pruefung',
					label: L('AVV-Prüfung (Hoster)', 'Processing agreement check (host)')
				},
				{
					id: 'vvt',
					type: 'reference',
					tool: 'vvt',
					label: L('Eintrag im VVT', 'Record of processing entry')
				}
			]
		},
		...blockSections(BLOCKS),
		{
			id: 'abschluss',
			title: L('Freigabe', 'Approval'),
			columns: 2,
			fields: [
				{ id: 'freigabe_am', type: 'date', label: L('Freigegeben am', 'Approved on') },
				{ id: 'freigabe_durch', type: 'text', label: L('Freigegeben durch', 'Approved by') },
				{
					id: 'wiedervorlage',
					type: 'date',
					label: L('Wiedervorlage', 'Next review'),
					help: L(
						'Spätestens wenn ein neuer Dienst eingebunden wird erneut prüfen.',
						'Check again at the latest when a new service is added.'
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
				requires: ['freigabe_am'],
				check: (record) => approvalBlocked(record.data)
			},
			{ from: 'pruefung', to: 'abgelehnt', label: L('Ablehnen', 'Reject') },
			{ from: 'freigegeben', to: 'pruefung', label: L('Erneut prüfen', 'Review again') },
			{ from: 'abgelehnt', to: 'pruefung', label: L('Wieder aufnehmen', 'Reopen') }
		]
	}
};
