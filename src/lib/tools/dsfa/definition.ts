import type { FieldSection, RecordToolDefinition, RecordView } from '../../records/types.js';
import type { Localized } from '../types.js';
import { LEGAL_BASES } from '../vvt/definition.js';
import { threatsFor, type SdmGoal } from './threats.js';

const L = (de: string, en: string) => ({ de, en });

/** the four steps the DSK uses for both likelihood and severity */
export const SCALE = [
	{ value: '1', label: L('Geringfügig', 'Negligible') },
	{ value: '2', label: L('Überschaubar', 'Limited') },
	{ value: '3', label: L('Substanziell', 'Significant') },
	{ value: '4', label: L('Groß', 'Major') }
];

export type RiskLevel = 'gering' | 'risiko' | 'hoch';

/**
 * the DSK risk matrix (Kurzpapier Nr. 18) by severity, then likelihood, both
 * 1–4. The DSK draws curved bands; each cell takes the band at its centre.
 */
const MATRIX: Record<number, readonly RiskLevel[]> = {
	4: ['risiko', 'hoch', 'hoch', 'hoch'],
	3: ['risiko', 'risiko', 'risiko', 'hoch'],
	2: ['risiko', 'risiko', 'risiko', 'risiko'],
	1: ['gering', 'gering', 'risiko', 'risiko']
};

export function riskLevel(likelihood: number, severity: number): RiskLevel {
	return MATRIX[severity][likelihood - 1];
}

/** a risk section: one SDM protection goal and what can go wrong with it */
export type RiskSection = FieldSection & { goal: SdmGoal };

function risk(id: string, goal: SdmGoal, title: Localized, help: Localized): RiskSection {
	return {
		id,
		goal,
		title,
		intro: help,
		fields: [
			{
				id: `${id}_gefaehrdungen`,
				type: 'multiselect',
				label: L('Relevante Gefährdungen', 'Relevant threats'),
				help: L(
					'Elementare Gefährdungen nach BSI-Standard 200-3 (G 0.x) und datenschutzspezifische Ereignisse (DS), die dieses Gewährleistungsziel verletzen können.',
					'Elementary threats under BSI-Standard 200-3 (G 0.x) and data protection events (DS) that can violate this protection goal.'
				),
				options: threatsFor(goal).map((threat) => ({
					value: threat.id,
					label: L(`${threat.id} ${threat.title.de}`, `${threat.id} ${threat.title.en}`)
				})),
				cite: { law: 'DSK', ref: 'Kurzpapier Nr. 18' }
			},
			{
				id: `${id}_beschreibung`,
				type: 'textarea',
				label: L('Risiko im Einzelfall', 'Risk in this case'),
				help: L(
					'Welcher Schaden kann den Betroffenen entstehen, durch welches Ereignis und aus welcher Risikoquelle?',
					'What harm can the data subjects suffer, through which event and from which source of risk?'
				)
			},
			{
				id: `${id}_w`,
				type: 'select',
				label: L('Eintrittswahrscheinlichkeit', 'Likelihood'),
				options: SCALE
			},
			{ id: `${id}_s`, type: 'select', label: L('Schwere', 'Severity'), options: SCALE },
			{
				id: `${id}_begruendung`,
				type: 'textarea',
				label: L('Begründung der Einstufung', 'Reasons for the rating'),
				help: L(
					'Die Einordnung in die Stufen ist zu begründen, nach Art, Umfang, Umständen und Zwecken der Verarbeitung.',
					'The rating must be justified by the nature, scope, context and purposes of the processing.'
				),
				cite: { law: 'DSK', ref: 'Kurzpapier Nr. 18' }
			},
			{
				id: `${id}_massnahmen`,
				type: 'textarea',
				label: L('Abhilfemaßnahmen', 'Measures to address the risk'),
				cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 7 lit. d' }
			},
			{
				id: `${id}_rw`,
				type: 'select',
				label: L('Wahrscheinlichkeit nach Maßnahmen', 'Likelihood after measures'),
				options: SCALE
			},
			{
				id: `${id}_rs`,
				type: 'select',
				label: L('Schwere nach Maßnahmen', 'Severity after measures'),
				options: SCALE
			}
		]
	};
}

