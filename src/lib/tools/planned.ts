import type { ToolManifest } from './types.js';

/**
 * Tools on the roadmap. Each becomes its own folder when it is built; until
 * then the manifest only exists here so the catalogue shows what is coming
 * and under which legal duty.
 */
export const planned: ToolManifest[] = [
	// ---------- Datenschutz ----------
	{
		slug: 'vvt',
		category: 'datenschutz',
		status: 'planned',
		shape: 'register',
		version: 0,
		name: { de: 'Verzeichnis von Verarbeitungstätigkeiten', en: 'Record of processing activities' },
		summary: {
			de: 'Strukturiertes Verzeichnis je Mandant: Zweck, Kategorien, Empfänger, Drittland, Löschfrist, TOMs. Druck als amtliches Verzeichnis.',
			en: 'Structured register per client: purpose, categories, recipients, third countries, retention, TOMs. Prints as the official record.'
		},
		legalBasis: [{ law: 'DSGVO', ref: 'Art. 30' }]
	},
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
		slug: 'datenpanne',
		category: 'datenschutz',
		status: 'planned',
		shape: 'workflow',
		version: 0,
		name: { de: 'Datenpanne', en: 'Personal data breach' },
		summary: {
			de: '72-Stunden-Uhr ab Kenntnisnahme, Risikoprüfung (Meldung an Behörde? Benachrichtigung Betroffener?), Inhaltsprüfung nach Art. 33 Abs. 3, Verzeichnis.',
			en: '72-hour clock from awareness, risk test (notify the authority? inform data subjects?), Art. 33(3) content checklist, breach register.'
		},
		legalBasis: [
			{ law: 'DSGVO', ref: 'Art. 33' },
			{ law: 'DSGVO', ref: 'Art. 34' }
		]
	},
	{
		slug: 'betroffenenanfrage',
		category: 'datenschutz',
		status: 'planned',
		shape: 'workflow',
		version: 0,
		name: { de: 'Betroffenenanfrage', en: 'Data subject request' },
		summary: {
			de: 'Anfragen nach Art. 15–22 verfolgen: Identitätsprüfung, Monatsfrist mit Verlängerung, Prüfliste je Recht, Register.',
			en: 'Track requests under Art. 15–22: identity check, one-month deadline with extension, per-right checklist, register.'
		},
		legalBasis: [
			{ law: 'DSGVO', ref: 'Art. 12' },
			{ law: 'DSGVO', ref: 'Art. 15–22' }
		]
	},
	{
		slug: 'avv-pruefung',
		category: 'datenschutz',
		status: 'planned',
		shape: 'register',
		version: 0,
		name: { de: 'AVV-Prüfung', en: 'Processor contract check' },
		summary: {
			de: 'Prüfliste nach Art. 28 Abs. 3 lit. a–h, Auftragsverarbeiter-Register mit Wiedervorlage, Unterauftragsverarbeiter.',
			en: 'Checklist for Art. 28(3)(a)–(h), processor register with review dates, sub-processors.'
		},
		legalBasis: [{ law: 'DSGVO', ref: 'Art. 28' }]
	},
	{
		slug: 'drittland-transfer',
		category: 'datenschutz',
		status: 'planned',
		shape: 'questionnaire',
		version: 0,
		name: { de: 'Drittland-Transfer', en: 'Third-country transfer' },
		summary: {
			de: 'Land → Mechanismus (Angemessenheit, DPF, SCC + TIA, BCR); Transfer Impact Assessment als Fragebogen.',
			en: 'Country → mechanism (adequacy, DPF, SCCs + TIA, BCRs); transfer impact assessment questionnaire.'
		},
		legalBasis: [{ law: 'DSGVO', ref: 'Art. 44–49' }]
	},
	{
		slug: 'tom-katalog',
		category: 'datenschutz',
		status: 'planned',
		shape: 'register',
		version: 0,
		name: { de: 'TOM-Katalog', en: 'Technical and organisational measures' },
		summary: {
			de: 'Maßnahmenkatalog nach SDM-Bausteinen je System; speist VVT und DSFA.',
			en: 'Measures catalogue per system based on the SDM building blocks; feeds the record and the DPIA.'
		},
		legalBasis: [{ law: 'DSGVO', ref: 'Art. 32' }]
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
		slug: 'ki-register',
		category: 'ki',
		status: 'planned',
		shape: 'register',
		version: 0,
		name: { de: 'KI-Register', en: 'AI system register' },
		summary: {
			de: 'Inventar der KI-Systeme je Mandant: Zweck, Rolle (Anbieter/Betreiber), Modell, Datenkategorien, Risikoklasse, Verantwortliche.',
			en: 'Inventory of AI systems per client: purpose, role (provider/deployer), model, data categories, risk class, owner.'
		},
		legalBasis: [
			{ law: 'KI-VO', ref: 'Art. 3' },
			{ law: 'KI-VO', ref: 'Art. 26' }
		]
	},
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
		slug: 'ki-nutzungsrichtlinie',
		category: 'ki',
		status: 'planned',
		shape: 'questionnaire',
		version: 0,
		name: { de: 'KI-Nutzungsrichtlinie', en: 'AI usage policy' },
		summary: {
			de: 'Generator für eine interne Richtlinie: erlaubte Werkzeuge, Datenklassen, verbotene Eingaben, Protokollierung.',
			en: 'Generator for an internal policy: allowed tools, data classes, prohibited inputs, logging.'
		},
		legalBasis: [
			{ law: 'KI-VO', ref: 'Art. 4' },
			{ law: 'DSK', ref: 'Orientierungshilfe KI' }
		]
	},
	{
		slug: 'technische-dokumentation',
		category: 'ki',
		status: 'planned',
		shape: 'questionnaire',
		version: 0,
		name: { de: 'Technische Dokumentation', en: 'Technical documentation' },
		summary: {
			de: 'Prüfliste nach Anhang IV mit Nachweisfeldern je Abschnitt (Anbieter).',
			en: 'Annex IV checklist with evidence fields per section (providers).'
		},
		legalBasis: [
			{ law: 'KI-VO', ref: 'Art. 11' },
			{ law: 'KI-VO', ref: 'Anhang IV' }
		]
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
		slug: 'ki-dsgvo-schnittstelle',
		category: 'ki',
		status: 'planned',
		shape: 'questionnaire',
		version: 0,
		name: { de: 'KI und DSGVO', en: 'AI and GDPR' },
		summary: {
			de: 'Geführte Prüfung: automatisierte Entscheidung (Art. 22), DSFA-Auslöser bei KI, Rechtsgrundlage für Trainingsdaten.',
			en: 'Guided check: automated decisions (Art. 22), DPIA triggers for AI, legal basis for training data.'
		},
		legalBasis: [
			{ law: 'DSGVO', ref: 'Art. 22' },
			{ law: 'DSGVO', ref: 'Art. 35' }
		]
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
