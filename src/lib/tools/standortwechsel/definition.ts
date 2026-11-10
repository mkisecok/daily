import type {
	FieldDef,
	FieldSection,
	RecordToolDefinition,
	RecordView
} from '../../records/types.js';
import { riskLevel, SCALE, type Rating, type RiskLevel } from '../dsfa/definition.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** what moves; checklist items and risks apply only to what is chosen */
export type Scope = 'arbeitsplaetze' | 'akten' | 'serverraum' | 'netz';

export const SCOPES: { value: Scope; label: Localized }[] = [
	{ value: 'arbeitsplaetze', label: L('Arbeitsplätze und Endgeräte', 'Workstations and devices') },
	{ value: 'akten', label: L('Papierakten und Archiv', 'Paper files and archive') },
	{ value: 'serverraum', label: L('Serverraum oder Technikraum', 'Server or technical room') },
	{ value: 'netz', label: L('Netzwerk und Telefonie', 'Network and telephony') }
];

/**
 * one checklist item: a yes/no field. Not answered keeps it open, "no" is a
 * gap. `scope` limits it to moves that include one of the listed parts;
 * `interstate` to moves into another federal state.
 */
export type Item = {
	id: string;
	label: Localized;
	cite: LegalBasis;
	scope?: Scope[];
	interstate?: boolean;
};

const BSI = (ref: string): LegalBasis => ({ law: 'BSI', ref });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });

type Block = { id: string; title: Localized; intro: Localized; scope?: Scope[]; items: Item[] };