/**
 * one risk per protection goal of the SDM, in the order of the TOM catalogue.
 * `zweck` and `rechte` keep their ids from version 2, where they stood for
 * function creep and impaired rights; they now hold unlinkability and
 * intervenability, so earlier entries keep their ratings.
 */
export const RISKS: RiskSection[] = [
	risk(
		'vertraulichkeit',
		'vertraulichkeit',
		L('Unbefugte Offenlegung', 'Unauthorised disclosure'),
		L(
			'Vertraulichkeit: Kenntnisnahme durch Unbefugte, etwa durch Angriffe, Fehlversand oder zu weite Berechtigungen.',
			'Confidentiality: access by unauthorised persons, e.g. through attacks, misdirected mail or overly broad permissions.'
		)
	),
	risk(
		'integritaet',
		'integritaet',
		L('Unbefugte Veränderung', 'Unauthorised alteration'),
		L(
			'Integrität: falsche oder manipulierte Daten mit Folgen für Entscheidungen über Personen.',
			'Integrity: wrong or manipulated data affecting decisions about people.'
		)
	),
	risk(
		'verfuegbarkeit',
		'verfuegbarkeit',
		L('Verlust oder Nichtverfügbarkeit', 'Loss or unavailability'),
		L(
			'Verfügbarkeit: Daten fehlen, wenn sie gebraucht werden, oder gehen verloren.',
			'Availability: data is missing when needed or is lost.'
		)
	),
	risk(
		'datenminimierung',
		'datenminimierung',
		L('Übermäßige Verarbeitung', 'Excessive processing'),
		L(
			'Datenminimierung: mehr Daten, mehr Personen oder längere Speicherung als für den Zweck nötig.',
			'Data minimisation: more data, more people or longer storage than the purpose needs.'
		)
	),
	risk(
		'zweck',
		'nichtverkettung',
		L('Zweckentfremdung und Verkettung', 'Function creep and linkage'),
		L(
			'Nichtverkettung: Nutzung für andere Zwecke, Zusammenführung von Datenbeständen, Profilbildung.',
			'Unlinkability: use for other purposes, combining datasets, profiling.'
		)
	),
	risk(
		'transparenz',
		'transparenz',
		L('Intransparente Verarbeitung', 'Opaque processing'),
		L(
			'Transparenz: Betroffene, Verantwortliche und Aufsicht können die Verarbeitung nicht nachvollziehen.',
			'Transparency: data subjects, the controller and the authority cannot follow the processing.'
		)
	),
	risk(
		'rechte',
		'intervenierbarkeit',
		L('Beeinträchtigung von Betroffenenrechten', 'Impairment of data subject rights'),
		L(
			'Intervenierbarkeit: Betroffene können ihre Rechte nicht ausüben oder nicht eingreifen, etwa bei automatisierten Entscheidungen.',
			'Intervenability: data subjects cannot exercise their rights or intervene, e.g. in automated decisions.'
		)
	)
];

/** likelihood and severity, 1–4 each */
export type Rating = { likelihood: number; severity: number };

export type AssessedRisk = {
	id: string;
	goal: SdmGoal;
	title: Localized;
	/** ids of the threats chosen as relevant, e.g. `G 0.23` */
	threats: string[];
	/** the rating is explained, as DSK Kurzpapier Nr. 18 asks */
	justified: boolean;
	before: RiskLevel | null;
	after: RiskLevel | null;
	/** the ratings behind `before` and `after`, for the matrix */
	initial: Rating | null;
	residual: Rating | null;
};

