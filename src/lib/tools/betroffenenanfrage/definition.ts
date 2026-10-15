import type { RecordToolDefinition } from '../../records/types.js';

const L = (de: string, en: string) => ({ de, en });

export const RIGHTS = [
	'auskunft',
	'berichtigung',
	'loeschung',
	'einschraenkung',
	'uebertragbarkeit',
	'widerspruch',
	'art22',
	'widerruf'
] as const;

/** a data subject request from receipt to reply or refusal (Art. 12, 15–22) */
export const definition: RecordToolDefinition = {
	slug: 'betroffenenanfrage',
	version: 1,
	intro: L(
		'Ein Eintrag je Antrag einer betroffenen Person. Ab Eingang läuft die Monatsfrist des Art. 12 Abs. 3 DSGVO; sie erscheint unter Fristen. Die Prüfliste richtet sich nach den geltend gemachten Rechten. Bitte keine Klarnamen in die Bezeichnung schreiben.',
		'One entry per request from a data subject. From receipt the one-month period of Art. 12(3) GDPR runs; it appears under Deadlines. The checklist follows the rights invoked. Please keep names out of the title.'
	),
	sources: [
		{ law: 'DSGVO', ref: 'Art. 12' },
		{ law: 'DSGVO', ref: 'Art. 15–22' },
		{ law: 'EDPB', ref: 'Leitlinien 01/2022' }
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'antrag',
			title: L('Antrag', 'Request'),
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Bezeichnung', 'Title'),
					help: L(
						'Ohne Klarnamen, z. B. „Auskunft Kundin 2026-17“.',
						'Without names, e.g. "Access customer 2026-17".'
					),
					required: true,
					listColumn: true
				},
				{
					id: 'eingang',
					type: 'datetime',
					label: L('Eingang am', 'Received on'),
					help: L(
						'Ab dem Tag des Eingangs läuft die Monatsfrist, auch bei Eingang an einer falschen Stelle im Haus.',
						'The one-month period runs from the day of receipt, even if the request reached the wrong department.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 12 Abs. 3' },
					required: true,
					listColumn: true
				},
				{
					id: 'kanal',
					type: 'select',
					label: L('Eingangsweg', 'Channel'),
					options: [
						{ value: 'email', label: L('E-Mail', 'Email') },
						{ value: 'post', label: L('Brief', 'Letter') },
						{ value: 'formular', label: L('Webformular', 'Web form') },
						{ value: 'telefon', label: L('Telefon', 'Phone') },
						{ value: 'persoenlich', label: L('Persönlich', 'In person') },
						{ value: 'sonstiges', label: L('Sonstiges', 'Other') }
					]
				},
				{
					id: 'rechte',
					type: 'multiselect',
					label: L('Geltend gemachte Rechte', 'Rights invoked'),
					options: [
						{ value: 'auskunft', label: L('Auskunft (Art. 15)', 'Access (Art. 15)') },
						{
							value: 'berichtigung',
							label: L('Berichtigung (Art. 16)', 'Rectification (Art. 16)')
						},
						{ value: 'loeschung', label: L('Löschung (Art. 17)', 'Erasure (Art. 17)') },
						{
							value: 'einschraenkung',
							label: L('Einschränkung (Art. 18)', 'Restriction (Art. 18)')
						},
						{
							value: 'uebertragbarkeit',
							label: L('Datenübertragbarkeit (Art. 20)', 'Data portability (Art. 20)')
						},
						{ value: 'widerspruch', label: L('Widerspruch (Art. 21)', 'Objection (Art. 21)') },
						{
							value: 'art22',
							label: L('Automatisierte Entscheidung (Art. 22)', 'Automated decision (Art. 22)')
						},
						{
							value: 'widerruf',
							label: L(
								'Widerruf der Einwilligung (Art. 7 Abs. 3)',
								'Withdrawal of consent (Art. 7(3))'
							)
						}
					],
					listColumn: true
				},
				{ id: 'anliegen', type: 'textarea', label: L('Anliegen', 'Request in substance') }
			]
		},
		{
			id: 'identitaet',
			title: L('Identität', 'Identity'),
			fields: [
				{
					id: 'identitaet',
					type: 'select',
					label: L('Identität der antragstellenden Person', 'Identity of the requester'),
					options: [
						{
							value: 'eindeutig',
							label: L(
								'Eindeutig (z. B. bekannter Kontaktweg)',
								'Clear (e.g. known contact channel)'
							)
						},
						{ value: 'angefordert', label: L('Nachweis angefordert', 'Proof requested') },
						{ value: 'bestaetigt', label: L('Nach Nachweis bestätigt', 'Confirmed after proof') },
						{ value: 'zweifel', label: L('Nicht feststellbar', 'Cannot be established') }
					],
					help: L(
						'Zusätzliche Nachweise nur bei begründeten Zweifeln anfordern; keine Ausweiskopie als Regel.',
						'Request additional proof only where there are reasonable doubts; no ID copy as a rule.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 12 Abs. 6' }
				},
				{
					id: 'nachweis_angefordert_am',
					type: 'datetime',
					label: L('Nachweis angefordert am', 'Proof requested on')
				}
			]
		},
		{
			id: 'bearbeitung',
			title: L('Bearbeitung', 'Handling'),
			fields: [
				{
					id: 'verlaengerung',
					type: 'boolean',
					label: L('Frist um zwei Monate verlängern', 'Extend the period by two months'),
					help: L(
						'Nur wenn die Komplexität oder die Zahl der Anträge es erfordert.',
						'Only where the complexity or number of requests requires it.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 12 Abs. 3 Satz 2' }
				},
				{
					id: 'verlaengerung_grund',
					type: 'textarea',
					label: L('Gründe für die Verlängerung', 'Reasons for the extension')
				},
				{
					id: 'verlaengerung_mitgeteilt_am',
					type: 'datetime',
					label: L('Verlängerung mitgeteilt am', 'Extension communicated on'),
					cite: { law: 'DSGVO', ref: 'Art. 12 Abs. 3 Satz 3' }
				},
				{
					id: 'massnahmen',
					type: 'textarea',
					label: L('Durchgeführte Maßnahmen', 'Measures taken'),
					help: L(
						'Z. B. Auskunft mit Kopie erteilt, Daten gelöscht, Werbesperre gesetzt.',
						'E.g. access with copy provided, data erased, marketing block set.'
					)
				},
				{
					id: 'empfaenger_informiert',
					type: 'boolean',
					label: L(
						'Empfänger über Berichtigung, Löschung oder Einschränkung informiert',
						'Recipients informed of rectification, erasure or restriction'
					),
					cite: { law: 'DSGVO', ref: 'Art. 19' }
				},
				{
					id: 'ablehnung',
					type: 'select',
					label: L('Grund einer Ablehnung', 'Reason for refusal'),
					options: [
						{ value: 'unbegruendet', label: L('Offenkundig unbegründet', 'Manifestly unfounded') },
						{
							value: 'exzessiv',
							label: L('Exzessiv, insbesondere wiederholt', 'Excessive, in particular repetitive')
						},
						{
							value: 'ausnahme',
							label: L(
								'Gesetzliche Ausnahme (z. B. Art. 17 Abs. 3, §§ 34, 35 BDSG)',
								'Statutory exception (e.g. Art. 17(3), §§ 34, 35 BDSG)'
							)
						},
						{
							value: 'identitaet',
							label: L(
								'Identität nicht feststellbar (Art. 11 Abs. 2, Art. 12 Abs. 2)',
								'Identity cannot be established (Art. 11(2), Art. 12(2))'
							)
						}
					],
					cite: { law: 'DSGVO', ref: 'Art. 12 Abs. 5' }
				},
				{
					id: 'ablehnung_grund',
					type: 'textarea',
					label: L('Begründung der Ablehnung', 'Reasons for the refusal'),
					cite: { law: 'DSGVO', ref: 'Art. 12 Abs. 4' }
				},
				{
					id: 'antwort_am',
					type: 'datetime',
					label: L('Antwort versandt am', 'Reply sent on'),
					cite: { law: 'DSGVO', ref: 'Art. 12 Abs. 3' }
				}
			]
		}
	],
	workflow: {
		states: [
			{ id: 'eingegangen', label: L('Eingegangen', 'Received') },
			{ id: 'in_bearbeitung', label: L('In Bearbeitung', 'In progress') },
			{ id: 'beantwortet', label: L('Beantwortet', 'Answered'), terminal: true },
			{ id: 'abgelehnt', label: L('Abgelehnt', 'Refused'), terminal: true }
		],
		initialState: 'eingegangen',
		transitions: [
			{
				from: 'eingegangen',
				to: 'in_bearbeitung',
				label: L('Bearbeitung beginnen', 'Start handling'),
				requires: ['rechte']
			},
			{
				from: 'in_bearbeitung',
				to: 'beantwortet',
				label: L('Als beantwortet abschließen', 'Close as answered'),
				requires: ['massnahmen', 'antwort_am'],
				check: (record) =>
					record.data.identitaet === 'zweifel'
						? L(
								'Bei nicht feststellbarer Identität den Antrag ablehnen oder den Nachweis abwarten.',
								'If identity cannot be established, refuse the request or wait for proof.'
							)
						: null
			},
			{
				from: 'in_bearbeitung',
				to: 'abgelehnt',
				label: L('Ablehnen', 'Refuse'),
				requires: ['ablehnung', 'ablehnung_grund', 'antwort_am']
			}
		]
	}
};
