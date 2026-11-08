import type { FieldSection, RecordToolDefinition } from '../../records/types.js';
import type { Localized } from '../types.js';
import { EBENEN, LEVEL_STATUS, VORGAENGE, ZIELE } from './cube.js';

const L = (de: string, en: string) => ({ de, en });

/**
 * what a goal typically asks for on each level, after SDM V3.1a, part C and
 * D2.6 b): the same goal takes a different form in the business process,
 * the application and the infrastructure
 */
export const REQUIREMENTS: Record<string, [Localized, Localized, Localized]> = {
	vertraulichkeit: [
		L(
			'Rollen und Befugnisse fachlich festlegen, Beschäftigte auf Vertraulichkeit verpflichten.',
			'Define roles and authorisations, bind staff to confidentiality.'
		),
		L(
			'Rollen- und Rechtekonzept in der Anwendung, Authentisierung der Nutzenden.',
			'Role and permission concept in the application, user authentication.'
		),
		L(
			'Verschlüsselung bei Übertragung und Speicherung, Härtung, getrennte Netze.',
			'Encryption in transit and at rest, hardening, separated networks.'
		)
	],
	integritaet: [
		L(
			'Vier-Augen-Prinzip und fachliche Plausibilitätsprüfung.',
			'Four-eyes principle and plausibility checks.'
		),
		L(
			'Eingabeprüfungen und Änderungsprotokoll in der Anwendung.',
			'Input validation and change log in the application.'
		),
		L(
			'Prüfsummen, Schreibschutz, Schutz vor Schadsoftware.',
			'Checksums, write protection, malware protection.'
		)
	],
	verfuegbarkeit: [
		L(
			'Vertretungsregeln und Notfallabläufe im Fachverfahren.',
			'Deputy rules and emergency procedures in the business process.'
		),
		L('Wiederanlauf der Anwendung, Export der Daten.', 'Restart of the application, data export.'),
		L(
			'Datensicherung, getestete Wiederherstellung, Redundanz.',
			'Backups, tested restore, redundancy.'
		)
	],
	datenminimierung: [
		L(
			'Je Zweck die erforderlichen Daten und Löschfristen festlegen.',
			'Set the necessary data and retention periods per purpose.'
		),
		L(
			'Nur erforderliche Felder, datenschutzfreundliche Voreinstellungen, Pseudonymisierung.',
			'Only necessary fields, privacy-friendly defaults, pseudonymisation.'
		),
		L(
			'Automatisierte Löschung, auch in Protokollen und Sicherungen.',
			'Automated deletion, including logs and backups.'
		)
	],
	nichtverkettung: [
		L(
			'Zweckbindung und getrennte Zuständigkeiten festlegen.',
			'Set purpose limitation and separate responsibilities.'
		),
		L(
			'Mandantentrennung, keine zweckfremden Schnittstellen.',
			'Tenant separation, no interfaces for other purposes.'
		),
		L(
			'Getrennte Datenbanken oder Netze, kontrollierte Schnittstellen.',
			'Separate databases or networks, controlled interfaces.'
		)
	],
	transparenz: [
		L(
			'Information der Betroffenen, Dokumentation des Verfahrens, fachliche Nachweise.',
			'Informing data subjects, documenting the procedure, business-level evidence.'
		),
		L(
			'Fachliches Protokoll der Verarbeitungsschritte in der Anwendung.',
			'Business log of the processing steps in the application.'
		),
		L('Technisches Protokoll, etwa in der Datenbank.', 'Technical log, e.g. in the database.')
	],
	intervenierbarkeit: [
		L(
			'Abläufe für Auskunft, Berichtigung, Löschung und Widerspruch.',
			'Procedures for access, rectification, erasure and objection.'
		),
		L(
			'Funktionen zum Berichtigen, Sperren, Löschen und Exportieren.',
			'Functions to rectify, restrict, erase and export.'
		),
		L(
			'Löschen und Einschränken lassen sich auch technisch durchsetzen.',
			'Erasure and restriction can be enforced technically as well.'
		)
	]
};

