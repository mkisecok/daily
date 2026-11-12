import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });
const BDSG = (ref: string): LegalBasis => ({ law: 'BDSG', ref });

export const OCCASIONS = [
	{
		value: 'beschwerde',
		label: L('Beschwerde einer betroffenen Person', 'Complaint by a data subject')
	},
	{ value: 'panne', label: L('Nach der Meldung einer Datenpanne', 'After a breach notification') },
	{
		value: 'pruefung',
		label: L('Anlasslose Prüfung oder Fragebogen', 'Routine audit or questionnaire')
	},
	{ value: 'vor_ort', label: L('Angekündigte Kontrolle vor Ort', 'Announced on-site inspection') },
	{
		value: 'bescheid',
		label: L('Anordnung oder Bescheid erhalten', 'Order or decision received')
	},
	{
		value: 'bussgeld',
		label: L(
			'Anhörung oder Bescheid im Bußgeldverfahren',
			'Hearing or decision in fine proceedings'
		)
	}
];

/** what led to the inquiry */
export const occasionOf = (data: RecordData) =>
	typeof data.anlass === 'string' && data.anlass ? data.anlass : null;

const is =
	(...values: string[]) =>
	(data: RecordData) =>
		values.includes(occasionOf(data) ?? '');

/** the checklist in the order of handling an inquiry */
export const BLOCKS: Block[] = [
	{
		id: 'eingang',
		title: L('Eingang', 'Receipt'),
		intro: L('Am Tag, an dem das Schreiben ankommt.', 'On the day the letter arrives.'),
		when: (data) => occasionOf(data) !== null,
		items: [
			{
				id: 'e_frist',
				label: L(
					'Frist aus dem Schreiben notiert; falls nötig rechtzeitig um Verlängerung gebeten',
					'Deadline from the letter noted; an extension asked for in good time if needed'
				),
				cite: DSGVO('Art. 31'),
				na: false
			},
			{
				id: 'e_echt',
				label: L(
					'Absender und Zuständigkeit geprüft: echtes Schreiben der zuständigen Aufsichtsbehörde',
					'Sender and competence checked: a genuine letter from the competent supervisory authority'
				),
				cite: BDSG('§ 40 Abs. 1, 2')
			},
			{
				id: 'e_intern',
				label: L(
					'Leitung und Datenschutzbeauftragte informiert',
					'Management and the data protection officer informed'
				),
				cite: DSGVO('Art. 38 Abs. 1'),
				na: false
			},
			{
				id: 'e_kontakt',
				label: L(
					'Eine Ansprechperson für die Behörde festgelegt',
					'One contact person for the authority set'
				),
				cite: DSGVO('Art. 39 Abs. 1 lit. e')
			}
		]
	},
	{
		id: 'sachverhalt',
		title: L('Sachverhalt klären', 'Establishing the facts'),
		intro: L(
			'Was die Behörde wissen will und was dazu vorliegt.',
			'What the authority wants to know and what is on file.'
		),
		when: is('beschwerde', 'panne', 'pruefung', 'vor_ort'),
		items: [
			{
				id: 's_fragen',
				label: L(
					'Jede Frage der Behörde einzeln erfasst und einer zuständigen Person zugeordnet',
					'Each of the authority’s questions listed and assigned to someone'
				),
				cite: DSGVO('Art. 31')
			},
			{
				id: 's_unterlagen',
				label: L(
					'Unterlagen zusammengestellt: VVT, TOM, DSFA, Auftragsverarbeitungsverträge, Löschkonzept',
					'Records gathered: record of processing, measures, DPIA, processing agreements, deletion concept'
				),
				cite: DSGVO('Art. 30 Abs. 4, Art. 5 Abs. 2')
			},
			{
				id: 's_intern',
				label: L(
					'Sachverhalt mit den Fachbereichen geklärt und Belege gesichert',
					'Facts settled with the departments and evidence secured'
				),
				cite: DSGVO('Art. 5 Abs. 2')
			},
			{
				id: 's_verweigerung',
				label: L(
					'Fragen geprüft, deren Antwort ein Straf- oder Bußgeldverfahren nach sich ziehen könnte; über das Auskunftsverweigerungsrecht bewusst entschieden',
					'Questions checked whose answer could lead to criminal or fine proceedings; the right to refuse decided on deliberately'
				),
				cite: BDSG('§ 40 Abs. 4 Satz 2')
			}
		]
	},
	{
		id: 'beschwerde',
		title: L('Beschwerde', 'Complaint'),
		intro: L(
			'Wenn sich eine betroffene Person beschwert hat.',
			'When a data subject has complained.'
		),
		when: is('beschwerde'),
		items: [
			{
				id: 'b_nachgeholt',
				label: L(
					'Das ursprüngliche Anliegen der Person beantwortet oder nachgeholt (Werkzeug Betroffenenanfrage)',
					'The person’s original request answered or made good (data subject request tool)'
				),
				cite: DSGVO('Art. 12 Abs. 3')
			},
			{
				id: 'b_ursache',
				label: L(
					'Ursache geklärt und abgestellt, etwa eine verlorene oder zu spät beantwortete Anfrage',
					'Cause found and removed, for example a request lost or answered late'
				),
				cite: DSGVO('Art. 24 Abs. 1')
			}
		]
	},
	{
		id: 'panne',
		title: L('Datenpanne', 'Breach'),
		intro: L(
			'Wenn die Anfrage auf eine gemeldete Datenpanne folgt.',
			'When the inquiry follows a reported breach.'
		),
		when: is('panne'),
		items: [
			{
				id: 'p_doku',
				label: L(
					'Dokumentation der Datenpanne vollständig (Werkzeug Datenpanne)',
					'Breach documentation complete (breach tool)'
				),
				cite: DSGVO('Art. 33 Abs. 5')
			},
			{
				id: 'p_massnahmen',
				label: L('Ergriffene Maßnahmen mit Datum belegt', 'Measures taken evidenced with dates'),
				cite: DSGVO('Art. 33 Abs. 3 lit. d')
			}
		]
	},
	{
		id: 'vor_ort',
		title: L('Kontrolle vor Ort', 'On-site inspection'),
		intro: L(
			'Die Behörde darf Geschäftsräume betreten und Anlagen einsehen; die Stelle muss das dulden.',
			'The authority may enter business premises and inspect systems; the organisation must allow it.'
		),
		when: is('vor_ort'),
		items: [
			{
				id: 'v_termin',
				label: L(
					'Termin bestätigt; Raum und Ansprechpersonen der Bereiche bereit',
					'Date confirmed; a room and the departments’ contacts ready'
				),
				cite: BDSG('§ 40 Abs. 5')
			},
			{
				id: 'v_zugang',
				label: L(
					'Zugang zu Systemen vorbereitet; die Prüfenden werden begleitet',
					'Access to systems prepared; the inspectors are accompanied'
				),
				cite: BDSG('§ 40 Abs. 5')
			},
			{
				id: 'v_protokoll',
				label: L(
					'Eigenes Protokoll geführt: was gezeigt, gefragt und mitgenommen wurde',
					'Own minutes kept: what was shown, asked and taken away'
				),
				cite: DSGVO('Art. 5 Abs. 2')
			}
		]
	},
	{
		id: 'rechtsbehelf',
		title: L('Bescheid und Rechtsbehelf', 'Decision and remedy'),
		intro: L(
			'Wenn eine Anordnung, ein Bescheid oder ein Bußgeldverfahren vorliegt.',
			'When there is an order, a decision or fine proceedings.'
		),
		when: is('bescheid', 'bussgeld'),
		items: [
			{
				id: 'r_beistand',
				label: L('Rechtlichen Beistand eingebunden', 'Legal counsel involved'),
				cite: BDSG('§ 20 Abs. 1'),
				na: false
			},
			{
				id: 'r_frist',
				label: L(
					'Rechtsbehelfsfrist im Kalender: Klage binnen eines Monats, Einspruch gegen einen Bußgeldbescheid binnen zwei Wochen',
					'Remedy deadline in the calendar: action within one month, objection to a fine within two weeks'
				),
				cite: BDSG('§ 20 Abs. 6'),
				help: L(
					'Gegen einen Bescheid ist die Klage zum Verwaltungsgericht ohne Widerspruchsverfahren gegeben, Frist ein Monat ab Bekanntgabe (§ 74 VwGO). Gegen einen Bußgeldbescheid: Einspruch binnen zwei Wochen ab Zustellung (§ 67 OWiG). Ohne korrekte Rechtsbehelfsbelehrung gelten längere Fristen.',
					'An action against a decision goes to the administrative court without an objection procedure, within one month of notification (§ 74 VwGO). Against a fine notice: objection within two weeks of service (§ 67 OWiG). Without correct instructions on remedies, longer periods apply.'
				),
				na: false
			},
			{
				id: 'r_umsetzung',
				label: L(
					'Anordnung umgesetzt oder Rechtsbehelf eingelegt',
					'Order carried out or a remedy filed'
				),
				cite: DSGVO('Art. 58 Abs. 2')
			}
		]
	},
	{
		id: 'antwort',
		title: L('Antwort', 'Reply'),
		intro: L('Was hinausgeht und was zugesagt wird.', 'What goes out and what is promised.'),
		when: is('beschwerde', 'panne', 'pruefung', 'bussgeld'),
		items: [
			{
				id: 'a_vollstaendig',
				label: L(
					'Antwort geht jede Frage in der Reihenfolge des Schreibens durch',
					'The reply takes each question in the order of the letter'
				),
				cite: DSGVO('Art. 31')
			},
			{
				id: 'a_anlagen',
				label: L(
					'Belege als nummerierte Anlagen beigefügt',
					'Evidence attached as numbered annexes'
				),
				cite: DSGVO('Art. 5 Abs. 2')
			},
			{
				id: 'a_versand',
				label: L(
					'Fristgerecht versandt; Versand und Inhalt abgelegt',
					'Sent on time; dispatch and content filed'
				),
				cite: DSGVO('Art. 31'),
				na: false
			},
			{
				id: 'a_zusagen',
				label: L(
					'Zugesagte Maßnahmen mit Termin und verantwortlicher Person erfasst',
					'Promised measures recorded with a date and an owner'
				),
				cite: DSGVO('Art. 24 Abs. 1')
			}
		]
	}
];

