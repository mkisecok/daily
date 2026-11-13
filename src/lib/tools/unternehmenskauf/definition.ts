import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, inScope, snapshot, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });
const BGB = (ref: string): LegalBasis => ({ law: 'BGB', ref });

export const DSK_ASSET: LegalBasis = {
	law: 'DSK',
	ref: 'Beschluss Asset Deal (11.09.2024)'
};

export const DEALS = [
	{
		value: 'asset',
		label: L(
			'Asset Deal (Kauf einzelner Wirtschaftsgüter)',
			'Asset deal (buying individual assets)'
		)
	},
	{ value: 'share', label: L('Share Deal (Kauf von Anteilen)', 'Share deal (buying shares)') },
	{
		value: 'umwandlung',
		label: L('Verschmelzung oder Umwandlung', 'Merger or conversion')
	}
];

export const SCOPES = [
	{
		value: 'beschaeftigte',
		label: L(
			'Beschäftigte gehen über (Betriebsübergang)',
			'Staff transfer (transfer of undertaking)'
		)
	},
	{
		value: 'nur_kunden',
		label: L('Kundendaten sind das einzige verkaufte Gut', 'Customer data is the only asset sold')
	},
	{
		value: 'drittland',
		label: L('Käufer oder Konzern außerhalb des EWR', 'Buyer or group outside the EEA')
	}
];

/** the deal type chosen in the entry */
export const dealOf = (data: RecordData) =>
	typeof data.art === 'string' && data.art ? data.art : null;

