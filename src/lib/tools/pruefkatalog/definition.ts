import type { RecordToolDefinition } from '../../records/types.js';
import type { Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });

/**
 * Question sets per audit topic, in Daily's own words. Standards are cited
 * by clause number only; their text is not reproduced.
 */
export const TEMPLATES: Record<string, { label: Localized; questions: Localized[] }> = {
	dsgvo: {
		label: L('DSGVO-Grundlagen', 'GDPR basics'),
		questions: [
			L(
				'Ist das Verzeichnis von Verarbeitungstätigkeiten vollständig und aktuell (Art. 30)?',
				'Is the record of processing activities complete and up to date (Art. 30)?'
			),
			L(
				'Ist für jede Verarbeitung die Rechtsgrundlage dokumentiert (Art. 6, 9)?',
				'Is the legal basis documented for each processing (Art. 6, 9)?'
			),
			L(
				'Werden Betroffene bei der Erhebung informiert; sind die Datenschutzhinweise aktuell (Art. 13, 14)?',
				'Are data subjects informed at collection; are the privacy notices current (Art. 13, 14)?'
			),
			L(
				'Ist ein Datenschutzbeauftragter benannt und der Aufsichtsbehörde gemeldet (Art. 37 Abs. 7)?',
				'Is a data protection officer designated and notified to the authority (Art. 37(7))?'
			),
			L(
				'Gibt es ein Löschkonzept, und werden Löschläufe nachweislich durchgeführt (Art. 5 Abs. 1 lit. e, Art. 17)?',
				'Is there a retention schedule, and are erasure runs evidenced (Art. 5(1)(e), Art. 17)?'
			),
			L(
				'Werden Beschäftigte regelmäßig geschult (Art. 39 Abs. 1 lit. b)?',
				'Are staff trained regularly (Art. 39(1)(b))?'
			)
		]
	},
	tom: {
		label: L('Technische und organisatorische Maßnahmen', 'Technical and organisational measures'),
		questions: [
			L(
				'Gibt es ein Rollen- und Berechtigungskonzept, und werden Berechtigungen regelmäßig überprüft?',
				'Is there a role and permission concept, and are permissions reviewed regularly?'
			),
			L(
				'Ist der Zugang zu Systemen mit sensiblen Daten mit mehreren Faktoren gesichert?',
				'Is access to systems with sensitive data protected by multiple factors?'
			),
			L(
				'Werden Daten bei Übertragung und Speicherung verschlüsselt, wo das Risiko es verlangt (Art. 32 Abs. 1 lit. a)?',
				'Is data encrypted in transit and at rest where the risk requires it (Art. 32(1)(a))?'
			),
			L(
				'Gibt es Datensicherungen, und wurde eine Wiederherstellung erfolgreich getestet (Art. 32 Abs. 1 lit. c)?',
				'Are there backups, and has a restore been tested successfully (Art. 32(1)(c))?'
			),
			L('Werden Sicherheitsupdates zeitnah eingespielt?', 'Are security updates applied promptly?'),
			L(
				'Werden Zugriffe protokolliert und die Protokolle ausgewertet?',
				'Are accesses logged and the logs reviewed?'
			),
			L(
				'Wird die Wirksamkeit der Maßnahmen regelmäßig überprüft (Art. 32 Abs. 1 lit. d)?',
				'Is the effectiveness of the measures reviewed regularly (Art. 32(1)(d))?'
			)
		]
	},
	betroffenenrechte: {
		label: L('Betroffenenrechte', 'Data subject rights'),
		questions: [
			L(
				'Sind Ablauf und Zuständigkeit für Anträge Betroffener festgelegt?',
				'Are the process and responsibility for data subject requests defined?'
			),
			L(
				'Wird die Monatsfrist überwacht; wurden Verlängerungen begründet mitgeteilt (Art. 12 Abs. 3)?',
				'Is the one-month period monitored; were extensions communicated with reasons (Art. 12(3))?'
			),
			L(
				'Wird die Identität nur bei begründeten Zweifeln zusätzlich geprüft (Art. 12 Abs. 6)?',
				'Is identity verified additionally only where there are reasonable doubts (Art. 12(6))?'
			),
			L(
				'Stichprobe: Sind beantwortete Auskünfte vollständig im Sinne des Art. 15 Abs. 1 bis 3?',
				'Sample: are answered access requests complete within Art. 15(1) to (3)?'
			),
			L(
				'Werden Empfänger über Berichtigung, Löschung und Einschränkung informiert (Art. 19)?',
				'Are recipients informed of rectification, erasure and restriction (Art. 19)?'
			)
		]
	},
	auftragsverarbeitung: {
		label: L('Auftragsverarbeitung', 'Processing on behalf'),
		questions: [
			L('Sind alle Auftragsverarbeiter erfasst?', 'Are all processors recorded?'),
			L(
				'Liegt für jeden ein Vertrag mit den Inhalten des Art. 28 Abs. 3 vor?',
				'Is there a contract with the content of Art. 28(3) for each?'
			),
			L(
				'Sind Unterauftragsverarbeiter genehmigt, und ist ein Einspruchsrecht vereinbart (Art. 28 Abs. 2)?',
				'Are sub-processors authorised, and is a right to object agreed (Art. 28(2))?'
			),
			L(
				'Liegen Nachweise hinreichender Garantien vor (Art. 28 Abs. 1)?',
				'Is there evidence of sufficient guarantees (Art. 28(1))?'
			),
			L(
				'Sind Drittlandübermittlungen auf eine Grundlage nach Art. 44 ff. gestützt?',
				'Are third-country transfers based on a ground under Art. 44 et seq.?'
			)
		]
	},
	datenpannen: {
		label: L('Datenpannen', 'Personal data breaches'),
		questions: [
			L(
				'Kennen Beschäftigte den internen Meldeweg für Vorfälle?',
				'Do staff know the internal reporting route for incidents?'
			),
			L(
				'Gibt es einen Ablauf, der die 72-Stunden-Frist sicher einhält (Art. 33 Abs. 1)?',
				'Is there a process that reliably meets the 72-hour period (Art. 33(1))?'
			),
			L(
				'Sind alle Vorfälle dokumentiert, auch nicht gemeldete (Art. 33 Abs. 5)?',
				'Are all incidents documented, including those not notified (Art. 33(5))?'
			),
			L(
				'Stichprobe: Waren Risikobewertung und Entscheidung über die Benachrichtigung nachvollziehbar (Art. 34)?',
				'Sample: were the risk assessment and the decision on communication traceable (Art. 34)?'
			)
		]
	},
	kivo: {
		label: L('KI-Verordnung (Betreiber)', 'AI Act (deployer)'),
		questions: [
			L(
				'Gibt es ein vollständiges KI-Register mit Rolle und Risikoklasse je System?',
				'Is there a complete AI register with role and risk class per system?'
			),
			L(
				'Ist die Einstufung jedes Systems begründet und dokumentiert (Art. 6)?',
				'Is the classification of each system reasoned and documented (Art. 6)?'
			),
			L(
				'Werden Hochrisiko-Systeme nach der Betriebsanleitung verwendet (Art. 26 Abs. 1)?',
				'Are high-risk systems used according to the instructions (Art. 26(1))?'
			),
			L(
				'Ist die menschliche Aufsicht kompetenten, befugten Personen übertragen (Art. 26 Abs. 2)?',
				'Is human oversight assigned to competent, authorised persons (Art. 26(2))?'
			),
			L(
				'Werden automatisch erzeugte Protokolle mindestens sechs Monate aufbewahrt (Art. 26 Abs. 6)?',
				'Are automatically generated logs kept for at least six months (Art. 26(6))?'
			),
			L(
				'Sind Beschäftigte und ihre Vertretung vor der Einführung informiert (Art. 26 Abs. 7)?',
				'Were workers and their representatives informed before deployment (Art. 26(7))?'
			),
			L(
				'Werden Transparenzpflichten nach Art. 50 erfüllt?',
				'Are the transparency obligations under Art. 50 met?'
			),
			L(
				'Ist die KI-Kompetenz der Beschäftigten belegt (Art. 4)?',
				'Is the AI literacy of staff evidenced (Art. 4)?'
			)
		]
	},
	isms: {
		label: L('ISMS-Kernanforderungen (ISO/IEC 27001)', 'ISMS core requirements (ISO/IEC 27001)'),
		questions: [
			L(
				'Ist der Geltungsbereich des ISMS festgelegt und dokumentiert (Kap. 4.3)?',
				'Is the scope of the ISMS defined and documented (cl. 4.3)?'
			),
			L(
				'Gibt es eine von der Leitung freigegebene Sicherheitsleitlinie (Kap. 5.2)?',
				'Is there a security policy approved by management (cl. 5.2)?'
			),
			L(
				'Werden Informationssicherheitsrisiken nach einem festgelegten Verfahren beurteilt und behandelt (Kap. 6.1.2, 6.1.3)?',
				'Are information security risks assessed and treated by a defined process (cl. 6.1.2, 6.1.3)?'
			),
			L(
				'Liegt eine aktuelle Erklärung zur Anwendbarkeit vor?',
				'Is there a current statement of applicability?'
			),
			L(
				'Werden interne Audits und Managementbewertungen durchgeführt (Kap. 9.2, 9.3)?',
				'Are internal audits and management reviews carried out (cl. 9.2, 9.3)?'
			),
			L(
				'Werden Abweichungen mit Ursachenanalyse und Korrekturmaßnahmen behandelt (Kap. 10.2)?',
				'Are nonconformities handled with root cause analysis and corrective action (cl. 10.2)?'
			)
		]
	},
	aims: {
		label: L('AIMS-Kernanforderungen (ISO/IEC 42001)', 'AIMS core requirements (ISO/IEC 42001)'),
		questions: [
			L(
				'Ist der Geltungsbereich des KI-Managementsystems festgelegt (Kap. 4.3)?',
				'Is the scope of the AI management system defined (cl. 4.3)?'
			),
			L(
				'Gibt es eine KI-Politik, und sind Rollen und Verantwortlichkeiten zugewiesen (Kap. 5.2, 5.3)?',
				'Is there an AI policy, and are roles and responsibilities assigned (cl. 5.2, 5.3)?'
			),
			L(
				'Werden KI-Risiken beurteilt und behandelt (Kap. 6.1.2, 6.1.3)?',
				'Are AI risks assessed and treated (cl. 6.1.2, 6.1.3)?'
			),
			L(
				'Werden die Auswirkungen von KI-Systemen auf Personen und Gruppen abgeschätzt (Kap. 6.1.4)?',
				'Are the impacts of AI systems on individuals and groups assessed (cl. 6.1.4)?'
			),
			L(
				'Werden interne Audits und Managementbewertungen durchgeführt (Kap. 9.2, 9.3)?',
				'Are internal audits and management reviews carried out (cl. 9.2, 9.3)?'
			)
		]
	}
};