const VORGANG_OPTIONS = VORGAENGE.map((v) => ({
	value: v.id,
	label: L(`${v.title.de} (${v.code})`, `${v.title.en} (${v.code})`)
}));

/** one protection goal: its status on each level (view b), its gaps per operation (view a) */
function goal(id: string, title: Localized): FieldSection {
	return {
		id,
		title,
		intro: L(
			'Wie das Ziel auf jeder Ebene umgesetzt ist, und bei welchen Vorgängen es noch Lücken hat.',
			'How the goal is met on each level, and for which operations it still has gaps.'
		),
		fields: [
			...EBENEN.map((ebene, index) => ({
				id: `${id}_${ebene.id}`,
				type: 'select' as const,
				label: L(`Ebene ${ebene.n}: ${ebene.title.de}`, `Level ${ebene.n}: ${ebene.title.en}`),
				help: REQUIREMENTS[id][index],
				options: LEVEL_STATUS
			})),
			{
				id: `${id}_luecken`,
				type: 'multiselect',
				label: L('Vorgänge mit Lücke', 'Operations with a gap'),
				help: L(
					'Vorgangsgruppen, bei denen dieses Ziel noch nicht erfüllt ist, etwa fehlende Transparenz beim Bereitstellen.',
					'Groups of operations for which this goal is not yet met, e.g. missing transparency when disclosing.'
				),
				options: VORGANG_OPTIONS,
				cite: { law: 'DSK', ref: 'SDM V3.1a, D2.6 a' }
			},
			{
				id: `${id}_anmerkungen`,
				type: 'textarea',
				label: L('Anforderungen und Maßnahmen', 'Requirements and measures')
			}
		]
	};
}

