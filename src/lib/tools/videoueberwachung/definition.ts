import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, snapshot, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });

export const DSK_VIDEO: LegalBasis = {
	law: 'DSK',
	ref: 'Orientierungshilfe Videoüberwachung durch nicht-öffentliche Stellen (2020)'
};
export const EDPB_VIDEO: LegalBasis = { law: 'EDPB', ref: 'Leitlinien 3/2019' };

export const SCOPES = [
	{
		value: 'oeffentlich',
		label: L(
			'Erfasst öffentlich zugängliche Bereiche (Verkaufsraum, Eingang, Parkplatz)',
			'Covers publicly accessible areas (shop floor, entrance, car park)'
		)
	},
	{
		value: 'aufzeichnung',
		label: L(
			'Bilder werden gespeichert, nicht nur live gezeigt',
			'Images are stored, not only shown live'
		)
	},
	{
		value: 'beschaeftigte',
		label: L(
			'Erfasst Arbeitsplätze oder Wege von Beschäftigten',
			'Covers workplaces or routes of staff'
		)
	},
	{
		value: 'fernzugriff',
		label: L(
			'Zugriff per App oder Cloud, oder ein Dienstleister betreut die Anlage',
			'Access by app or cloud, or a service provider runs the system'
		)
	},
	{
		value: 'funktionen',
		label: L(
			'Kameras können schwenken, zoomen oder Ton aufnehmen',
			'Cameras can pan, zoom or record sound'
		)
	}
];

