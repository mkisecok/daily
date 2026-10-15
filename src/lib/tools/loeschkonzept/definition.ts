import type { RecordToolDefinition } from '../../records/types.js';
import type { Localized } from '../types.js';

const L = (de: string, en: string) => ({ de, en });

export type Unit = 'monate' | 'jahre';
export type Start = 'jahresende' | 'ereignis' | 'zweckwegfall' | 'erhebung';

/**
 * retention periods most data categories fall under. `period` is what the
 * provision sets (or common practice, marked as such in the label).
 */
export const RETENTION: Record<string, { label: Localized; period?: [number, Unit, Start] }> = {
	abschluss: {
		label: L(
			'Bücher, Inventare, Jahresabschlüsse: 10 Jahre (§ 257 Abs. 1 Nr. 1, Abs. 4 HGB, § 147 Abs. 1 Nr. 1, Abs. 3 AO)',
			'Books, inventories, annual accounts: 10 years (§ 257(1) No. 1, (4) HGB, § 147(1) No. 1, (3) AO)'
		),
		period: [10, 'jahre', 'jahresende']
	},
	belege: {
		label: L(
			'Buchungsbelege: 8 Jahre (§ 257 Abs. 1 Nr. 4, Abs. 4 HGB, § 147 Abs. 1 Nr. 4, Abs. 3 AO, seit 2025)',
			'Accounting vouchers: 8 years (§ 257(1) No. 4, (4) HGB, § 147(1) No. 4, (3) AO, since 2025)'
		),
		period: [8, 'jahre', 'jahresende']
	},
	briefe: {
		label: L(
			'Handels- und Geschäftsbriefe: 6 Jahre (§ 257 Abs. 1 Nr. 2, 3, Abs. 4 HGB, § 147 Abs. 3 AO)',
			'Commercial and business letters: 6 years (§ 257(1) No. 2, 3, (4) HGB, § 147(3) AO)'
		),
		period: [6, 'jahre', 'jahresende']
	},
	lohn: {
		label: L(
			'Lohnkonten: 6 Jahre nach der letzten Eintragung (§ 41 Abs. 1 Satz 9 EStG)',
			'Payroll accounts: 6 years after the last entry (§ 41(1) ninth sentence EStG)'
		),
		period: [6, 'jahre', 'jahresende']
	},
	bewerbung: {
		label: L(
			'Abgelehnte Bewerbungen: üblich 6 Monate nach Absage (Fristen aus § 15 Abs. 4 AGG, § 61b ArbGG)',
			'Rejected applications: usually 6 months after rejection (periods under § 15(4) AGG, § 61b ArbGG)'
		),
		period: [6, 'monate', 'ereignis']
	},
	verjaehrung: {
		label: L(
			'Rechtsverteidigung bis zur Verjährung: 3 Jahre ab Jahresende (§§ 195, 199 BGB)',
			'Legal defence until limitation: 3 years from year end (§§ 195, 199 BGB)'
		),
		period: [3, 'jahre', 'jahresende']
	},
	keine: {
		label: L(
			'Keine gesetzliche Frist: Löschung nach Wegfall des Zwecks',
			'No statutory period: erasure once the purpose ceases'
		)
	},
	sonstige: { label: L('Sonstige Frist', 'Other period') }
};