const num = (record: RecordView, id: string) => {
	const value = Number(record.data[id]);
	return Number.isInteger(value) && value >= 1 && value <= 4 ? value : null;
};

/** each risk before and after measures; residual falls back to the initial rating */
export function assessRisks(record: RecordView): AssessedRisk[] {
	return RISKS.map(({ id, goal, title }) => {
		const w = num(record, `${id}_w`);
		const s = num(record, `${id}_s`);
		const rw = num(record, `${id}_rw`) ?? w;
		const rs = num(record, `${id}_rs`) ?? s;
		const threats = record.data[`${id}_gefaehrdungen`];
		const reasons = record.data[`${id}_begruendung`];
		return {
			id,
			goal,
			title,
			threats: Array.isArray(threats) ? threats : [],
			justified: typeof reasons === 'string' && reasons.trim() !== '',
			before: w && s ? riskLevel(w, s) : null,
			after: rw && rs ? riskLevel(rw, rs) : null,
			initial: w && s ? { likelihood: w, severity: s } : null,
			residual: rw && rs ? { likelihood: rw, severity: rs } : null
		};
	});
}

const highResidual = (record: RecordView) => assessRisks(record).some((r) => r.after === 'hoch');

const ORDER: Record<RiskLevel, number> = { gering: 0, risiko: 1, hoch: 2 };

const hasMeasures = (record: RecordView, risk: AssessedRisk) => {
	const text = record.data[`${risk.id}_massnahmen`];
	return typeof text === 'string' && text.trim() !== '';
};

/**
 * risks rated lower after measures although no measure is named. Only
 * measures lower a risk; acceptance or transfer are not open to the
 * controller (SDM V3.1a, D3.1).
 */
export function unbackedReductions(record: RecordView): AssessedRisk[] {
	return assessRisks(record).filter(
		(r) => r.before && r.after && ORDER[r.after] < ORDER[r.before] && !hasMeasures(record, r)
	);
}

/** measures are named, so they must be in place before processing starts */
export const measuresPending = (record: RecordView) =>
	record.data.umgesetzt !== true && assessRisks(record).some((r) => hasMeasures(record, r));

const PENDING = L(
	'Vor der Freigabe die Abhilfemaßnahmen umsetzen und auf Wirksamkeit testen (DSK Kurzpapier Nr. 5, Schritte 11 und 12).',
	'Implement the measures and test that they work before sign-off (DSK Kurzpapier Nr. 5, steps 11 and 12).'
);