/** the checklist in the order of a transaction */
export const BLOCKS: Block[] = [
	{
		id: 'datenraum',
		title: L('Due Diligence', 'Due diligence'),
		intro: L(
			'Solange verhandelt wird, gehören personenbezogene Daten grundsätzlich nicht in den Datenraum.',
			'While negotiations run, personal data generally does not belong in the data room.'
		),
		when: (data) => dealOf(data) !== null,
		items: [
			{
				id: 'r_anonym',
				label: L(
					'Angaben zu Kunden und Beschäftigten im Datenraum nur anonymisiert oder zusammengefasst',
					'Customer and staff details in the data room only anonymised or aggregated'
				),
				cite: DSK_ASSET,
				na: false
			},
			{
				id: 'r_schluessel',
				label: L(
					'Einzelangaben zu Schlüsselpersonen nur mit deren freiwilliger Einwilligung',
					'Individual details on key people only with their voluntary consent'
				),
				cite: DSGVO('Art. 6 Abs. 1 lit. a, Art. 7')
			},
			{
				id: 'r_vertraulich',
				label: L(
					'Vertraulichkeitsvereinbarung mit den Bietern; Zugriffe im Datenraum protokolliert',
					'Confidentiality agreement with bidders; data room access logged'
				),
				cite: DSGVO('Art. 32 Abs. 1')
			},
			{
				id: 'r_anbieter',
				label: L(
					'Auftragsverarbeitungsvertrag mit dem Anbieter des Datenraums',
					'Processing agreement with the data room provider'
				),
				cite: DSGVO('Art. 28 Abs. 3')
			}
		]
	},
	{
		id: 'asset',
		title: L('Kundendaten im Asset Deal', 'Customer data in an asset deal'),
		intro: L(
			'Die Fallgruppen der Datenschutzkonferenz. Der Beschluss bindet Gerichte nicht; Berlin und Sachsen tragen ihn nicht mit.',
			'The case groups of the German data protection conference. The resolution does not bind courts; Berlin and Saxony do not support it.'
		),
		when: (data) => dealOf(data) === 'asset',
		items: [
			{
				id: 'k_laufend',
				label: L(
					'Kunden mit laufendem Vertrag, auch in der Gewährleistung: Übergang zur Vertragserfüllung',
					'Customers with a running contract, including warranty: transfer to perform the contract'
				),
				cite: DSGVO('Art. 6 Abs. 1 lit. b'),
				help: L(
					'Übernimmt der Käufer nur die Erfüllung und nicht den Vertrag, trägt das berechtigte Interesse.',
					'If the buyer takes over only performance and not the contract, legitimate interest is the basis.'
				)
			},
			{
				id: 'k_anbahnung',
				label: L(
					'Kunden in der Vertragsanbahnung: Widerspruchslösung mit angemessener Frist',
					'Customers in contract initiation: objection option with a reasonable period'
				),
				cite: DSGVO('Art. 6 Abs. 1 lit. f, Art. 21')
			},
			{
				id: 'k_beendet',
				label: L(
					'Beendete Verträge: Daten nur übergeben, soweit eine gesetzliche Aufbewahrung es verlangt, und dort gesperrt',
					'Ended contracts: data handed over only where legal retention requires it, and kept blocked'
				),
				cite: DSGVO('Art. 6 Abs. 1 lit. c, Art. 17 Abs. 3 lit. b')
			},
			{
				id: 'k_forderungen',
				label: L(
					'Offene Forderungen: Übermittlung auf das berechtigte Interesse gestützt',
					'Open receivables: transfer based on legitimate interest'
				),
				cite: DSGVO('Art. 6 Abs. 1 lit. f')
			},
			{
				id: 'k_einwilligung',
				label: L(
					'Bankdaten und besondere Kategorien nur mit Einwilligung übergeben',
					'Bank details and special categories handed over only with consent'
				),
				cite: DSGVO('Art. 6 Abs. 1 lit. a, Art. 9 Abs. 2 lit. a'),
				na: false
			},
			{
				id: 'k_werbung',
				label: L(
					'Werbung durch den Käufer nur nach denselben Regeln, die für den Verkäufer galten',
					'Advertising by the buyer only under the same rules that applied to the seller'
				),
				cite: { law: 'UWG', ref: '§ 7' }
			},
			{
				id: 'k_einziges',
				label: L(
					'Kundendaten als einziges Gut: Einwilligung der Kunden; bei Aufgabe eines Kleinunternehmens genügt für Postanschriften eine Widerspruchslösung',
					'Customer data as the only asset: customer consent; when a small business closes, an objection option suffices for postal addresses'
				),
				cite: DSK_ASSET,
				help: L(
					'Die Ausnahme gilt nach der DSK für Unternehmen mit weniger als 50 Beschäftigten und höchstens 10 Mio. Euro Umsatz, die ihr Geschäft aufgeben und an einen Käufer derselben Branche übergeben.',
					'Under the DSK, the exception covers businesses with fewer than 50 staff and turnover of at most EUR 10 million that close and pass the business to a buyer in the same sector.'
				),
				scope: ['nur_kunden'],
				na: false
			}
		]
	},
	{
		id: 'gesellschaft',
		title: L('Share Deal oder Umwandlung', 'Share deal or conversion'),
		intro: L(
			'Der Verantwortliche bleibt derselbe oder folgt kraft Gesetzes nach; Daten werden nicht übermittelt.',
			'The controller stays the same or succeeds by law; data is not transferred.'
		),
		when: (data) => dealOf(data) === 'share' || dealOf(data) === 'umwandlung',
		items: [
			{
				id: 'g_konzern',
				label: L(
					'Datenflüsse in den neuen Konzern nur mit eigener Rechtsgrundlage; ein Konzernprivileg gibt es nicht',
					'Data flows into the new group only with a legal basis of their own; there is no group privilege'
				),
				cite: DSGVO('Art. 6 Abs. 1, ErwG 48'),
				na: false
			}
		]
	},
	{
		id: 'betriebsuebergang',
		title: L('Betriebsübergang', 'Transfer of undertaking'),
		intro: L('Wenn Beschäftigte mit dem Betrieb übergehen.', 'When staff move with the business.'),
		scope: ['beschaeftigte'],
		items: [
			{
				id: 'b_unterrichtung',
				label: L(
					'Beschäftigte vor dem Übergang in Textform unterrichtet',
					'Staff informed in text form before the transfer'
				),
				cite: BGB('§ 613a Abs. 5'),
				na: false
			},
			{
				id: 'b_widerspruch',
				label: L(
					'Widerspruchsfrist von einem Monat abgewartet; Daten von Widersprechenden nicht übergeben',
					'One-month objection period awaited; data of those who object not handed over'
				),
				cite: BGB('§ 613a Abs. 6'),
				na: false
			},
			{
				id: 'b_akten',
				label: L(
					'Nur die Personalakten der Übergehenden übergeben; Gesundheitsdaten getrennt',
					'Only the personnel files of those transferring handed over; health data kept apart'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. c')
			}
		]
	},
	{
		id: 'drittland',
		title: L('Drittland', 'Third country'),
		intro: L(
			'Wenn Daten nach dem Vollzug außerhalb des EWR verarbeitet werden.',
			'When data is processed outside the EEA after closing.'
		),
		scope: ['drittland'],
		items: [
			{
				id: 't_grundlage',
				label: L(
					'Grundlage für die Übermittlung festgestellt (Werkzeug Drittland-Transfer)',
					'Basis for the transfer established (third-country transfer tool)'
				),
				cite: DSGVO('Art. 44 bis 46')
			}
		]
	},
	{
		id: 'vollzug',
		title: L('Nach dem Vollzug', 'After closing'),
		intro: L(
			'Was im übernommenen Bereich stimmen muss.',
			'What must be right in the acquired business.'
		),
		when: (data) => dealOf(data) !== null,
		items: [
			{
				id: 'n_vvt',
				label: L(
					'Verzeichnisse von Verarbeitungstätigkeiten zusammengeführt',
					'Records of processing activities merged'
				),
				cite: DSGVO('Art. 30 Abs. 1')
			},
			{
				id: 'n_information',
				label: L(
					'Betroffene über den neuen Verantwortlichen informiert',
					'Data subjects informed about the new controller'
				),
				cite: DSGVO('Art. 13, 14')
			},
			{
				id: 'n_avv',
				label: L(
					'Auftragsverarbeitungsverträge übertragen oder neu geschlossen',
					'Processing agreements transferred or newly concluded'
				),
				cite: DSGVO('Art. 28 Abs. 3')
			},
			{
				id: 'n_dsb',
				label: L(
					'Datenschutzbeauftragte benannt und der Aufsichtsbehörde gemeldet',
					'Data protection officer appointed and notified to the authority'
				),
				cite: DSGVO('Art. 37 Abs. 7')
			},
			{
				id: 'n_tom',
				label: L(
					'Technische und organisatorische Maßnahmen angeglichen',
					'Technical and organisational measures aligned'
				),
				cite: DSGVO('Art. 32 Abs. 1')
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
	if (inScope(data, ['drittland']) && !snapshot(data, 'transfer_check')) {
		return L('Erst die Drittlandprüfung durchführen.', 'Run the third-country check first.');
	}
	return null;
}

/** a company purchase, sale, merger or transfer of undertaking, from due diligence to integration */
export const definition: RecordToolDefinition = {
	slug: 'unternehmenskauf',
	version: 1,
	intro: L(
		'Ein Eintrag je Transaktion, auf Käufer- oder Verkäuferseite. Die Art des Geschäfts bestimmt, welche Teile gelten: Beim Asset Deal werden Daten übermittelt und brauchen je Fallgruppe eine Grundlage; beim Share Deal und bei der Umwandlung bleibt oder folgt der Verantwortliche. Beschäftigte, die übergehen, sind nach § 613a BGB zu unterrichten.',
		'One entry per transaction, on the buying or selling side. The deal type decides which parts apply: in an asset deal data is transferred and each case group needs a basis; in a share deal or conversion the controller stays or succeeds. Staff who transfer must be informed under § 613a BGB.'
	),
	sources: [DSK_ASSET, DSGVO('Art. 5, 6, 9, 13, 14, 28, 30, 37'), BGB('§ 613a Abs. 5, 6')],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'vorhaben',
			title: L('Transaktion', 'The transaction'),
			columns: 2,
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Bezeichnung', 'Name'),
					help: L(
						'Z. B. „Kauf Muster Logistik GmbH“.',
						'E.g. "Purchase of Example Logistics Ltd".'
					),
					required: true,
					listColumn: true
				},
				{
					id: 'rolle',
					type: 'select',
					label: L('Unsere Seite', 'Our side'),
					options: [
						{ value: 'kaeufer', label: L('Käufer', 'Buyer') },
						{ value: 'verkaeufer', label: L('Verkäufer', 'Seller') }
					]
				},
				{
					id: 'art',
					type: 'select',
					label: L('Art des Geschäfts', 'Deal type'),
					required: true,
					options: DEALS,
					listColumn: true
				},
				{
					id: 'vollzug_am',
					type: 'date',
					label: L('Geplanter Vollzug', 'Planned closing'),
					listColumn: true
				},
				{
					id: 'unterrichtet_am',
					type: 'date',
					label: L('Beschäftigte unterrichtet am', 'Staff informed on'),
					help: L(
						'Beim Betriebsübergang: Daraus berechnet Daily das Ende der Widerspruchsfrist.',
						'For a transfer of undertaking: Daily works out the end of the objection period from it.'
					)
				},
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
			id: 'pruefungen',
			title: L('Prüfungen und Verknüpfungen', 'Checks and links'),
			fields: [
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
			{ id: 'verhandlung', label: L('Verhandlung', 'Negotiation') },
			{ id: 'vollzug', label: L('Vollzug', 'Closing') },
			{ id: 'abgeschlossen', label: L('Abgeschlossen', 'Done'), terminal: true },
			{ id: 'abgebrochen', label: L('Abgebrochen', 'Called off'), terminal: true }
		],
		initialState: 'verhandlung',
		transitions: [
			{ from: 'verhandlung', to: 'vollzug', label: L('Vertrag unterzeichnet', 'Contract signed') },
			{ from: 'verhandlung', to: 'abgebrochen', label: L('Abbrechen', 'Call off') },
			{
				from: 'vollzug',
				to: 'verhandlung',
				label: L('Zurück zur Verhandlung', 'Back to negotiation')
			},
			{
				from: 'vollzug',
				to: 'abgeschlossen',
				label: L('Integration abgeschlossen', 'Integration done'),
				requires: ['abschluss_am'],
				check: (record) => closingBlocked(record.data)
			}
		]
	},
	example: {
		bezeichnung: 'Kauf Muster Logistik GmbH (Beispiel)',
		rolle: 'kaeufer',
		art: 'asset',
		verantwortlich: 'Rechtsabteilung',
		umfang: ['beschaeftigte'],
		r_anonym: 'nein',
		r_anonym_notiz: 'Datenraum enthält eine Kundenliste mit Namen und Umsätzen.',
		r_vertraulich: 'ja',
		k_laufend: 'ja'
	}
};
