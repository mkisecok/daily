import type { RecordToolDefinition } from '../../records/types.js';

const L = (de: string, en: string) => ({ de, en });

/**
 * the audit report: own conclusions plus, composed on the record page, the
 * audit with its checklists and findings. Printing the record gives the
 * complete report.
 */
export const definition: RecordToolDefinition = {
	slug: 'auditbericht',
	version: 1,
	intro: L(
		'Ein Bericht je Audit. Zusammenfassung, Gesamturteil und Empfehlungen stehen hier; das verknüpfte Audit mit Prüfkatalog und Feststellungen wird auf der Berichtsseite angefügt. Die Druckfassung ist der vollständige Bericht.',
		'One report per audit. Summary, overall conclusion and recommendations are written here; the linked audit with its checklists and findings is appended on the report page. The print version is the complete report.'
	),
	sources: [
		{ law: 'ISO 27001', ref: 'Kap. 9.2.2' },
		{ law: 'ISO 42001', ref: 'Kap. 9.2' }
	],
	titleField: 'titel',
	composes: ['audit'],
	sections: [
		{
			id: 'bericht',
			title: L('Bericht', 'Report'),
			fields: [
				{ id: 'titel', type: 'text', label: L('Titel', 'Title'), required: true, listColumn: true },
				{
					id: 'audit',
					type: 'reference',
					tool: 'auditprogramm',
					label: L('Audit', 'Audit'),
					required: true,
					listColumn: true
				},
				{
					id: 'zusammenfassung',
					type: 'textarea',
					label: L('Zusammenfassung', 'Summary'),
					required: true,
					help: L(
						'Für die Leitung geschrieben: Umfang, Gesamturteil und die wichtigsten Abweichungen in wenigen Absätzen.',
						'Written for management: scope, overall conclusion and the main nonconformities in a few paragraphs.'
					)
				},
				{
					id: 'gesamturteil',
					type: 'select',
					label: L('Gesamturteil', 'Overall conclusion'),
					options: [
						{ value: 'konform', label: L('Anforderungen erfüllt', 'Requirements met') },
						{
							value: 'abweichungen',
							label: L('Erfüllt mit Abweichungen', 'Met with nonconformities')
						},
						{
							value: 'nicht_konform',
							label: L('Wesentliche Anforderungen nicht erfüllt', 'Essential requirements not met')
						}
					],
					listColumn: true,
					help: L(
						'Das Urteil ergibt sich aus den Feststellungen und wird in der Zusammenfassung begründet.',
						'The conclusion follows from the findings and is explained in the summary.'
					)
				},
				{
					id: 'staerken',
					type: 'textarea',
					label: L('Stärken', 'Strengths'),
					help: L(
						'Was gut funktioniert. Das macht den Bericht ausgewogen und hilft, Gutes auf andere Bereiche zu übertragen.',
						'What works well. It makes the report balanced and helps carry good practice to other areas.'
					)
				},
				{
					id: 'empfehlungen',
					type: 'textarea',
					label: L('Empfehlungen', 'Recommendations'),
					help: L(
						'Verbesserungen ohne Abweichung. Abweichungen gehören in die Feststellungen.',
						'Improvements without a nonconformity. Nonconformities belong in the findings.'
					)
				}
			]
		},
		{
			id: 'freigabe',
			title: L('Verteilung und Freigabe', 'Distribution and approval'),
			fields: [
				{
					id: 'verteiler',
					type: 'text',
					label: L('Verteiler', 'Distribution'),
					help: L(
						'Wer den Bericht erhält, etwa Leitung, geprüfter Bereich und Datenschutzbeauftragte. Der Bericht kann vertrauliche Angaben enthalten.',
						'Who receives the report, for example management, the audited area and the DPO. The report may contain confidential details.'
					)
				},
				{
					id: 'erstellt_am',
					type: 'date',
					label: L('Erstellt am', 'Written on'),
					listColumn: true
				},
				{ id: 'freigegeben_von', type: 'text', label: L('Freigegeben von', 'Approved by') },
				{ id: 'freigegeben_am', type: 'date', label: L('Freigegeben am', 'Approved on') }
			]
		}
	]
};
