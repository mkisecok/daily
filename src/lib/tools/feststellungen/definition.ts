import type { RecordToolDefinition, RecordView } from '../../records/types.js';

const L = (de: string, en: string) => ({ de, en });

/** nonconformities need a corrective action; observations and positive findings do not */
export const isNonconformity = (record: RecordView) =>
	record.data.kategorie === 'wesentlich' || record.data.kategorie === 'gering';

/** an audit finding with its corrective action, from recording to verified effectiveness */
export const definition: RecordToolDefinition = {
	slug: 'feststellungen',
	version: 1,
	intro: L(
		'Ein Eintrag je Feststellung eines Audits oder einer Prüfung. Abweichungen werden mit Ursache, Korrekturmaßnahme, Verantwortlichem und Frist verfolgt, bis ihre Wirksamkeit bestätigt ist; die Fristen erscheinen unter Fristen.',
		'One entry per finding of an audit or review. Nonconformities are tracked with cause, corrective action, owner and deadline until their effectiveness is confirmed; the deadlines appear under Deadlines.'
	),
	sources: [
		{ law: 'ISO 27001', ref: 'Kap. 10.2' },
		{ law: 'ISO 42001', ref: 'Kap. 10.2' }
	],
	titleField: 'titel',
	sections: [
		{
			id: 'feststellung',
			title: L('Feststellung', 'Finding'),
			fields: [
				{
					id: 'titel',
					type: 'text',
					label: L('Kurzbezeichnung', 'Short title'),
					required: true,
					listColumn: true
				},
				{
					id: 'audit',
					type: 'reference',
					tool: 'auditprogramm',
					label: L('Audit', 'Audit'),
					listColumn: true
				},
				{
					id: 'kategorie',
					type: 'select',
					label: L('Einstufung', 'Grading'),
					options: [
						{ value: 'wesentlich', label: L('Wesentliche Abweichung', 'Major nonconformity') },
						{ value: 'gering', label: L('Geringfügige Abweichung', 'Minor nonconformity') },
						{ value: 'hinweis', label: L('Verbesserungspotenzial', 'Opportunity for improvement') },
						{ value: 'positiv', label: L('Positive Feststellung', 'Positive finding') }
					],
					required: true,
					listColumn: true
				},
				{
					id: 'anforderung',
					type: 'text',
					label: L('Anforderung', 'Requirement'),
					help: L('Z. B. „Art. 32 Abs. 1 lit. c DSGVO“.', 'E.g. "Art. 32(1)(c) GDPR".')
				},
				{ id: 'sachverhalt', type: 'textarea', label: L('Sachverhalt', 'Facts'), required: true },
				{ id: 'nachweis', type: 'textarea', label: L('Objektiver Nachweis', 'Objective evidence') }
			]
		},
		{
			id: 'korrektur',
			title: L('Korrektur', 'Correction'),
			fields: [
				{
					id: 'ursache',
					type: 'textarea',
					label: L('Ursache', 'Root cause'),
					cite: { law: 'ISO 27001', ref: 'Kap. 10.2' }
				},
				{ id: 'sofort', type: 'textarea', label: L('Sofortmaßnahme', 'Immediate correction') },
				{ id: 'massnahme', type: 'textarea', label: L('Korrekturmaßnahme', 'Corrective action') },
				{
					id: 'verantwortlich',
					type: 'text',
					label: L('Verantwortlich', 'Owner'),
					listColumn: true
				},
				{ id: 'frist', type: 'date', label: L('Umsetzen bis', 'Implement by'), listColumn: true },
				{ id: 'umgesetzt_am', type: 'date', label: L('Umgesetzt am', 'Implemented on') }
			]
		},
		{
			id: 'wirksamkeit',
			title: L('Wirksamkeit', 'Effectiveness'),
			fields: [
				{
					id: 'pruefen_am',
					type: 'date',
					label: L('Wirksamkeit prüfen am', 'Check effectiveness on')
				},
				{
					id: 'wirksamkeit',
					type: 'textarea',
					label: L('Ergebnis der Wirksamkeitsprüfung', 'Result of the effectiveness check')
				}
			]
		}
	],
	workflow: {
		states: [
			{ id: 'offen', label: L('Offen', 'Open') },
			{ id: 'massnahme', label: L('Maßnahme festgelegt', 'Action set') },
			{ id: 'umgesetzt', label: L('Umgesetzt', 'Implemented') },
			{ id: 'wirksam', label: L('Wirksam', 'Effective'), terminal: true },
			{ id: 'geschlossen', label: L('Geschlossen', 'Closed'), terminal: true }
		],
		initialState: 'offen',
		transitions: [
			{
				from: 'offen',
				to: 'massnahme',
				label: L('Maßnahme festlegen', 'Set the action'),
				requires: ['massnahme', 'verantwortlich', 'frist'],
				check: (record) =>
					isNonconformity(record) && !record.data.ursache
						? L(
								'Bei einer Abweichung zuerst die Ursache festhalten.',
								'For a nonconformity, record the root cause first.'
							)
						: null
			},
			{
				from: 'offen',
				to: 'geschlossen',
				label: L('Ohne Maßnahme schließen', 'Close without action'),
				check: (record) =>
					isNonconformity(record)
						? L(
								'Abweichungen brauchen eine Korrekturmaßnahme.',
								'Nonconformities need a corrective action.'
							)
						: null
			},
			{
				from: 'massnahme',
				to: 'umgesetzt',
				label: L('Als umgesetzt erfassen', 'Record as implemented'),
				requires: ['umgesetzt_am']
			},
			{
				from: 'umgesetzt',
				to: 'wirksam',
				label: L('Wirksamkeit bestätigen', 'Confirm effectiveness'),
				requires: ['wirksamkeit']
			},
			{
				from: 'umgesetzt',
				to: 'massnahme',
				label: L('Nicht wirksam: neue Maßnahme', 'Not effective: new action')
			}
		]
	}
};
