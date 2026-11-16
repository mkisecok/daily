import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, inScope, snapshot, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const KIVO = (ref: string): LegalBasis => ({ law: 'KI-VO', ref });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });

export const SCOPES = [
	{
		value: 'personenbezug',
		label: L(
			'Eingaben oder Ausgaben enthalten personenbezogene Daten',
			'Inputs or outputs contain personal data'
		)
	},
	{
		value: 'beschaeftigte',
		label: L('Wird von Beschäftigten bei der Arbeit genutzt', 'Used by staff at work')
	},
	{
		value: 'kontakt',
		label: L(
			'Spricht mit Kunden oder der Öffentlichkeit (Chatbot, Telefon)',
			'Talks to customers or the public (chatbot, phone)'
		)
	},
	{
		value: 'inhalte',
		label: L(
			'Erzeugt Texte, Bilder, Audio oder Video zur Veröffentlichung',
			'Generates text, images, audio or video for publication'
		)
	},
	{
		value: 'entscheidungen',
		label: L('Bereitet Entscheidungen über Personen vor', 'Prepares decisions about people')
	},
	{
		value: 'personal',
		label: L(
			'Im Personalbereich: Bewerbung, Leistung, Einsatzplanung',
			'In HR: applications, performance, scheduling'
		)
	},
	{
		value: 'chatbot',
		label: L('Chatbot für Kunden oder Besucher', 'Chatbot for customers or visitors')
	}
];

/** the attached risk classification's outcome, e.g. `hochrisiko` */
export const riskOutcome = (data: RecordData) => snapshot(data, 'einstufung')?.outcome ?? null;

