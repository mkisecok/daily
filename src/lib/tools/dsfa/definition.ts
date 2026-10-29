import type { FieldSection, RecordToolDefinition, RecordView } from '../../records/types.js';
import type { Localized } from '../types.js';

const L = (de: string, en: string) => ({ de, en });

/** the four steps the DSK uses for both likelihood and severity */
const SCALE = [
	{ value: '1', label: L('Geringfügig', 'Negligible') },
	{ value: '2', label: L('Überschaubar', 'Limited') },
	{ value: '3', label: L('Substanziell', 'Significant') },
	{ value: '4', label: L('Groß', 'Major') }
];

export type RiskLevel = 'gering' | 'risiko' | 'hoch';

/**
 * risk from likelihood and severity (1–4 each), in the manner of the DSK
 * risk matrix (Kurzpapier Nr. 18): up to 4 points low, 5–6 a risk, from 7
 * high.
 */
export function riskLevel(likelihood: number, severity: number): RiskLevel {
	const score = likelihood + severity;
	return score <= 4 ? 'gering' : score <= 6 ? 'risiko' : 'hoch';
}

function risk(id: string, title: Localized, help: Localized): FieldSection {
	return {
		id,
		title,
		intro: help,
		fields: [
			{
				id: `${id}_beschreibung`,
				type: 'textarea',
				label: L('Risiko im Einzelfall', 'Risk in this case')
			},
			{
				id: `${id}_w`,
				type: 'select',
				label: L('Eintrittswahrscheinlichkeit', 'Likelihood'),
				options: SCALE
			},
			{ id: `${id}_s`, type: 'select', label: L('Schwere', 'Severity'), options: SCALE },
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

/** the risk sources assessed, along the protection goals of the SDM */
export const RISKS = [
	risk(
		'vertraulichkeit',
		L('Unbefugte Offenlegung', 'Unauthorised disclosure'),
		L(
			'Kenntnisnahme durch Unbefugte, etwa durch Angriffe, Fehlversand oder zu weite Berechtigungen.',
			'Access by unauthorised persons, e.g. through attacks, misdirected mail or overly broad permissions.'
		)
	),
	risk(
		'integritaet',
		L('Unbefugte Veränderung', 'Unauthorised alteration'),
		L(
			'Falsche oder manipulierte Daten mit Folgen für Entscheidungen über Personen.',
			'Wrong or manipulated data affecting decisions about people.'
		)
	),
	risk(
		'verfuegbarkeit',
		L('Verlust oder Nichtverfügbarkeit', 'Loss or unavailability'),
		L(
			'Daten fehlen, wenn sie gebraucht werden, oder gehen verloren.',
			'Data is missing when needed or is lost.'
		)
	),
	risk(
		'zweck',
		L('Zweckentfremdung und Verkettung', 'Function creep and linkage'),
		L(
			'Nutzung für andere Zwecke, Zusammenführung von Datenbeständen, übermäßige Erhebung.',
			'Use for other purposes, combining datasets, excessive collection.'
		)
	),
	risk(
		'rechte',
		L('Beeinträchtigung von Betroffenenrechten', 'Impairment of data subject rights'),
		L(
			'Intransparenz, fehlende Eingriffsmöglichkeiten, Diskriminierung, Profilbildung.',
			'Opacity, lack of intervention, discrimination, profiling.'
		)
	)
];

export type AssessedRisk = {
	id: string;
	title: Localized;
	before: RiskLevel | null;
	after: RiskLevel | null;
};

const num = (record: RecordView, id: string) => {
	const value = Number(record.data[id]);
	return Number.isInteger(value) && value >= 1 && value <= 4 ? value : null;
};

/** each risk before and after measures; residual falls back to the initial rating */
export function assessRisks(record: RecordView): AssessedRisk[] {
	return RISKS.map(({ id, title }) => {
		const w = num(record, `${id}_w`);
		const s = num(record, `${id}_s`);
		const rw = num(record, `${id}_rw`) ?? w;
		const rs = num(record, `${id}_rs`) ?? s;
		return {
			id,
			title,
			before: w && s ? riskLevel(w, s) : null,
			after: rw && rs ? riskLevel(rw, rs) : null
		};
	});
}

const highResidual = (record: RecordView) => assessRisks(record).some((r) => r.after === 'hoch');

/** a data protection impact assessment from draft to sign-off (Art. 35, 36) */
export const definition: RecordToolDefinition = {
	slug: 'dsfa',
	version: 2,
	intro: L(
		'Eine Datenschutz-Folgenabschätzung je Verarbeitungsvorgang mit voraussichtlich hohem Risiko: Beschreibung, Notwendigkeit, Risiken vor und nach Abhilfemaßnahmen, Entscheidung und gegebenenfalls Konsultation der Aufsichtsbehörde. Die Bewertung lehnt sich an die Risikomatrix der DSK an; die Druckfassung dient als Bericht.',
		'One DPIA per processing operation likely to result in a high risk: description, necessity, risks before and after measures, decision and, where needed, consultation of the authority. The rating follows the DSK risk matrix; the print version serves as the report.'
	),
	sources: [
		{ law: 'DSGVO', ref: 'Art. 35' },
		{ law: 'DSGVO', ref: 'Art. 36' },
		{ law: 'DSK', ref: 'Kurzpapier Nr. 5' },
		{ law: 'DSK', ref: 'Kurzpapier Nr. 18' }
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
				requires: ['verarbeitung', 'zwecke', 'notwendigkeit'],
				check: (record) =>
					assessRisks(record).some((r) => r.before === null)
						? L(
								'Erst alle Risiken nach Wahrscheinlichkeit und Schwere einstufen.',
								'First rate every risk by likelihood and severity.'
							)
						: null
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
				requires: ['entscheidung'],
				check: (record) =>
					highResidual(record)
						? L(
								'Bei hohem Restrisiko vor Beginn der Verarbeitung die Aufsichtsbehörde konsultieren (Art. 36 Abs. 1).',
								'With a high residual risk, consult the authority before processing starts (Art. 36(1)).'
							)
						: null
			},
			{
				from: 'konsultation',
				to: 'abgeschlossen',
				label: L('Nach Stellungnahme freigeben', 'Sign off after the opinion'),
				requires: ['stellungnahme', 'entscheidung']
			},
			{ from: 'abgeschlossen', to: 'bewertet', label: L('Überarbeiten', 'Revise') }
		]
	}
};
