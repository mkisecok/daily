import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });

export const KINDS = [
	{ value: 'umzug', label: L('Ein Standort zieht um', 'A site moves') },
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
	},
	{ value: 'serverraum', label: L('Ein Serverraum zieht um', 'A server room moves') },
	{
		value: 'bundesland',
		label: L('Umzug in ein anderes Bundesland', 'Move to another federal state')
	}
];

/** a closure, as opposed to a move */
const closing = (data: RecordData) => kindOf(data) === 'standort' || kindOf(data) === 'aufgabe';

/** what is closing */
export const kindOf = (data: RecordData) =>
	typeof data.art === 'string' && data.art ? data.art : null;

/** the checklist: inventory and destruction for both, then the parts of a move or a closure */
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
		when: closing,
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
		id: 'umzug_vorher',
		title: L('Vor dem Umzug', 'Before the move'),
		intro: L('Was vor dem Packen geklärt sein muss.', 'What must be settled before packing.'),
		when: (data) => kindOf(data) === 'umzug',
		items: [
			{
				id: 'p_aussortieren',
				label: L(
					'Nicht mehr benötigte Akten und Datenträger vorab gelöscht oder vernichtet, nach dem Löschkonzept',
					'Files and media no longer needed deleted or destroyed beforehand, following the deletion concept'
				),
				cite: { law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. e' }
			},
			{
				id: 'p_dienstleister',
				label: L(
					'Umzugs- und IT-Dienstleister schriftlich zur Vertraulichkeit verpflichtet; wer auf Daten zugreift, mit Auftragsverarbeitungsvertrag',
					'Moving and IT contractors bound to confidentiality in writing; those who access data under a processing agreement'
				),
				cite: { law: 'DSGVO', ref: 'Art. 28 Abs. 3, Art. 32 Abs. 4' }
			},
			{
				id: 'p_beschaeftigte',
				label: L(
					'Beschäftigte kennen Ablauf, Zuständige und den Meldeweg, wenn etwas fehlt',
					'Staff know the schedule, who is in charge and how to report anything missing'
				),
				cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 4' }
			}
		]
	},
	{
		id: 'transport',
		title: L('Transport', 'Transport'),
		intro: L(
			'Akten und Geräte sind unterwegs am leichtesten verloren.',
			'Files and devices are easiest lost on the way.'
		),
		when: (data) => kindOf(data) === 'umzug',
		items: [
			{
				id: 't_verschluesselt',
				label: L(
					'Laptops, Festplatten und Datenträger sind verschlüsselt',
					'Laptops, disks and storage media are encrypted'
				),
				cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. a' },
				scope: ['it']
			},
			{
				id: 't_behaelter',
				label: L(
					'Akten in verschlossenen, nummerierten Behältern mit Packliste',
					'Files in locked, numbered containers with a packing list'
				),
				cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. b' },
				scope: ['papier']
			},
			{
				id: 't_begleitung',
				label: L(
					'Transport begleitet oder nachverfolgt; keine unbeaufsichtigte Zwischenlagerung',
					'Transport accompanied or tracked; no unattended interim storage'
				),
				cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. b' }
			},
			{
				id: 't_uebergabe',
				label: L(
					'Ankunft gegen die Liste geprüft: vollständig und unbeschädigt',
					'Arrival checked against the list: complete and undamaged'
				),
				cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. b' }
			}
		]
	},
	{
		id: 'serverraum',
		title: L('Serverraum', 'Server room'),
		intro: L('Wenn Server oder Netztechnik umziehen.', 'When servers or network equipment move.'),
		when: (data) => kindOf(data) === 'umzug',
		scope: ['serverraum'],
		items: [
			{
				id: 's_sicherung',
				label: L(
					'Vollständige Datensicherung vor dem Abbau, Wiederherstellung getestet, eine Kopie bleibt getrennt vom Transport',
					'Full backup before dismantling, restore tested, one copy kept apart from the transport'
				),
				cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. c' }
			},
			{
				id: 's_wiederanlauf',
				label: L(
					'Wiederanlaufplan: Reihenfolge, Zuständige, Rückfallebene, geplante Ausfallzeit',
					'Restart plan: order, people in charge, fallback, planned downtime'
				),
				cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. c' }
			},
			{
				id: 's_zutritt',
				label: L(
					'Neuer Serverraum: eigener, abschließbarer Raum, Zutritt nur für Berechtigte und protokolliert',
					'New server room: a room of its own, lockable, access only for authorised staff and logged'
				),
				cite: { law: 'BSI', ref: 'INF.2 Rechenzentrum sowie Serverraum' }
			},
			{
				id: 's_umwelt',
				label: L(
					'Brandmelder und geeignete Löschmittel, keine wasserführenden Leitungen über den Geräten, Klimatisierung',
					'Fire detection and suitable extinguishers, no water pipes above the equipment, air conditioning'
				),
				cite: { law: 'BSI', ref: 'INF.2 Rechenzentrum sowie Serverraum' }
			},
			{
				id: 's_strom',
				label: L(
					'Unterbrechungsfreie Stromversorgung und Überspannungsschutz',
					'Uninterruptible power supply and surge protection'
				),
				cite: { law: 'BSI', ref: 'INF.2 Rechenzentrum sowie Serverraum' }
			},
			{
				id: 's_test',
				label: L(
					'Nach dem Aufbau geprüft: Zugriffsrechte, Firewall, Protokollierung, Datensicherung läuft wieder',
					'Checked after set-up: access rights, firewall, logging, backups running again'
				),
				cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. d' }
			}
		]
	},
	{
		id: 'neu',
		title: L('Sicherheit am neuen Standort', 'Security at the new site'),
		intro: L('Vor dem Einzug prüfen, nicht danach.', 'Check before moving in, not after.'),
		when: (data) => kindOf(data) === 'umzug',
		items: [
			{
				id: 'n_zutritt',
				label: L(
					'Zutrittskontrolle: Schließanlage oder Karten, Ausgabe dokumentiert, Schließungen der Vormieter getauscht',
					'Access control: locks or cards, issue recorded, the previous tenant’s locks replaced'
				),
				cite: { law: 'BSI', ref: 'INF.1 Allgemeines Gebäude' }
			},
			{
				id: 'n_besucher',
				label: L(
					'Besucher werden empfangen und begleitet; keine freien Wege zu Büros oder Technik',
					'Visitors are received and accompanied; no free way to offices or technology'
				),
				cite: { law: 'BSI', ref: 'INF.1 Allgemeines Gebäude' }
			},
			{
				id: 'n_arbeitsplatz',
				label: L(
					'Arbeitsplätze: abschließbare Schränke, Bildschirme nicht von Fenstern oder Fluren einsehbar, Clean Desk',
					'Workstations: lockable cabinets, screens not visible from windows or corridors, clean desk'
				),
				cite: { law: 'BSI', ref: 'INF.7 Büroarbeitsplatz' }
			},
			{
				id: 'n_drucker',
				label: L(
					'Drucker und Kopierer nicht frei zugänglich; Ausdrucke erst nach Anmeldung',
					'Printers and copiers not freely accessible; prints released only after sign-in'
				),
				cite: { law: 'BSI', ref: 'INF.7 Büroarbeitsplatz' }
			},
			{
				id: 'n_archiv',
				label: L(
					'Archivraum für Akten: abschließbar, trocken, brandgeschützt',
					'Archive room for files: lockable, dry, fire-protected'
				),
				cite: { law: 'BSI', ref: 'INF.1 Allgemeines Gebäude' },
				scope: ['papier']
			},
			{
				id: 'n_netz',
				label: L(
					'Netzwerk: Gäste-WLAN getrennt, Netzdosen in öffentlichen Bereichen deaktiviert, Technikschrank verschlossen',
					'Network: guest Wi-Fi separate, network sockets in public areas disabled, technical cabinet locked'
				),
				cite: { law: 'BSI', ref: 'INF.5 Raum sowie Schrank für technische Infrastruktur' },
				scope: ['it']
			},
			{
				id: 'n_gemeinsam',
				label: L(
					'Mit anderen Mietern Geteiltes geklärt: Hausnetz, Technikräume, Poststelle, Briefkästen',
					'What is shared with other tenants settled: building network, technical rooms, mail room, letterboxes'
				),
				cite: { law: 'BSI', ref: 'INF.1 Allgemeines Gebäude' }
			}
		]
	},
	{
		id: 'rueckbau',
		title: L('Rückbau am alten Standort', 'Clearing the old site'),
		intro: L('Nichts bleibt zurück.', 'Nothing is left behind.'),
		when: (data) => kindOf(data) === 'umzug',
		items: [
			{
				id: 'a_begehung',
				label: L(
					'Begehung nach dem Auszug: keine Akten, Datenträger oder Geräte zurückgeblieben',
					'Walk-through after moving out: no files, media or devices left behind'
				),
				cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1' }
			},
			{
				id: 'a_zugaenge',
				label: L(
					'Schlüssel und Karten zurückgegeben, Tür- und Alarmcodes gelöscht',
					'Keys and cards returned, door and alarm codes deleted'
				),
				cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. b' }
			},
			{
				id: 'a_anschluesse',
				label: L(
					'Router, Telefonanlage und Netzgeräte abgebaut oder auf Werkseinstellung zurückgesetzt',
					'Routers, phone system and network devices removed or reset to factory settings'
				),
				cite: { law: 'BSI', ref: 'CON.6 Löschen und Vernichten' },
				scope: ['it']
			},
			{
				id: 'a_post',
				label: L('Nachsendeauftrag für Post eingerichtet', 'Mail forwarding set up'),
				cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. b' }
			}
		]
	},
	{
		id: 'umzug_doku',
		title: L('Dokumentation', 'Documentation'),
		intro: L(
			'Die neue Anschrift und die neuen Maßnahmen gehören in die Unterlagen.',
			'The new address and the new measures belong in the records.'
		),
		when: (data) => kindOf(data) === 'umzug',
		items: [
			{
				id: 'd_vvt',
				label: L(
					'Verzeichnis von Verarbeitungstätigkeiten angepasst (TOM, Empfänger, Ort der Verarbeitung)',
					'Record of processing activities updated (measures, recipients, place of processing)'
				),
				cite: { law: 'DSGVO', ref: 'Art. 30 Abs. 1' }
			},
			{
				id: 'd_tom',
				label: L(
					'Technische und organisatorische Maßnahmen für den neuen Standort beschrieben',
					'Technical and organisational measures described for the new site'
				),
				cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1' }
			},
			{
				id: 'd_hinweise',
				label: L(
					'Neue Anschrift in Datenschutzhinweisen, Impressum und Verträgen',
					'New address in privacy notices, imprint and contracts'
				),
				cite: { law: 'DSGVO', ref: 'Art. 13 Abs. 1 lit. a' }
			},
			{
				id: 'd_dsb',
				label: L(
					'Datenschutzbeauftragter in die Planung eingebunden',
					'Data protection officer involved in planning'
				),
				cite: { law: 'DSGVO', ref: 'Art. 38 Abs. 1' }
			},
			{
				id: 'd_aufsicht',
				label: L(
					'Zuständige Aufsichtsbehörde des neuen Bundeslands festgestellt und ihr die Kontaktdaten des Datenschutzbeauftragten mitgeteilt',
					'Competent supervisory authority of the new federal state established and given the data protection officer’s contact details'
				),
				cite: { law: 'DSGVO', ref: 'Art. 37 Abs. 7' },
				scope: ['bundesland']
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
					'Personalakten nach den Fristen aufbewahrt, der Rest gelöscht (Werkzeug Personalprozesse)',
					'Personnel files kept by the periods, the rest deleted (HR processes tool)'
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
		when: closing,
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

/** what still stands in the way of marking the site closed or the move done, or null */
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
		'Ein Eintrag je Umzug, Schließung eines Standorts oder Aufgabe des Unternehmens. Bei einem Umzug geht es um Transport, Serverraum, Sicherheit am neuen und Rückbau am alten Standort. Bei einer Schließung verschwinden Daten nicht mit dem Betrieb: Was aufbewahrt werden muss, bleibt gesperrt und sicher; alles andere wird gelöscht, und Betroffene behalten ihre Rechte, solange Daten gespeichert sind.',
		'One entry per move, site closure or business wind-up. A move is about transport, the server room, security at the new site and clearing the old one. With a closure, data does not disappear with the business: what must be kept stays blocked and secure; everything else is deleted, and data subjects keep their rights as long as data is stored.'
	),
	sources: [
		DSGVO('Art. 5, 12, 15, 17, 28, 30, 37'),
		{ law: 'GmbHG', ref: '§ 74 Abs. 2' },
		{ law: 'BSI', ref: 'CON.6 Löschen und Vernichten' },
		{ law: 'BSI', ref: 'INF.1, INF.2, INF.7' },
		{ law: 'BDSG', ref: '§ 40 Abs. 2' }
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
					label: L('Was steht an?', 'What is happening?'),
					required: true,
					options: KINDS,
					listColumn: true
				},
				{
					id: 'schliessung_am',
					type: 'date',
					label: L('Termin des Umzugs oder der Schließung', 'Date of the move or closure'),
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
					id: 'begehung_am',
					type: 'date',
					label: L('Umzug abgeschlossen am', 'Move completed on'),
					help: L(
						'Nach der Begehung des neuen und des alten Standorts.',
						'After walking through the new and the old site.'
					)
				},
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
			{ id: 'abgeschlossen', label: L('Abgeschlossen', 'Done'), terminal: true }
		],
		initialState: 'planung',
		transitions: [
			{
				from: 'planung',
				to: 'aufbewahrung',
				label: L('Geschlossen', 'Closed'),
				requires: ['geschlossen_am'],
				when: (record) => kindOf(record.data) !== 'umzug',
				check: (record) => closingBlocked(record.data)
			},
			{
				from: 'planung',
				to: 'abgeschlossen',
				label: L('Umzug abgeschlossen', 'Move completed'),
				requires: ['begehung_am'],
				when: (record) => kindOf(record.data) === 'umzug',
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
