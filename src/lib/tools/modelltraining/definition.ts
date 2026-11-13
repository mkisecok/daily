import type { RecordData, RecordToolDefinition } from '../../records/types.js';
import { blockSections, checklist, inScope, snapshot, type Block } from '../_shared/occasion.js';
import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });
const KIVO = (ref: string): LegalBasis => ({ law: 'KI-VO', ref });

export const EDPB_MODELS: LegalBasis = { law: 'EDPB', ref: 'Stellungnahme 28/2024' };
export const GPAI_GUIDELINES: LegalBasis = {
	law: 'EU-Kommission',
	ref: 'Leitlinien zu KI-Modellen mit allgemeinem Verwendungszweck (Juli 2025)'
};

export const SCOPES = [
	{
		value: 'personenbezug',
		label: L(
			'Trainingsdaten enthalten personenbezogene Daten',
			'Training data contains personal data'
		)
	},
	{
		value: 'scraping',
		label: L('Daten werden aus dem Internet gesammelt', 'Data is collected from the internet')
	},
	{
		value: 'kunden',
		label: L(
			'Daten von Kunden oder Beschäftigten aus eigenen Systemen',
			'Data of customers or employees from own systems'
		)
	},
	{
		value: 'besondere',
		label: L(
			'Gesundheit, Religion oder andere besondere Kategorien sind möglich',
			'Health, religion or other special categories are possible'
		)
	},
	{
		value: 'feinabstimmung',
		label: L('Ein bestehendes Modell wird feinabgestimmt', 'An existing model is fine-tuned')
	},
	{
		value: 'allgemein',
		label: L(
			'Allgemein verwendbares Modell, das anderen bereitgestellt wird',
			'A general-purpose model made available to others'
		)
	},
	{
		value: 'hochrisiko',
		label: L(
			'Einsatz in einem Hochrisiko-Bereich nach Anhang III',
			'Use in an Annex III high-risk area'
		)
	}
];

const PERSONAL = ['personenbezug'];

