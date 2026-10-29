import type { FieldDef, RecordToolDefinition } from '../../records/types.js';
import type { Localized } from '../types.js';

const L = (de: string, en: string) => ({ de, en });

/** one Art. 28(3) clause: a yes/no field citing its letter */
function clause(id: string, ref: string, label: Localized): FieldDef {
	return { id, type: 'boolean', label, cite: { law: 'DSGVO', ref } };
}

/** the clauses Art. 28(3) requires, in the order of the provision */
export const CLAUSES: FieldDef[] = [
	clause(
		'grundlagen',
		'Art. 28 Abs. 3 Satz 1',
		L(
			'Gegenstand, Dauer, Art und Zweck, Datenarten, Kategorien Betroffener sowie Rechte und Pflichten des Verantwortlichen sind festgelegt',
			'Subject matter, duration, nature and purpose, types of data, categories of data subjects and the controller’s rights and obligations are set out'
		)
	),
	clause(
		'lit_a',
		'Art. 28 Abs. 3 lit. a',
		L(
			'Verarbeitung nur auf dokumentierte Weisung, auch bei Übermittlungen in Drittländer',
			'Processing only on documented instructions, including transfers to third countries'
		)
	),
	clause(
		'lit_b',
		'Art. 28 Abs. 3 lit. b',
		L(
			'Die befugten Personen sind zur Vertraulichkeit verpflichtet',
			'Authorised persons are committed to confidentiality'
		)
	),
	clause(
		'lit_c',
		'Art. 28 Abs. 3 lit. c',
		L('Maßnahmen nach Art. 32 sind vereinbart', 'Measures under Art. 32 are agreed')
	),
	clause(
		'lit_d',
		'Art. 28 Abs. 3 lit. d',
		L(
			'Unterauftragsverarbeiter nur unter den Bedingungen des Art. 28 Abs. 2 und 4',
			'Sub-processors only under the conditions of Art. 28(2) and (4)'
		)
	),
	clause(
		'lit_e',
		'Art. 28 Abs. 3 lit. e',
		L('Unterstützung bei Anträgen betroffener Personen', 'Assistance with data subject requests')
	),
	clause(
		'lit_f',
		'Art. 28 Abs. 3 lit. f',
		L(
			'Unterstützung bei Sicherheit, Meldungen von Datenpannen und DSFA (Art. 32 bis 36)',
			'Assistance with security, breach notifications and DPIA (Art. 32 to 36)'
		)
	),
	clause(
		'lit_g',
		'Art. 28 Abs. 3 lit. g',
		L(
			'Löschung oder Rückgabe aller Daten nach Ende der Leistungen',
			'Deletion or return of all data after the end of the services'
		)
	),
	clause(
		'lit_h',
		'Art. 28 Abs. 3 lit. h',
		L(
			'Nachweise und Überprüfungen einschließlich Inspektionen werden ermöglicht',
			'Information and audits, including inspections, are made possible'
		)
	)
];

