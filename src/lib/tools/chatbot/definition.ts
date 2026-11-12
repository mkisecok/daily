import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, inScope, snapshot, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });
const KIVO = (ref: string): LegalBasis => ({ law: 'KI-VO', ref });

export const SCOPES = [
	{
		value: 'eigenbau',
		label: L(
			'Selbst auf ein Sprachmodell aufgesetzt, unter eigenem Namen',
			'Built on a language model in-house, under own name'
		)
	},
	{
		value: 'drittland',
		label: L('Modell oder Anbieter außerhalb des EWR', 'Model or provider outside the EEA')
	},
	{
		value: 'entscheidungen',
		label: L(
			'Der Bot entscheidet über Anliegen, etwa Erstattungen oder Termine',
			'The bot decides on requests, such as refunds or appointments'
		)
	}
];

/** the checklist in the order of putting a chatbot live */
export const BLOCKS: Block[] = [
	{
		id: 'einordnung',
		title: L('Einordnung', 'Classification'),
		intro: L(
			'Wer welche Pflichten nach der KI-Verordnung trägt.',
			'Who carries which duties under the AI Act.'
		),
		items: [
			{
				id: 'e_rolle',
				label: L(
					'Rolle geklärt: Anbieter des Chatbots oder Betreiber eines fremden Systems',
					'Role settled: provider of the chatbot or deployer of someone else’s system'
				),
				cite: KIVO('Art. 3 Nr. 3, 4'),
				help: L(
					'Wer einen Chatbot entwickeln lässt oder selbst auf ein Sprachmodell aufsetzt und ihn unter eigenem Namen in Betrieb nimmt, ist in der Regel Anbieter dieses Systems.',
					'Whoever has a chatbot developed, or builds one on a language model, and puts it into service under their own name is usually the provider of that system.'
				),
				na: false
			},
			{
				id: 'e_einstufung',
				label: L(
					'Risikoklasse festgestellt (Werkzeug Risikoklassifizierung)',
					'Risk class established (risk classification tool)'
				),
				cite: KIVO('Art. 6, Art. 50'),
				na: false
			}
		]
	},
	{
		id: 'transparenz',
		title: L('Transparenz', 'Transparency'),
		intro: L(
			'Seit dem 2. August 2026 müssen Menschen erkennen können, dass sie mit einer KI sprechen.',
			'Since 2 August 2026 people must be able to tell that they are talking to an AI.'
		),
		items: [
			{
				id: 't_hinweis',
				label: L(
					'Klar erkennbar und barrierefrei, spätestens bei der ersten Nachricht, dass man mit einer KI schreibt (Werkzeug Transparenzpflichten)',
					'Clear and accessible, at the latest with the first message, that one is chatting with an AI (transparency duties tool)'
				),
				cite: KIVO('Art. 50 Abs. 1, 5'),
				help: L(
					'Die Pflicht trifft den Anbieter des Systems. Wer einen fremden Chatbot einbindet, sollte prüfen, ob der Hinweis eingeschaltet ist.',
					'The duty lies with the system’s provider. Whoever embeds someone else’s chatbot should check that the notice is switched on.'
				),
				na: false
			}
		]
	},
	{
		id: 'datenschutz',
		title: L('Datenschutz', 'Data protection'),
		intro: L(
			'Was mit den Eingaben der Besuchenden geschieht.',
			'What happens to what visitors type.'
		),
		items: [
			{
				id: 'd_hinweise',
				label: L(
					'Datenschutzhinweise nennen den Chatbot, den Anbieter, den Zweck und die Speicherdauer',
					'Privacy notice names the chatbot, the provider, the purpose and the storage period'
				),
				cite: DSGVO('Art. 13'),
				na: false
			},
			{
				id: 'd_laden',
				label: L(
					'Das Chatfenster lädt Dienste Dritter erst, wenn jemand den Chat öffnet',
					'The chat window loads third-party services only once someone opens the chat'
				),
				cite: { law: 'TDDDG', ref: '§ 25 Abs. 1' }
			},
			{
				id: 'd_sensibel',
				label: L(
					'Hinweis, keine Gesundheits- oder anderen sensiblen Daten einzugeben',
					'Notice not to enter health or other sensitive data'
				),
				cite: DSGVO('Art. 9 Abs. 1')
			},
			{
				id: 'd_speicher',
				label: L(
					'Speicherdauer der Chatverläufe festgelegt und umgesetzt',
					'Storage period for chat logs set and applied'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. e')
			},
			{
				id: 'd_training',
				label: L(
					'Eingaben werden nicht zum Training des Anbieters verwendet',
					'Inputs are not used to train the provider’s model'
				),
				cite: DSGVO('Art. 28 Abs. 3 lit. a')
			}
		]
	},
	{
		id: 'anbieter',
		title: L('Anbieter und Sicherheit', 'Provider and security'),
		intro: L('Der Dienst hinter dem Chatfenster.', 'The service behind the chat window.'),
		items: [
			{
				id: 'a_avv',
				label: L(
					'Auftragsverarbeitungsvertrag mit dem Anbieter des Modells oder Chatbots (Werkzeug AVV-Prüfung)',
					'Processing agreement with the model or chatbot provider (AVV check tool)'
				),
				cite: DSGVO('Art. 28 Abs. 3')
			},
			{
				id: 'a_drittland',
				label: L(
					'Grundlage für die Übermittlung festgestellt (Werkzeug Drittland-Transfer)',
					'Basis for the transfer established (third-country transfer tool)'
				),
				cite: DSGVO('Art. 44 bis 46'),
				scope: ['drittland']
			},
			{
				id: 'a_missbrauch',
				label: L(
					'Gegen Missbrauch geprüft: eingeschleuste Anweisungen, Abfluss interner Daten',
					'Checked against misuse: injected instructions, leaking internal data'
				),
				cite: DSGVO('Art. 32 Abs. 1')
			}
		]
	},
	{
		id: 'entscheidungen',
		title: L('Entscheidungen', 'Decisions'),
		intro: L(
			'Wenn der Bot nicht nur antwortet, sondern über Anliegen entscheidet.',
			'When the bot does not only answer but decides on requests.'
		),
		scope: ['entscheidungen'],
		items: [
			{
				id: 'x_mensch',
				label: L(
					'Keine Entscheidung mit rechtlicher oder ähnlich erheblicher Wirkung allein durch den Bot; ein Mensch ist erreichbar',
					'No decision with legal or similarly significant effect by the bot alone; a person can be reached'
				),
				cite: DSGVO('Art. 22 Abs. 1, 3'),
				na: false
			}
		]
	},
	{
		id: 'freigabe',
		title: L('Vor dem Start', 'Before launch'),
		intro: L('Der letzte Schritt.', 'The last step.'),
		items: [
			{
				id: 'f_vvt',
				label: L(
					'Eintrag im Verzeichnis von Verarbeitungstätigkeiten',
					'Entry in the record of processing activities'
				),
				cite: DSGVO('Art. 30 Abs. 1')
			},
			{
				id: 'f_kompetenz',
				label: L(
					'Die Betreuenden kennen Grenzen und Risiken des Chatbots (Werkzeug KI-Kompetenz)',
					'The people running it know the chatbot’s limits and risks (AI literacy tool)'
				),
				cite: KIVO('Art. 4')
			}
		]
	}
];

/** the attached checks the scope requires */
export const REQUIRED_CHECKS = [
	{
		field: 'einstufung',
		scope: undefined,
		label: L('Risikoklassifizierung', 'risk classification')
	},
	{
		field: 'ki_check',
		scope: undefined,
		label: L('Prüfung der Transparenzpflichten', 'transparency duties check')
	},
	{
		field: 'transfer_check',
		scope: ['drittland'],
		label: L('Drittlandprüfung', 'third-country check')
	}
];

export const missingChecks = (data: RecordData) =>
	REQUIRED_CHECKS.filter((c) => inScope(data, c.scope) && !snapshot(data, c.field));

/** what still stands in the way of approval, or null */
export function approvalBlocked(data: RecordData): Localized | null {
	if (snapshot(data, 'einstufung')?.outcome === 'verboten') {
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
	const missing = missingChecks(data);
	if (missing.length > 0) {
		return L(
			`Erst durchführen: ${missing.map((c) => c.label.de).join(', ')}.`,
			`Run first: ${missing.map((c) => c.label.en).join(', ')}.`
		);
	}
	return null;
}

/** a chatbot on the website, from choosing it to going live */
export const definition: RecordToolDefinition = {
	slug: 'chatbot',
	version: 1,
	intro: L(
		'Ein Eintrag je Chatbot auf Website, Shop oder App. Ein Chatbot ist ein KI-System, das direkt mit Menschen spricht; die Kennzeichnungspflicht des Art. 50 KI-VO gilt seit dem 2. August 2026. Risikoklassifizierung, Transparenzpflichten und Drittlandprüfung werden verknüpft, nicht wiederholt.',
		'One entry per chatbot on a website, shop or app. A chatbot is an AI system that talks directly with people; the notice duty of Art. 50 AI Act applies since 2 August 2026. The risk classification, transparency duties and third-country check are linked, not repeated.'
	),
	sources: [
		KIVO('Art. 3 Nr. 3, 4, Art. 4, Art. 50 Abs. 1, 5'),
		DSGVO('Art. 13, 22, 28, 32, 44'),
		{ law: 'TDDDG', ref: '§ 25' }
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'vorhaben',
			title: L('Chatbot', 'The chatbot'),
			columns: 2,
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Bezeichnung', 'Name'),
					help: L('Z. B. „Kundenservice-Bot im Shop“.', 'E.g. "Customer service bot in the shop".'),
					required: true,
					listColumn: true
				},
				{ id: 'anbieter', type: 'text', label: L('Anbieter oder Modell', 'Provider or model') },
				{
					id: 'zweck',
					type: 'textarea',
					label: L('Wobei er hilft', 'What it helps with')
				},
				{
					id: 'start_am',
					type: 'date',
					label: L('Geplanter Start', 'Planned launch'),
					listColumn: true
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
					id: 'ki_check',
					type: 'assessment',
					tool: 'transparenzpflichten',
					label: L('Transparenzpflichten', 'Transparency duties'),
					cite: KIVO('Art. 50')
				},
				{
					id: 'transfer_check',
					type: 'assessment',
					tool: 'drittland-transfer',
					label: L('Drittlandprüfung (bei Drittland)', 'Third-country check (if relevant)'),
					cite: DSGVO('Art. 44')
				},
				{
					id: 'avv',
					type: 'reference',
					tool: 'avv-pruefung',
					label: L('AVV-Prüfung', 'Processing agreement check')
				},
				{
					id: 'register',
					type: 'reference',
					tool: 'ki-register',
					label: L('Eintrag im KI-Register', 'AI register entry')
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
						'Spätestens bei einem neuen Modell oder neuen Aufgaben des Bots.',
						'At the latest with a new model or new tasks for the bot.'
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
		bezeichnung: 'Kundenservice-Bot im Shop (Beispiel)',
		anbieter: 'Sprachmodell eines US-Anbieters über eine Schnittstelle',
		zweck: 'Beantwortet Fragen zu Lieferung, Rückgabe und Öffnungszeiten.',
		verantwortlich: 'E-Commerce',
		umfang: ['eigenbau', 'drittland'],
		e_rolle: 'ja',
		e_rolle_notiz: 'Eigene Oberfläche unter unserem Namen: Wir sind Anbieter.',
		t_hinweis: 'nein',
		t_hinweis_notiz: 'Hinweis steht bisher nur in den Datenschutzhinweisen.',
		d_hinweise: 'ja',
		d_training: 'ja'
	}
};
