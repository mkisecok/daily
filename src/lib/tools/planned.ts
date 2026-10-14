import type { ToolManifest } from './types.js';

/**
 * Tools on the roadmap. Each becomes its own folder when it is built; until
 * then the manifest only exists here so the catalogue shows what is coming
 * and under which legal duty.
 */
export const planned: ToolManifest[] = [
	// ---------- Datenschutz ----------
	{
		slug: 'dsfa',
		category: 'datenschutz',
		status: 'planned',
		shape: 'workflow',
		version: 0,
		name: { de: 'Datenschutz-Folgenabschätzung', en: 'Data protection impact assessment' },
		summary: {
			de: 'Vollständige DSFA: Beschreibung, Erforderlichkeit, Risikomatrix, Maßnahmen, Restrisiko, Konsultationsentscheidung. Bericht als PDF.',
			en: 'Full DPIA: description, necessity, risk matrix, measures, residual risk, consultation decision. PDF report.'
		},
		legalBasis: [
			{ law: 'DSGVO', ref: 'Art. 35' },
			{ law: 'DSGVO', ref: 'Art. 36' }
		]
	},
	{
		slug: 'loeschkonzept',
		category: 'datenschutz',
		status: 'planned',
		shape: 'register',
		version: 0,
		name: { de: 'Löschkonzept', en: 'Retention schedule' },
		summary: {
			de: 'Aufbewahrungsfristen je Datenkategorie (HGB, AO), daraus abgeleitete Löschregeln.',
			en: 'Retention periods per data category (HGB, AO) and the deletion rules derived from them.'
		},
		legalBasis: [
			{ law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. e' },
			{ law: 'DSGVO', ref: 'Art. 17' }
		]
	},
	{
		slug: 'schulungsnachweis',
		category: 'datenschutz',
		status: 'planned',
		shape: 'register',
		version: 0,
		name: { de: 'Schulungsnachweis', en: 'Training log' },
		summary: {
			de: 'Schulungen je Mandant und Beschäftigten, Wiederholungsfristen als Fristen.',
			en: 'Training per client and employee, renewal dates as deadlines.'
		},
		legalBasis: [{ law: 'DSGVO', ref: 'Art. 39 Abs. 1 lit. b' }]
	},
	// ---------- Künstliche Intelligenz ----------
	{
		slug: 'grundrechte-folgenabschaetzung',
		category: 'ki',
		status: 'planned',
		shape: 'workflow',
		version: 0,
		name: { de: 'Grundrechte-Folgenabschätzung', en: 'Fundamental rights impact assessment' },
		summary: {
			de: 'FRIA nach Art. 27 für öffentliche Stellen sowie Kredit- und Versicherungsbetreiber.',
			en: 'FRIA under Art. 27 for public bodies and credit or insurance deployers.'
		},
		legalBasis: [{ law: 'KI-VO', ref: 'Art. 27' }]
	},
	{
		slug: 'ki-kompetenz',
		category: 'ki',
		status: 'planned',
		shape: 'register',
		version: 0,
		name: { de: 'KI-Kompetenz', en: 'AI literacy' },
		summary: {
			de: 'Schulungsplan und Nachweis je Rolle nach Art. 4.',
			en: 'Training plan and evidence per role under Art. 4.'
		},
		legalBasis: [{ law: 'KI-VO', ref: 'Art. 4' }]
	},
	{
		slug: 'vorfallmeldung',
		category: 'ki',
		status: 'planned',
		shape: 'workflow',
		version: 0,
		name: { de: 'Vorfallmeldung', en: 'Serious incident report' },
		summary: {
			de: 'Register schwerwiegender Vorfälle mit Fristen nach Art. 73 (15, 10 und 2 Tage), Verknüpfung zur Datenpanne.',
			en: 'Register of serious incidents with Art. 73 deadlines (15, 10 and 2 days), linked to data breaches.'
		},
		legalBasis: [{ law: 'KI-VO', ref: 'Art. 73' }]
	},
	{
		slug: 'aims-gap',
		category: 'ki',
		status: 'planned',
		shape: 'questionnaire',
		version: 0,
		name: { de: 'AIMS-Gap-Analyse', en: 'AIMS gap analysis' },
		summary: {
			de: 'Lückenanalyse gegen ISO/IEC 42001 Anhang A, abgebildet auf KI-VO-Artikel und ISO 27001.',
			en: 'Gap analysis against ISO/IEC 42001 Annex A, mapped to AI Act articles and ISO 27001.'
		},
		legalBasis: [
			{ law: 'ISO 42001', ref: 'Anhang A' },
			{ law: 'ISO 27001', ref: 'Anhang A' }
		]
	},

	// ---------- Audit ----------
	{
		slug: 'auditprogramm',
		category: 'audit',
		status: 'planned',
		shape: 'workflow',
		version: 0,
		name: { de: 'Auditprogramm', en: 'Audit programme' },
		summary: {
			de: 'Audit definieren: Umfang, Kriterien (DSGVO, KI-VO, 27001, 42001, TISAX), Zeitplan, Ansprechpartner.',
			en: 'Define an audit: scope, criteria (GDPR, AI Act, 27001, 42001, TISAX), schedule, contacts.'
		},
		legalBasis: [{ law: 'ISO 27001', ref: 'Kap. 9.2' }]
	},
	{
		slug: 'pruefkatalog',
		category: 'audit',
		status: 'planned',
		shape: 'questionnaire',
		version: 0,
		name: { de: 'Prüfkatalog', en: 'Audit checklist' },
		summary: {
			de: 'Fragensätze je Kriterium, Stichproben, Interviewnotizen.',
			en: 'Question sets per criterion, sampling, interview notes.'
		},
		legalBasis: [{ law: 'DSGVO', ref: 'Art. 39 Abs. 1 lit. b' }]
	},
	{
		slug: 'feststellungen',
		category: 'audit',
		status: 'planned',
		shape: 'workflow',
		version: 0,
		name: { de: 'Feststellungen', en: 'Findings' },
		summary: {
			de: 'Haupt- und Nebenabweichungen, Hinweise, Nachweise, Korrekturmaßnahmen mit Fristen.',
			en: 'Major and minor nonconformities, observations, evidence, corrective actions with deadlines.'
		},
		legalBasis: [{ law: 'ISO 27001', ref: 'Kap. 10.1' }]
	},
	{
		slug: 'auditbericht',
		category: 'audit',
		status: 'planned',
		shape: 'workflow',
		version: 0,
		name: { de: 'Auditbericht', en: 'Audit report' },
		summary: {
			de: 'Berichtsgenerator aus Programm, Katalog und Feststellungen; PDF.',
			en: 'Report generator from programme, checklist and findings; PDF.'
		},
		legalBasis: [{ law: 'ISO 27001', ref: 'Kap. 9.2' }]
	},

	// ---------- Entwickler ----------
	{
		slug: 'repo-check',
		category: 'entwickler',
		status: 'planned',
		shape: 'workflow',
		version: 0,
		name: { de: 'Repo-Check', en: 'Repository check' },
		summary: {
			de: 'Quellcode auf personenbezogene Muster, Geheimnisse und Aufrufe externer KI-Dienste prüfen; Befundliste für den DSB.',
			en: 'Scan source code for personal-data patterns, secrets and calls to external AI services; findings list for the DPO.'
		},
		legalBasis: [
			{ law: 'DSGVO', ref: 'Art. 25' },
			{ law: 'DSGVO', ref: 'Art. 32' }
		]
	},
	{
		slug: 'guardrail-test',
		category: 'entwickler',
		status: 'planned',
		shape: 'workflow',
		version: 0,
		name: { de: 'Guardrail-Test', en: 'Guardrail test' },
		summary: {
			de: 'Prompt-Sätze gegen einen Chatbot-Endpunkt ausführen; Verweigerungs- und Leckraten als Nachweis im Risikomanagement.',
			en: 'Run prompt sets against a chatbot endpoint; refusal and leak rates as risk-management evidence.'
		},
		legalBasis: [
			{ law: 'KI-VO', ref: 'Art. 9' },
			{ law: 'KI-VO', ref: 'Art. 15' }
		]
	}
];