/** what still stands in the way of marking the reply sent, or null */
export function replyBlocked(data: RecordData): Localized | null {
	const state = checklist(data, BLOCKS);
	if (state.gaps.length > 0 || state.open.length > 0) {
		return L(
			'Erst alle Punkte der Checkliste erledigen.',
			'Complete every point of the checklist first.'
		);
	}
	return null;
}

/** an inquiry, inspection or decision of a supervisory authority, from receipt to closure */
export const definition: RecordToolDefinition = {
	slug: 'aufsichtsanfrage',
	version: 1,
	intro: L(
		'Ein Eintrag je Schreiben oder Verfahren einer Aufsichtsbehörde. Der Anlass bestimmt, welche Teile gelten. Verantwortliche müssen mit der Behörde zusammenarbeiten und Auskunft geben; Fragen, deren Antwort sie selbst belasten würde, dürfen sie verweigern. Gute Zusammenarbeit zählt bei der Bemessung eines Bußgeldes (Art. 83 Abs. 2 lit. f DSGVO).',
		'One entry per letter or procedure of a supervisory authority. The occasion decides which parts apply. Controllers must cooperate with the authority and provide information; they may refuse questions whose answer would incriminate them. Good cooperation counts when a fine is set (Art. 83(2)(f) GDPR).'
	),
	sources: [
		DSGVO('Art. 30 Abs. 4, 31, 58, 83 Abs. 2 lit. f'),
		BDSG('§ 20, § 40 Abs. 4, 5'),
		{ law: 'VwGO', ref: '§ 74' },
		{ law: 'OWiG', ref: '§ 67' }
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'vorgang',
			title: L('Vorgang', 'The procedure'),
			columns: 2,
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Betreff', 'Subject'),
					help: L(
						'Z. B. „Beschwerde wegen Auskunft, Az. 123/26“.',
						'E.g. "Complaint about access, ref. 123/26".'
					),
					required: true,
					listColumn: true
				},
				{ id: 'behoerde', type: 'text', label: L('Aufsichtsbehörde', 'Supervisory authority') },
				{ id: 'aktenzeichen', type: 'text', label: L('Aktenzeichen', 'Reference') },
				{
					id: 'anlass',
					type: 'select',
					label: L('Anlass', 'Occasion'),
					required: true,
					options: OCCASIONS,
					listColumn: true
				},
				{
					id: 'eingang_am',
					type: 'date',
					label: L('Eingegangen am', 'Received on'),
					required: true
				},
				{
					id: 'frist',
					type: 'date',
					label: L('Antwortfrist der Behörde', 'Authority’s deadline for a reply'),
					listColumn: true
				},
				{
					id: 'bescheid_am',
					type: 'date',
					label: L('Bescheid zugestellt am', 'Decision served on'),
					help: L(
						'Bei einem Bescheid oder Bußgeldbescheid: Daraus berechnet Daily die Rechtsbehelfsfrist.',
						'For a decision or fine notice: Daily works out the remedy deadline from it.'
					)
				},
				{ id: 'verantwortlich', type: 'text', label: L('Verantwortlich', 'In charge') },
				{
					id: 'gegenstand',
					type: 'textarea',
					label: L('Worum es geht', 'What it is about')
				}
			]
		},
		{
			id: 'verknuepfungen',
			title: L('Verknüpfungen', 'Links'),
			intro: L(
				'Die Einträge, nach denen die Behörde fragt.',
				'The entries the authority asks about.'
			),
			fields: [
				{
					id: 'anfrage',
					type: 'reference',
					tool: 'betroffenenanfrage',
					label: L('Betroffenenanfrage (bei Beschwerde)', 'Data subject request (with a complaint)')
				},
				{
					id: 'panne_ref',
					type: 'reference',
					tool: 'datenpanne',
					label: L('Datenpanne (nach einer Meldung)', 'Breach (after a notification)')
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
			title: L('Ergebnis', 'Outcome'),
			columns: 2,
			fields: [
				{ id: 'antwort_am', type: 'date', label: L('Antwort versandt am', 'Reply sent on') },
				{
					id: 'abschluss_am',
					type: 'date',
					label: L('Verfahren beendet am', 'Procedure ended on')
				},
				{
					id: 'ergebnis',
					type: 'textarea',
					label: L('Ergebnis der Behörde', 'Authority’s outcome'),
					help: L(
						'Etwa Einstellung, Hinweis, Verwarnung, Anordnung oder Bußgeld.',
						'For example closure, advice, reprimand, order or fine.'
					)
				}
			]
		}
	],
	workflow: {
		states: [
			{ id: 'offen', label: L('In Bearbeitung', 'In progress') },
			{ id: 'beantwortet', label: L('Beantwortet', 'Replied') },
			{ id: 'abgeschlossen', label: L('Abgeschlossen', 'Closed'), terminal: true }
		],
		initialState: 'offen',
		transitions: [
			{
				from: 'offen',
				to: 'beantwortet',
				label: L('Antwort versandt', 'Reply sent'),
				requires: ['antwort_am'],
				check: (record) => replyBlocked(record.data)
			},
			{
				from: 'beantwortet',
				to: 'offen',
				label: L('Rückfrage der Behörde', 'Authority asks again')
			},
			{
				from: 'beantwortet',
				to: 'abgeschlossen',
				label: L('Verfahren beendet', 'Procedure ended'),
				requires: ['abschluss_am']
			}
		]
	},
	example: {
		bezeichnung: 'Beschwerde wegen Auskunft (Beispiel)',
		behoerde: 'Landesbeauftragte für Datenschutz (Beispiel)',
		aktenzeichen: 'B-123/26',
		anlass: 'beschwerde',
		eingang_am: '2026-11-10',
		frist: '2026-12-01',
		verantwortlich: 'Datenschutzbeauftragte',
		gegenstand:
			'Eine Kundin hat sich beschwert, ihre Auskunftsanfrage vom August sei nicht beantwortet worden.',
		e_frist: 'ja',
		e_intern: 'ja',
		b_nachgeholt: 'nein',
		b_nachgeholt_notiz: 'Auskunft wird bis 20.11. nachgeholt.'
	}
};