/** the checklist in the order of the move */
export const BLOCKS: Block[] = [
	{
		id: 'planung',
		title: L('Vor dem Umzug', 'Before the move'),
		intro: L(
			'Was feststehen muss, bevor die erste Kiste gepackt wird.',
			'What must be settled before the first box is packed.'
		),
		items: [
			{
				id: 'p_inventar',
				label: L(
					'Liste aller Geräte, Datenträger und Aktenbestände, die umziehen',
					'List of all devices, storage media and file holdings that move'
				),
				cite: DSGVO('Art. 32 Abs. 1')
			},
			{
				id: 'p_aussortieren',
				label: L(
					'Nicht mehr benötigte Akten und Datenträger vorab gelöscht oder vernichtet, nach dem Löschkonzept',
					'Files and media no longer needed deleted or destroyed beforehand, following the deletion concept'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. e')
			},
			{
				id: 'p_dienstleister',
				label: L(
					'Umzugs- und IT-Dienstleister schriftlich zur Vertraulichkeit verpflichtet; wer auf Daten zugreift, mit Auftragsverarbeitungsvertrag',
					'Moving and IT contractors bound to confidentiality in writing; those who access data under a processing agreement'
				),
				cite: DSGVO('Art. 28 Abs. 3, Art. 32 Abs. 4')
			},
			{
				id: 'p_beschaeftigte',
				label: L(
					'Beschäftigte kennen Ablauf, Zuständige und den Meldeweg, wenn etwas fehlt',
					'Staff know the schedule, who is in charge and how to report anything missing'
				),
				cite: DSGVO('Art. 32 Abs. 4')
			}
		]
	},
	{
		id: 'transport',
		title: L('Transport', 'Transport'),
		intro: L(
			'Vom Abbau bis zur Übergabe am neuen Standort.',
			'From dismantling to hand-over at the new site.'
		),
		scope: ['arbeitsplaetze', 'akten', 'serverraum'],
		items: [
			{
				id: 't_verschluesselt',
				label: L(
					'Laptops, Festplatten und Datenträger sind verschlüsselt',
					'Laptops, disks and storage media are encrypted'
				),
				cite: DSGVO('Art. 32 Abs. 1 lit. a'),
				scope: ['arbeitsplaetze', 'serverraum']
			},
			{
				id: 't_behaelter',
				label: L(
					'Akten in verschlossenen, nummerierten Behältern mit Packliste',
					'Files in locked, numbered containers with a packing list'
				),
				cite: DSGVO('Art. 32 Abs. 1 lit. b'),
				scope: ['akten']
			},
			{
				id: 't_begleitung',
				label: L(
					'Transport begleitet oder nachverfolgt; keine unbeaufsichtigte Zwischenlagerung',
					'Transport accompanied or tracked; no unattended interim storage'
				),
				cite: DSGVO('Art. 32 Abs. 1 lit. b')
			},
			{
				id: 't_uebergabe',
				label: L(
					'Ankunft gegen die Liste geprüft: vollständig und unbeschädigt',
					'Arrival checked against the list: complete and undamaged'
				),
				cite: DSGVO('Art. 32 Abs. 1 lit. b')
			}
		]
	},
	{
		id: 'serverraum',
		title: L('Serverraum', 'Server room'),
		intro: L(
			'Abbau, Transport und Wiederanlauf der Server, und der neue Raum selbst.',
			'Dismantling, moving and restarting the servers, and the new room itself.'
		),
		scope: ['serverraum'],
		items: [
			{
				id: 's_sicherung',
				label: L(
					'Vollständige Datensicherung vor dem Abbau, Wiederherstellung getestet, eine Kopie bleibt getrennt vom Transport',
					'Full backup before dismantling, restore tested, one copy kept apart from the transport'
				),
				cite: DSGVO('Art. 32 Abs. 1 lit. c')
			},
			{
				id: 's_wiederanlauf',
				label: L(
					'Wiederanlaufplan: Reihenfolge, Zuständige, Rückfallebene, geplante Ausfallzeit',
					'Restart plan: order, people in charge, fallback, planned downtime'
				),
				cite: DSGVO('Art. 32 Abs. 1 lit. c')
			},
			{
				id: 's_zutritt',
				label: L(
					'Neuer Serverraum: eigener, abschließbarer Raum, Zutritt nur für Berechtigte und protokolliert',
					'New server room: a room of its own, lockable, access only for authorised staff and logged'
				),
				cite: BSI('INF.2 Rechenzentrum sowie Serverraum')
			},
			{
				id: 's_umwelt',
				label: L(
					'Brandmelder und geeignete Löschmittel, keine wasserführenden Leitungen über den Geräten, Klimatisierung',
					'Fire detection and suitable extinguishers, no water pipes above the equipment, air conditioning'
				),
				cite: BSI('INF.2 Rechenzentrum sowie Serverraum')
			},
			{
				id: 's_strom',
				label: L(
					'Unterbrechungsfreie Stromversorgung und Überspannungsschutz',
					'Uninterruptible power supply and surge protection'
				),
				cite: BSI('INF.2 Rechenzentrum sowie Serverraum')
			},
			{
				id: 's_test',
				label: L(
					'Nach dem Aufbau geprüft: Zugriffsrechte, Firewall, Protokollierung, Datensicherung läuft wieder',
					'Checked after set-up: access rights, firewall, logging, backups running again'
				),
				cite: DSGVO('Art. 32 Abs. 1 lit. d')
			}
		]
	},
	{
		id: 'neu',
		title: L('Sicherheit am neuen Standort', 'Security at the new site'),
		intro: L(
			'Gebäude, Räume und Arbeitsplätze, bevor dort personenbezogene Daten verarbeitet werden.',
			'Building, rooms and workstations, before personal data is processed there.'
		),
		items: [
			{
				id: 'n_zutritt',
				label: L(
					'Zutrittskontrolle: Schließanlage oder Karten, Ausgabe dokumentiert, Schließungen der Vormieter getauscht',
					'Access control: locks or cards, issue recorded, the previous tenant’s locks replaced'
				),
				cite: BSI('INF.1 Allgemeines Gebäude')
			},
			{
				id: 'n_einbruch',
				label: L(
					'Einbruchschutz: Türen, erreichbare Fenster, Alarmanlage',
					'Burglary protection: doors, reachable windows, alarm system'
				),
				cite: BSI('INF.1 Allgemeines Gebäude')
			},
			{
				id: 'n_besucher',
				label: L(
					'Besucher werden empfangen und begleitet; keine freien Wege zu Büros oder Technik',
					'Visitors are received and accompanied; no free way to offices or technology'
				),
				cite: BSI('INF.1 Allgemeines Gebäude')
			},
			{
				id: 'n_brand',
				label: L(
					'Brandschutz: Rauchmelder, Feuerlöscher, Fluchtwege',
					'Fire protection: smoke detectors, extinguishers, escape routes'
				),
				cite: BSI('INF.1 Allgemeines Gebäude')
			},
			{
				id: 'n_gemeinsam',
				label: L(
					'Mit anderen Mietern Geteiltes geklärt: Hausnetz, Technikräume, Poststelle, Briefkästen',
					'What is shared with other tenants settled: building network, technical rooms, mail room, letterboxes'
				),
				cite: BSI('INF.1 Allgemeines Gebäude')
			},
			{
				id: 'n_arbeitsplatz',
				label: L(
					'Arbeitsplätze: abschließbare Schränke, Bildschirme nicht von Fenstern oder Fluren einsehbar, Clean Desk',
					'Workstations: lockable cabinets, screens not visible from windows or corridors, clean desk'
				),
				cite: BSI('INF.7 Büroarbeitsplatz'),
				scope: ['arbeitsplaetze']
			},
			{
				id: 'n_drucker',
				label: L(
					'Drucker und Kopierer nicht frei zugänglich; Ausdrucke erst nach Anmeldung',
					'Printers and copiers not freely accessible; prints released only after sign-in'
				),
				cite: BSI('INF.7 Büroarbeitsplatz'),
				scope: ['arbeitsplaetze']
			},
			{
				id: 'n_archiv',
				label: L(
					'Archivraum für Akten: abschließbar, trocken, brandgeschützt',
					'Archive room for files: lockable, dry, fire-protected'
				),
				cite: BSI('INF.1 Allgemeines Gebäude'),
				scope: ['akten']
			},
			{
				id: 'n_netz',
				label: L(
					'Netzwerk: Gäste-WLAN getrennt, Netzdosen in öffentlichen Bereichen deaktiviert, Technikschrank verschlossen',
					'Network: guest Wi-Fi separate, network sockets in public areas disabled, technical cabinet locked'
				),
				cite: BSI('INF.5 Raum sowie Schrank für technische Infrastruktur'),
				scope: ['netz']
			}
		]
	},
	{
		id: 'alt',
		title: L('Rückbau am alten Standort', 'Clearing the old site'),
		intro: L(
			'Was nach dem Auszug nicht zurückbleiben darf.',
			'What must not be left behind after moving out.'
		),
		items: [
			{
				id: 'a_begehung',
				label: L(
					'Begehung nach dem Auszug: keine Akten, Datenträger oder Geräte zurückgeblieben',
					'Walk-through after moving out: no files, media or devices left behind'
				),
				cite: DSGVO('Art. 32 Abs. 1')
			},
			{
				id: 'a_vernichtung',
				label: L(
					'Ausgesonderte Datenträger und Akten sicher vernichtet (DIN 66399), Nachweis liegt vor',
					'Discarded media and files securely destroyed (DIN 66399), certificate on file'
				),
				cite: BSI('CON.6 Löschen und Vernichten')
			},
			{
				id: 'a_zugaenge',
				label: L(
					'Schlüssel und Karten zurückgegeben, Tür- und Alarmcodes gelöscht',
					'Keys and cards returned, door and alarm codes deleted'
				),
				cite: DSGVO('Art. 32 Abs. 1 lit. b')
			},
			{
				id: 'a_anschluesse',
				label: L(
					'Router, Telefonanlage und Netzgeräte abgebaut oder auf Werkseinstellung zurückgesetzt',
					'Routers, phone system and network devices removed or reset to factory settings'
				),
				cite: BSI('CON.6 Löschen und Vernichten'),
				scope: ['netz', 'serverraum']
			},
			{
				id: 'a_post',
				label: L('Nachsendeauftrag für Post eingerichtet', 'Mail forwarding set up'),
				cite: DSGVO('Art. 32 Abs. 1 lit. b')
			}
		]
	},
	{
		id: 'doku',
		title: L('Dokumentation und Information', 'Records and information'),
		intro: L(
			'Was nach dem Umzug in den Unterlagen und nach außen stimmen muss.',
			'What must be right in the records and towards others after the move.'
		),
		items: [
			{
				id: 'd_vvt',
				label: L(
					'Verzeichnis von Verarbeitungstätigkeiten angepasst (TOM, Empfänger, Ort der Verarbeitung)',
					'Record of processing activities updated (measures, recipients, place of processing)'
				),
				cite: DSGVO('Art. 30 Abs. 1')
			},
			{
				id: 'd_tom',
				label: L(
					'Technische und organisatorische Maßnahmen für den neuen Standort beschrieben',
					'Technical and organisational measures described for the new site'
				),
				cite: DSGVO('Art. 32 Abs. 1')
			},
			{
				id: 'd_hinweise',
				label: L(
					'Neue Anschrift in Datenschutzhinweisen, Impressum und Verträgen',
					'New address in privacy notices, imprint and contracts'
				),
				cite: DSGVO('Art. 13 Abs. 1 lit. a')
			},
			{
				id: 'd_dsb',
				label: L(
					'Datenschutzbeauftragter in die Planung eingebunden',
					'Data protection officer involved in planning'
				),
				cite: DSGVO('Art. 38 Abs. 1')
			},
			{
				id: 'd_aufsicht',
				label: L(
					'Zuständige Aufsichtsbehörde des neuen Bundeslands festgestellt und ihr die Kontaktdaten des Datenschutzbeauftragten mitgeteilt',
					'Competent supervisory authority of the new federal state established and given the data protection officer’s contact details'
				),
				cite: DSGVO('Art. 37 Abs. 7'),
				interstate: true
			}
		]
	}
];

export const ITEMS: Item[] = BLOCKS.flatMap((block) =>
	block.items.map((item) => ({ ...item, scope: item.scope ?? block.scope }))
);

/** one risk of the move, rated on the DSK scale before and after measures */
export type MoveRisk = {
	id: string;
	title: Localized;
	/** the BSI elementary threats behind it, for the description */
	threats: string;
	scope?: Scope[];
};

export const RISKS: MoveRisk[] = [
	{
		id: 'r_transport',
		title: L('Verlust oder Diebstahl beim Transport', 'Loss or theft in transport'),
		threats: 'G 0.16, G 0.17',
		scope: ['arbeitsplaetze', 'akten', 'serverraum']
	},
	{
		id: 'r_ausfall',
		title: L(
			'Ausfall von Systemen oder Datenverlust beim Umzug des Serverraums',
			'System outage or data loss when the server room moves'
		),
		threats: 'G 0.18, G 0.45',
		scope: ['serverraum']
	},
	{
		id: 'r_umgebung',
		title: L(
			'Schäden im neuen Serverraum durch Feuer, Wasser, Hitze oder Stromausfall',
			'Damage in the new server room from fire, water, heat or power failure'
		),
		threats: 'G 0.1, G 0.2, G 0.3, G 0.8',
		scope: ['serverraum']
	},
	{
		id: 'r_zutritt',
		title: L(
			'Unbefugter Zutritt oder Einsicht am neuen Standort',
			'Unauthorised access or viewing at the new site'
		),
		threats: 'G 0.14, G 0.19'
	},
	{
		id: 'r_rueckstand',
		title: L(
			'Zurückgelassene Akten, Datenträger oder Zugänge am alten Standort',
			'Files, media or access left behind at the old site'
		),
		threats: 'G 0.19'
	},
	{
		id: 'r_dienstleister',
		title: L(
			'Einsicht oder Zugriff durch Umzugs- und IT-Dienstleister',
			'Viewing or access by moving and IT contractors'
		),
		threats: 'G 0.14, G 0.19'
	}
];

const yesNo = (item: Item): FieldDef => ({
	id: item.id,
	type: 'boolean',
	label: item.label,
	cite: item.cite
});

const riskSection = (risk: MoveRisk): FieldSection => ({
	id: risk.id,
	title: risk.title,
	intro: L(
		`Gefährdungen nach BSI-Standard 200-3: ${risk.threats}. Bewertung nach der Risikomatrix der DSK (Kurzpapier Nr. 18).`,
		`Threats under BSI-Standard 200-3: ${risk.threats}. Rated on the DSK risk matrix (Kurzpapier Nr. 18).`
	),
	fields: [
		{
			id: `${risk.id}_w`,
			type: 'select',
			label: L('Eintrittswahrscheinlichkeit', 'Likelihood'),
			options: SCALE
		},
		{ id: `${risk.id}_s`, type: 'select', label: L('Schwere', 'Severity'), options: SCALE },
		{
			id: `${risk.id}_massnahmen`,
			type: 'textarea',
			label: L('Maßnahmen', 'Measures'),
			help: L(
				'Was das Risiko senkt, etwa Verschlüsselung, Begleitung, Packliste.',
				'What lowers the risk, e.g. encryption, escort, packing list.'
			)
		},
		{
			id: `${risk.id}_rw`,
			type: 'select',
			label: L('Wahrscheinlichkeit nach Maßnahmen', 'Likelihood after measures'),
			options: SCALE
		},
		{
			id: `${risk.id}_rs`,
			type: 'select',
			label: L('Schwere nach Maßnahmen', 'Severity after measures'),
			options: SCALE
		}
	]
});

const num = (record: RecordView, id: string) => {
	const value = Number(record.data[id]);
	return Number.isInteger(value) && value >= 1 && value <= 4 ? value : null;
};

export type AssessedMoveRisk = MoveRisk & {
	before: RiskLevel | null;
	after: RiskLevel | null;
	initial: Rating | null;
	residual: Rating | null;
	measures: boolean;
};

/** the risks that apply, before and after measures; residual falls back to the initial rating */
export function assessRisks(record: RecordView): AssessedMoveRisk[] {
	return RISKS.filter((risk) => applies(record, risk)).map((risk) => {
		const w = num(record, `${risk.id}_w`);
		const s = num(record, `${risk.id}_s`);
		const rw = num(record, `${risk.id}_rw`) ?? w;
		const rs = num(record, `${risk.id}_rs`) ?? s;
		const text = record.data[`${risk.id}_massnahmen`];
		return {
			...risk,
			before: w && s ? riskLevel(w, s) : null,
			after: rw && rs ? riskLevel(rw, rs) : null,
			initial: w && s ? { likelihood: w, severity: s } : null,
			residual: rw && rs ? { likelihood: rw, severity: rs } : null,
			measures: typeof text === 'string' && text.trim() !== ''
		};
	});
}

/** whether a checklist item or risk applies to this move */
export function applies(record: RecordView, entry: { scope?: Scope[]; interstate?: boolean }) {
	if (entry.interstate && record.data.bundesland_wechsel !== true) return false;
	if (!entry.scope) return true;
	const chosen = record.data.umfang;
	return Array.isArray(chosen) && entry.scope.some((scope) => chosen.includes(scope));
}

/** an office move from planning to the walk-through of the new site */
export const definition: RecordToolDefinition = {
	slug: 'standortwechsel',
	version: 1,
	intro: L(
		'Ein Eintrag je Umzug eines Büros oder Standorts. Die Checkliste führt vom Packen über Transport und Serverraum bis zur Sicherheit am neuen Standort und zum Rückbau am alten; was nicht umzieht, entfällt. Die Risikoanalyse bewertet die typischen Risiken eines Umzugs vor und nach Maßnahmen in der Risikomatrix der DSK.',
		'One entry per move of an office or site. The checklist runs from packing through transport and the server room to security at the new site and clearing the old one; what does not move drops out. The risk analysis rates the typical risks of a move before and after measures on the DSK risk matrix.'
	),
	sources: [
		DSGVO('Art. 5 Abs. 1 lit. f'),
		DSGVO('Art. 24'),
		DSGVO('Art. 32'),
		BSI('IT-Grundschutz-Kompendium, Edition 2023'),
		{ law: 'DSK', ref: 'Kurzpapier Nr. 18' }
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'vorhaben',
			title: L('Vorhaben', 'The move'),
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Bezeichnung', 'Name'),
					help: L('Z. B. „Umzug Köln → Berlin“.', 'E.g. "Move Cologne → Berlin".'),
					required: true,
					listColumn: true
				},
				{ id: 'alter_standort', type: 'text', label: L('Bisheriger Standort', 'Previous site') },
				{
					id: 'neuer_standort',
					type: 'text',
					label: L('Neuer Standort', 'New site'),
					listColumn: true
				},
				{
					id: 'umzugstermin',
					type: 'date',
					label: L('Umzugstermin', 'Moving date'),
					listColumn: true
				},
				{ id: 'verantwortlich', type: 'text', label: L('Verantwortlich', 'In charge') },
				{
					id: 'umfang',
					type: 'multiselect',
					label: L('Was zieht um?', 'What moves?'),
					help: L(
						'Bestimmt, welche Punkte der Checkliste und welche Risiken gelten.',
						'Decides which checklist points and risks apply.'
					),
					options: SCOPES
				},
				{
					id: 'bundesland_wechsel',
					type: 'boolean',
					label: L('Wechsel in ein anderes Bundesland', 'Move into another federal state'),
					help: L(
						'Dann ist in der Regel eine andere Datenschutzaufsicht zuständig.',
						'Then another data protection authority is usually competent.'
					),
					cite: { law: 'BDSG', ref: '§ 40 Abs. 2' }
				},
				{
					id: 'tom',
					type: 'reference',
					tool: 'tom-katalog',
					label: L('TOM des neuen Standorts', 'Measures of the new site')
				}
			]
		},
		...BLOCKS.map((block) => ({
			id: block.id,
			title: block.title,
			intro: block.intro,
			fields: block.items.map(yesNo)
		})),
		...RISKS.map(riskSection),
		{
			id: 'abschluss',
			title: L('Abschluss', 'Close-out'),
			fields: [
				{
					id: 'begehung_am',
					type: 'date',
					label: L('Begehung des neuen Standorts', 'Walk-through of the new site'),
					help: L(
						'Einige Wochen nach dem Einzug prüfen, ob die Maßnahmen im Alltag greifen.',
						'A few weeks after moving in, check that the measures work in daily use.'
					)
				},
				{ id: 'anmerkungen', type: 'textarea', label: L('Anmerkungen', 'Remarks') }
			]
		}
	],
	workflow: {
		states: [
			{ id: 'planung', label: L('Planung', 'Planning') },
			{ id: 'umzug', label: L('Umzug', 'Moving') },
			{ id: 'nachbereitung', label: L('Nachbereitung', 'Follow-up') },
			{ id: 'abgeschlossen', label: L('Abgeschlossen', 'Closed'), terminal: true }
		],
		initialState: 'planung',
		transitions: [
			{
				from: 'planung',
				to: 'umzug',
				label: L('Umzug beginnt', 'Move starts'),
				requires: ['umzugstermin', 'umfang'],
				check: (record) =>
					applies(record, { scope: ['serverraum'] }) && record.data.s_sicherung !== true
						? L(
								'Erst die Datensicherung vor dem Abbau des Serverraums bestätigen.',
								'Confirm the backup before the server room is dismantled first.'
							)
						: null
			},
			{ from: 'umzug', to: 'planung', label: L('Zurück in die Planung', 'Back to planning') },
			{ from: 'umzug', to: 'nachbereitung', label: L('Eingezogen', 'Moved in') },
			{
				from: 'nachbereitung',
				to: 'abgeschlossen',
				label: L('Abschließen', 'Close'),
				requires: ['begehung_am'],
				check: (record) => {
					if (ITEMS.some((item) => applies(record, item) && record.data[item.id] !== true)) {
						return L(
							'Erst alle Punkte der Checkliste erledigen.',
							'Complete every point of the checklist first.'
						);
					}
					return assessRisks(record).some((risk) => risk.after === 'hoch')
						? L(
								'Ein Restrisiko ist noch hoch; erst weitere Maßnahmen treffen.',
								'A residual risk is still high; take further measures first.'
							)
						: null;
				}
			}
		]
	}
};