export const BLOCKS: Block[] = [
	{
		id: 'anbieter',
		title: L('Anbieter und Vertrag', 'Provider and contract'),
		intro: L(
			'Was der Anbieter mit den Eingaben macht und was er zusagt.',
			'What the provider does with the inputs and what it commits to.'
		),
		items: [
			{
				id: 'v_training',
				label: L(
					'Nutzungsbedingungen geprüft: Eingaben werden nicht ohne Zustimmung zum Training genutzt',
					'Terms checked: inputs are not used for training without consent'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. b')
			},
			{
				id: 'v_avv',
				label: L(
					'Auftragsverarbeitungsvertrag geschlossen (Werkzeug AVV-Prüfung)',
					'Processing agreement concluded (AVV check tool)'
				),
				cite: DSGVO('Art. 28 Abs. 3'),
				scope: ['personenbezug']
			},
			{
				id: 'v_standort',
				label: L(
					'Ort der Verarbeitung bekannt; außerhalb des EWR mit Grundlage nach Kapitel V',
					'Place of processing known; outside the EEA with a Chapter V basis'
				),
				cite: DSGVO('Art. 44'),
				scope: ['personenbezug']
			},
			{
				id: 'v_anleitung',
				label: L(
					'Betriebsanleitung oder Dokumentation des Anbieters liegt vor',
					'The provider’s instructions or documentation are on file'
				),
				cite: KIVO('Art. 13, Art. 26 Abs. 1')
			}
		]
	},
	{
		id: 'nutzung',
		title: L('Regeln für die Nutzung', 'Rules of use'),
		intro: L('Was Nutzende dürfen, sollen und können.', 'What users may, should and can do.'),
		items: [
			{
				id: 'n_richtlinie',
				label: L(
					'Die KI-Nutzungsrichtlinie gilt für das Tool (Werkzeug KI-Nutzungsrichtlinie)',
					'The AI usage policy covers the tool (AI usage policy tool)'
				),
				cite: KIVO('Art. 4')
			},
			{
				id: 'n_eingaben',
				label: L(
					'Festgelegt, welche Daten eingegeben werden dürfen; keine besonderen Kategorien ohne Freigabe',
					'Set which data may be entered; no special categories without approval'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. c, Art. 25')
			},
			{
				id: 'n_pruefen',
				label: L(
					'Ausgaben werden vor der Verwendung von einem Menschen geprüft',
					'Outputs are checked by a person before use'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. d')
			},
			{
				id: 'n_kompetenz',
				label: L(
					'Nutzende geschult (Werkzeug Schulungsnachweis)',
					'Users trained (training log tool)'
				),
				cite: KIVO('Art. 4')
			}
		]
	},
	{
		id: 'daten',
		title: L('Personenbezogene Daten', 'Personal data'),
		intro: L(
			'Wenn Eingaben oder Ausgaben Personen betreffen.',
			'When inputs or outputs concern people.'
		),
		scope: ['personenbezug'],
		items: [
			{
				id: 'p_rechtsgrundlage',
				label: L(
					'Rechtsgrundlage für Eingaben und Ausgaben festgestellt',
					'Legal basis for inputs and outputs established'
				),
				cite: DSGVO('Art. 6 Abs. 1')
			},
			{
				id: 'p_vvt',
				label: L(
					'Eintrag im Verzeichnis von Verarbeitungstätigkeiten',
					'Entry in the record of processing activities'
				),
				cite: DSGVO('Art. 30 Abs. 1')
			},
			{
				id: 'p_rechte',
				label: L(
					'Betroffenenrechte lassen sich erfüllen, auch für gespeicherte Verläufe',
					'Data subject rights can be met, also for stored histories'
				),
				cite: DSGVO('Art. 15 bis 17')
			},
			{
				id: 'p_speicherung',
				label: L(
					'Speicherdauer von Eingaben und Verläufen eingestellt',
					'Retention of inputs and histories set'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. e')
			}
		]
	},
	{
		id: 'beschaeftigte',
		title: L('Beschäftigte', 'Staff'),
		intro: L(
			'Wenn Beschäftigte das Tool bei der Arbeit nutzen.',
			'When staff use the tool at work.'
		),
		scope: ['beschaeftigte'],
		items: [
			{
				id: 'b_unterrichtung',
				label: L(
					'Betriebsrat rechtzeitig über die Planung unterrichtet',
					'Works council informed of the plans in good time'
				),
				cite: { law: 'BetrVG', ref: '§ 90 Abs. 1 Nr. 3' }
			},
			{
				id: 'b_mitbestimmung',
				label: L(
					'Mitbestimmung geklärt, wenn das Tool Leistung oder Verhalten erfassen kann',
					'Co-determination settled where the tool can record performance or behaviour'
				),
				cite: { law: 'BetrVG', ref: '§ 87 Abs. 1 Nr. 6' }
			},
			{
				id: 'b_richtlinien',
				label: L(
					'Auswahlrichtlinien, an denen KI mitwirkt, nur mit Zustimmung des Betriebsrats',
					'Selection guidelines drawn up with AI only with the works council’s consent'
				),
				cite: { law: 'BetrVG', ref: '§ 95 Abs. 2a' },
				scope: ['personal']
			},
			{
				id: 'b_sachverstand',
				label: L(
					'Sachverständigen für den Betriebsrat ermöglicht, wenn er die KI beurteilen muss',
					'An expert made available to the works council when it has to assess the AI'
				),
				cite: { law: 'BetrVG', ref: '§ 80 Abs. 3 Satz 2' },
				scope: ['personal']
			}
		]
	},
	{
		id: 'transparenz',
		title: L('Transparenz', 'Transparency'),
		intro: L(
			'Wenn das Tool mit Menschen spricht oder Inhalte erzeugt, die veröffentlicht werden.',
			'When the tool talks to people or generates content that is published.'
		),
		scope: ['kontakt', 'inhalte', 'chatbot'],
		items: [
			{
				id: 't_hinweis',
				label: L(
					'Hinweis, dass Personen mit einer KI sprechen (Werkzeug Transparenzpflichten)',
					'Notice that people are talking to an AI (transparency tool)'
				),
				cite: KIVO('Art. 50 Abs. 1'),
				scope: ['kontakt', 'chatbot']
			},
			{
				id: 't_kennzeichnung',
				label: L(
					'Veröffentlichte KI-Inhalte und Deepfakes gekennzeichnet',
					'Published AI content and deepfakes labelled'
				),
				cite: KIVO('Art. 50 Abs. 4'),
				scope: ['inhalte']
			}
		]
	},
	{
		id: 'entscheidungen',
		title: L('Entscheidungen über Personen', 'Decisions about people'),
		intro: L(
			'Wenn Ergebnisse in Entscheidungen über Menschen einfließen.',
			'When outputs feed into decisions about people.'
		),
		scope: ['entscheidungen'],
		items: [
			{
				id: 'e_mensch',
				label: L(
					'Keine ausschließlich automatisierte Entscheidung mit rechtlicher oder ähnlich erheblicher Wirkung; ein Mensch entscheidet',
					'No decision with legal or similarly significant effect based solely on automated processing; a person decides'
				),
				cite: DSGVO('Art. 22 Abs. 1')
			},
			{
				id: 'e_erklaerung',
				label: L(
					'Die Entscheidung lässt sich gegenüber der betroffenen Person erklären',
					'The decision can be explained to the person concerned'
				),
				cite: DSGVO('Art. 13 Abs. 2 lit. f, Art. 15 Abs. 1 lit. h')
			}
		]
	},
	{
		id: 'personal',
		title: L('Im Personalbereich', 'In HR'),
		intro: L(
			'Wenn die KI Bewerbungen, Leistung oder den Einsatz von Beschäftigten betrifft; dann ist sie oft hochriskant (Anhang III Nr. 4 KI-VO).',
			'When the AI concerns applications, performance or the deployment of staff; it is then often high-risk (Annex III point 4 AI Act).'
		),
		scope: ['personal'],
		items: [
			{
				id: 'm_emotion',
				label: L(
					'Keine Ableitung von Emotionen am Arbeitsplatz, außer aus medizinischen oder Sicherheitsgründen',
					'No inference of emotions at the workplace, except for medical or safety reasons'
				),
				cite: { law: 'KI-VO', ref: 'Art. 5 Abs. 1 lit. f' },
				na: false
			},
			{
				id: 'm_grundlage',
				label: L(
					'Rechtsgrundlage geprüft (§ 26 Abs. 1 BDSG ist seit EuGH C-34/21 umstritten)',
					'Legal basis checked (§ 26(1) BDSG is disputed since CJEU C-34/21)'
				),
				cite: { law: 'DSGVO', ref: 'Art. 6, Art. 88' }
			},
			{
				id: 'm_umfang',
				label: L(
					'Nur nötige Daten; keine dauerhafte Aufzeichnung des Verhaltens',
					'Only the data needed; no permanent recording of behaviour'
				),
				cite: { law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. c' }
			},
			{
				id: 'm_hinweise',
				label: L(
					'Datenschutzhinweise für Beschäftigte um Zweck und Funktionsweise ergänzt',
					'Staff privacy notice extended with purpose and how it works'
				),
				cite: { law: 'DSGVO', ref: 'Art. 13' }
			},
			{
				id: 'm_berichtigung',
				label: L(
					'Beschäftigte können falsche Daten und Bewertungen berichtigen lassen',
					'Staff can have wrong data and ratings corrected'
				),
				cite: { law: 'DSGVO', ref: 'Art. 16' }
			}
		]
	},
	{
		id: 'chatbot',
		title: L('Chatbot', 'Chatbot'),
		intro: L(
			'Wenn Kunden oder Besucher mit dem Tool schreiben, etwa auf der Website.',
			'When customers or visitors chat with the tool, for example on the website.'
		),
		scope: ['chatbot'],
		items: [
			{
				id: 'c_rolle',
				label: L(
					'Rolle geklärt: Anbieter des Chatbots oder Betreiber eines fremden Systems',
					'Role settled: provider of the chatbot or deployer of someone else’s system'
				),
				cite: { law: 'KI-VO', ref: 'Art. 3 Nr. 3, 4' },
				help: L(
					'Wer einen Chatbot entwickeln lässt oder selbst auf ein Sprachmodell aufsetzt und ihn unter eigenem Namen in Betrieb nimmt, ist in der Regel Anbieter dieses Systems.',
					'Whoever has a chatbot developed, or builds one on a language model, and puts it into service under their own name is usually the provider of that system.'
				),
				na: false
			},
			{
				id: 'c_hinweise',
				label: L(
					'Datenschutzhinweise nennen den Chatbot, den Anbieter, den Zweck und die Speicherdauer',
					'Privacy notice names the chatbot, the provider, the purpose and the storage period'
				),
				cite: { law: 'DSGVO', ref: 'Art. 13' },
				na: false
			},
			{
				id: 'c_laden',
				label: L(
					'Das Chatfenster lädt Dienste Dritter erst, wenn jemand den Chat öffnet',
					'The chat window loads third-party services only once someone opens the chat'
				),
				cite: { law: 'TDDDG', ref: '§ 25 Abs. 1' }
			},
			{
				id: 'c_sensibel',
				label: L(
					'Hinweis, keine Gesundheits- oder anderen sensiblen Daten einzugeben',
					'Notice not to enter health or other sensitive data'
				),
				cite: { law: 'DSGVO', ref: 'Art. 9 Abs. 1' }
			},
			{
				id: 'c_missbrauch',
				label: L(
					'Gegen Missbrauch geprüft: eingeschleuste Anweisungen, Abfluss interner Daten',
					'Checked against misuse: injected instructions, leaking internal data'
				),
				cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1' }
			}
		]
	},
	{
		id: 'hochrisiko',
		title: L('Hochrisiko-KI', 'High-risk AI'),
		intro: L(
			'Nur wenn die Risikoklassifizierung ein Hochrisiko-System ergibt; Geltungsbeginn der Pflichten: 2. Dezember 2027.',
			'Only when the risk classification finds a high-risk system; the duties apply as of 2 December 2027.'
		),
		when: (data) => riskOutcome(data) === 'hochrisiko',
		items: [
			{
				id: 'h_betreiber',
				label: L(
					'Betreiberpflichten umgesetzt (Werkzeug Betreiberpflichten)',
					'Deployer duties in place (deployer duties tool)'
				),
				cite: KIVO('Art. 26')
			},
			{
				id: 'h_aufsicht',
				label: L(
					'Menschliche Aufsicht durch kompetente, befugte Personen benannt',
					'Human oversight assigned to competent, authorised persons'
				),
				cite: KIVO('Art. 26 Abs. 2')
			},
			{
				id: 'h_beschaeftigte',
				label: L(
					'Beschäftigte und ihre Vertretung vor der Inbetriebnahme am Arbeitsplatz informiert',
					'Staff and their representatives informed before use at the workplace'
				),
				cite: KIVO('Art. 26 Abs. 7')
			},
			{
				id: 'h_grundrechte',
				label: L(
					'Grundrechte-Folgenabschätzung, wo Art. 27 sie verlangt (Werkzeug Grundrechte-Folgenabschätzung)',
					'Fundamental rights impact assessment where Art. 27 requires it (FRIA tool)'
				),
				cite: KIVO('Art. 27')
			},
			{
				id: 'h_anleitung',
				label: L(
					'Einsatz nach der Betriebsanleitung des Anbieters',
					'Used according to the provider’s instructions for use'
				),
				cite: { law: 'KI-VO', ref: 'Art. 26 Abs. 1' },
				na: false
			},
			{
				id: 'h_ueberwachung',
				label: L(
					'Betrieb überwacht; Risiken und schwerwiegende Vorfälle an den Anbieter gemeldet',
					'Operation monitored; risks and serious incidents reported to the provider'
				),
				cite: { law: 'KI-VO', ref: 'Art. 26 Abs. 5' }
			},
			{
				id: 'h_protokolle',
				label: L(
					'Automatisch erzeugte Protokolle mindestens sechs Monate aufbewahrt',
					'Automatically generated logs kept for at least six months'
				),
				cite: { law: 'KI-VO', ref: 'Art. 26 Abs. 6' }
			}
		]
	},
	{
		id: 'freigabe',
		title: L('Vor der Freigabe', 'Before approval'),
		intro: L('Der letzte Schritt vor dem Einsatz.', 'The last step before use.'),
		items: [
			{
				id: 'f_register',
				label: L('Eintrag im KI-Register angelegt', 'Entry in the AI register created')
			},
			{
				id: 'f_beauftragte',
				label: L(
					'Datenschutzbeauftragter und KI-Verantwortliche eingebunden',
					'Data protection officer and AI lead involved'
				),
				cite: DSGVO('Art. 38 Abs. 1')
			},
			{
				id: 'f_pilot',
				label: L('Pilot mit einer kleinen Gruppe ausgewertet', 'Pilot with a small group evaluated')
			}
		]
	}
];

/** what still stands in the way of approval, or null */
export function approvalBlocked(data: RecordData): Localized | null {
	if (riskOutcome(data) === 'verboten') {
		return L(
			'Die Risikoklassifizierung ergibt eine verbotene Praktik (Art. 5 KI-VO); das Tool darf nicht eingesetzt werden.',
			'The risk classification finds a prohibited practice (Art. 5 AI Act); the tool must not be used.'
		);
	}
	if (!snapshot(data, 'einstufung')) {
		return L('Erst die Risikoklassifizierung durchführen.', 'Run the risk classification first.');
	}
	const state = checklist(data, BLOCKS);
	if (state.gaps.length > 0 || state.open.length > 0) {
		return L(
			'Erst alle Punkte der Checkliste erledigen.',
			'Complete every point of the checklist first.'
		);
	}
	if (inScope(data, ['personenbezug']) && !snapshot(data, 'dsfa_check')) {
		return L('Erst die DSFA-Schwellwertanalyse durchführen.', 'Run the DPIA screening first.');
	}
	if (snapshot(data, 'dsfa_check')?.verdict === 'positive' && !data.dsfa) {
		return L(
			'Die Schwellwertanalyse verlangt eine DSFA; erst die DSFA verknüpfen.',
			'The screening requires a DPIA; link the DPIA first.'
		);
	}
	return null;
}

/** introducing an AI tool such as an assistant or chatbot, from the first check to approval */
export const definition: RecordToolDefinition = {
	slug: 'ki-einfuehrung',
	version: 1,
	intro: L(
		'Ein Eintrag je KI-Tool, das eingeführt werden soll, etwa ein Assistent, ein Chatbot oder eine KI-Funktion in vorhandener Software. Die Risikoklassifizierung entscheidet, ob die Pflichten für Hochrisiko-KI dazukommen; die übrigen Prüfungen werden verknüpft, nicht wiederholt.',
		'One entry per AI tool to be introduced, such as an assistant, a chatbot or an AI feature in existing software. The risk classification decides whether the high-risk duties apply; the other checks are linked, not repeated.'
	),
	sources: [
		KIVO('Art. 4, 5, 26, 27, 50'),
		DSGVO('Art. 5, 6, 22, 25, 28, 35'),
		{ law: 'BetrVG', ref: '§ 87, § 90' }
	],
	titleField: 'bezeichnung',
	example: {
		bezeichnung: 'Schreibassistent (Beispiel)',
		anbieter: 'Beispiel KI AG',
		zweck: 'Entwürfe für E-Mails, Protokolle und Texte für die Website.',
		verantwortlich: 'KI-Beauftragte',
		umfang: ['personenbezug', 'beschaeftigte', 'inhalte']
	},
	sections: [
		{
			id: 'vorhaben',
			title: L('Vorhaben', 'The introduction'),
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('KI-Tool', 'AI tool'),
					help: L('Z. B. „Copilot in Microsoft 365“.', 'E.g. "Copilot in Microsoft 365".'),
					required: true,
					listColumn: true
				},
				{ id: 'anbieter', type: 'text', label: L('Anbieter', 'Provider'), listColumn: true },
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
						'Bestimmt, welche Teile der Checkliste und welche Prüfungen gelten.',
						'Decides which parts of the checklist and which checks apply.'
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
					cite: KIVO('Art. 5, 6, 50')
				},
				{
					id: 'dsfa_check',
					type: 'assessment',
					tool: 'dsfa-schwellwert',
					label: L(
						'DSFA-Schwellwertanalyse (bei personenbezogenen Daten)',
						'DPIA screening (with personal data)'
					),
					cite: DSGVO('Art. 35 Abs. 1')
				},
				{
					id: 'ki_dsgvo',
					type: 'assessment',
					tool: 'ki-dsgvo-schnittstelle',
					label: L('KI und DSGVO (bei personenbezogenen Daten)', 'AI and GDPR (with personal data)')
				},
				{
					id: 'transparenz_check',
					type: 'assessment',
					tool: 'transparenzpflichten',
					label: L('Transparenzpflichten', 'Transparency obligations'),
					cite: KIVO('Art. 50'),
					when: (data) => inScope(data, ['kontakt', 'chatbot', 'inhalte'])
				},
				{
					id: 'ki_register',
					type: 'reference',
					tool: 'ki-register',
					label: L('Eintrag im KI-Register', 'AI register entry')
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
					label: L('AVV-Prüfung', 'Processing agreement check')
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
			fields: [
				{ id: 'freigabe_am', type: 'date', label: L('Freigegeben am', 'Approved on') },
				{ id: 'freigabe_durch', type: 'text', label: L('Freigegeben durch', 'Approved by') },
				{
					id: 'wiedervorlage',
					type: 'date',
					label: L('Wiedervorlage', 'Next review'),
					help: L(
						'KI-Tools ändern sich schnell: nach neuen Funktionen oder Modellen erneut prüfen.',
						'AI tools change quickly: check again after new features or models.'
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
				requires: ['umfang', 'freigabe_am'],
				check: (record) => approvalBlocked(record.data)
			},
			{ from: 'pruefung', to: 'abgelehnt', label: L('Ablehnen', 'Reject') },
			{ from: 'freigegeben', to: 'pruefung', label: L('Erneut prüfen', 'Review again') },
			{ from: 'abgelehnt', to: 'pruefung', label: L('Wieder aufnehmen', 'Reopen') }
		]
	}
};
