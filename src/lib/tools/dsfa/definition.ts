import type {
	FieldSection,
	RecordData,
	RecordToolDefinition,
	RecordView
} from '../../records/types.js';
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

/**
 * where a risk comes from, as the BfDI's method for risk assessment (annex
 * to its DSFA template) and DSK Kurzpapier Nr. 18 name the sources: the
 * processing as planned first, because it harms people too
 */
export const RISK_SOURCES = [
	{ value: 'geplant', label: L('Geplante Verarbeitung', 'Processing as planned') },
	{ value: 'bearbeitungsfehler', label: L('Bearbeitungsfehler', 'Handling errors') },
	{
		value: 'missbrauch',
		label: L('Missbrauch durch Beschäftigte', 'Misuse by staff')
	},
	{ value: 'empfaenger', label: L('Fehler bei Empfängern', 'Errors at recipients') },
	{ value: 'technik', label: L('Technische Fehler', 'Technical faults') },
	{ value: 'angriff', label: L('Angriffe von außen', 'Attacks from outside') },
	{ value: 'hoehere_gewalt', label: L('Höhere Gewalt', 'Force majeure') }
];

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
				id: `${id}_quellen`,
				type: 'multiselect',
				label: L('Risikoquellen', 'Sources of risk'),
				help: L(
					'Woraus der Schaden entstehen kann. Auch die Verarbeitung, die wie geplant läuft, kann Betroffenen schaden.',
					'What the harm can arise from. The processing running as planned can also harm data subjects.'
				),
				options: RISK_SOURCES,
				cite: { law: 'BfDI', ref: 'Anlage zum Muster DSFA' }
			},
			{
				id: `${id}_beschreibung`,
				type: 'textarea',
				label: L('Risiko im Einzelfall', 'Risk in this case'),
				help: L(
					'Welcher Schaden kann den Betroffenen entstehen und durch welches Ereignis? Etwa Diskriminierung, Identitätsdiebstahl oder -betrug, finanzieller Verlust, Rufschädigung, wirtschaftliche oder gesellschaftliche Nachteile, erschwerte Ausübung von Rechten, Einschüchterung, die Menschen von der Wahrnehmung ihrer Rechte abhält, Profilbildung oder körperlicher Schaden durch falsche oder offengelegte Daten.',
					'What harm can the data subjects suffer, and through which event? For example discrimination, identity theft or fraud, financial loss, damage to reputation, economic or social disadvantage, rights made harder to exercise, a chilling effect that keeps people from using their rights, profiling, or physical harm from wrong or disclosed data.'
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
					'Die Einordnung in die Stufen ist zu begründen, nach Art, Umfang, Umständen und Zwecken der Verarbeitung. Für die Schwere zählen, wie weit und wie heimlich in Rechte eingegriffen wird, und wie empfindlich Daten und Personen sind, etwa bei sensiblen Daten, Berufsgeheimnisträgern oder besonders geschützten Grundrechten.',
					'The rating must be justified by the nature, scope, context and purposes of the processing. For severity, what counts is how widely and how covertly rights are affected, and how sensitive the data and the people are, e.g. sensitive data, holders of professional secrets or specially protected fundamental rights.'
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

/** the groups the BfDI's list under Art. 35(4) names as in need of protection */
const VULNERABLE = [
	{ value: 'kinder', label: L('Kinder', 'Children') },
	{
		value: 'beschaeftigte',
		label: L(
			'Beschäftigte, wenn der Arbeitgeber oder Dienstherr verarbeitet',
			'Employees, where the employer processes'
		)
	},
	{
		value: 'schutzbedarf',
		label: L(
			'Menschen mit besonderem Schutzbedarf, etwa Patienten, psychisch Kranke, Ältere, Asylsuchende',
			'People with special protection needs, e.g. patients, the mentally ill, older people, asylum seekers'
		)
	},
	{
		value: 'machtgefaelle',
		label: L(
			'Menschen in deutlich schwächerer Stellung gegenüber dem Verantwortlichen',
			'People in a clearly weaker position than the controller'
		)
	}
];

/** the rights of the EU Charter a processing most often interferes with */
const RIGHTS = [
	{
		value: 'art7',
		label: L('Privat- und Familienleben (Art. 7 GRCh)', 'Private and family life (Art. 7 CFR)')
	},
	{
		value: 'art8',
		label: L(
			'Schutz personenbezogener Daten (Art. 8 GRCh)',
			'Protection of personal data (Art. 8 CFR)'
		)
	},
	{
		value: 'art10',
		label: L(
			'Gedanken-, Gewissens- und Religionsfreiheit (Art. 10 GRCh)',
			'Freedom of thought, conscience and religion (Art. 10 CFR)'
		)
	},
	{
		value: 'art11',
		label: L(
			'Meinungs- und Informationsfreiheit (Art. 11 GRCh)',
			'Freedom of expression and information (Art. 11 CFR)'
		)
	},
	{
		value: 'art12',
		label: L(
			'Versammlungs- und Vereinigungsfreiheit (Art. 12 GRCh)',
			'Freedom of assembly and association (Art. 12 CFR)'
		)
	},
	{
		value: 'art15',
		label: L('Berufsfreiheit (Art. 15 GRCh)', 'Freedom to choose an occupation (Art. 15 CFR)')
	},
	{
		value: 'art21',
		label: L('Nichtdiskriminierung (Art. 21 GRCh)', 'Non-discrimination (Art. 21 CFR)')
	},
	{
		value: 'art24',
		label: L('Rechte des Kindes (Art. 24 GRCh)', 'Rights of the child (Art. 24 CFR)')
	},
	{
		value: 'art31',
		label: L('Gerechte Arbeitsbedingungen (Art. 31 GRCh)', 'Fair working conditions (Art. 31 CFR)')
	},
	{ value: 'art35', label: L('Gesundheitsschutz (Art. 35 GRCh)', 'Health care (Art. 35 CFR)') },
	{
		value: 'art47',
		label: L('Wirksamer Rechtsbehelf (Art. 47 GRCh)', 'Effective remedy (Art. 47 CFR)')
	}
];

/** how far a safeguard is in place, as the EDPB DPIA template (2026) grades it */
const COMPLIANCE_STATUS = [
	{ value: 'umgesetzt', label: L('Umgesetzt', 'Implemented') },
	{ value: 'teilweise', label: L('Teilweise umgesetzt', 'Partly implemented') },
	{ value: 'geplant', label: L('Geplant', 'Planned') },
	{ value: 'entfaellt', label: L('Entfällt', 'Not applicable') }
];

const usesConsent = (data: RecordData) =>
	Array.isArray(data.rechtsgrundlagen) && data.rechtsgrundlagen.includes('einwilligung');

/**
 * the safeguards for the principles and the rights of data subjects beside
 * security, as WP 248 Annex 2 and the EDPB DPIA template (2026, 2.3) list
 * them; consent only where it is a legal basis
 */
export const COMPLIANCE: {
	id: string;
	label: Localized;
	cite: { law: 'DSGVO'; ref: string };
	when?: (data: RecordData) => boolean;
}[] = [
	{
		id: 'e_information',
		label: L('Information der Betroffenen', 'Information of data subjects'),
		cite: { law: 'DSGVO', ref: 'Art. 13, 14' }
	},
	{
		id: 'e_rechte',
		label: L(
			'Auskunft, Berichtigung, Löschung, Widerspruch und die weiteren Betroffenenrechte',
			'Access, rectification, erasure, objection and the other rights of data subjects'
		),
		cite: { law: 'DSGVO', ref: 'Art. 15–22' }
	},
	{
		id: 'e_einwilligung',
		label: L('Wirksame und widerrufbare Einwilligung', 'Valid consent that can be withdrawn'),
		cite: { law: 'DSGVO', ref: 'Art. 7' },
		when: usesConsent
	},
	{
		id: 'e_auftragsverarbeitung',
		label: L('Verträge mit Auftragsverarbeitern', 'Contracts with processors'),
		cite: { law: 'DSGVO', ref: 'Art. 28' }
	},
	{
		id: 'e_drittland',
		label: L(
			'Garantien für Übermittlungen in Drittländer',
			'Safeguards for transfers to third countries'
		),
		cite: { law: 'DSGVO', ref: 'Art. 44–49' }
	},
	{
		id: 'e_design',
		label: L(
			'Datenschutz durch Technikgestaltung und Voreinstellungen',
			'Data protection by design and by default'
		),
		cite: { law: 'DSGVO', ref: 'Art. 25' }
	},
	{
		id: 'e_loeschfristen',
		label: L('Löschfristen festgelegt und umgesetzt', 'Retention periods set and applied'),
		cite: { law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. e' }
	}
];

const complianceSection: FieldSection = {
	id: 'einhaltung',
	title: L('Grundsätze und Betroffenenrechte', 'Principles and data subject rights'),
	intro: L(
		'Wie weit die Schutzvorkehrungen neben der Sicherheit umgesetzt sind. Die Sicherheit selbst belegt der verknüpfte Eintrag im TOM-Katalog.',
		'How far the safeguards beside security are in place. Security itself is evidenced by the linked TOM catalogue entry.'
	),
	fields: [
		...COMPLIANCE.map((item) => ({
			id: item.id,
			type: 'select' as const,
			label: item.label,
			options: COMPLIANCE_STATUS,
			cite: item.cite,
			...(item.when ? { when: item.when } : {})
		})),
		{
			id: 'einhaltung_details',
			type: 'textarea',
			label: L('Einzelheiten', 'Details'),
			help: L(
				'Wie die Vorkehrungen umgesetzt sind, und was bei teilweise umgesetzten oder geplanten noch fehlt.',
				'How the safeguards are implemented, and what is still missing for those partly implemented or planned.'
			)
		}
	]
};

/**
 * safeguards not yet assessed, and those assessed but not yet in place;
 * a safeguard that does not apply to this record counts as neither
 */
export function complianceOpen(record: RecordView): { unset: Localized[]; pending: Localized[] } {
	const unset: Localized[] = [];
	const pending: Localized[] = [];
	for (const item of COMPLIANCE) {
		if (item.when && !item.when(record.data)) continue;
		const value = record.data[item.id];
		if (typeof value !== 'string' || !value) unset.push(item.label);
		else if (value === 'teilweise' || value === 'geplant') pending.push(item.label);
	}
	return { unset, pending };
}

/** the sign-off fails the checklist: something unassessed, or open without conditions */
export function complianceBlocks(record: RecordView): boolean {
	const { unset, pending } = complianceOpen(record);
	return unset.length > 0 || (pending.length > 0 && record.data.beschluss !== 'auflagen');
}

/** likelihood and severity, 1–4 each */
export type Rating = { likelihood: number; severity: number };

export type AssessedRisk = {
	id: string;
	goal: SdmGoal;
	title: Localized;
	/** ids of the threats chosen as relevant, e.g. `G 0.23` */
	threats: string[];
	/** where the risk comes from, values of `RISK_SOURCES` */
	sources: string[];
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
		const sources = record.data[`${id}_quellen`];
		const reasons = record.data[`${id}_begruendung`];
		return {
			id,
			goal,
			title,
			threats: Array.isArray(threats) ? threats : [],
			sources: Array.isArray(sources) ? sources : [],
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

const COMPLIANCE_BLOCKS = L(
	'Erst alle Grundsätze und Betroffenenrechte einschätzen; sind noch welche offen, nur mit Auflagen freigeben (EDPB-Vorlage 2026, 2.3 und 6).',
	'First assess all principles and data subject rights; while some are still open, sign off only with conditions (EDPB template 2026, 2.3 and 6).'
);

const PENDING = L(
	'Vor der Freigabe die Abhilfemaßnahmen umsetzen und auf Wirksamkeit testen (DSK Kurzpapier Nr. 5, Schritte 11 und 12).',
	'Implement the measures and test that they work before sign-off (DSK Kurzpapier Nr. 5, steps 11 and 12).'
);

/** a data protection impact assessment from draft to sign-off (Art. 35, 36) */
export const definition: RecordToolDefinition = {
	slug: 'dsfa',
	version: 6,
	intro: L(
		'Eine Datenschutz-Folgenabschätzung je Verarbeitungsvorgang mit voraussichtlich hohem Risiko nach dem Ablauf des DSK-Kurzpapiers Nr. 5: Umfang, Beschreibung, Akteure, Notwendigkeit, Rechtsgrundlagen, Risiken je Gewährleistungsziel des Standard-Datenschutzmodells vor und nach Abhilfemaßnahmen, Entscheidung und gegebenenfalls Konsultation der Aufsichtsbehörde. Zu jedem Ziel lassen sich die Gefährdungen nach BSI-Standard 200-3 und datenschutzspezifische Ereignisse auswählen; die Bewertung folgt der Risikomatrix der DSK, die Druckfassung dient als Bericht.',
		'One DPIA per processing operation likely to result in a high risk, following the steps of DSK Kurzpapier Nr. 5: scope, description, actors, necessity, legal bases, risks per protection goal of the Standard Data Protection Model before and after measures, decision and, where needed, consultation of the authority. For each goal the threats of BSI-Standard 200-3 and data protection events can be chosen; the rating follows the DSK risk matrix and the print version serves as the report.'
	),
	sources: [
		{ law: 'DSGVO', ref: 'Art. 35' },
		{ law: 'DSGVO', ref: 'Art. 36' },
		{ law: 'DSK', ref: 'Kurzpapier Nr. 5' },
		{ law: 'DSK', ref: 'Kurzpapier Nr. 18' },
		{ law: 'DSK', ref: 'Standard-Datenschutzmodell V3.1a, D3' },
		{ law: 'WP29', ref: 'WP 248 rev. 01' },
		{ law: 'EDPB', ref: 'DSFA-Vorlage 2026' },
		{ law: 'BfDI', ref: 'Muster mit Hinweisen DSFA und Anlage' }
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
					id: 'fachbereich',
					type: 'text',
					label: L('Verantwortlicher Fachbereich', 'Responsible unit'),
					help: L(
						'Die Stelle im Haus, der die Verarbeitung gehört und die für sie einsteht; nicht das DSFA-Team.',
						'The unit in the organisation that owns the processing and answers for it; not the DPIA team.'
					),
					cite: { law: 'BfDI', ref: 'Muster DSFA, A.3' }
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
						'Daten, Betroffene, Empfänger, Datenflüsse und Speicherdauer, dazu die eingesetzten Mittel: Systeme und Software, Netze, beteiligte Personen und Papierakten.',
						'Data, data subjects, recipients, data flows and retention, and the assets used: systems and software, networks, people involved and paper records.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 7 lit. a' }
				},
				{
					id: 'ausmass',
					type: 'textarea',
					label: L(
						'Umfang und Umstände der Verarbeitung',
						'Scale and circumstances of the processing'
					),
					help: L(
						'Wie viele Personen und welcher Anteil der Gruppe erfasst werden, welche Datenmenge, welches räumliche Ausmaß. Dazu die Umstände: verdeckte Erhebung, Benachrichtigung der Betroffenen, Fernzugriff und mobiles Arbeiten, zentrale oder verteilte Speicherung, Such- und Verknüpfungsmöglichkeiten.',
						'How many people and which share of the group are covered, how much data, what geographic reach. And the circumstances: covert collection, whether data subjects are notified, remote access and mobile work, central or distributed storage, ways to search and link the data.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 1' }
				},
				{
					id: 'zugriffe',
					type: 'textarea',
					label: L('Zugriffe und Schnittstellen', 'Access and interfaces'),
					help: L(
						'Wer im Haus worauf zugreifen darf, welche Stellen von außen abrufen, etwa automatisiert, und welche Schnittstellen zu anderen Systemen bestehen.',
						'Who in the organisation may access what, which bodies retrieve data from outside, e.g. automatically, and which interfaces to other systems exist.'
					),
					cite: { law: 'BfDI', ref: 'Muster DSFA, B.11' }
				},
				{
					id: 'neue_technologien',
					type: 'boolean',
					label: L(
						'Neue Technologien oder organisatorische Lösungen',
						'New technologies or organisational solutions'
					),
					help: L(
						'Technik oder Organisation, die dem Stand der Technik voraus ist, sodass sich die Folgen für Betroffene und Gesellschaft schwer abschätzen lassen, etwa KI, Biometrie oder neue Datenmodelle.',
						'Technology or organisation ahead of the state of the art, so the effects on data subjects and society are hard to assess, e.g. AI, biometrics or new data models.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 1' }
				},
				{
					id: 'neue_technologien_details',
					type: 'textarea',
					label: L('Welche, und was daran neu ist', 'Which, and what is new about it'),
					when: (data) => data.neue_technologien === true
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
					id: 'schutzbeduerftig',
					type: 'boolean',
					label: L(
						'Besonders schutzbedürftige Personen betroffen',
						'Especially vulnerable people affected'
					),
					cite: { law: 'WP29', ref: 'WP 248 rev. 01, Kriterium 7' }
				},
				{
					id: 'schutzbeduerftige_gruppen',
					type: 'multiselect',
					label: L('Welche Gruppen', 'Which groups'),
					options: VULNERABLE,
					when: (data) => data.schutzbeduerftig === true
				},
				{
					id: 'grundrechte',
					type: 'multiselect',
					label: L('Betroffene Rechte und Freiheiten', 'Rights and freedoms affected'),
					help: L(
						'Die Grundrechte, in die die Verarbeitung eingreifen kann; ihre Risiken bewerten die Abschnitte unten.',
						'The fundamental rights the processing can interfere with; the sections below assess the risks to them.'
					),
					options: RIGHTS,
					cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 7 lit. c' }
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
					label: L('Notwendigkeit', 'Necessity'),
					help: L(
						'Erreicht die Verarbeitung ihren Zweck, und ist sie das mildeste Mittel? Welche Alternativen wurden geprüft und warum reichen sie nicht? Zweckbindung, Datenminimierung, Speicherbegrenzung.',
						'Does the processing achieve its purpose, and is it the least intrusive means? Which alternatives were considered and why are they not enough? Purpose limitation, data minimisation, storage limitation.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 7 lit. b' }
				},
				{
					id: 'verhaeltnismaessigkeit',
					type: 'textarea',
					label: L('Verhältnismäßigkeit', 'Proportionality'),
					help: L(
						'Überwiegt der Nutzen für den Verantwortlichen, die Betroffenen und die Allgemeinheit die Nachteile für die Rechte der Betroffenen? Die Risiken unten einbeziehen.',
						'Do the benefits for the controller, the data subjects and society outweigh the disadvantages for the rights of the data subjects? Take the risks below into account.'
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
					id: 'besondere_kategorien',
					type: 'boolean',
					label: L(
						'Besondere Kategorien personenbezogener Daten oder Daten über Straftaten',
						'Special categories of personal data or data on criminal offences'
					),
					help: L(
						'Gesundheit, Herkunft, Religion, Gewerkschaft, Sexualleben, biometrische oder genetische Daten, Straftaten.',
						'Health, origin, religion, trade union, sex life, biometric or genetic data, criminal offences.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 9 Abs. 1, Art. 10' }
				},
				{
					id: 'art9_ausnahme',
					type: 'textarea',
					label: L('Ausnahme vom Verarbeitungsverbot', 'Exception to the prohibition'),
					help: L(
						'Die Ausnahme nach Art. 9 Abs. 2, etwa Arbeitsrecht (lit. b) oder ausdrückliche Einwilligung (lit. a), und die Norm, auf die sie sich stützt.',
						'The exception under Art. 9(2), e.g. employment law ((b)) or explicit consent ((a)), and the provision it relies on.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 9 Abs. 2' },
					when: (data) => data.besondere_kategorien === true
				},
				{
					id: 'automatisiert',
					type: 'boolean',
					label: L(
						'Automatisierte Entscheidung mit rechtlicher oder ähnlich erheblicher Wirkung',
						'Automated decision with legal or similarly significant effect'
					),
					cite: { law: 'DSGVO', ref: 'Art. 22' }
				},
				{
					id: 'art22_garantien',
					type: 'textarea',
					label: L('Ausnahme und Garantien', 'Exception and safeguards'),
					help: L(
						'Die Ausnahme nach Art. 22 Abs. 2 und die Garantien nach Abs. 3: Eingreifen einer Person, eigener Standpunkt, Anfechtung.',
						'The exception under Art. 22(2) and the safeguards under (3): human intervention, own point of view, contesting the decision.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 22 Abs. 2, 3' },
					when: (data) => data.automatisiert === true
				},
				{
					id: 'verhaltensregeln',
					type: 'textarea',
					label: L('Genehmigte Verhaltensregeln', 'Approved codes of conduct'),
					help: L(
						'Welche genehmigten Verhaltensregeln nach Art. 40 eingehalten werden und wie sie in die Bewertung eingehen. Leer lassen, wenn keine gelten.',
						'Which approved codes of conduct under Art. 40 are complied with and how they enter the assessment. Leave empty if none apply.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 8' }
				},
				{
					id: 'dsb',
					type: 'textarea',
					label: L('Rat des Datenschutzbeauftragten', 'Advice of the data protection officer'),
					cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 2' }
				},
				{
					id: 'dsb_umsetzung',
					type: 'textarea',
					label: L('Umgang mit dem Rat', 'How the advice was followed'),
					help: L(
						'Was aus dem Rat übernommen wurde, und warum ein Teil nicht.',
						'What was taken from the advice, and why part of it was not.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 2' }
				},
				{
					id: 'standpunkt',
					type: 'textarea',
					label: L(
						'Standpunkt der Betroffenen oder ihrer Vertreter',
						'Views of data subjects or their representatives'
					),
					help: L(
						'Etwa über den Betriebsrat. Wurden sie nicht beteiligt, kurz begründen, warum.',
						'For example through the works council. If they were not involved, say briefly why.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 35 Abs. 9' }
				}
			]
		},
		complianceSection,
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
					id: 'massnahmenplan',
					type: 'textarea',
					label: L('Maßnahmenplan', 'Action plan'),
					help: L(
						'Welche Maßnahmen noch umgesetzt werden, wer sie umsetzt und wie sie im Betrieb überwacht werden.',
						'Which measures are still to be implemented, who implements them and how they are monitored in operation.'
					),
					cite: { law: 'EDPB', ref: 'DSFA-Vorlage 2026, 4.2.3' }
				},
				{
					id: 'massnahmen_bis',
					type: 'date',
					label: L('Umsetzen bis', 'Implement by')
				},
				{
					id: 'beschluss',
					type: 'select',
					label: L('Entscheidung des Verantwortlichen', 'Decision of the controller'),
					options: [
						{ value: 'durchfuehren', label: L('Wie geplant durchführen', 'Proceed as planned') },
						{
							value: 'auflagen',
							label: L('Mit Auflagen durchführen', 'Proceed with conditions')
						},
						{
							value: 'konsultation',
							label: L('Aufsichtsbehörde konsultieren', 'Consult the authority')
						},
						{ value: 'abbruch', label: L('Nicht durchführen', 'Do not proceed') }
					],
					cite: { law: 'EDPB', ref: 'DSFA-Vorlage 2026, 6' }
				},
				{
					id: 'entscheidung',
					type: 'textarea',
					label: L('Begründung und Auflagen', 'Reasons and conditions'),
					help: L(
						'Warum so entschieden wurde, und bei Auflagen, was vor Beginn der Verarbeitung erfüllt sein muss.',
						'Why the decision was taken and, with conditions, what must be met before processing starts.'
					)
				},
				{
					id: 'freigegeben_von',
					type: 'text',
					label: L('Freigegeben von', 'Approved by'),
					help: L(
						'Die verantwortliche Person der Leitung, etwa die Geschäftsführung.',
						'The responsible person in management, e.g. the managing director.'
					)
				},
				{
					id: 'freigegeben_am',
					type: 'date',
					label: L('Freigegeben am', 'Approved on')
				},
				{
					id: 'konsultation_am',
					type: 'datetime',
					label: L('Aufsichtsbehörde konsultiert am', 'Authority consulted on'),
					cite: { law: 'DSGVO', ref: 'Art. 36 Abs. 1' }
				},
				{
					id: 'frist_verlaengert',
					type: 'boolean',
					label: L(
						'Frist für die Stellungnahme um sechs Wochen verlängert',
						'Deadline for the opinion extended by six weeks'
					),
					cite: { law: 'DSGVO', ref: 'Art. 36 Abs. 2' },
					when: (data) => typeof data.konsultation_am === 'string' && data.konsultation_am !== ''
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
				requires: ['restrisiko', 'beschluss', 'freigegeben_von', 'freigegeben_am'],
				check: (record) => {
					if (highResidual(record) || record.data.beschluss === 'konsultation') {
						return L(
							'Bei hohem Restrisiko vor Beginn der Verarbeitung die Aufsichtsbehörde konsultieren (Art. 36 Abs. 1).',
							'With a high residual risk, consult the authority before processing starts (Art. 36(1)).'
						);
					}
					if (record.data.beschluss === 'abbruch') return null;
					if (complianceBlocks(record)) return COMPLIANCE_BLOCKS;
					return measuresPending(record) ? PENDING : null;
				}
			},
			{
				from: 'konsultation',
				to: 'abgeschlossen',
				label: L('Nach Stellungnahme freigeben', 'Sign off after the opinion'),
				requires: ['stellungnahme', 'restrisiko', 'beschluss', 'freigegeben_von', 'freigegeben_am'],
				check: (record) => {
					if (record.data.beschluss === 'abbruch') return null;
					if (complianceBlocks(record)) return COMPLIANCE_BLOCKS;
					return measuresPending(record) ? PENDING : null;
				}
			},
			{ from: 'abgeschlossen', to: 'bewertet', label: L('Überarbeiten', 'Revise') }
		]
	},
	example: {
		bezeichnung: 'Videoüberwachung der Laderampen (Beispiel)',
		umfang:
			'Vier Kameras an den Laderampen des Lagers, Aufzeichnung rund um die Uhr, Speicherung 72 Stunden.',
		verarbeitung:
			'Die Kameras zeichnen den Bereich vor den Rampen auf. Zugriff auf Aufnahmen nur nach einem Vorfall, durch die Lagerleitung gemeinsam mit dem Betriebsrat.',
		fachbereich: 'Logistik, Lagerleitung',
		ausmass:
			'Rund 60 Beschäftigte im Lager und täglich etwa 40 Fahrer; erfasst werden nur die vier Rampen. Die Kameras sind sichtbar und angekündigt, die Aufnahmen liegen auf einem Rekorder vor Ort, ohne Fernzugriff und ohne Verknüpfung mit anderen Systemen.',
		zugriffe:
			'Lagerleitung und Betriebsrat gemeinsam, nur nach einem Vorfall; keine Abrufe von außen, keine Schnittstellen. Herausgabe an die Polizei nur bei einer Anzeige.',
		neue_technologien: false,
		zwecke:
			'Aufklärung und Abschreckung von Diebstählen nach zwei Vorfällen im Jahr 2026; Wahrung des Hausrechts.',
		team: 'Datenschutzbeauftragte, Lagerleitung, IT, Betriebsrat',
		akteure: 'Beschäftigte im Lager, Fahrer von Speditionen, Besucher.',
		schutzbeduerftig: true,
		schutzbeduerftige_gruppen: ['beschaeftigte'],
		grundrechte: ['art7', 'art8', 'art31'],
		anlass: 'Systematische Überwachung von Beschäftigten an ihrem Arbeitsplatz.',
		notwendigkeit:
			'Mildere Mittel (bessere Beleuchtung, verschlossene Rampen außerhalb der Schichten) wurden geprüft und reichen allein nicht. Pausenbereiche und der Weg zu den Sozialräumen bleiben ausgenommen.',
		rechtsgrundlagen: ['interesse'],
		rechtsgrundlagen_details:
			'Art. 6 Abs. 1 lit. f DSGVO; Betriebsvereinbarung nach § 87 Abs. 1 Nr. 6 BetrVG.',
		verhaeltnismaessigkeit:
			'Die Aufzeichnung erfasst nur die Rampen, nicht Pausen- oder Sozialräume, und wird nur nach einem Vorfall angesehen. Dem Schutz von Waren und Beschäftigten vor falschem Verdacht steht ein begrenzter Eingriff gegenüber.',
		besondere_kategorien: false,
		automatisiert: false,
		dsb: 'Speicherdauer auf 72 Stunden begrenzen, Zugriff nur im Vier-Augen-Prinzip, Hinweisschilder vor dem erfassten Bereich.',
		dsb_umsetzung: 'Alle drei Empfehlungen sind übernommen.',
		standpunkt:
			'Der Betriebsrat war im DSFA-Team; die Betriebsvereinbarung schließt die Leistungs- und Verhaltenskontrolle aus.',
		e_information: 'umgesetzt',
		e_rechte: 'umgesetzt',
		e_auftragsverarbeitung: 'teilweise',
		e_drittland: 'entfaellt',
		e_design: 'umgesetzt',
		e_loeschfristen: 'umgesetzt',
		einhaltung_details:
			'Der Wartungsvertrag mit dem Errichter der Kameras ist noch um eine Vereinbarung nach Art. 28 zu ergänzen.',
		vertraulichkeit_gefaehrdungen: ['G 0.14', 'G 0.19'],
		vertraulichkeit_quellen: ['missbrauch', 'angriff'],
		vertraulichkeit_beschreibung: 'Unbefugte sehen Aufnahmen ein oder geben sie weiter.',
		vertraulichkeit_w: '2',
		vertraulichkeit_s: '3',
		vertraulichkeit_massnahmen:
			'Rekorder im verschlossenen Technikraum; Zugriff nur für zwei benannte Personen, protokolliert.',
		vertraulichkeit_rw: '1',
		vertraulichkeit_rs: '3',
		zweck_gefaehrdungen: ['G 0.29', 'DS 5'],
		zweck_quellen: ['geplant', 'missbrauch'],
		zweck_beschreibung: 'Die Aufnahmen werden zur Leistungs- oder Verhaltenskontrolle genutzt.',
		zweck_w: '3',
		zweck_s: '3',
		zweck_massnahmen:
			'Betriebsvereinbarung schließt Leistungs- und Verhaltenskontrolle aus; Auswertung nur nach einem dokumentierten Vorfall.',
		zweck_rw: '1',
		zweck_rs: '3',
		transparenz_gefaehrdungen: ['DS 1', 'DS 2'],
		transparenz_quellen: ['geplant'],
		transparenz_beschreibung:
			'Fahrer und Besucher wissen nicht, dass und wie lange aufgezeichnet wird.',
		transparenz_w: '3',
		transparenz_s: '2',
		transparenz_massnahmen:
			'Hinweisschilder vor dem erfassten Bereich mit Verantwortlichem, Zweck, Speicherdauer und Kontakt; vollständige Hinweise am Empfang.',
		transparenz_rw: '1',
		transparenz_rs: '2',
		restrisiko:
			'Nach den Maßnahmen bleibt kein hohes Risiko; eine Konsultation der Aufsichtsbehörde ist nicht nötig.',
		umgesetzt: false,
		massnahmenplan:
			'Rekorder in den Technikraum verlegen (IT); Vereinbarung nach Art. 28 mit dem Errichter abschließen (Einkauf).',
		massnahmen_bis: '2027-01-15',
		ueberpruefung: '2027-11-01'
	}
};
