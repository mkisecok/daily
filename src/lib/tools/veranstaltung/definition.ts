import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, inScope, snapshot, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });

export const SCOPES = [
	{ value: 'fotos', label: L('Es wird fotografiert oder gefilmt', 'Photos or video are taken') },
	{
		value: 'veroeffentlichung',
		label: L(
			'Bilder kommen auf Website oder soziale Netzwerke',
			'Pictures go on the website or social media'
		)
	},
	{ value: 'kinder', label: L('Kinder nehmen teil', 'Children attend') },
	{
		value: 'stream',
		label: L('Vorträge werden aufgezeichnet oder gestreamt', 'Talks are recorded or streamed')
	},
	{
		value: 'essen',
		label: L(
			'Ernährung oder Barrierefreiheit wird abgefragt',
			'Dietary or accessibility needs are asked'
		)
	},
	{
		value: 'sponsoren',
		label: L(
			'Teilnehmerdaten gehen an Sponsoren oder Partner',
			'Attendee data goes to sponsors or partners'
		)
	},
	{
		value: 'plattform',
		label: L('Anmeldung über eine Plattform oder App', 'Registration through a platform or app')
	}
];

/** the checklist in the order of an event */
export const BLOCKS: Block[] = [
	{
		id: 'anmeldung',
		title: L('Einladung und Anmeldung', 'Invitation and registration'),
		intro: L('Was vor dem Termin feststehen muss.', 'What must be settled before the day.'),
		items: [
			{
				id: 'g_hinweise',
				label: L(
					'Datenschutzhinweise bei der Anmeldung, einschließlich Fotos und Aufzeichnungen',
					'Privacy notice at registration, including photos and recordings'
				),
				cite: DSGVO('Art. 13'),
				na: false
			},
			{
				id: 'g_umfang',
				label: L(
					'Bei der Anmeldung nur nötige Angaben erfragt',
					'Only the details needed asked at registration'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. c')
			},
			{
				id: 'g_plattform',
				label: L(
					'Auftragsverarbeitungsvertrag mit der Anmeldeplattform (Werkzeug AVV-Prüfung)',
					'Processing agreement with the registration platform (AVV check tool)'
				),
				cite: DSGVO('Art. 28 Abs. 3'),
				scope: ['plattform']
			},
			{
				id: 'g_besondere',
				label: L(
					'Angaben zu Ernährung und Barrierefreiheit freiwillig, mit ausdrücklicher Einwilligung, nach dem Termin gelöscht',
					'Dietary and accessibility details voluntary, with explicit consent, deleted after the day'
				),
				cite: DSGVO('Art. 9 Abs. 2 lit. a'),
				help: L(
					'Allergien, vegetarisch oder halal können Gesundheit oder Religion offenlegen.',
					'Allergies, vegetarian or halal can reveal health or religion.'
				),
				scope: ['essen']
			},
			{
				id: 'g_partner',
				label: L(
					'Weitergabe an Sponsoren oder Partner nur mit eigener Einwilligung',
					'Passing on to sponsors or partners only with separate consent'
				),
				cite: DSGVO('Art. 6 Abs. 1 lit. a, Art. 7'),
				scope: ['sponsoren'],
				na: false
			}
		]
	},
	{
		id: 'fotos',
		title: L('Fotos und Video', 'Photos and video'),
		intro: L(
			'Fotos von erkennbaren Personen sind personenbezogene Daten.',
			'Photos of identifiable people are personal data.'
		),
		scope: ['fotos'],
		items: [
			{
				id: 'f_grundlage',
				label: L(
					'Rechtsgrundlage festgelegt: für Übersichtsbilder meist berechtigtes Interesse (Werkzeug Interessenabwägung), für Porträts Einwilligung',
					'Legal basis set: usually legitimate interest for overview shots (legitimate-interest tool), consent for portraits'
				),
				cite: DSGVO('Art. 6 Abs. 1 lit. a, f'),
				help: L(
					'Ob daneben das Kunsturhebergesetz (§§ 22, 23 KUG) gilt, ist seit der DSGVO umstritten (Art. 85 DSGVO); die Abwägung sollte beide Maßstäbe tragen.',
					'Whether the German art copyright act (§§ 22, 23 KUG) also applies is disputed since the GDPR (Art. 85 GDPR); the balancing should hold under both.'
				),
				na: false
			},
			{
				id: 'f_hinweis',
				label: L(
					'Hinweis auf Fotos in der Einladung und gut sichtbar am Eingang, mit Ansprechperson',
					'Notice of photos in the invitation and clearly at the entrance, with a contact'
				),
				cite: DSGVO('Art. 13'),
				na: false
			},
			{
				id: 'f_widerspruch',
				label: L(
					'Wer nicht fotografiert werden will, ist erkennbar, etwa an einem Aufkleber, und wird nicht fotografiert',
					'Those who do not want to be photographed are recognisable, for example by a sticker, and are not photographed'
				),
				cite: DSGVO('Art. 21 Abs. 1')
			},
			{
				id: 'f_fotograf',
				label: L(
					'Auftragsverarbeitungsvertrag mit dem beauftragten Fotografen',
					'Processing agreement with the commissioned photographer'
				),
				cite: DSGVO('Art. 28 Abs. 3')
			}
		]
	},
	{
		id: 'kinder',
		title: L('Kinder', 'Children'),
		intro: L('Kinder brauchen besonderen Schutz.', 'Children need special protection.'),
		scope: ['kinder'],
		items: [
			{
				id: 'c_einwilligung',
				label: L(
					'Fotos von Kindern nur mit Einwilligung der Sorgeberechtigten',
					'Photos of children only with the consent of those with parental responsibility'
				),
				cite: DSGVO('Art. 6 Abs. 1 lit. a, ErwG 38'),
				na: false
			}
		]
	},
	{
		id: 'veroeffentlichung',
		title: L('Veröffentlichung', 'Publication'),
		intro: L(
			'Ein Foto zu machen und es zu veröffentlichen sind zwei Schritte.',
			'Taking a photo and publishing it are two steps.'
		),
		scope: ['veroeffentlichung'],
		items: [
			{
				id: 'v_auswahl',
				label: L(
					'Bilder vor der Veröffentlichung ausgewählt: nichts Bloßstellendes; einzelne Personen nur mit Einwilligung',
					'Pictures chosen before publication: nothing embarrassing; individuals only with consent'
				),
				cite: { law: 'KUG', ref: '§ 22, § 23' }
			},
			{
				id: 'v_entfernen',
				label: L('Bilder auf Wunsch zügig entfernt', 'Pictures removed promptly on request'),
				cite: DSGVO('Art. 17, Art. 21')
			},
			{
				id: 'v_netzwerke',
				label: L(
					'Für Seiten in sozialen Netzwerken die gemeinsame Verantwortung mit dem Netzwerk geregelt',
					'For social media pages, joint controllership with the network settled'
				),
				cite: DSGVO('Art. 26'),
				help: L(
					'Betreiber einer Fanpage sind mit dem Netzwerk gemeinsam verantwortlich (EuGH C-210/16).',
					'Operators of a fan page are joint controllers with the network (CJEU C-210/16).'
				)
			}
		]
	},
	{
		id: 'stream',
		title: L('Aufzeichnung und Stream', 'Recording and stream'),
		intro: L(
			'Wenn Vorträge aufgezeichnet oder übertragen werden.',
			'When talks are recorded or broadcast.'
		),
		scope: ['stream'],
		items: [
			{
				id: 's_referierende',
				label: L(
					'Referierende willigen in Aufzeichnung und Veröffentlichung ein',
					'Speakers consent to recording and publication'
				),
				cite: DSGVO('Art. 6 Abs. 1 lit. a'),
				na: false
			},
			{
				id: 's_publikum',
				label: L(
					'Publikum über die Aufzeichnung informiert; es gibt Plätze außerhalb des Kamerabilds',
					'Audience told about the recording; there are seats out of camera view'
				),
				cite: DSGVO('Art. 13, Art. 21 Abs. 1')
			}
		]
	},
	{
		id: 'nachher',
		title: L('Nach der Veranstaltung', 'After the event'),
		intro: L('Was bleibt und was geht.', 'What stays and what goes.'),
		items: [
			{
				id: 'n_loeschen',
				label: L(
					'Gästeliste gelöscht, sobald der Zweck erfüllt ist; Rechnungsdaten nach den Fristen aufbewahrt',
					'Guest list deleted once its purpose is served; invoice data kept for the retention periods'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. e, Art. 17 Abs. 3 lit. b'),
				na: false
			},
			{
				id: 'n_vvt',
				label: L(
					'Veranstaltungen im Verzeichnis von Verarbeitungstätigkeiten erfasst',
					'Events recorded in the record of processing activities'
				),
				cite: DSGVO('Art. 30 Abs. 1')
			}
		]
	}
];

/** what still stands in the way of closing the event, or null */
export function closingBlocked(data: RecordData): Localized | null {
	const state = checklist(data, BLOCKS);
	if (state.gaps.length > 0 || state.open.length > 0) {
		return L(
			'Erst alle Punkte der Checkliste erledigen.',
			'Complete every point of the checklist first.'
		);
	}
	if (inScope(data, ['fotos']) && !snapshot(data, 'abwaegung')) {
		return L(
			'Erst die Interessenabwägung für die Fotos durchführen.',
			'Run the legitimate-interest assessment for the photos first.'
		);
	}
	return null;
}

/** an event with a guest list, from the invitation to deleting the list */
export const definition: RecordToolDefinition = {
	slug: 'veranstaltung',
	version: 1,
	intro: L(
		'Ein Eintrag je Veranstaltung: Firmenfeier, Messe, Tag der offenen Tür, Konferenz. Der Umfang bestimmt, welche Teile gelten. Fotografieren und Veröffentlichen sind getrennte Schritte; für Übersichtsbilder trägt meist das berechtigte Interesse, für Porträts und Kinder die Einwilligung.',
		'One entry per event: company party, trade fair, open day, conference. The scope decides which parts apply. Taking and publishing photos are separate steps; legitimate interest usually covers overview shots, consent covers portraits and children.'
	),
	sources: [DSGVO('Art. 5, 6, 9, 13, 21, 26, 85'), { law: 'KUG', ref: '§ 22, § 23' }],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'vorhaben',
			title: L('Veranstaltung', 'The event'),
			columns: 2,
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Bezeichnung', 'Name'),
					help: L('Z. B. „Sommerfest 2027“.', 'E.g. "Summer party 2027".'),
					required: true,
					listColumn: true
				},
				{ id: 'ort', type: 'text', label: L('Ort', 'Place') },
				{
					id: 'termin',
					type: 'date',
					label: L('Termin', 'Date'),
					listColumn: true
				},
				{
					id: 'loeschung_am',
					type: 'date',
					label: L('Gästeliste löschen am', 'Delete the guest list on'),
					help: L(
						'Sobald Nachfassen und Abrechnung erledigt sind.',
						'Once follow-up and invoicing are done.'
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
					id: 'abwaegung',
					type: 'assessment',
					tool: 'interessenabwaegung',
					label: L('Interessenabwägung (bei Fotos)', 'Legitimate-interest assessment (photos)'),
					cite: DSGVO('Art. 6 Abs. 1 lit. f')
				},
				{
					id: 'vvt',
					type: 'reference',
					tool: 'vvt',
					label: L('VVT: Veranstaltungen', 'Record of processing: events')
				}
			]
		},
		...blockSections(BLOCKS),
		{
			id: 'abschluss',
			title: L('Abschluss', 'Closing'),
			columns: 2,
			fields: [
				{
					id: 'geloescht_am',
					type: 'date',
					label: L('Gästeliste gelöscht am', 'Guest list deleted on')
				},
				{ id: 'abschluss_durch', type: 'text', label: L('Abgeschlossen durch', 'Closed by') }
			]
		}
	],
	workflow: {
		states: [
			{ id: 'planung', label: L('Planung', 'Planning') },
			{ id: 'durchgefuehrt', label: L('Durchgeführt', 'Held') },
			{ id: 'abgeschlossen', label: L('Abgeschlossen', 'Closed'), terminal: true }
		],
		initialState: 'planung',
		transitions: [
			{ from: 'planung', to: 'durchgefuehrt', label: L('Veranstaltung fand statt', 'Event held') },
			{ from: 'durchgefuehrt', to: 'planung', label: L('Zurück zur Planung', 'Back to planning') },
			{
				from: 'durchgefuehrt',
				to: 'abgeschlossen',
				label: L('Gästeliste gelöscht', 'Guest list deleted'),
				requires: ['geloescht_am'],
				check: (record) => closingBlocked(record.data)
			}
		]
	},
	example: {
		bezeichnung: 'Sommerfest (Beispiel)',
		ort: 'Firmengelände',
		verantwortlich: 'Personal und Kommunikation',
		umfang: ['fotos', 'veroeffentlichung', 'kinder', 'essen'],
		g_hinweise: 'ja',
		g_besondere: 'nein',
		g_besondere_notiz: 'Allergien werden im Anmeldeformular als Pflichtfeld abgefragt.',
		f_hinweis: 'ja',
		c_einwilligung: 'nein'
	}
};
