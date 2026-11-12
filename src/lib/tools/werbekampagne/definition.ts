import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, inScope, snapshot, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });
const UWG = (ref: string): LegalBasis => ({ law: 'UWG', ref });

export const SCOPES = [
	{ value: 'email', label: L('E-Mail oder Newsletter', 'Email or newsletter') },
	{
		value: 'bestandskunden',
		label: L(
			'E-Mails an Bestandskunden ohne Einwilligung',
			'Emails to existing customers without consent'
		)
	},
	{ value: 'telefon', label: L('Anrufe bei Verbrauchern', 'Calls to consumers') },
	{ value: 'post', label: L('Werbebriefe', 'Advertising letters') },
	{
		value: 'gekauft',
		label: L('Gekaufte oder gemietete Adressen', 'Bought or rented addresses')
	},
	{ value: 'tracking', label: L('Öffnungs- oder Klickmessung', 'Open or click tracking') },
	{ value: 'dienstleister', label: L('Ein Versanddienst verschickt', 'A mailing service sends') },
	{
		value: 'drittland',
		label: L('Der Versanddienst sitzt außerhalb des EWR', 'The mailing service is outside the EEA')
	}
];

/** the checklist in the order of a campaign */
export const BLOCKS: Block[] = [
	{
		id: 'grundlage',
		title: L('Grundlage', 'Basis'),
		intro: L('Was für jede Werbung gilt.', 'What applies to any advertising.'),
		items: [
			{
				id: 'g_zweck',
				label: L(
					'Kampagne, Zielgruppe und Kanäle festgelegt',
					'Campaign, audience and channels set'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. b')
			},
			{
				id: 'g_hinweis',
				label: L(
					'Datenschutzhinweise nennen die Direktwerbung und das Widerspruchsrecht',
					'Privacy notices name direct marketing and the right to object'
				),
				cite: DSGVO('Art. 21 Abs. 4'),
				na: false
			},
			{
				id: 'g_sperrliste',
				label: L(
					'Widersprüche werden sofort beachtet und in einer Sperrliste geführt',
					'Objections are honoured at once and kept on a suppression list'
				),
				cite: DSGVO('Art. 21 Abs. 2, 3'),
				na: false
			}
		]
	},
	{
		id: 'email',
		title: L('E-Mail', 'Email'),
		intro: L('Newsletter und andere Werbe-E-Mails.', 'Newsletters and other advertising emails.'),
		scope: ['email'],
		items: [
			{
				id: 'e_einwilligung',
				label: L(
					'Ausdrückliche Einwilligung vor dem ersten Versand, nachgewiesen mit Double-Opt-in',
					'Express consent before the first mailing, proven with double opt-in'
				),
				cite: UWG('§ 7 Abs. 2 Nr. 2'),
				help: L(
					'Entfällt nur für Empfänger, bei denen alle Voraussetzungen der Bestandskundenregel erfüllt sind.',
					'Not applicable only for recipients who meet every condition of the existing-customer rule.'
				)
			},
			{
				id: 'e_absender',
				label: L(
					'Absender und werblicher Charakter in Kopf- und Betreffzeile erkennbar',
					'Sender and commercial nature recognisable in the header and subject line'
				),
				cite: { law: 'DDG', ref: '§ 6 Abs. 2' },
				na: false
			},
			{
				id: 'e_abmelden',
				label: L(
					'Abmeldelink in jeder Mail; Abmelden ohne Anmeldung möglich',
					'Unsubscribe link in every mail; unsubscribing works without signing in'
				),
				cite: DSGVO('Art. 7 Abs. 3, Art. 21 Abs. 3'),
				na: false
			}
		]
	},
	{
		id: 'bestand',
		title: L('Bestandskundenregel', 'Existing-customer rule'),
		intro: L(
			'E-Mail-Werbung ohne Einwilligung nur, wenn alle Voraussetzungen zusammen erfüllt sind.',
			'Email advertising without consent only when every condition is met at once.'
		),
		scope: ['bestandskunden'],
		items: [
			{
				id: 'b_kauf',
				label: L(
					'Adresse beim Verkauf einer Ware oder Dienstleistung vom Kunden selbst erhalten',
					'Address received from the customer when selling goods or a service'
				),
				cite: UWG('§ 7 Abs. 3 Nr. 1'),
				na: false
			},
			{
				id: 'b_aehnlich',
				label: L(
					'Werbung nur für eigene ähnliche Waren oder Dienstleistungen',
					'Advertising only for own similar goods or services'
				),
				cite: UWG('§ 7 Abs. 3 Nr. 2'),
				na: false
			},
			{
				id: 'b_widerspruch',
				label: L(
					'Kein Widerspruch; Hinweis auf das kostenlose Widerspruchsrecht schon bei der Erhebung und in jeder Mail',
					'No objection; notice of the free right to object at collection and in every mail'
				),
				cite: UWG('§ 7 Abs. 3 Nr. 3, 4'),
				na: false
			}
		]
	},
	{
		id: 'telefon',
		title: L('Telefon', 'Phone'),
		intro: L('Werbeanrufe bei Verbrauchern.', 'Advertising calls to consumers.'),
		scope: ['telefon'],
		items: [
			{
				id: 't_einwilligung',
				label: L(
					'Nur mit vorheriger ausdrücklicher Einwilligung angerufen',
					'Called only with prior express consent'
				),
				cite: UWG('§ 7 Abs. 2 Nr. 1'),
				na: false
			},
			{
				id: 't_doku',
				label: L(
					'Einwilligung bei Erteilung dokumentiert und fünf Jahre ab Erteilung und nach jeder Verwendung aufbewahrt',
					'Consent documented when given and kept for five years from then and after each use'
				),
				cite: UWG('§ 7a'),
				na: false
			}
		]
	},
	{
		id: 'post',
		title: L('Werbebriefe', 'Advertising letters'),
		intro: L(
			'Briefwerbung kann auf das berechtigte Interesse gestützt werden, solange niemand widerspricht.',
			'Postal advertising can rest on legitimate interest as long as nobody objects.'
		),
		scope: ['post'],
		items: [
			{
				id: 'p_abwaegung',
				label: L(
					'Interessenabwägung dokumentiert (Werkzeug Interessenabwägung)',
					'Legitimate-interest assessment documented (legitimate-interest tool)'
				),
				cite: DSGVO('Art. 6 Abs. 1 lit. f, ErwG 47')
			},
			{
				id: 'p_herkunft',
				label: L(
					'Herkunft der Adressen bekannt und auf Nachfrage benennbar',
					'Source of the addresses known and can be named on request'
				),
				cite: DSGVO('Art. 15 Abs. 1 lit. g')
			}
		]
	},
	{
		id: 'listen',
		title: L('Gekaufte oder gemietete Adressen', 'Bought or rented addresses'),
		intro: L(
			'Fremde Listen sind das häufigste Risiko in Werbekampagnen.',
			'Third-party lists are the most common risk in campaigns.'
		),
		scope: ['gekauft'],
		items: [
			{
				id: 'l_einwilligung',
				label: L(
					'Für E-Mail und Telefon: Einwilligungen belegt, die ausdrücklich Ihr Unternehmen als Werbenden nennen',
					'For email and phone: consents on file that expressly name your company as advertiser'
				),
				cite: DSGVO('Art. 7 Abs. 1')
			},
			{
				id: 'l_information',
				label: L(
					'Betroffene spätestens bei der ersten Kontaktaufnahme über die Herkunft informiert',
					'Data subjects told about the source at the latest at first contact'
				),
				cite: DSGVO('Art. 14 Abs. 2 lit. f, Abs. 3 lit. b')
			}
		]
	},
	{
		id: 'messung',
		title: L('Messung', 'Tracking'),
		intro: L('Öffnungs- und Klickmessung in Mails.', 'Open and click tracking in mails.'),
		scope: ['tracking'],
		items: [
			{
				id: 'm_einwilligung',
				label: L(
					'Öffnungs- und Klickmessung nur mit Einwilligung',
					'Open and click tracking only with consent'
				),
				cite: { law: 'TDDDG', ref: '§ 25 Abs. 1' }
			},
			{
				id: 'm_hinweis',
				label: L(
					'Auswertung und Segmentierung in den Datenschutzhinweisen beschrieben',
					'Evaluation and segmentation described in the privacy notice'
				),
				cite: DSGVO('Art. 13 Abs. 1 lit. c')
			}
		]
	},
	{
		id: 'versand',
		title: L('Versanddienst', 'Mailing service'),
		intro: L('Wenn ein Dienstleister verschickt.', 'When a provider sends the mailing.'),
		scope: ['dienstleister', 'drittland'],
		items: [
			{
				id: 'v_avv',
				label: L(
					'Auftragsverarbeitungsvertrag mit dem Versanddienst (Werkzeug AVV-Prüfung)',
					'Processing agreement with the mailing service (AVV check tool)'
				),
				cite: DSGVO('Art. 28 Abs. 3')
			},
			{
				id: 'v_drittland',
				label: L(
					'Grundlage für die Übermittlung festgestellt (Werkzeug Drittland-Transfer)',
					'Basis for the transfer established (third-country transfer tool)'
				),
				cite: DSGVO('Art. 44 bis 46'),
				scope: ['drittland']
			}
		]
	}
];

/** the attached checks the scope requires */
export const REQUIRED_CHECKS = [
	{
		field: 'abwaegung',
		scope: ['post'],
		label: L('Interessenabwägung', 'legitimate-interest assessment')
	},
	{
		field: 'transfer_check',
		scope: ['drittland'],
		label: L('Drittlandprüfung', 'third-country check')
	}
];

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

/** a newsletter or advertising campaign, from planning to the approval to send */
export const definition: RecordToolDefinition = {
	slug: 'werbekampagne',
	version: 1,
	intro: L(
		'Ein Eintrag je Newsletter oder Kampagne. Die Kanäle bestimmen, welche Teile gelten: E-Mail und Telefon brauchen grundsätzlich eine Einwilligung (§ 7 UWG), Briefwerbung kann auf das berechtigte Interesse gestützt werden. Ein Widerspruch beendet jede Direktwerbung (Art. 21 Abs. 3 DSGVO).',
		'One entry per newsletter or campaign. The channels decide which parts apply: email and phone generally need consent (§ 7 UWG), postal advertising can rest on legitimate interest. An objection ends all direct marketing (Art. 21(3) GDPR).'
	),
	sources: [
		UWG('§ 7, § 7a'),
		{ law: 'DDG', ref: '§ 6 Abs. 2' },
		DSGVO('Art. 6 Abs. 1 lit. f, 7, 14, 21'),
		{ law: 'TDDDG', ref: '§ 25' }
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'vorhaben',
			title: L('Kampagne', 'Campaign'),
			columns: 2,
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Bezeichnung', 'Name'),
					help: L('Z. B. „Frühjahrsaktion 2027“.', 'E.g. "Spring promotion 2027".'),
					required: true,
					listColumn: true
				},
				{ id: 'zielgruppe', type: 'text', label: L('Zielgruppe', 'Audience') },
				{
					id: 'versand_am',
					type: 'date',
					label: L('Geplanter Versand', 'Planned send date'),
					listColumn: true
				},
				{ id: 'verantwortlich', type: 'text', label: L('Verantwortlich', 'In charge') },
				{
					id: 'umfang',
					type: 'multiselect',
					label: L('Kanäle und Umstände', 'Channels and circumstances'),
					help: L(
						'Bestimmt, welche Teile der Checkliste gelten.',
						'Decides which parts of the checklist apply.'
					),
					options: SCOPES
				}
			]
		},
		{
			id: 'pruefungen',
			title: L('Prüfungen und Verknüpfungen', 'Checks and links'),
			fields: [
				{
					id: 'abwaegung',
					type: 'assessment',
					tool: 'interessenabwaegung',
					label: L('Interessenabwägung (bei Briefen)', 'Legitimate-interest assessment (letters)'),
					cite: DSGVO('Art. 6 Abs. 1 lit. f')
				},
				{
					id: 'transfer_check',
					type: 'assessment',
					tool: 'drittland-transfer',
					label: L('Drittlandprüfung (bei Drittland)', 'Third-country check (if relevant)'),
					cite: DSGVO('Art. 44')
				},
				{
					id: 'avv',
					type: 'reference',
					tool: 'avv-pruefung',
					label: L('AVV-Prüfung (Versanddienst)', 'Processing agreement check (mailing service)')
				},
				{
					id: 'vvt',
					type: 'reference',
					tool: 'vvt',
					label: L('VVT: Direktwerbung', 'Record of processing: direct marketing')
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
				{ id: 'freigabe_durch', type: 'text', label: L('Freigegeben durch', 'Approved by') }
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
	},
	example: {
		bezeichnung: 'Frühjahrsaktion (Beispiel)',
		zielgruppe: 'Kundinnen und Kunden der letzten zwei Jahre',
		verantwortlich: 'Marketing',
		umfang: ['email', 'bestandskunden', 'tracking', 'dienstleister'],
		g_zweck: 'ja',
		g_sperrliste: 'ja',
		e_absender: 'ja',
		b_aehnlich: 'nein',
		b_aehnlich_notiz: 'Aktion bewirbt auch Partnerprodukte.',
		m_einwilligung: 'nein'
	}
};
