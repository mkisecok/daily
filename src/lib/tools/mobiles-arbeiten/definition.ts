import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });
const BSI = (ref: string): LegalBasis => ({ law: 'BSI', ref });

export const SCOPES = [
	{ value: 'betriebsrat', label: L('Es gibt einen Betriebsrat', 'There is a works council') },
	{
		value: 'privatgeraete',
		label: L('Private Geräte dürfen genutzt werden', 'Private devices may be used')
	},
	{
		value: 'papier',
		label: L('Papierunterlagen werden mitgenommen', 'Paper documents are taken home')
	},
	{
		value: 'ausland',
		label: L('Arbeiten aus dem Ausland ist möglich', 'Working from abroad is possible')
	},
	{
		value: 'besondere',
		label: L(
			'Gesundheits- oder andere Daten des Art. 9 sind betroffen',
			'Health or other Art. 9 data is involved'
		)
	}
];

/** the checklist in the order of setting up remote work */
export const BLOCKS: Block[] = [
	{
		id: 'regelung',
		title: L('Regelung', 'Rules'),
		intro: L(
			'Was schriftlich feststehen muss, bevor jemand von zu Hause oder unterwegs arbeitet.',
			'What must be in writing before anyone works from home or on the move.'
		),
		items: [
			{
				id: 'r_richtlinie',
				label: L(
					'Schriftliche Regelung für mobiles Arbeiten, von den Beschäftigten bestätigt',
					'Written rules for remote work, acknowledged by staff'
				),
				cite: BSI('OPS.1.2.4 Telearbeit'),
				na: false
			},
			{
				id: 'r_betriebsrat',
				label: L(
					'Betriebsrat bei der Ausgestaltung beteiligt; Betriebsvereinbarung geschlossen oder nicht nötig',
					'Works council involved in how it is set up; works agreement concluded or not needed'
				),
				cite: { law: 'BetrVG', ref: '§ 87 Abs. 1 Nr. 14' },
				help: L(
					'Mitbestimmt ist das Wie, also Ort, Zeit, Erreichbarkeit und Ausstattung, nicht das Ob. Für Werkzeuge, die Verhalten oder Leistung erfassen können, gilt zusätzlich § 87 Abs. 1 Nr. 6.',
					'Co-determination covers the how, such as place, time, availability and equipment, not the whether. Tools that can record behaviour or performance also fall under § 87(1) no. 6.'
				),
				scope: ['betriebsrat']
			},
			{
				id: 'r_kontrolle',
				label: L(
					'Keine Überwachung über das Vereinbarte hinaus, etwa keine Bildschirm- oder Tastaturaufzeichnung',
					'No monitoring beyond what was agreed, such as no screen or keystroke recording'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. c, Art. 88'),
				na: false
			},
			{
				id: 'r_unterweisung',
				label: L(
					'Beschäftigte unterwiesen: Phishing, Bildschirmsperre, Verhalten bei Verlust (Werkzeug Schulungsnachweis)',
					'Staff instructed: phishing, screen lock, what to do on loss (training record tool)'
				),
				cite: BSI('ORP.3 Sensibilisierung und Schulung zur Informationssicherheit')
			}
		]
	},
	{
		id: 'technik',
		title: L('Geräte und Zugang', 'Devices and access'),
		intro: L('Technische Maßnahmen außerhalb des Büros.', 'Technical measures outside the office.'),
		items: [
			{
				id: 't_geraete',
				label: L(
					'Dienstliche Geräte verschlüsselt und mit aktuellen Updates',
					'Work devices encrypted and up to date'
				),
				cite: DSGVO('Art. 32 Abs. 1 lit. a'),
				na: false
			},
			{
				id: 't_vpn',
				label: L(
					'Zugriff auf interne Systeme nur über VPN oder einen gleichwertig gesicherten Zugang mit zweitem Faktor',
					'Access to internal systems only through a VPN or equally secured access with a second factor'
				),
				cite: BSI('NET.3.3 VPN')
			},
			{
				id: 't_heimnetz',
				label: L(
					'Heimnetz: WLAN verschlüsselt, Standardpasswort des Routers geändert',
					'Home network: Wi-Fi encrypted, router default password changed'
				),
				cite: BSI('INF.8 Häuslicher Arbeitsplatz')
			},
			{
				id: 't_dritte',
				label: L(
					'Bildschirmsperre automatisch; Mitbewohnende sehen und nutzen das Gerät nicht',
					'Automatic screen lock; people in the household neither see nor use the device'
				),
				cite: BSI('INF.8 Häuslicher Arbeitsplatz'),
				na: false
			},
			{
				id: 't_speicher',
				label: L(
					'Daten nur auf freigegebenen Speichern, nicht lokal auf USB-Sticks oder in privaten Clouds',
					'Data only on approved storage, not locally on USB sticks or in private clouds'
				),
				cite: DSGVO('Art. 32 Abs. 1 lit. b')
			},
			{
				id: 't_video',
				label: L(
					'Videokonferenzdienst mit Auftragsverarbeitungsvertrag (Werkzeug AVV-Prüfung)',
					'Video conferencing service with a processing agreement (AVV check tool)'
				),
				cite: DSGVO('Art. 28 Abs. 3')
			}
		]
	},
	{
		id: 'privat',
		title: L('Private Geräte', 'Private devices'),
		intro: L('Wenn Beschäftigte eigene Geräte nutzen.', 'When staff use their own devices.'),
		scope: ['privatgeraete'],
		items: [
			{
				id: 'p_regel',
				label: L(
					'Festgelegt, welche privaten Geräte wofür genutzt werden dürfen',
					'Set which private devices may be used for what'
				),
				cite: DSGVO('Art. 24 Abs. 1')
			},
			{
				id: 'p_trennung',
				label: L(
					'Dienstliche Daten getrennt in einem verwalteten Bereich (Container, verwaltete Apps)',
					'Work data kept apart in a managed area (container, managed apps)'
				),
				cite: BSI('SYS.3.2.2 Mobile Device Management (MDM)')
			},
			{
				id: 'p_loeschung',
				label: L(
					'Dienstliche Daten werden bei Verlust oder Austritt gelöscht; kein Zugriff auf private Daten',
					'Work data is deleted on loss or leaving; no access to private data'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. c, Art. 17')
			}
		]
	},
	{
		id: 'papier',
		title: L('Papier', 'Paper'),
		intro: L('Wenn Unterlagen das Büro verlassen.', 'When documents leave the office.'),
		scope: ['papier'],
		items: [
			{
				id: 'd_aufbewahrung',
				label: L('Unterlagen verschlossen aufbewahrt', 'Documents kept locked away'),
				cite: BSI('INF.8 Häuslicher Arbeitsplatz')
			},
			{
				id: 'd_vernichtung',
				label: L(
					'Vernichtung mit geeignetem Aktenvernichter oder Rückgabe ins Büro, nie im Hausmüll',
					'Destruction with a suitable shredder or return to the office, never in household waste'
				),
				cite: DSGVO('Art. 32 Abs. 1'),
				help: L(
					'Die Sicherheitsstufe des Aktenvernichters richtet sich nach DIN 66399; für personenbezogene Daten wird häufig P-4 empfohlen.',
					'The shredder’s security level follows DIN 66399; P-4 is often recommended for personal data.'
				)
			},
			{
				id: 'd_transport',
				label: L(
					'Transport in verschlossener Tasche, nicht unbeaufsichtigt im Auto',
					'Carried in a closed bag, not left unattended in the car'
				),
				cite: BSI('INF.9 Mobiler Arbeitsplatz')
			}
		]
	},
	{
		id: 'ausland',
		title: L('Ausland', 'Abroad'),
		intro: L(
			'Wenn Beschäftigte zeitweise aus einem anderen Land arbeiten.',
			'When staff work from another country for a while.'
		),
		scope: ['ausland'],
		items: [
			{
				id: 'x_regel',
				label: L(
					'Arbeiten aus dem Ausland nur nach Abstimmung; erlaubte Länder festgelegt',
					'Working from abroad only by agreement; permitted countries set'
				),
				cite: BSI('CON.7 Informationssicherheit auf Auslandsreisen')
			},
			{
				id: 'x_risiko',
				label: L(
					'Sicherheitsrisiken des Ziellandes bedacht, etwa Gerätekontrollen an der Grenze und unsichere Netze',
					'Security risks of the destination considered, such as device checks at the border and insecure networks'
				),
				cite: { law: 'EDPB', ref: 'Leitlinien 05/2021' },
				help: L(
					'Greift eine Beschäftigte aus einem Drittland zu, ist das nach dem EDSA keine Übermittlung nach Kapitel V, weil sie Teil des Verantwortlichen ist. Die Sicherheitspflichten gelten trotzdem.',
					'An employee accessing data from a third country is not a transfer under Chapter V in the EDPB’s view, because she is part of the controller. The security duties still apply.'
				)
			}
		]
	},
	{
		id: 'besondere',
		title: L('Besondere Kategorien', 'Special categories'),
		intro: L(
			'Etwa in der Personalabteilung, im Betriebsarztwesen oder in der Pflege.',
			'For example in HR, occupational health or care.'
		),
		scope: ['besondere'],
		items: [
			{
				id: 'k_massnahmen',
				label: L(
					'Zusätzliche Schutzmaßnahmen festgelegt, oder diese Daten vom mobilen Arbeiten ausgenommen',
					'Additional safeguards set, or this data excluded from remote work'
				),
				cite: { law: 'BDSG', ref: '§ 22 Abs. 2' }
			}
		]
	},
	{
		id: 'vorfall',
		title: L('Verlust und Vorfälle', 'Loss and incidents'),
		intro: L(
			'Ein verlorenes Gerät kann eine meldepflichtige Datenpanne sein.',
			'A lost device can be a notifiable breach.'
		),
		items: [
			{
				id: 'v_meldeweg',
				label: L(
					'Meldeweg bei Verlust oder Diebstahl bekannt, sofort und auch am Wochenende',
					'Reporting channel for loss or theft known, immediately and also at weekends'
				),
				cite: DSGVO('Art. 33 Abs. 1'),
				na: false
			},
			{
				id: 'v_fernloeschen',
				label: L(
					'Verlorene Geräte lassen sich sperren oder aus der Ferne löschen',
					'Lost devices can be locked or wiped remotely'
				),
				cite: BSI('SYS.3.2.2 Mobile Device Management (MDM)')
			}
		]
	},
	{
		id: 'freigabe',
		title: L('Vor der Freigabe', 'Before approval'),
		intro: L('Der letzte Schritt.', 'The last step.'),
		items: [
			{
				id: 'f_tom',
				label: L(
					'Mobiles Arbeiten in den TOM beschrieben (Werkzeug TOM-Katalog)',
					'Remote work described in the measures (TOM catalogue tool)'
				),
				cite: DSGVO('Art. 32 Abs. 1')
			},
			{
				id: 'f_dsb',
				label: L('Datenschutzbeauftragte eingebunden', 'Data protection officer involved'),
				cite: DSGVO('Art. 38 Abs. 1')
			}
		]
	}
];

/** what still stands in the way of approval, or null */
export function approvalBlocked(data: RecordData): Localized | null {
	const state = checklist(data, BLOCKS);
	if (state.gaps.length > 0 || state.open.length > 0) {
		return L(
			'Erst alle Punkte der Checkliste erledigen.',
			'Complete every point of the checklist first.'
		);
	}
	return null;
}

/** rules for working from home or on the move, from the first draft to approval */
export const definition: RecordToolDefinition = {
	slug: 'mobiles-arbeiten',
	version: 1,
	intro: L(
		'Ein Eintrag je Regelung, etwa für das ganze Unternehmen oder einen Bereich. Der Umfang bestimmt, welche Teile gelten. Unterweisung, Auftragsverarbeitung und TOM werden mit den vorhandenen Werkzeugen verknüpft.',
		'One entry per set of rules, for example for the whole company or one department. The scope decides which parts apply. Instruction, processing agreements and measures are linked to the existing tools.'
	),
	sources: [
		DSGVO('Art. 5, 24, 32, 33'),
		{ law: 'BetrVG', ref: '§ 87 Abs. 1 Nr. 6, 14' },
		BSI(
			'IT-Grundschutz-Kompendium, Edition 2023: INF.8, INF.9, OPS.1.2.4, NET.3.3, SYS.3.2.2, CON.7'
		),
		{ law: 'EDPB', ref: 'Leitlinien 05/2021' }
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'vorhaben',
			title: L('Vorhaben', 'The arrangement'),
			columns: 2,
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Bezeichnung', 'Name'),
					help: L('Z. B. „Mobiles Arbeiten Vertrieb“.', 'E.g. "Remote work, sales".'),
					required: true,
					listColumn: true
				},
				{
					id: 'personenkreis',
					type: 'text',
					label: L('Für wen', 'For whom'),
					listColumn: true
				},
				{ id: 'start_am', type: 'date', label: L('Gilt ab', 'Applies from') },
				{ id: 'verantwortlich', type: 'text', label: L('Verantwortlich', 'In charge') },
				{
					id: 'umfang',
					type: 'multiselect',
					label: L('Was trifft zu?', 'What applies?'),
					help: L(
						'Bestimmt, welche weiteren Teile der Checkliste gelten.',
						'Decides which further parts of the checklist apply.'
					),
					options: SCOPES
				}
			]
		},
		{
			id: 'verknuepfungen',
			title: L('Verknüpfungen', 'Links'),
			fields: [
				{
					id: 'tom',
					type: 'reference',
					tool: 'tom-katalog',
					label: L('TOM-Katalog', 'TOM catalogue')
				},
				{
					id: 'schulung',
					type: 'reference',
					tool: 'schulungsnachweis',
					label: L('Schulungsnachweis', 'Training record')
				},
				{
					id: 'avv',
					type: 'reference',
					tool: 'avv-pruefung',
					label: L(
						'AVV-Prüfung (Videokonferenz)',
						'Processing agreement check (video conferencing)'
					)
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
						'Spätestens wenn neue Geräte, Dienste oder Länder hinzukommen.',
						'At the latest when new devices, services or countries are added.'
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
	},
	example: {
		bezeichnung: 'Mobiles Arbeiten Vertrieb (Beispiel)',
		personenkreis: 'Vertrieb und Kundenservice',
		verantwortlich: 'IT und Personal',
		umfang: ['betriebsrat', 'privatgeraete'],
		r_richtlinie: 'ja',
		r_betriebsrat: 'nein',
		r_betriebsrat_notiz: 'Entwurf der Betriebsvereinbarung liegt beim Betriebsrat.',
		t_geraete: 'ja',
		t_vpn: 'ja',
		p_trennung: 'nein'
	}
};