/** retention schedule: one record per data category or document class */
export const definition: RecordToolDefinition = {
	slug: 'loeschkonzept',
	version: 1,
	intro: L(
		'Ein Eintrag je Datenart oder Dokumentenklasse: wie lange sie aufbewahrt werden muss oder darf, ab wann die Frist läuft und wie gelöscht wird. Grundlage sind die Speicherbegrenzung (Art. 5 Abs. 1 lit. e DSGVO) und das Recht auf Löschung (Art. 17); der Aufbau folgt dem Gedanken der DIN 66398.',
		'One entry per data type or document class: how long it must or may be kept, when the period starts and how it is erased. The basis is storage limitation (Art. 5(1)(e) GDPR) and the right to erasure (Art. 17); the structure follows the idea of DIN 66398.'
	),
	sources: [
		{ law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. e' },
		{ law: 'DSGVO', ref: 'Art. 17' },
		{ law: 'BDSG', ref: '§ 35' }
	],
	titleField: 'datenart',
	sections: [
		{
			id: 'daten',
			title: L('Datenart', 'Data type'),
			fields: [
				{
					id: 'datenart',
					type: 'text',
					label: L('Datenart oder Dokumentenklasse', 'Data type or document class'),
					help: L(
						'Z. B. „Buchungsbelege“, „Bewerbungsunterlagen“, „Server-Protokolle“.',
						'E.g. "Accounting vouchers", "Application documents", "Server logs".'
					),
					required: true,
					listColumn: true
				},
				{ id: 'beschreibung', type: 'textarea', label: L('Beschreibung', 'Description') },
				{
					id: 'verarbeitung',
					type: 'text',
					label: L('Verarbeitungstätigkeit', 'Processing activity')
				},
				{
					id: 'systeme',
					type: 'textarea',
					label: L('Systeme und Ablageorte', 'Systems and storage locations')
				}
			]
		},
		{
			id: 'frist',
			title: L('Frist', 'Period'),
			fields: [
				{
					id: 'grundlage',
					type: 'select',
					label: L('Grundlage der Frist', 'Basis of the period'),
					options: Object.entries(RETENTION).map(([value, { label }]) => ({ value, label })),
					required: true,
					listColumn: true
				},
				{ id: 'frist_wert', type: 'number', label: L('Frist', 'Period'), min: 0 },
				{
					id: 'frist_einheit',
					type: 'select',
					label: L('Einheit', 'Unit'),
					options: [
						{ value: 'monate', label: L('Monate', 'Months') },
						{ value: 'jahre', label: L('Jahre', 'Years') }
					]
				},
				{
					id: 'fristbeginn',
					type: 'select',
					label: L('Beginn der Frist', 'Start of the period'),
					options: [
						{
							value: 'jahresende',
							label: L(
								'Ende des Kalenderjahres der Entstehung (§ 257 Abs. 5 HGB, § 147 Abs. 4 AO)',
								'End of the calendar year of creation (§ 257(5) HGB, § 147(4) AO)'
							)
						},
						{
							value: 'ereignis',
							label: L(
								'Eintritt eines Ereignisses (z. B. Vertragsende, Absage)',
								'An event (e.g. end of contract, rejection)'
							)
						},
						{ value: 'zweckwegfall', label: L('Wegfall des Zwecks', 'End of the purpose') },
						{ value: 'erhebung', label: L('Erhebung der Daten', 'Collection of the data') }
					]
				},
				{ id: 'ereignis', type: 'text', label: L('Auslösendes Ereignis', 'Triggering event') }
			]
		},
		{
			id: 'loeschung',
			title: L('Löschung', 'Erasure'),
			fields: [
				{
					id: 'loeschregel',
					type: 'textarea',
					label: L('Löschregel', 'Erasure rule'),
					help: L(
						'Was wird wann von wem wie gelöscht, und wie wird es nachgewiesen?',
						'What is erased when, by whom and how, and how is it evidenced?'
					),
					required: true
				},
				{
					id: 'loeschart',
					type: 'select',
					label: L('Art der Löschung', 'Method of erasure'),
					options: [
						{ value: 'automatisch', label: L('Automatisch', 'Automatic') },
						{ value: 'manuell', label: L('Manuell', 'Manual') },
						{
							value: 'sperrung',
							label: L('Einschränkung statt Löschung', 'Restriction instead of erasure')
						}
					]
				},
				{
					id: 'verantwortlich',
					type: 'text',
					label: L('Verantwortlich', 'Responsible'),
					listColumn: true
				},
				{
					id: 'status',
					type: 'select',
					label: L('Status', 'Status'),
					options: [
						{ value: 'entwurf', label: L('Entwurf', 'Draft') },
						{ value: 'umgesetzt', label: L('Umgesetzt', 'Implemented') },
						{ value: 'ueberarbeitung', label: L('In Überarbeitung', 'Under revision') }
					],
					required: true,
					listColumn: true
				},
				{
					id: 'letzter_loeschlauf',
					type: 'date',
					label: L('Letzter Löschlauf', 'Last erasure run')
				},
				{
					id: 'naechster_loeschlauf',
					type: 'date',
					label: L('Nächster Löschlauf', 'Next erasure run')
				}
			]
		}
	]
};
