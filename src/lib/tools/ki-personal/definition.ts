import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, snapshot, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });
const KIVO = (ref: string): LegalBasis => ({ law: 'KI-VO', ref });
const BETRVG = (ref: string): LegalBasis => ({ law: 'BetrVG', ref });

export const SCOPES = [
	{
		value: 'bewertung',
		label: L(
			'Bewertet Leistung oder Verhalten von Beschäftigten',
			'Rates performance or behaviour of staff'
		)
	},
	{
		value: 'entscheidungen',
		label: L(
			'Beeinflusst Beförderung, Kündigung oder die Zuweisung von Aufgaben',
			'Affects promotion, dismissal or the allocation of tasks'
		)
	},
	{ value: 'betriebsrat', label: L('Es gibt einen Betriebsrat', 'There is a works council') },
	{
		value: 'richtlinien',
		label: L('Hilft beim Aufstellen von Auswahlrichtlinien', 'Helps draw up selection guidelines')
	},
	{
		value: 'oeffentlich',
		label: L(
			'Öffentliche Stelle oder Erbringer öffentlicher Dienste',
			'Public body or provider of public services'
		)
	}
];

/** the attached risk classification's outcome */
export const classOf = (data: RecordData) => snapshot(data, 'einstufung')?.outcome ?? null;