/** a processor contract: one record per processor and service */
export const definition: RecordToolDefinition = {
	slug: 'avv-pruefung',
	version: 2,
	intro: L(
		'Ein Eintrag je Auftragsverarbeiter und Leistung. Die Prüfliste folgt Art. 28 Abs. 3 DSGVO; nicht erfüllte Punkte erscheinen mit ihrem Buchstaben im Ergebnis. Mit Wiedervorlage wird der Vertrag zur Frist.',
		'One entry per processor and service. The checklist follows Art. 28(3) GDPR; clauses not met appear with their letter in the result. A review date turns the contract into a deadline.'
	),
	sources: [
		{ law: 'DSGVO', ref: 'Art. 28' },
		{ law: 'EDPB', ref: 'Leitlinien 07/2020' }
	],
	titleField: 'dienstleister',
	sections: [
		{
			id: 'vertrag',
			title: L('Auftragsverarbeiter und Leistung', 'Processor and service'),
			fields: [
				{
					id: 'dienstleister',
					type: 'text',
					label: L('Auftragsverarbeiter', 'Processor'),
					required: true,
					listColumn: true
				},
				{
					id: 'vvt',
					type: 'reference',
					tool: 'vvt',
					label: L('Verarbeitungstätigkeit im VVT', 'Processing activity in the record'),
					help: L(
						'Die Verarbeitungstätigkeit, für die der Auftragsverarbeiter eingesetzt wird.',
						'The processing activity the processor is engaged for.'
					)
				},
				{
					id: 'leistung',
					type: 'textarea',
					label: L(
						'Leistung und Gegenstand der Verarbeitung',
						'Service and subject matter of the processing'
					),
					required: true
				},
				{
					id: 'verarbeitungen',
					type: 'text',
					label: L('Betroffene Verarbeitungstätigkeiten', 'Processing activities concerned')
				},
				{
					id: 'vertragsart',
					type: 'select',
					label: L('Vertragsgrundlage', 'Contract basis'),
					options: [
						{ value: 'eigen', label: L('Eigener Vertrag', 'Own contract') },
						{
							value: 'anbieter',
							label: L('Vertrag des Auftragsverarbeiters', 'Processor’s contract')
						},
						{
							value: 'scc',
							label: L(
								'EU-Standardvertragsklauseln nach Art. 28 Abs. 7',
								'EU standard contractual clauses under Art. 28(7)'
							)
						}
					],
					cite: { law: 'DSGVO', ref: 'Art. 28 Abs. 3, 7' }
				},
				{ id: 'vertragsdatum', type: 'date', label: L('Vertrag vom', 'Contract dated') },
				{
					id: 'sitz',
					type: 'select',
					label: L('Verarbeitungsort', 'Place of processing'),
					options: [
						{ value: 'eu', label: L('EU/EWR', 'EU/EEA') },
						{ value: 'drittland', label: L('Auch in Drittländern', 'Also in third countries') }
					],
					listColumn: true
				},
				{
					id: 'drittland_details',
					type: 'textarea',
					label: L(
						'Drittländer und Grundlage der Übermittlung',
						'Third countries and transfer basis'
					),
					cite: { law: 'DSGVO', ref: 'Art. 44' }
				},
				{
					id: 'besondere_kategorien',
					type: 'boolean',
					label: L(
						'Besondere Kategorien personenbezogener Daten betroffen',
						'Special categories of personal data involved'
					),
					cite: { law: 'DSGVO', ref: 'Art. 9 Abs. 1' }
				}
			]
		},
		{
			id: 'pruefliste',
			title: L('Prüfliste Art. 28 Abs. 3', 'Checklist Art. 28(3)'),
			intro: L(
				'„Ja“, wenn der Vertrag die Pflicht ausdrücklich regelt; offen lassen, solange nicht geprüft.',
				'"Yes" if the contract covers the obligation expressly; leave open while not yet checked.'
			),
			fields: [
				...CLAUSES,
				{
					id: 'meldung_pannen',
					type: 'boolean',
					label: L(
						'Datenpannen werden unverzüglich gemeldet',
						'Breaches are reported without undue delay'
					),
					cite: { law: 'DSGVO', ref: 'Art. 33 Abs. 2' }
				}
			]
		},
		{
			id: 'unterauftrag',
			title: L('Unterauftragsverarbeiter', 'Sub-processors'),
			fields: [
				{
					id: 'genehmigung',
					type: 'select',
					label: L('Genehmigung', 'Authorisation'),
					options: [
						{ value: 'keine', label: L('Keine Unterauftragsverarbeiter', 'No sub-processors') },
						{ value: 'einzeln', label: L('Gesonderte Genehmigung', 'Specific authorisation') },
						{ value: 'allgemein', label: L('Allgemeine Genehmigung', 'General authorisation') }
					],
					cite: { law: 'DSGVO', ref: 'Art. 28 Abs. 2' }
				},
				{
					id: 'einspruch',
					type: 'boolean',
					label: L(
						'Information über Änderungen und Einspruchsrecht vereinbart',
						'Information on changes and right to object agreed'
					),
					cite: { law: 'DSGVO', ref: 'Art. 28 Abs. 2 Satz 2' }
				},
				{
					id: 'unterauftragnehmer',
					type: 'textarea',
					label: L('Unterauftragsverarbeiter im Einzelnen', 'Sub-processors in detail')
				}
			]
		},
		{
			id: 'status',
			title: L('Garantien und Status', 'Guarantees and status'),
			fields: [
				{
					id: 'garantien',
					type: 'select',
					label: L('Nachweis hinreichender Garantien', 'Evidence of sufficient guarantees'),
					options: [
						{
							value: 'zertifikat',
							label: L(
								'Zertifizierung (z. B. ISO 27001, Art. 42)',
								'Certification (e.g. ISO 27001, Art. 42)'
							)
						},
						{
							value: 'testat',
							label: L(
								'Prüfbericht oder Testat (z. B. ISAE 3402, C5)',
								'Audit report or attestation (e.g. ISAE 3402, C5)'
							)
						},
						{ value: 'audit', label: L('Eigene Prüfung vor Ort', 'Own on-site audit') },
						{ value: 'selbstauskunft', label: L('Selbstauskunft', 'Self-assessment') },
						{ value: 'keiner', label: L('Kein Nachweis', 'No evidence') }
					],
					cite: { law: 'DSGVO', ref: 'Art. 28 Abs. 1, 5' }
				},
				{
					id: 'status',
					type: 'select',
					label: L('Status', 'Status'),
					options: [
						{ value: 'pruefung', label: L('In Prüfung', 'Under review') },
						{
							value: 'nachbesserung',
							label: L('Nachbesserung angefordert', 'Amendment requested')
						},
						{ value: 'freigegeben', label: L('Freigegeben', 'Approved') },
						{ value: 'beendet', label: L('Beendet', 'Ended') }
					],
					required: true,
					listColumn: true
				},
				{ id: 'wiedervorlage', type: 'date', label: L('Wiedervorlage', 'Next review') },
				{ id: 'notizen', type: 'textarea', label: L('Notizen', 'Notes') }
			]
		}
	]
};