/** One checklist of an audit: a topic, its questions, evidence and result. */
export const definition: RecordToolDefinition = {
	slug: 'pruefkatalog',
	version: 1,
	intro: L(
		'Ein Eintrag je Prüfthema eines Audits. Eine Vorlage liefert die Prüffragen; Stichproben, Interviewnotizen und Nachweise halten fest, worauf das Ergebnis beruht. Nicht erfüllte Anforderungen werden als Feststellung weiterverfolgt.',
		'One entry per topic of an audit. A template supplies the questions; samples, interview notes and evidence record what the result rests on. Requirements not met are followed up as findings.'
	),
	sources: [
		{ law: 'ISO 27001', ref: 'Kap. 9.2' },
		{ law: 'DSGVO', ref: 'Art. 39 Abs. 1 lit. b' }
	],
	titleField: 'titel',
	sections: [
		{
			id: 'thema',
			title: L('Thema', 'Topic'),
			fields: [
				{
					id: 'titel',
					type: 'text',
					label: L('Prüfthema', 'Topic'),
					required: true,
					listColumn: true
				},
				{
					id: 'audit',
					type: 'reference',
					tool: 'auditprogramm',
					label: L('Audit', 'Audit'),
					listColumn: true
				},
				{
					id: 'vorlage',
					type: 'select',
					label: L('Vorlage', 'Template'),
					options: Object.entries(TEMPLATES).map(([value, t]) => ({ value, label: t.label }))
				},
				{ id: 'bereich', type: 'text', label: L('Geprüfter Bereich', 'Area audited') },
				{
					id: 'fragen',
					type: 'textarea',
					label: L('Eigene oder angepasste Fragen', 'Own or adapted questions')
				}
			]
		},
		{
			id: 'pruefung',
			title: L('Prüfung', 'Review'),
			fields: [
				{ id: 'stichproben', type: 'textarea', label: L('Stichproben', 'Samples') },
				{ id: 'interviews', type: 'textarea', label: L('Interviewnotizen', 'Interview notes') },
				{ id: 'nachweise', type: 'textarea', label: L('Nachweise', 'Evidence') },
				{
					id: 'ergebnis',
					type: 'select',
					label: L('Ergebnis', 'Result'),
					options: [
						{ value: 'erfuellt', label: L('Erfüllt', 'Met') },
						{ value: 'teilweise', label: L('Teilweise erfüllt', 'Partly met') },
						{ value: 'nicht_erfuellt', label: L('Nicht erfüllt', 'Not met') }
					],
					listColumn: true
				},
				{ id: 'bewertung', type: 'textarea', label: L('Begründung', 'Reasoning') }
			]
		}
	]
};