/** the checklist in the order of introducing AI for staff */
export const BLOCKS: Block[] = [
	{
		id: 'grenzen',
		title: L('Verbote und Einstufung', 'Prohibitions and classification'),
		intro: L(
			'Was nie erlaubt ist, und welche Pflichten das System auslöst.',
			'What is never allowed, and which duties the system triggers.'
		),
		items: [
			{
				id: 'g_emotion',
				label: L(
					'Keine Ableitung von Emotionen am Arbeitsplatz, außer aus medizinischen oder Sicherheitsgründen',
					'No inference of emotions at the workplace, except for medical or safety reasons'
				),
				cite: KIVO('Art. 5 Abs. 1 lit. f'),
				na: false
			},
			{
				id: 'g_einstufung',
				label: L(
					'Risikoklasse festgestellt (Werkzeug Risikoklassifizierung)',
					'Risk class established (risk classification tool)'
				),
				cite: KIVO('Anhang III Nr. 4 lit. b'),
				na: false
			}
		]
	},
	{
		id: 'betriebsrat',
		title: L('Betriebsrat', 'Works council'),
		intro: L(
			'Seit 2021 regelt das BetrVG die Beteiligung bei Künstlicher Intelligenz ausdrücklich.',
			'Since 2021 the BetrVG expressly covers involvement on artificial intelligence.'
		),
		scope: ['betriebsrat'],
		items: [
			{
				id: 'b_unterrichtung',
				label: L(
					'Betriebsrat rechtzeitig über die Planung unterrichtet und mit ihm beraten',
					'Works council informed about the plans in good time and consulted'
				),
				cite: BETRVG('§ 90 Abs. 1 Nr. 3'),
				na: false
			},
			{
				id: 'b_mitbestimmung',
				label: L(
					'Mitbestimmung bei technischer Überwachung gewahrt; Betriebsvereinbarung geschlossen',
					'Co-determination on technical monitoring respected; works agreement concluded'
				),
				cite: BETRVG('§ 87 Abs. 1 Nr. 6')
			},
			{
				id: 'b_richtlinien',
				label: L(
					'Auswahlrichtlinien, an denen KI mitwirkt, nur mit Zustimmung des Betriebsrats',
					'Selection guidelines drawn up with AI only with the works council’s consent'
				),
				cite: BETRVG('§ 95 Abs. 2a'),
				scope: ['richtlinien']
			},
			{
				id: 'b_sachverstand',
				label: L(
					'Sachverständigen für den Betriebsrat ermöglicht, wenn er die KI beurteilen muss',
					'An expert made available to the works council when it has to assess the AI'
				),
				cite: BETRVG('§ 80 Abs. 3 Satz 2')
			}
		]
	},
	{
		id: 'information',
		title: L('Information', 'Information'),
		intro: L('Wer vorher Bescheid wissen muss.', 'Who must know beforehand.'),
		items: [
			{
				id: 'i_vorab',
				label: L(
					'Betroffene Beschäftigte und Arbeitnehmervertretung vor dem Einsatz informiert',
					'Affected staff and workers’ representatives informed before use'
				),
				cite: KIVO('Art. 26 Abs. 7'),
				help: L(
					'Für Hochrisiko-Systeme ist das Pflicht nach der KI-Verordnung, Geltungsbeginn 2. Dezember 2027; die Information über die Verarbeitung verlangt Art. 13 DSGVO schon heute.',
					'For high-risk systems this is required under the AI Act as of 2 December 2027; information about the processing is already required by Art. 13 GDPR.'
				),
				na: false
			},
			{
				id: 'i_hinweise',
				label: L(
					'Datenschutzhinweise für Beschäftigte um Zweck und Funktionsweise ergänzt',
					'Staff privacy notice extended with purpose and how it works'
				),
				cite: DSGVO('Art. 13')
			}
		]
	},
	{
		id: 'datenschutz',
		title: L('Datenschutz', 'Data protection'),
		intro: L('Grundlage und Umfang der Daten.', 'Basis and extent of the data.'),
		items: [
			{
				id: 'd_grundlage',
				label: L(
					'Rechtsgrundlage geprüft (§ 26 Abs. 1 BDSG ist seit EuGH C-34/21 umstritten)',
					'Legal basis checked (§ 26(1) BDSG is disputed since CJEU C-34/21)'
				),
				cite: DSGVO('Art. 6, Art. 88')
			},
			{
				id: 'd_umfang',
				label: L(
					'Nur nötige Daten; keine dauerhafte Aufzeichnung des Verhaltens',
					'Only the data needed; no permanent recording of behaviour'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. c')
			}
		]
	},
	{
		id: 'entscheidungen',
		title: L('Entscheidungen über Beschäftigte', 'Decisions about staff'),
		intro: L(
			'Wenn das System Leistung bewertet oder Entscheidungen vorbereitet.',
			'When the system rates performance or prepares decisions.'
		),
		scope: ['bewertung', 'entscheidungen'],
		items: [
			{
				id: 'e_mensch',
				label: L(
					'Ein Mensch entscheidet und kann das Ergebnis prüfen und übergehen',
					'A person decides and can review and override the result'
				),
				cite: DSGVO('Art. 22 Abs. 1'),
				na: false
			},
			{
				id: 'e_berichtigung',
				label: L(
					'Beschäftigte können falsche Daten und Bewertungen berichtigen lassen',
					'Staff can have wrong data and ratings corrected'
				),
				cite: DSGVO('Art. 16')
			}
		]
	},
	{
		id: 'hochrisiko',
		title: L('Pflichten bei Hochrisiko', 'High-risk duties'),
		intro: L(
			'Gelten, weil die Risikoklassifizierung ein Hochrisiko-System ergibt; Geltungsbeginn für Anhang III: 2. Dezember 2027.',
			'Apply because the risk classification finds a high-risk system; for Annex III as of 2 December 2027.'
		),
		when: (data) => classOf(data) === 'hochrisiko',
		items: [
			{
				id: 'h_anleitung',
				label: L(
					'Einsatz nach der Betriebsanleitung des Anbieters',
					'Used according to the provider’s instructions for use'
				),
				cite: KIVO('Art. 26 Abs. 1'),
				na: false
			},
			{
				id: 'h_aufsicht',
				label: L(
					'Menschliche Aufsicht durch kompetente, befugte Personen benannt',
					'Human oversight by competent, authorised people assigned'
				),
				cite: KIVO('Art. 26 Abs. 2'),
				na: false
			},
			{
				id: 'h_ueberwachung',
				label: L(
					'Betrieb überwacht; Risiken und schwerwiegende Vorfälle an den Anbieter gemeldet',
					'Operation monitored; risks and serious incidents reported to the provider'
				),
				cite: KIVO('Art. 26 Abs. 5')
			},
			{
				id: 'h_protokolle',
				label: L(
					'Automatisch erzeugte Protokolle mindestens sechs Monate aufbewahrt',
					'Automatically generated logs kept for at least six months'
				),
				cite: KIVO('Art. 26 Abs. 6')
			}
		]
	},
	{
		id: 'grfa',
		title: L('Grundrechte-Folgenabschätzung', 'Fundamental rights impact assessment'),
		intro: L(
			'Nur für öffentliche Stellen und private Erbringer öffentlicher Dienste; private Arbeitgeber trifft sie in der Regel nicht.',
			'Only for public bodies and private providers of public services; private employers are usually not covered.'
		),
		scope: ['oeffentlich'],
		when: (data) => classOf(data) === 'hochrisiko',
		items: [
			{
				id: 'f_grfa',
				label: L(
					'Grundrechte-Folgenabschätzung vor der Inbetriebnahme durchgeführt (Werkzeug Grundrechte-Folgenabschätzung)',
					'Fundamental rights impact assessment carried out before putting into service (FRIA tool)'
				),
				cite: KIVO('Art. 27 Abs. 1'),
				na: false
			}
		]
	}
];

/** the attached screening result says a DPIA is needed */
export const dpiaNeeded = (data: RecordData) =>
	snapshot(data, 'dsfa_check')?.verdict === 'positive';

/** what still stands in the way of approval, or null */
export function approvalBlocked(data: RecordData): Localized | null {
	if (classOf(data) === 'verboten') {
		return L(
			'Die Risikoklassifizierung ergibt eine verbotene Praxis.',
			'The risk classification finds a prohibited practice.'
		);
	}
	const state = checklist(data, BLOCKS);
	if (state.gaps.length > 0 || state.open.length > 0) {
		return L(
			'Erst alle Punkte der Checkliste erledigen.',
			'Complete every point of the checklist first.'
		);
	}
	if (!snapshot(data, 'einstufung')) {
		return L('Erst die Risikoklassifizierung durchführen.', 'Run the risk classification first.');
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

/** AI used on existing staff: rating, deciding, allocating work */
export const definition: RecordToolDefinition = {
	slug: 'ki-personal',
	version: 1,
	intro: L(
		'Ein Eintrag je KI-System, das bei bestehenden Beschäftigten eingesetzt wird: um Leistung oder Verhalten zu bewerten, Aufgaben zuzuweisen oder Beförderungen und Kündigungen vorzubereiten. Solche Systeme sind nach Anhang III Nr. 4 lit. b KI-VO hochriskant. Für Bewerbungen gibt es das Werkzeug Bewerbungsverfahren, für allgemeine KI-Werkzeuge KI-Tool einführen.',
		'One entry per AI system used on existing staff: to rate performance or behaviour, allocate tasks or prepare promotions and dismissals. Such systems are high-risk under Annex III no. 4(b) AI Act. Applications have the hiring procedure tool, general AI tools the AI tool introduction.'
	),
	sources: [
		KIVO('Art. 5 Abs. 1 lit. f, Art. 26, 27, Anhang III Nr. 4'),
		BETRVG('§ 80 Abs. 3, § 87 Abs. 1 Nr. 6, § 90 Abs. 1 Nr. 3, § 95 Abs. 2a'),
		DSGVO('Art. 5, 13, 16, 22, 35, 88')
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'vorhaben',
			title: L('System', 'The system'),
			columns: 2,
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('KI-System', 'AI system'),
					help: L(
						'Z. B. „Schichtplanung mit Leistungsprognose“.',
						'E.g. "Shift planning with performance forecast".'
					),
					required: true,
					listColumn: true
				},
				{ id: 'anbieter', type: 'text', label: L('Anbieter', 'Provider') },
				{
					id: 'zweck',
					type: 'textarea',
					label: L('Wofür es eingesetzt wird', 'What it is used for')
				},
				{
					id: 'einsatz_ab',
					type: 'date',
					label: L('Geplanter Einsatz ab', 'Planned use from'),
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
					id: 'einstufung',
					type: 'assessment',
					tool: 'risikoklassifizierung',
					label: L('Risikoklassifizierung', 'Risk classification'),
					cite: KIVO('Art. 6')
				},
				{
					id: 'dsfa_check',
					type: 'assessment',
					tool: 'dsfa-schwellwert',
					label: L('DSFA-Schwellwertanalyse', 'DPIA screening'),
					cite: DSGVO('Art. 35 Abs. 1')
				},
				{
					id: 'dsfa',
					type: 'reference',
					tool: 'dsfa',
					label: L('DSFA (falls nötig)', 'DPIA (if needed)')
				},
				{
					id: 'register',
					type: 'reference',
					tool: 'ki-register',
					label: L('Eintrag im KI-Register', 'AI register entry')
				},
				{
					id: 'grfa_ref',
					type: 'reference',
					tool: 'grundrechte-folgenabschaetzung',
					label: L('Grundrechte-Folgenabschätzung (falls nötig)', 'FRIA (if needed)')
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
						'Spätestens bei neuen Funktionen oder einer neuen Version des Systems.',
						'At the latest with new functions or a new version of the system.'
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
		bezeichnung: 'Schichtplanung mit Leistungsprognose (Beispiel)',
		anbieter: 'Beispiel Workforce GmbH',
		zweck: 'Verteilt Schichten und Aufgaben nach prognostizierter Leistung je Person.',
		verantwortlich: 'Leitung Logistik',
		umfang: ['bewertung', 'entscheidungen', 'betriebsrat'],
		g_emotion: 'ja',
		b_unterrichtung: 'ja',
		b_mitbestimmung: 'nein',
		b_mitbestimmung_notiz: 'Verhandlung über die Betriebsvereinbarung läuft.',
		e_mensch: 'ja'
	}
};
