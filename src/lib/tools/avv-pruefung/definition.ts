import { checkFields } from '../../records/checks.js';
import type { FieldDef, RecordData, RecordToolDefinition } from '../../records/types.js';
import type { Localized } from '../types.js';

const L = (de: string, en: string) => ({ de, en });

/**
 * one Art. 28(3) clause: a checklist point citing its letter. Every clause
 * is required by law, so none can be "not applicable".
 */
function clause(id: string, ref: string, label: Localized): FieldDef & { type: 'check' } {
	return { id, type: 'check', label, cite: { law: 'DSGVO', ref }, na: false };
}

/** the clauses Art. 28(3) requires, in the order of the provision */
export const CLAUSES: (FieldDef & { type: 'check' })[] = [
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
	),
	clause(
		'hinweis',
		'Art. 28 Abs. 3 UAbs. 2',
		L(
			'Unverzüglicher Hinweis, wenn eine Weisung gegen Datenschutzrecht verstößt',
			'Immediate notice if an instruction infringes data protection law'
		)
	)
];

/** sub-processors are allowed, with either kind of authorisation */
const subProcessors = (data: RecordData) =>
	data.genehmigung === 'einzeln' || data.genehmigung === 'allgemein';

/** a processor contract: one record per processor and service */
export const definition: RecordToolDefinition = {
	slug: 'avv-pruefung',
	version: 3,
	intro: L(
		'Ein Eintrag je Auftragsverarbeiter und Leistung. Die Prüfliste folgt Art. 28 Abs. 3 DSGVO; nicht erfüllte Punkte erscheinen mit ihrem Buchstaben im Ergebnis. Mit Wiedervorlage wird der Vertrag zur Frist. Steuerberater, Rechtsanwälte, Banken und Postdienste entscheiden in der Regel selbst über die Daten und sind keine Auftragsverarbeiter; für sie ist kein AVV nötig (DSK-Kurzpapier Nr. 13).',
		'One entry per processor and service. The checklist follows Art. 28(3) GDPR; clauses not met appear with their letter in the result. A review date turns the contract into a deadline. Tax advisers, lawyers, banks and postal services usually decide on the data themselves and are not processors; they need no processor contract (DSK Kurzpapier Nr. 13).'
	),
	sources: [
		{ law: 'DSGVO', ref: 'Art. 28' },
		{ law: 'EDPB', ref: 'Leitlinien 07/2020' },
		{ law: 'EDPB', ref: 'Stellungnahme 22/2024' },
		{ law: 'DSK', ref: 'Kurzpapier Nr. 13' }
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
					cite: { law: 'DSGVO', ref: 'Art. 44' },
					when: (data) => data.sitz === 'drittland'
				},
				{
					id: 'transfer_check',
					type: 'assessment',
					tool: 'drittland-transfer',
					label: L('Drittlandprüfung', 'Third-country transfer check'),
					when: (data) => data.sitz === 'drittland'
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
				...CLAUSES.flatMap((c) =>
					checkFields({ id: c.id, label: c.label, cite: c.cite, na: false })
				),
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
					cite: { law: 'DSGVO', ref: 'Art. 28 Abs. 2 Satz 2' },
					when: (data) => data.genehmigung === 'allgemein'
				},
				{
					id: 'gleiche_pflichten',
					type: 'boolean',
					label: L(
						'Unterauftragsverarbeitern werden dieselben Pflichten auferlegt; der Auftragsverarbeiter haftet für sie',
						'Sub-processors take on the same obligations; the processor remains liable for them'
					),
					cite: { law: 'DSGVO', ref: 'Art. 28 Abs. 4' },
					when: subProcessors
				},
				{
					id: 'unterauftragnehmer',
					type: 'textarea',
					label: L('Unterauftragsverarbeiter im Einzelnen', 'Sub-processors in detail'),
					help: L(
						'Name, Sitz und Leistung jedes Unterauftragsverarbeiters, auch weiter unten in der Kette.',
						'Name, location and service of every sub-processor, including further down the chain.'
					),
					cite: { law: 'EDPB', ref: 'Stellungnahme 22/2024' },
					when: subProcessors
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
					id: 'nachweis_bis',
					type: 'date',
					label: L('Nachweis gültig bis', 'Evidence valid until'),
					help: L(
						'Zertifikate und Prüfberichte laufen ab; das Datum wird zur Frist.',
						'Certificates and audit reports expire; the date becomes a deadline.'
					),
					when: (data) => data.garantien === 'zertifikat' || data.garantien === 'testat'
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
				{
					id: 'loeschbestaetigung',
					type: 'boolean',
					label: L(
						'Löschung oder Rückgabe der Daten bestätigt',
						'Deletion or return of the data confirmed'
					),
					cite: { law: 'DSGVO', ref: 'Art. 28 Abs. 3 lit. g' },
					when: (data) => data.status === 'beendet'
				},
				{ id: 'geprueft_am', type: 'date', label: L('Zuletzt geprüft', 'Last reviewed') },
				{
					id: 'wiedervorlage',
					type: 'date',
					label: L('Wiedervorlage', 'Next review'),
					listColumn: true
				},
				{ id: 'notizen', type: 'textarea', label: L('Notizen', 'Notes') }
			]
		}
	],
	example: {
		dienstleister: 'Lohnbüro Muster GmbH (Beispiel)',
		leistung:
			'Lohn- und Gehaltsabrechnung für alle Beschäftigten, Meldungen an Finanzamt und Sozialversicherung.',
		verarbeitungen: 'Lohn- und Gehaltsabrechnung',
		vertragsart: 'anbieter',
		vertragsdatum: '2024-03-01',
		sitz: 'eu',
		besondere_kategorien: true,
		grundlagen: 'ja',
		lit_a: 'ja',
		lit_b: 'ja',
		lit_c: 'ja',
		lit_d: 'nein',
		lit_d_notiz:
			'Der Vertrag erlaubt Unterauftragnehmer pauschal, ohne Information über Änderungen.',
		lit_g: 'ja',
		hinweis: 'ja',
		meldung_pannen: true,
		genehmigung: 'allgemein',
		einspruch: false,
		gleiche_pflichten: true,
		garantien: 'selbstauskunft',
		status: 'nachbesserung',
		geprueft_am: '2026-09-01',
		wiedervorlage: '2026-12-15'
	}
};