/** the checklist from the purpose to the released model */
export const BLOCKS: Block[] = [
	{
		id: 'rolle',
		title: L('Zweck und Rolle', 'Purpose and role'),
		intro: L(
			'Wofür das Modell gebraucht wird und wer dafür einsteht.',
			'What the model is for and who answers for it.'
		),
		items: [
			{
				id: 'r_zweck',
				label: L(
					'Zweck und Einsatz des Modells festgelegt, bevor Daten gesammelt werden',
					'Purpose and use of the model set before data is collected'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. b'),
				na: false
			},
			{
				id: 'r_anbieter',
				label: L(
					'Rolle geklärt: Wer ein Modell entwickelt und unter eigenem Namen bereitstellt oder selbst in Betrieb nimmt, ist Anbieter',
					'Role settled: whoever develops a model and offers it under their own name or puts it into service is the provider'
				),
				cite: KIVO('Art. 3 Nr. 3'),
				na: false
			},
			{
				id: 'r_feinabstimmung',
				label: L(
					'Feinabstimmung eingeordnet: Rechenaufwand gegenüber dem Ausgangsmodell und Änderungen am Zweck dokumentiert',
					'Fine-tuning classified: compute compared with the original model and changes to the purpose documented'
				),
				cite: KIVO('Art. 25 Abs. 1'),
				help: L(
					'Nach den Leitlinien der Kommission wird Anbieter des geänderten Modells, wer mehr als ein Drittel der ursprünglichen Trainingsrechenleistung einsetzt; die Pflichten gelten dann für die Änderung. Wer ein System so ändert, dass es hochriskant wird, ist nach Art. 25 KI-VO Anbieter dieses Systems.',
					"Under the Commission's guidelines, whoever uses more than a third of the original training compute becomes the provider of the modified model; the duties then cover the modification. Whoever changes a system so that it becomes high-risk is its provider under Art. 25 AI Act."
				),
				scope: ['feinabstimmung']
			}
		]
	},
	{
		id: 'daten',
		title: L('Trainingsdaten', 'Training data'),
		intro: L(
			'Die DSGVO gilt für das Sammeln, Aufbereiten und Trainieren.',
			'The GDPR applies to collecting, preparing and training.'
		),
		scope: PERSONAL,
		items: [
			{
				id: 'd_grundlage',
				label: L(
					'Rechtsgrundlage festgelegt; berechtigtes Interesse nur nach Prüfung von Interesse, Erforderlichkeit und Abwägung',
					'Legal basis set; legitimate interest only after checking interest, necessity and balancing'
				),
				cite: DSGVO('Art. 6 Abs. 1 lit. f'),
				help: L(
					'Der Europäische Datenschutzausschuss hält das berechtigte Interesse für möglich, aber nicht für selbstverständlich; in die Abwägung gehen auch die vernünftigen Erwartungen der Betroffenen ein (Stellungnahme 28/2024).',
					'The European Data Protection Board considers legitimate interest possible but not a given; the reasonable expectations of data subjects are part of the balancing (Opinion 28/2024).'
				),
				na: false
			},
			{
				id: 'd_herkunft',
				label: L(
					'Herkunft jeder Datenquelle dokumentiert; keine Daten aus rechtswidriger Verarbeitung',
					'Origin of every data source documented; no data from unlawful processing'
				),
				cite: DSGVO('Art. 5 Abs. 2'),
				help: L(
					'Wurde für das Training rechtswidrig verarbeitet, kann das auch den späteren Einsatz des Modells belasten, sofern das Modell nicht anonym ist.',
					'Unlawful processing for training can also taint the later use of the model unless the model is anonymous.'
				),
				na: false
			},
			{
				id: 'd_minimierung',
				label: L(
					'Nur nötige Daten; Namen und Kennungen vor dem Training entfernt oder pseudonymisiert (Werkzeug Pseudonymisierer)',
					'Only the data needed; names and identifiers removed or pseudonymised before training (pseudonymiser tool)'
				),
				cite: DSGVO('Art. 5 Abs. 1 lit. c, Art. 25 Abs. 1')
			},
			{
				id: 'd_scraping',
				label: L(
					'Beim Sammeln aus dem Internet: sensible Seiten ausgeschlossen, maschinenlesbare Vorbehalte beachtet, Ausschlussliste für Betroffene',
					'When collecting from the internet: sensitive sites excluded, machine-readable reservations respected, an exclusion list for data subjects'
				),
				cite: DSGVO('Art. 6 Abs. 1 lit. f, Art. 25 Abs. 1'),
				scope: ['scraping']
			},
			{
				id: 'd_kunden',
				label: L(
					'Zweckänderung geprüft: Kunden- oder Beschäftigtendaten nur, wenn das Training mit dem ursprünglichen Zweck vereinbar ist',
					'Change of purpose checked: customer or employee data only if training is compatible with the original purpose'
				),
				cite: DSGVO('Art. 6 Abs. 4'),
				scope: ['kunden'],
				na: false
			},
			{
				id: 'd_besondere',
				label: L(
					'Besondere Kategorien herausgefiltert oder eine Ausnahme nach Art. 9 Abs. 2 belegt',
					'Special categories filtered out or an exception under Art. 9(2) shown'
				),
				cite: DSGVO('Art. 9 Abs. 1, 2'),
				help: L(
					'„Offensichtlich öffentlich gemacht“ (lit. e) setzt voraus, dass die Person die Daten selbst bewusst veröffentlicht hat; dass sie im Netz stehen, genügt nicht.',
					'"Manifestly made public" (point (e)) requires that the person published the data themselves on purpose; being online is not enough.'
				),
				scope: ['besondere'],
				na: false
			}
		]
	},
	{
		id: 'rechte',
		title: L('Transparenz und Betroffenenrechte', 'Transparency and data subject rights'),
		intro: L(
			'Wer im Training steckt, soll davon wissen und widersprechen können.',
			'Those in the training data should know and be able to object.'
		),
		scope: PERSONAL,
		items: [
			{
				id: 'b_information',
				label: L(
					'Über das Training informiert, auch bei Daten aus fremden Quellen',
					'Information about the training given, also for data from other sources'
				),
				cite: DSGVO('Art. 13, 14'),
				na: false
			},
			{
				id: 'b_widerspruch',
				label: L(
					'Widerspruch vor dem Training möglich, etwa über eine Opt-out-Liste',
					'Objection possible before training, for example through an opt-out list'
				),
				cite: DSGVO('Art. 21 Abs. 1')
			},
			{
				id: 'b_loeschung',
				label: L(
					'Löschanträge: Daten aus dem Trainingsdatensatz entfernt; für das Modell Filter oder erneutes Training geprüft',
					'Erasure requests: data removed from the training set; for the model, filters or retraining considered'
				),
				cite: DSGVO('Art. 17 Abs. 1')
			}
		]
	},
	{
		id: 'modell',
		title: L('Modell und Ausgaben', 'Model and outputs'),
		intro: L('Ein Modell kann sich Trainingsdaten merken.', 'A model can memorise training data.'),
		scope: PERSONAL,
		items: [
			{
				id: 'm_anonym',
				label: L(
					'Getestet, ob sich personenbezogene Daten aus dem Modell abfragen lassen; Ergebnis dokumentiert',
					'Tested whether personal data can be extracted from the model; result documented'
				),
				cite: DSGVO('Art. 5 Abs. 2'),
				help: L(
					'Anonym ist ein Modell nur, wenn Extraktion und Abfrage personenbezogener Daten mit vertretbarem Aufwand praktisch ausgeschlossen sind (Stellungnahme 28/2024); sonst gilt die DSGVO auch für das Modell.',
					'A model is anonymous only if extracting and querying personal data is practically ruled out with reasonable means (Opinion 28/2024); otherwise the GDPR applies to the model too.'
				),
				na: false
			},
			{
				id: 'm_ausgaben',
				label: L(
					'Ausgabefilter gegen personenbezogene Daten in Antworten',
					'Output filters against personal data in answers'
				),
				cite: DSGVO('Art. 25 Abs. 1')
			},
			{
				id: 'm_sicherheit',
				label: L(
					'Trainingsdaten und Modellgewichte geschützt: Zugriffsrechte, getrennte Umgebung',
					'Training data and model weights protected: access rights, a separate environment'
				),
				cite: DSGVO('Art. 32 Abs. 1')
			}
		]
	},
	{
		id: 'gpai',
		title: L('Modell mit allgemeinem Verwendungszweck', 'General-purpose model'),
		intro: L(
			'Diese Pflichten gelten seit dem 2. August 2025.',
			'These duties apply since 2 August 2025.'
		),
		scope: ['allgemein'],
		items: [
			{
				id: 'g_doku',
				label: L(
					'Technische Dokumentation mit Training und Tests; Informationen für Anbieter, die das Modell einbauen',
					'Technical documentation with training and tests; information for providers who build the model in'
				),
				cite: KIVO('Art. 53 Abs. 1 lit. a, b'),
				help: L(
					'Entfällt bei freier und quelloffener Lizenz mit öffentlichen Gewichten, außer bei systemischem Risiko (Art. 53 Abs. 2).',
					'Does not apply under a free and open-source licence with public weights, except for systemic risk (Art. 53(2)).'
				)
			},
			{
				id: 'g_urheber',
				label: L(
					'Strategie zum Urheberrecht: maschinenlesbare Nutzungsvorbehalte von Rechteinhabern beachtet',
					'Copyright policy: machine-readable reservations of rights holders respected'
				),
				cite: KIVO('Art. 53 Abs. 1 lit. c'),
				help: L(
					'Text und Data Mining ist ohne Vorbehalt erlaubt; ein Vorbehalt im Netz muss maschinenlesbar sein (§ 44b UrhG).',
					'Text and data mining is allowed unless reserved; a reservation online must be machine-readable (§ 44b UrhG).'
				),
				na: false
			},
			{
				id: 'g_zusammenfassung',
				label: L(
					'Zusammenfassung der Trainingsinhalte nach der Vorlage des KI-Büros veröffentlicht',
					"Summary of the training content published using the AI Office's template"
				),
				cite: KIVO('Art. 53 Abs. 1 lit. d'),
				na: false
			}
		]
	},
	{
		id: 'hochrisiko',
		title: L('Hochrisiko-KI', 'High-risk AI'),
		intro: L(
			'Für Systeme nach Anhang III; Geltungsbeginn 2. Dezember 2027.',
			'For Annex III systems, as of 2 December 2027.'
		),
		scope: ['hochrisiko'],
		items: [
			{
				id: 'h_daten',
				label: L(
					'Trainings-, Validierungs- und Testdaten relevant, repräsentativ und auf Verzerrungen geprüft',
					'Training, validation and test data relevant, representative and checked for bias'
				),
				cite: KIVO('Art. 10 Abs. 2, 3'),
				na: false
			},
			{
				id: 'h_doku',
				label: L(
					'Technische Dokumentation erstellt (Werkzeug Technische Dokumentation)',
					'Technical documentation drawn up (technical documentation tool)'
				),
				cite: KIVO('Art. 11 Abs. 1')
			}
		]
	}
];

/** the attached balancing test holds */
export const balanced = (data: RecordData) => snapshot(data, 'abwaegung')?.verdict === 'negative';

/** the attached screening result says a DPIA is needed */
export const dpiaNeeded = (data: RecordData) =>
	snapshot(data, 'dsfa_check')?.verdict === 'positive';

/** what still stands in the way of releasing the model, or null */
export function releaseBlocked(data: RecordData): Localized | null {
	const state = checklist(data, BLOCKS);
	if (state.gaps.length > 0 || state.open.length > 0) {
		return L(
			'Erst alle Punkte der Checkliste erledigen.',
			'Complete every point of the checklist first.'
		);
	}
	if (!inScope(data, PERSONAL)) return null;
	if (snapshot(data, 'abwaegung') && !balanced(data)) {
		return L(
			'Die Interessenabwägung trägt das Training nicht.',
			'The legitimate-interest assessment does not support the training.'
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

/** training or fine-tuning an own AI model, from the purpose to the release */
export const definition: RecordToolDefinition = {
	slug: 'modelltraining',
	version: 1,
	intro: L(
		'Ein Eintrag je Modell oder Feinabstimmung. Der Umfang bestimmt, welche Teile gelten. Für personenbezogene Trainingsdaten gilt die DSGVO; ob das fertige Modell noch personenbezogene Daten enthält, wird getestet, nicht angenommen. Wer ein allgemein verwendbares Modell anderen bereitstellt, hat die Anbieterpflichten nach Art. 53 KI-VO.',
		'One entry per model or fine-tuning. The scope decides which parts apply. The GDPR applies to personal training data; whether the finished model still contains personal data is tested, not assumed. Whoever makes a general-purpose model available to others has the provider duties under Art. 53 AI Act.'
	),
	sources: [
		DSGVO('Art. 5, 6, 9, 13, 14, 17, 21, 25, 32, 35'),
		EDPB_MODELS,
		KIVO('Art. 3, 10, 25, 53'),
		GPAI_GUIDELINES
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'vorhaben',
			title: L('Modell', 'The model'),
			columns: 2,
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Bezeichnung', 'Name'),
					help: L('Z. B. „Support-Assistent“.', 'E.g. "Support assistant".'),
					required: true,
					listColumn: true
				},
				{
					id: 'basismodell',
					type: 'text',
					label: L('Ausgangsmodell', 'Base model'),
					help: L('Leer, wenn von Grund auf trainiert.', 'Empty if trained from scratch.')
				},
				{ id: 'verantwortlich', type: 'text', label: L('Verantwortlich', 'In charge') },
				{
					id: 'training_ab',
					type: 'date',
					label: L('Training geplant ab', 'Training planned from'),
					listColumn: true
				},
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
					label: L(
						'Interessenabwägung (bei personenbezogenen Daten)',
						'Legitimate-interest assessment (personal data)'
					),
					cite: DSGVO('Art. 6 Abs. 1 lit. f')
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
				}
			]
		},
		...blockSections(BLOCKS),
		{
			id: 'abschluss',
			title: L('Freigabe', 'Release'),
			columns: 2,
			fields: [
				{ id: 'freigabe_am', type: 'date', label: L('Freigegeben am', 'Released on') },
				{ id: 'freigabe_durch', type: 'text', label: L('Freigegeben durch', 'Released by') }
			]
		}
	],
	workflow: {
		states: [
			{ id: 'konzept', label: L('Konzept', 'Concept') },
			{ id: 'training', label: L('Training', 'Training') },
			{ id: 'freigegeben', label: L('Freigegeben', 'Released') }
		],
		initialState: 'konzept',
		transitions: [
			{ from: 'konzept', to: 'training', label: L('Training beginnen', 'Start training') },
			{ from: 'training', to: 'konzept', label: L('Zurück zum Konzept', 'Back to concept') },
			{
				from: 'training',
				to: 'freigegeben',
				label: L('Modell freigeben', 'Release the model'),
				requires: ['freigabe_am'],
				check: (record) => releaseBlocked(record.data)
			},
			{ from: 'freigegeben', to: 'training', label: L('Nachtrainieren', 'Retrain') }
		]
	},
	example: {
		bezeichnung: 'Support-Assistent (Beispiel)',
		basismodell: 'Offenes Sprachmodell, 8 Mrd. Parameter',
		verantwortlich: 'Kundenservice und IT',
		umfang: ['personenbezug', 'kunden', 'feinabstimmung'],
		r_zweck: 'ja',
		r_anbieter: 'ja',
		r_feinabstimmung: 'ja',
		r_feinabstimmung_notiz:
			'Weniger als ein Prozent der ursprünglichen Rechenleistung; Zweck bleibt Kundenservice.',
		d_kunden: 'nein',
		d_kunden_notiz:
			'Tickets enthalten Namen und Vertragsdaten; die Vereinbarkeit mit dem ursprünglichen Zweck ist nicht geprüft.',
		m_anonym: 'nein',
		m_anonym_notiz: 'Vor der Freigabe sind keine Extraktionstests geplant.'
	}
};