/** the checklist in the order of a set-up */
export const BLOCKS: Block[] = [
	{
		id: 'zweck',
		title: L('Zweck und Erforderlichkeit', 'Purpose and necessity'),
		intro: L(
			'Ob die Kameras überhaupt sein dürfen. Die Abwägung selbst steht in der verknüpften Interessenabwägung.',
			'Whether the cameras are allowed at all. The balancing itself is in the linked legitimate-interest assessment.'
		),
		items: [
			{
				id: 'z_zweck',
				label: L(
					'Zweck je Kamera schriftlich festgelegt, etwa Schutz vor Einbruch oder Vandalismus',
					'Purpose set in writing per camera, such as protection against burglary or vandalism'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. b'),
				na: false
			},
			{
				id: 'z_anlass',
				label: L(
					'Gefährdung belegt, etwa durch frühere Vorfälle oder Anzeigen',
					'Threat shown, for example by past incidents or police reports'
				),
				cite: DSK_VIDEO
			},
			{
				id: 'z_milder',
				label: L(
					'Mildere Mittel geprüft: Beleuchtung, Schlösser, Zutrittskontrolle, Wachdienst, Kamera nur außerhalb der Öffnungszeiten',
					'Milder means checked: lighting, locks, access control, guards, camera only outside opening hours'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. c')
			},
			{
				id: 'z_tabu',
				label: L(
					'Keine Kamera in Toiletten, Umkleiden, Pausen- oder Sozialräumen',
					'No camera in toilets, changing rooms, break or social rooms'
				),
				cite: DSK_VIDEO,
				na: false
			}
		]
	},
	{
		id: 'bereich',
		title: L('Erfassungsbereich', 'Coverage'),
		intro: L('Was die Kameras sehen und was nicht.', 'What the cameras see and what they do not.'),
		items: [
			{
				id: 'e_bereich',
				label: L(
					'Blickfeld auf das Nötige begrenzt und je Kamera mit Lageplan oder Standbild dokumentiert',
					'Field of view limited to what is needed and documented per camera with a site plan or still image'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. c, Art. 25 Abs. 2'),
				na: false
			},
			{
				id: 'e_umgebung',
				label: L(
					'Gehweg, Straße und Nachbargrundstücke nicht im Bild oder ausgeblendet',
					'Pavement, street and neighbouring property out of view or masked'
				),
				cite: DSK_VIDEO
			},
			{
				id: 'e_ton',
				label: L('Tonaufnahme abgeschaltet', 'Sound recording switched off'),
				cite: { law: 'StGB', ref: '§ 201' },
				scope: ['funktionen'],
				na: false
			},
			{
				id: 'e_schwenk',
				label: L(
					'Schwenken und Zoomen gesperrt oder auf festgelegte Positionen begrenzt',
					'Pan and zoom locked or limited to set positions'
				),
				cite: DSGVO('Art. 25 Abs. 2'),
				scope: ['funktionen']
			},
			{
				id: 'e_monitor',
				label: L(
					'Monitore so aufgestellt, dass Unbefugte sie nicht sehen',
					'Monitors placed so that unauthorised people cannot see them'
				),
				cite: DSGVO('Art. 32 Abs. 1 lit. b')
			}
		]
	},
	{
		id: 'hinweis',
		title: L('Hinweis', 'Notice'),
		intro: L(
			'Wer den Bereich betritt, muss die Überwachung vorher erkennen können.',
			'Anyone entering the area must be able to see the surveillance beforehand.'
		),
		items: [
			{
				id: 'h_schild',
				label: L(
					'Hinweisschild vor dem Erfassungsbereich, gut sichtbar etwa auf Augenhöhe',
					'Sign before the covered area, clearly visible at about eye level'
				),
				cite: EDPB_VIDEO,
				na: false
			},
			{
				id: 'h_inhalt',
				label: L(
					'Schild nennt Verantwortlichen, Zweck, berechtigtes Interesse, Speicherdauer, Kontakt zum DSB und wo die vollständige Information steht',
					'Sign names the controller, purpose, legitimate interest, storage period, DPO contact and where the full information is'
				),
				cite: DSGVO('Art. 13 Abs. 1, 2'),
				na: false
			},
			{
				id: 'h_vollstaendig',
				label: L(
					'Vollständige Information vor Ort als Aushang und online erreichbar',
					'Full information available on site as a notice and online'
				),
				cite: EDPB_VIDEO
			}
		]
	},
	{
		id: 'speicherung',
		title: L('Speicherung und Zugriff', 'Storage and access'),
		intro: L('Wenn Bilder gespeichert werden.', 'When images are stored.'),
		scope: ['aufzeichnung'],
		items: [
			{
				id: 's_dauer',
				label: L(
					'Speicherdauer festgelegt, in der Regel höchstens 72 Stunden; eine längere ist begründet',
					'Storage period set, as a rule 72 hours at most; a longer one is justified'
				),
				cite: DSK_VIDEO,
				help: L(
					'Die Aufsichtsbehörden sehen 72 Stunden als Richtwert. Der EDSA verlangt für längere Fristen eine besondere Begründung.',
					'The supervisory authorities take 72 hours as a guide. The EDPB requires a specific reason for longer periods.'
				),
				na: false
			},
			{
				id: 's_loeschung',
				label: L(
					'Automatisches Löschen oder Überschreiben eingestellt und geprüft',
					'Automatic deletion or overwriting set up and checked'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. e, Art. 25 Abs. 2')
			},
			{
				id: 's_zugriff',
				label: L(
					'Auswertung nur durch wenige benannte Personen, nur aus Anlass, mit Protokoll',
					'Review only by a few named people, only for a reason, with a log'
				),
				cite: { law: 'BSI', ref: 'OPS.1.1.5 Protokollierung' }
			},
			{
				id: 's_schutz',
				label: L(
					'Rekorder verschlossen, Aufnahmen verschlüsselt, Standardpasswörter geändert',
					'Recorder locked away, recordings encrypted, default passwords changed'
				),
				cite: DSGVO('Art. 32 Abs. 1 lit. a, b')
			},
			{
				id: 's_herausgabe',
				label: L(
					'Regel für die Herausgabe an die Polizei und für Auskunftsersuchen, mit Schwärzen anderer Personen',
					'Rule for handing footage to the police and for access requests, with other people masked'
				),
				cite: DSGVO('Art. 15 Abs. 4, Art. 6 Abs. 4')
			}
		]
	},
	{
		id: 'fernzugriff',
		title: L('Fernzugriff und Dienstleister', 'Remote access and providers'),
		intro: L(
			'Wenn die Anlage per App, Cloud oder von einem Dienstleister erreicht wird.',
			'When the system is reached by app, cloud or a service provider.'
		),
		scope: ['fernzugriff'],
		items: [
			{
				id: 'f_avv',
				label: L(
					'Auftragsverarbeitungsvertrag mit Errichter, Wachdienst oder Cloud-Anbieter (Werkzeug AVV-Prüfung)',
					'Processing agreement with installer, security service or cloud provider (AVV check tool)'
				),
				cite: DSGVO('Art. 28 Abs. 3')
			},
			{
				id: 'f_zugang',
				label: L(
					'Fernzugriff mit eigenen Zugängen und zweitem Faktor; Firmware aktuell',
					'Remote access with personal accounts and a second factor; firmware up to date'
				),
				cite: DSGVO('Art. 32 Abs. 1')
			},
			{
				id: 'f_standort',
				label: L(
					'Speicherort und Unterauftragnehmer bekannt; bei Drittland Grundlage nach Kapitel V',
					'Storage location and sub-processors known; for a third country a Chapter V basis'
				),
				cite: DSGVO('Art. 28 Abs. 2, Art. 44')
			}
		]
	},
	{
		id: 'beschaeftigte',
		title: L('Beschäftigte', 'Staff'),
		intro: L(
			'Wenn Arbeitsplätze oder Wege von Beschäftigten im Bild sind.',
			'When workplaces or routes of staff are in view.'
		),
		scope: ['beschaeftigte'],
		items: [
			{
				id: 'b_betriebsrat',
				label: L(
					'Betriebsrat beteiligt; Betriebsvereinbarung geschlossen oder nicht nötig',
					'Works council involved; works agreement concluded or not needed'
				),
				cite: { law: 'BetrVG', ref: '§ 87 Abs. 1 Nr. 6' }
			},
			{
				id: 'b_kontrolle',
				label: L(
					'Keine Leistungs- oder Verhaltenskontrolle; Arbeitsplätze nicht dauerhaft im Bild',
					'No monitoring of performance or behaviour; workplaces not permanently in view'
				),
				cite: DSK_VIDEO,
				na: false
			},
			{
				id: 'b_information',
				label: L('Beschäftigte gesondert informiert', 'Staff informed separately'),
				cite: DSGVO('Art. 13')
			}
		]
	},
	{
		id: 'freigabe',
		title: L('Vor der Freigabe', 'Before approval'),
		intro: L('Der letzte Schritt vor dem Einschalten.', 'The last step before switching on.'),
		items: [
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
			},
			{
				id: 'r_wiedervorlage',
				label: L(
					'Termin festgelegt, an dem die Erforderlichkeit erneut geprüft wird',
					'Date set on which the necessity is checked again'
				),
				cite: DSGVO('Art. 24 Abs. 1')
			}
		]
	}
];

/** the attached balancing test holds */
const balanced = (data: RecordData) => snapshot(data, 'abwaegung')?.verdict === 'negative';

/** the attached screening result says a DPIA is needed */
export const dpiaNeeded = (data: RecordData) =>
	snapshot(data, 'dsfa_check')?.verdict === 'positive';

/** what still stands in the way of approval, or null */
export function approvalBlocked(data: RecordData): Localized | null {
	const state = checklist(data, BLOCKS);
	if (state.gaps.length > 0 || state.open.length > 0) {
		return L(
			'Erst alle Punkte der Checkliste erledigen.',
			'Complete every point of the checklist first.'
		);
	}
	if (!balanced(data)) {
		return L(
			'Erst eine Interessenabwägung verknüpfen, die die Überwachung trägt.',
			'First link a legitimate-interest assessment that supports the surveillance.'
		);
	}
	if (!snapshot(data, 'dsfa_check')) {
		return L('Erst die DSFA-Schwellwertanalyse durchführen.', 'Run the DPIA screening first.');
	}
	if (dpiaNeeded(data) && !data.dsfa) {
		return L(
			'Die Schwellwertanalyse verlangt eine DSFA; erst die DSFA verknüpfen.',
			'The screening requires a DPIA; link the DPIA first.'
		);
	}
	return null;
}

/** setting up video surveillance by a company or association, from the first check to approval */
export const definition: RecordToolDefinition = {
	slug: 'videoueberwachung',
	version: 1,
	intro: L(
		'Ein Eintrag je Anlage oder Standort, für Unternehmen, Vereine und andere nicht-öffentliche Stellen. Rechtsgrundlage ist das berechtigte Interesse nach Art. 6 Abs. 1 lit. f DSGVO; § 4 BDSG tritt dahinter zurück (BVerwG 6 C 2.18). Interessenabwägung und DSFA-Schwellwertanalyse werden verknüpft, nicht wiederholt. Behörden prüfen nach § 4 BDSG oder dem Landesrecht.',
		'One entry per system or site, for companies, associations and other private bodies. The legal basis is legitimate interest under Art. 6(1)(f) GDPR; § 4 BDSG gives way to it (Federal Administrative Court 6 C 2.18). The legitimate-interest assessment and the DPIA screening are linked, not repeated. Public authorities check under § 4 BDSG or state law.'
	),
	sources: [
		DSGVO('Art. 5, 6 Abs. 1 lit. f, 13, 25, 32, 35'),
		DSK_VIDEO,
		EDPB_VIDEO,
		{ law: 'BVerwG', ref: 'Urteil vom 27.03.2019, 6 C 2.18' },
		{ law: 'BetrVG', ref: '§ 87 Abs. 1 Nr. 6' }
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'anlage',
			title: L('Anlage', 'The system'),
			columns: 2,
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Anlage oder Standort', 'System or site'),
					help: L('Z. B. „Kameras Lager Nord“.', 'E.g. "Cameras north warehouse".'),
					required: true,
					listColumn: true
				},
				{
					id: 'kameras',
					type: 'number',
					label: L('Anzahl Kameras', 'Number of cameras'),
					min: 1,
					integer: true,
					listColumn: true
				},
				{
					id: 'zweck',
					type: 'textarea',
					label: L('Wozu die Kameras dienen', 'What the cameras are for')
				},
				{
					id: 'inbetrieb_ab',
					type: 'date',
					label: L('Geplant in Betrieb ab', 'Planned in operation from'),
					listColumn: true
				},
				{ id: 'verantwortlich', type: 'text', label: L('Verantwortlich', 'In charge') },
				{
					id: 'umfang',
					type: 'multiselect',
					label: L('Was trifft zu?', 'What applies?'),
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
			intro: L(
				'Die Ergebnisse der vorhandenen Werkzeuge; sie werden hier nicht noch einmal abgefragt.',
				'The results of the existing tools; they are not asked again here.'
			),
			fields: [
				{
					id: 'abwaegung',
					type: 'assessment',
					tool: 'interessenabwaegung',
					label: L('Interessenabwägung', 'Legitimate-interest assessment'),
					cite: DSGVO('Art. 6 Abs. 1 lit. f')
				},
				{
					id: 'dsfa_check',
					type: 'assessment',
					tool: 'dsfa-schwellwert',
					label: L('DSFA-Schwellwertanalyse', 'DPIA screening'),
					cite: DSGVO('Art. 35 Abs. 3 lit. c')
				},
				{
					id: 'vvt',
					type: 'reference',
					tool: 'vvt',
					label: L('Eintrag im VVT', 'Record of processing entry')
				},
				{
					id: 'avv',
					type: 'reference',
					tool: 'avv-pruefung',
					label: L('AVV-Prüfung (bei Dienstleister)', 'Processing agreement check (if a provider)')
				},
				{
					id: 'dsfa',
					type: 'reference',
					tool: 'dsfa',
					label: L('DSFA (falls nötig)', 'DPIA (if needed)')
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
						'Die Erforderlichkeit regelmäßig prüfen, spätestens wenn sich Lage oder Anlass ändern.',
						'Check the necessity regularly, at the latest when the site or the reason changes.'
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
