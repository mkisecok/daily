import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });

export const KINDS = [
	{ value: 'standort', label: L('Ein Standort schließt', 'A site closes') },
	{
		value: 'aufgabe',
		label: L(
			'Das Unternehmen wird aufgegeben oder liquidiert',
			'The business is wound up or liquidated'
		)
	}
];

export const SCOPES = [
	{ value: 'papier', label: L('Papierakten', 'Paper files') },
	{
		value: 'it',
		label: L(
			'Server, Geräte, Kameras oder Zutrittssysteme',
			'Servers, devices, cameras or access systems'
		)
	},
	{ value: 'beschaeftigte', label: L('Beschäftigte scheiden aus', 'Staff leave') },
	{
		value: 'online',
		label: L(
			'Website, Shop, Kundenkonten oder Newsletter',
			'Website, shop, customer accounts or newsletter'
		)
	},
	{
		value: 'dienstleister',
		label: L('Auftragsverarbeiter verarbeiten Daten', 'Processors handle data')
	}
];

/** what is closing */
export const kindOf = (data: RecordData) =>
	typeof data.art === 'string' && data.art ? data.art : null;

/** the checklist in the order of a closure */
export const BLOCKS: Block[] = [
	{
		id: 'bestand',
		title: L('Bestand', 'Inventory'),
		intro: L(
			'Bevor etwas gelöscht oder weggegeben wird.',
			'Before anything is deleted or given away.'
		),
		when: (data) => kindOf(data) !== null,
		items: [
			{
				id: 'i_inventar',
				label: L(
					'Erfasst, welche Daten wo liegen: Akten, Server, Geräte, Cloud-Dienste',
					'Listed which data is where: files, servers, devices, cloud services'
				),
				cite: DSGVO('Art. 30 Abs. 1'),
				na: false
			},
			{
				id: 'i_entscheidung',
				label: L(
					'Je Datenart entschieden: aufbewahren, übergeben oder löschen (Werkzeug Löschkonzept)',
					'Decided per kind of data: keep, hand over or delete (deletion concept tool)'
				),
				cite: DSGVO('Art. 17 Abs. 3 lit. b'),
				help: L(
					'Aufbewahrungspflichten enden nicht mit dem Betrieb, etwa Buchungsbelege 8 Jahre (§ 147 AO, § 257 HGB), Lohnkonto 6 Jahre (§ 41 EStG).',
					'Retention duties do not end with the business, for example accounting records 8 years (§ 147 AO, § 257 HGB), payroll account 6 years (§ 41 EStG).'
				),
				na: false
			}
		]
	},
	{
		id: 'aufbewahrung',
		title: L('Aufbewahrung', 'Retention'),
		intro: L(
			'Was bleiben muss, bleibt gesperrt und sicher.',
			'What must stay, stays blocked and secure.'
		),
		when: (data) => kindOf(data) !== null,
		items: [
			{
				id: 'a_sperre',
				label: L(
					'Aufbewahrte Daten nur noch zur Aufbewahrung genutzt, Zugriff eng begrenzt',
					'Retained data used only for retention, access narrowly limited'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. b, Art. 32')
			},
			{
				id: 'a_archiv',
				label: L(
					'Mit einem Archivdienst ein Auftragsverarbeitungsvertrag geschlossen',
					'A processing agreement concluded with an archive service'
				),
				cite: DSGVO('Art. 28 Abs. 3')
			}
		]
	},
	{
		id: 'liquidation',
		title: L('Verwahrung nach der Liquidation', 'Custody after liquidation'),
		intro: L(
			'Wenn das Unternehmen aufgegeben wird, braucht die Aufbewahrung einen Verwahrer.',
			'When the business is wound up, retention needs a custodian.'
		),
		when: (data) => kindOf(data) === 'aufgabe',
		items: [
			{
				id: 'a_verwahrung',
				label: L(
					'Bücher und Schriften für zehn Jahre einem Gesellschafter oder Dritten in Verwahrung gegeben',
					'Books and papers given into custody with a shareholder or third party for ten years'
				),
				cite: { law: 'GmbHG', ref: '§ 74 Abs. 2' },
				help: L(
					'Gilt nach der Liquidation einer GmbH; ohne Bestimmung im Gesellschaftsvertrag oder Beschluss bestimmt das Gericht den Verwahrer.',
					'Applies after a GmbH is liquidated; if neither the articles nor a resolution name the custodian, the court appoints one.'
				)
			}
		]
	},
	{
		id: 'vernichtung',
		title: L('Löschen und Vernichten', 'Deleting and destroying'),
		intro: L(
			'Was nicht aufbewahrt werden muss, wird gelöscht, mit Nachweis.',
			'What need not be kept is deleted, with proof.'
		),
		when: (data) => kindOf(data) !== null,
		items: [
			{
				id: 'v_loeschen',
				label: L(
					'Daten ohne Aufbewahrungspflicht gelöscht',
					'Data without a retention duty deleted'
				),
				cite: DSGVO('Art. 17 Abs. 1 lit. a'),
				na: false
			},
			{
				id: 'v_geraete',
				label: L(
					'Datenträger und Geräte sicher gelöscht oder vernichtet, mit Nachweis; Kameras und Zutrittssysteme abgebaut',
					'Storage media and devices securely wiped or destroyed, with proof; cameras and access systems removed'
				),
				cite: { law: 'BSI', ref: 'CON.6 Löschen und Vernichten' },
				scope: ['it']
			},
			{
				id: 'v_akten',
				label: L(
					'Papierakten datenschutzgerecht vernichtet, mit Vernichtungsnachweis',
					'Paper files destroyed securely, with a certificate of destruction'
				),
				cite: DSGVO('Art. 32 Abs. 1'),
				help: L(
					'Die Sicherheitsstufe richtet sich nach DIN 66399; ein Entsorger ist Auftragsverarbeiter.',
					'The security level follows DIN 66399; a disposal firm is a processor.'
				),
				scope: ['papier']
			}
		]
	},
	{
		id: 'dienstleister',
		title: L('Auftragsverarbeiter', 'Processors'),
		intro: L('Wenn Dienstleister Daten verarbeiten.', 'When providers process data.'),
		scope: ['dienstleister'],
		items: [
			{
				id: 'd_ende',
				label: L(
					'Verträge beendet; Rückgabe oder Löschung bestätigt (Werkzeug Dienstleister wechseln)',
					'Contracts ended; return or deletion confirmed (provider change tool)'
				),
				cite: DSGVO('Art. 28 Abs. 3 lit. g')
			}
		]
	},
	{
		id: 'beschaeftigte',
		title: L('Beschäftigte', 'Staff'),
		intro: L('Wenn Beschäftigte ausscheiden.', 'When staff leave.'),
		scope: ['beschaeftigte'],
		items: [
			{
				id: 'p_akten',
				label: L(
					'Personalakten nach den Fristen aufbewahrt, der Rest gelöscht (Werkzeug Eintritt und Austritt)',
					'Personnel files kept by the periods, the rest deleted (staff joining and leaving tool)'
				),
				cite: DSGVO('Art. 17 Abs. 3 lit. b')
			},
			{
				id: 'p_auskunft',
				label: L(
					'Beschäftigte wissen, wo sie später Auskunft und Unterlagen erhalten',
					'Staff know where to get information and documents later'
				),
				cite: DSGVO('Art. 15')
			}
		]
	},
	{
		id: 'online',
		title: L('Online-Angebote', 'Online services'),
		intro: L('Website, Shop, Konten und Listen.', 'Website, shop, accounts and lists.'),
		scope: ['online'],
		items: [
			{
				id: 'w_abschalten',
				label: L(
					'Website, Formulare und Tracking abgeschaltet; Datenbanken gelöscht oder gesichert aufbewahrt',
					'Website, forms and tracking switched off; databases deleted or kept securely'
				),
				cite: DSGVO('Art. 17 Abs. 1 lit. a')
			},
			{
				id: 'w_konten',
				label: L(
					'Kundenkonten und Newsletterlisten gelöscht, oder nur nach den Regeln für einen Verkauf übergeben (Werkzeug Unternehmenskauf)',
					'Customer accounts and newsletter lists deleted, or handed over only under the rules for a sale (company purchase tool)'
				),
				cite: DSGVO('Art. 6 Abs. 1, Art. 17')
			}
		]
	},
	{
		id: 'nachher',
		title: L('Nach der Schließung', 'After closing'),
		intro: L(
			'Rechte der Betroffenen bestehen weiter, solange Daten gespeichert sind.',
			'Data subjects keep their rights as long as data is stored.'
		),
		when: (data) => kindOf(data) !== null,
		items: [
			{
				id: 's_kontakt',
				label: L(
					'Eine Stelle bleibt für Auskunftsersuchen erreichbar, solange Daten aufbewahrt werden',
					'Someone stays reachable for access requests while data is kept'
				),
				cite: DSGVO('Art. 12 Abs. 3, Art. 15'),
				na: false
			},
			{
				id: 's_vvt',
				label: L(
					'Verzeichnis von Verarbeitungstätigkeiten abgeschlossen oder auf den verbleibenden Betrieb angepasst',
					'Record of processing activities closed or updated for the remaining business'
				),
				cite: DSGVO('Art. 30 Abs. 1')
			},
			{
				id: 's_dsb',
				label: L(
					'Ende oder Nachfolge der Datenschutzbeauftragten geregelt und der Aufsichtsbehörde mitgeteilt',
					'End or succession of the data protection officer settled and notified to the authority'
				),
				cite: DSGVO('Art. 37 Abs. 7')
			}
		]
	}
];

/** what still stands in the way of marking the site closed, or null */
export function closingBlocked(data: RecordData): Localized | null {
	const state = checklist(data, BLOCKS);
	if (state.gaps.length > 0 || state.open.length > 0) {
		return L(
			'Erst alle Punkte der Checkliste erledigen.',
			'Complete every point of the checklist first.'
		);
	}
	return null;
}

/** closing a site or winding up the business, from the inventory to final deletion */
export const definition: RecordToolDefinition = {
	slug: 'schliessung',
	version: 1,
	intro: L(
		'Ein Eintrag je Schließung eines Standorts oder Aufgabe des Unternehmens. Daten verschwinden nicht mit dem Betrieb: Was aufbewahrt werden muss, bleibt gesperrt und sicher; alles andere wird gelöscht, und Betroffene behalten ihre Rechte, solange Daten gespeichert sind. Für einen Umzug gibt es das Werkzeug Standortwechsel.',
		'One entry per site closure or business wind-up. Data does not disappear with the business: what must be kept stays blocked and secure; everything else is deleted, and data subjects keep their rights as long as data is stored. Moves have the office move tool.'
	),
	sources: [
		DSGVO('Art. 5, 12, 15, 17, 28, 30, 37'),
		{ law: 'GmbHG', ref: '§ 74 Abs. 2' },
		{ law: 'BSI', ref: 'CON.6 Löschen und Vernichten' }
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'vorhaben',
			title: L('Schließung', 'The closure'),
			columns: 2,
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Bezeichnung', 'Name'),
					help: L('Z. B. „Filiale Kassel“.', 'E.g. "Kassel branch".'),
					required: true,
					listColumn: true
				},
				{
					id: 'art',
					type: 'select',
					label: L('Was schließt', 'What closes'),
					required: true,
					options: KINDS,
					listColumn: true
				},
				{
					id: 'schliessung_am',
					type: 'date',
					label: L('Geplante Schließung', 'Planned closure'),
					listColumn: true
				},
				{
					id: 'aufbewahrung_bis',
					type: 'date',
					label: L('Aufbewahrung endet', 'Retention ends'),
					help: L(
						'Das Ende der längsten Aufbewahrungsfrist; danach wird endgültig gelöscht.',
						'The end of the longest retention period; final deletion follows.'
					)
				},
				{
					id: 'verwahrer',
					type: 'text',
					label: L('Verwahrer der Unterlagen', 'Custodian of the records')
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
			id: 'verknuepfungen',
			title: L('Verknüpfungen', 'Links'),
			fields: [
				{
					id: 'loeschkonzept',
					type: 'reference',
					tool: 'loeschkonzept',
					label: L('Löschkonzept', 'Deletion concept')
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
				{ id: 'geschlossen_am', type: 'date', label: L('Geschlossen am', 'Closed on') },
				{
					id: 'geloescht_am',
					type: 'date',
					label: L('Endgültig gelöscht am', 'Finally deleted on')
				}
			]
		}
	],
	workflow: {
		states: [
			{ id: 'planung', label: L('Planung', 'Planning') },
			{ id: 'aufbewahrung', label: L('Aufbewahrung läuft', 'Retention running') },
			{ id: 'abgeschlossen', label: L('Endgültig gelöscht', 'Finally deleted'), terminal: true }
		],
		initialState: 'planung',
		transitions: [
			{
				from: 'planung',
				to: 'aufbewahrung',
				label: L('Geschlossen', 'Closed'),
				requires: ['geschlossen_am'],
				check: (record) => closingBlocked(record.data)
			},
			{ from: 'aufbewahrung', to: 'planung', label: L('Wieder öffnen', 'Reopen') },
			{
				from: 'aufbewahrung',
				to: 'abgeschlossen',
				label: L('Endgültig gelöscht', 'Finally deleted'),
				requires: ['geloescht_am']
			}
		]
	},
	example: {
		bezeichnung: 'Filiale Kassel (Beispiel)',
		art: 'standort',
		verantwortlich: 'Standortleitung',
		umfang: ['papier', 'it', 'beschaeftigte'],
		i_inventar: 'ja',
		i_entscheidung: 'nein',
		i_entscheidung_notiz: 'Für die Kundenakten im Keller ist noch offen, was bleibt.',
		v_geraete: 'nein',
		v_geraete_notiz: 'Drei alte Rechner stehen noch im Lager.'
	}
};