/** a data protection impact assessment from draft to sign-off (Art. 35, 36) */
export const definition: RecordToolDefinition = {
	slug: 'dsfa',
	version: 3,
	intro: L(
		'Eine Datenschutz-Folgenabschätzung je Verarbeitungsvorgang mit voraussichtlich hohem Risiko nach dem Ablauf des DSK-Kurzpapiers Nr. 5: Umfang, Beschreibung, Akteure, Notwendigkeit, Rechtsgrundlagen, Risiken je Gewährleistungsziel des Standard-Datenschutzmodells vor und nach Abhilfemaßnahmen, Entscheidung und gegebenenfalls Konsultation der Aufsichtsbehörde. Zu jedem Ziel lassen sich die Gefährdungen nach BSI-Standard 200-3 und datenschutzspezifische Ereignisse auswählen; die Bewertung folgt der Risikomatrix der DSK, die Druckfassung dient als Bericht.',
		'One DPIA per processing operation likely to result in a high risk, following the steps of DSK Kurzpapier Nr. 5: scope, description, actors, necessity, legal bases, risks per protection goal of the Standard Data Protection Model before and after measures, decision and, where needed, consultation of the authority. For each goal the threats of BSI-Standard 200-3 and data protection events can be chosen; the rating follows the DSK risk matrix and the print version serves as the report.'
	),
	sources: [
		{ law: 'DSGVO', ref: 'Art. 35' },
		{ law: 'DSGVO', ref: 'Art. 36' },
		{ law: 'DSK', ref: 'Kurzpapier Nr. 5' },
		{ law: 'DSK', ref: 'Kurzpapier Nr. 18' },
		{ law: 'DSK', ref: 'Standard-Datenschutzmodell V3.1a, D3' }
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'beschreibung',
			title: L('Beschreibung', 'Description'),
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Verarbeitungsvorgang', 'Processing operation'),
					required: true,
					listColumn: true
				},
				{
					id: 'vvt',
					type: 'reference',
					tool: 'vvt',
					label: L('Verarbeitungstätigkeit im VVT', 'Processing activity in the record'),
					help: L(
						'Der Eintrag im Verzeichnis von Verarbeitungstätigkeiten, für den diese DSFA durchgeführt wird.',
						'The entry in the record of processing activities this DPIA is carried out for.'
					)
				},
				{
					id: 'tom',
					type: 'reference',
					tool: 'tom-katalog',
					label: L('Maßnahmen im TOM-Katalog', 'Measures in the TOM catalogue'),
					help: L(
						'Der Eintrag im TOM-Katalog für das System, auf dem die Verarbeitung läuft. Seine Maßnahmen werden je Gewährleistungsziel mit den Risiken abgeglichen.',
						'The TOM catalogue entry for the system the processing runs on. Its measures are compared with the risks goal by goal.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 7 lit. d' }
				},
				{
					id: 'umfang',
					type: 'textarea',
					label: L('Beurteilungsumfang', 'Scope of the assessment'),
					help: L(
						'Welche Verarbeitungsvorgänge, Systeme und Prozesse die DSFA umfasst und welche angrenzenden Prozesse ausdrücklich nicht.',
						'Which processing operations, systems and processes the DPIA covers, and which neighbouring processes it expressly leaves out.'
					),
					cite: { law: 'DSK', ref: 'Kurzpapier Nr. 5, Schritt 3' }
				},
				{
					id: 'verarbeitung',
					type: 'textarea',
					label: L(
						'Systematische Beschreibung der Verarbeitung',
						'Systematic description of the processing'
					),
					help: L(
						'Daten, Betroffene, Systeme, Empfänger, Datenflüsse, Speicherdauer.',
						'Data, data subjects, systems, recipients, data flows, retention.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 7 lit. a' }
				},
				{
					id: 'zwecke',
					type: 'textarea',
					label: L('Zwecke und berechtigte Interessen', 'Purposes and legitimate interests'),
					cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 7 lit. a' }
				},
				{
					id: 'team',
					type: 'textarea',
					label: L('DSFA-Team', 'DPIA team'),
					help: L(
						'Wer die DSFA erstellt: Fachbereich, Datenschutz, IT-Sicherheit, gegebenenfalls Auftragsverarbeiter oder Hersteller.',
						'Who carries out the DPIA: business unit, data protection, IT security and, where useful, processors or vendors.'
					),
					cite: { law: 'DSK', ref: 'Kurzpapier Nr. 5, Schritt 1' }
				},
				{
					id: 'akteure',
					type: 'textarea',
					label: L('Akteure und betroffene Personen', 'Actors and data subjects'),
					help: L(
						'Beteiligte Stellen, Auftragsverarbeiter und Empfänger, die Gruppen betroffener Personen und wie sie eingebunden werden, etwa über den Betriebsrat.',
						'Bodies involved, processors and recipients, the groups of data subjects and how they are involved, e.g. through the works council.'
					),
					cite: { law: 'DSK', ref: 'Kurzpapier Nr. 5, Schritt 4' }
				},
				{
					id: 'schwellwert',
					type: 'assessment',
					tool: 'dsfa-schwellwert',
					label: L('DSFA-Schwellwertanalyse', 'DPIA screening')
				},
				{
					id: 'anlass',
					type: 'textarea',
					label: L('Anlass der DSFA', 'Reason for the DPIA'),
					help: L(
						'Die Regelbeispiele, Muss-Listen-Einträge und WP-248-Kriterien, die eine DSFA auslösen. Wird aus der Schwellwertanalyse übernommen, solange das Feld leer ist.',
						'The statutory examples, must-list entries and WP 248 criteria that trigger a DPIA. Taken over from the screening while the field is empty.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 1, 3, 4' }
				},
				{
					id: 'notwendigkeit',
					type: 'textarea',
					label: L('Notwendigkeit und Verhältnismäßigkeit', 'Necessity and proportionality'),
					help: L(
						'Rechtsgrundlage, Zweckbindung, Datenminimierung, Speicherbegrenzung, Alternativen.',
						'Legal basis, purpose limitation, data minimisation, storage limitation, alternatives.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 7 lit. b' }
				},
				{
					id: 'rechtsgrundlagen',
					type: 'multiselect',
					label: L('Rechtsgrundlagen', 'Legal bases'),
					help: L(
						'Die Rechtsgrundlagen der Verarbeitungsvorgänge, wie im Verzeichnis von Verarbeitungstätigkeiten.',
						'The legal bases of the processing operations, as in the record of processing activities.'
					),
					options: LEGAL_BASES,
					cite: { law: 'DSK', ref: 'Kurzpapier Nr. 5, Schritt 6' }
				},
				{
					id: 'rechtsgrundlagen_details',
					type: 'textarea',
					label: L('Rechtsgrundlagen im Einzelnen', 'Legal bases in detail'),
					help: L(
						'Normen außerhalb der DSGVO, die Interessenabwägung zu lit. f oder die Ausnahme nach Art. 9 Abs. 2.',
						'Provisions outside the GDPR, the balancing test for (f) or the exception under Art. 9(2).'
					),
					cite: { law: 'DSGVO', ref: 'Art. 6 Abs. 1' }
				},
				{
					id: 'dsb',
					type: 'textarea',
					label: L('Rat des Datenschutzbeauftragten', 'Advice of the data protection officer'),
					cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 2' }
				},
				{
					id: 'standpunkt',
					type: 'textarea',
					label: L(
						'Standpunkt der Betroffenen oder ihrer Vertreter',
						'Views of data subjects or their representatives'
					),
					cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 9' }
				}
			]
		},
		...RISKS,
		{
			id: 'ergebnis',
			title: L('Ergebnis', 'Outcome'),
			fields: [
				{
					id: 'restrisiko',
					type: 'textarea',
					label: L('Umgang mit den Restrisiken', 'Handling of the residual risks'),
					help: L(
						'Welche Risiken nach den Maßnahmen bleiben und warum die Verarbeitung mit ihnen vertretbar ist. Senken lassen sich Risiken nur durch Maßnahmen; Übernahme oder Übertragung wie in der Informationssicherheit sind nicht möglich.',
						'Which risks remain after the measures and why processing is justifiable with them. Only measures lower a risk; acceptance or transfer as in information security are not available.'
					),
					cite: { law: 'DSK', ref: 'Kurzpapier Nr. 5, Schritt 10' }
				},
				{
					id: 'umgesetzt',
					type: 'boolean',
					label: L('Abhilfemaßnahmen umgesetzt und getestet', 'Measures implemented and tested'),
					help: L(
						'Vor Beginn der Verarbeitung müssen die Maßnahmen umgesetzt und auf ihre Wirksamkeit getestet sein.',
						'The measures must be in place and tested for effectiveness before processing starts.'
					),
					cite: { law: 'DSK', ref: 'Kurzpapier Nr. 5, Schritte 11 und 12' }
				},
				{
					id: 'entscheidung',
					type: 'textarea',
					label: L('Entscheidung des Verantwortlichen', 'Decision of the controller'),
					help: L(
						'Freigabe der Verarbeitung, Auflagen, verantwortliche Person, Datum.',
						'Approval of the processing, conditions, responsible person, date.'
					)
				},
				{
					id: 'konsultation_am',
					type: 'datetime',
					label: L('Aufsichtsbehörde konsultiert am', 'Authority consulted on'),
					cite: { law: 'DSGVO', ref: 'Art. 36 Abs. 1' }
				},
				{
					id: 'stellungnahme',
					type: 'textarea',
					label: L('Stellungnahme der Aufsichtsbehörde', 'Opinion of the authority'),
					cite: { law: 'DSGVO', ref: 'Art. 36 Abs. 2' }
				},
				{
					id: 'ueberpruefung',
					type: 'date',
					label: L('Nächste Überprüfung', 'Next review'),
					cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 11' }
				}
			]
		}
	],
	workflow: {
		states: [
			{ id: 'entwurf', label: L('Entwurf', 'Draft') },
			{ id: 'bewertet', label: L('Bewertet', 'Assessed') },
			{ id: 'konsultation', label: L('Konsultation', 'Consultation') },
			{ id: 'abgeschlossen', label: L('Abgeschlossen', 'Signed off') }
		],
		initialState: 'entwurf',
		transitions: [
			{
				from: 'entwurf',
				to: 'bewertet',
				label: L('Bewertung abschließen', 'Complete the assessment'),
				requires: ['verarbeitung', 'zwecke', 'notwendigkeit', 'rechtsgrundlagen'],
				check: (record) => {
					const risks = assessRisks(record);
					if (risks.some((r) => r.before === null)) {
						return L(
							'Erst alle Risiken nach Wahrscheinlichkeit und Schwere einstufen.',
							'First rate every risk by likelihood and severity.'
						);
					}
					if (risks.some((r) => !r.justified)) {
						return L(
							'Jede Einstufung begründen (DSK Kurzpapier Nr. 18).',
							'Give reasons for every rating (DSK Kurzpapier Nr. 18).'
						);
					}
					const unbacked = unbackedReductions(record);
					if (unbacked.length === 0) return null;
					const list = (lang: 'de' | 'en') => unbacked.map((r) => r.title[lang]).join(', ');
					return L(
						`Ein Risiko sinkt nur durch benannte Abhilfemaßnahmen: ${list('de')}.`,
						`A risk only goes down through measures that are named: ${list('en')}.`
					);
				}
			},
			{ from: 'bewertet', to: 'entwurf', label: L('Zurück zum Entwurf', 'Back to draft') },
			{
				from: 'bewertet',
				to: 'konsultation',
				label: L('Aufsichtsbehörde konsultieren', 'Consult the authority'),
				requires: ['konsultation_am'],
				check: (record) =>
					highResidual(record)
						? null
						: L(
								'Eine Konsultation ist nur bei hohem Restrisiko vorgeschrieben.',
								'Consultation is only required for a high residual risk.'
							)
			},
			{
				from: 'bewertet',
				to: 'abgeschlossen',
				label: L('Freigeben', 'Sign off'),
				requires: ['restrisiko', 'entscheidung'],
				check: (record) => {
					if (highResidual(record)) {
						return L(
							'Bei hohem Restrisiko vor Beginn der Verarbeitung die Aufsichtsbehörde konsultieren (Art. 36 Abs. 1).',
							'With a high residual risk, consult the authority before processing starts (Art. 36(1)).'
						);
					}
					return measuresPending(record) ? PENDING : null;
				}
			},
			{
				from: 'konsultation',
				to: 'abgeschlossen',
				label: L('Nach Stellungnahme freigeben', 'Sign off after the opinion'),
				requires: ['stellungnahme', 'restrisiko', 'entscheidung'],
				check: (record) => (measuresPending(record) ? PENDING : null)
			},
			{ from: 'abgeschlossen', to: 'bewertet', label: L('Überarbeiten', 'Revise') }
		]
	}
};