/** the SDM cube per processing activity: model, assess goal by goal, see what is open */
export const definition: RecordToolDefinition = {
	slug: 'sdm-wuerfel',
	version: 1,
	intro: L(
		'Ein Eintrag je Verarbeitungstätigkeit. Der SDM-Würfel des Standard-Datenschutzmodells legt drei Achsen übereinander: die Vorgänge der Verarbeitung (oder die vier Phasen des Datenlebenszyklus), die drei Ebenen Fachverfahren, Fachapplikation und Infrastruktur, und die sieben Gewährleistungsziele. Je Ziel wird festgehalten, wie es auf jeder Ebene umgesetzt ist und bei welchen Vorgängen Lücken bleiben; das Ergebnis zeigt den Würfel mit allen offenen Zellen. Bei normaler Risikostufe genügen die vier Phasen, bei hoher sind alle neun Vorgangsgruppen zu betrachten.',
		'One entry per processing activity. The SDM cube of the Standard Data Protection Model lays three axes over each other: the operations of the processing (or the four phases of the data life cycle), the three levels business process, business application and infrastructure, and the seven protection goals. For each goal you record how it is met on each level and for which operations gaps remain; the result shows the cube with every open cell. For a normal risk the four phases suffice, for a high one all nine groups of operations should be examined.'
	),
	sources: [
		{ law: 'DSK', ref: 'Standard-Datenschutzmodell V3.1a, D2.1–D2.6' },
		{ law: 'DSGVO', ref: 'Art. 5 Abs. 2' },
		{ law: 'DSGVO', ref: 'Art. 25' },
		{ law: 'DSGVO', ref: 'Art. 32' }
	],
	titleField: 'bezeichnung',
	sections: [
		{
			id: 'gegenstand',
			title: L('Verarbeitung', 'Processing'),
			fields: [
				{
					id: 'bezeichnung',
					type: 'text',
					label: L('Verarbeitungstätigkeit', 'Processing activity'),
					required: true,
					listColumn: true
				},
				{
					id: 'risikostufe',
					type: 'select',
					label: L('Risikostufe', 'Risk level'),
					help: L(
						'Bei normaler Risikostufe genügen die vier Phasen des Datenlebenszyklus; bei hoher sind die neun Vorgangsgruppen einzeln zu betrachten.',
						'For a normal risk the four phases of the data life cycle suffice; for a high one examine the nine groups of operations one by one.'
					),
					options: [
						{ value: 'normal', label: L('Normal', 'Normal') },
						{ value: 'hoch', label: L('Hoch', 'High') }
					],
					cite: { law: 'DSK', ref: 'SDM V3.1a, D2.6' },
					required: true,
					listColumn: true
				},
				{
					id: 'vvt',
					type: 'reference',
					tool: 'vvt',
					label: L('Verarbeitungstätigkeit im VVT', 'Processing activity in the record')
				},
				{
					id: 'dsfa',
					type: 'reference',
					tool: 'dsfa',
					label: L('Datenschutz-Folgenabschätzung', 'Data protection impact assessment'),
					help: L(
						'Bei hohem Risiko die DSFA, deren Risiken der Würfel vollständig abdecken soll.',
						'For a high risk, the DPIA whose risks the cube should cover in full.'
					)
				},
				{
					id: 'tom',
					type: 'reference',
					tool: 'tom-katalog',
					label: L('Maßnahmen im TOM-Katalog', 'Measures in the TOM catalogue')
				}
			]
		},
		{
			id: 'modell',
			title: L('Modellierung', 'Model'),
			intro: L(
				'Die Vorgänge der Verarbeitung und was auf jeder Ebene zum Einsatz kommt: Prozesse und Datenkategorien, Anwendungen und Schnittstellen, technische Dienste.',
				'The operations of the processing and what each level uses: processes and data categories, applications and interfaces, technical services.'
			),
			fields: [
				{
					id: 'vorgaenge',
					type: 'multiselect',
					label: L('Vorgänge der Verarbeitung', 'Operations of the processing'),
					help: L(
						'Die neun Vorgangsgruppen nach Art. 4 Nr. 2 DSGVO; nicht jede Verarbeitung umfasst alle.',
						'The nine groups of operations under Art. 4(2) GDPR; not every processing includes all of them.'
					),
					options: VORGANG_OPTIONS,
					cite: { law: 'DSK', ref: 'SDM V3.1a, D2.1' }
				},
				{
					id: 'ebene1',
					type: 'textarea',
					label: L('Ebene 1: Fachverfahren', 'Level 1: business process'),
					help: L(
						'Zweck, Teilprozesse, Rollen und Zuständigkeiten, Datenkategorien.',
						'Purpose, sub-processes, roles and responsibilities, data categories.'
					),
					cite: { law: 'DSK', ref: 'SDM V3.1a, D2.3' }
				},
				{
					id: 'ebene2',
					type: 'textarea',
					label: L('Ebene 2: Fachapplikation', 'Level 2: business application'),
					help: L(
						'Anwendungen, Sachbearbeitung, Schnittstellen zu anderen Systemen.',
						'Applications, case handling, interfaces to other systems.'
					)
				},
				{
					id: 'ebene3',
					type: 'textarea',
					label: L('Ebene 3: Infrastruktur', 'Level 3: infrastructure'),
					help: L(
						'Betriebssysteme, Datenbanken, Netze, Authentisierungsdienste, Speicher.',
						'Operating systems, databases, networks, authentication services, storage.'
					)
				}
			]
		},
		...ZIELE.map((z) => goal(z.id, z.title)),
		{
			id: 'pruefung',
			title: L('Prüfung', 'Review'),
			fields: [
				{
					id: 'verantwortlich',
					type: 'text',
					label: L('Verantwortlich', 'Responsible'),
					listColumn: true
				},
				{ id: 'geprueft_am', type: 'date', label: L('Geprüft am', 'Reviewed on') },
				{
					id: 'status',
					type: 'select',
					label: L('Status', 'Status'),
					options: [
						{ value: 'entwurf', label: L('Entwurf', 'Draft') },
						{ value: 'in_pruefung', label: L('In Prüfung', 'Under review') },
						{ value: 'abgeschlossen', label: L('Abgeschlossen', 'Completed') }
					],
					listColumn: true
				},
				{
					id: 'wiedervorlage',
					type: 'date',
					label: L('Wiedervorlage', 'Next review'),
					cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. d' }
				}
			]
		}
	]
};
