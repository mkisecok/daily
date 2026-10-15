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
					required: true
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
					listColumn: true
				},
				{ id: 'staerken', type: 'textarea', label: L('Stärken', 'Strengths') },
				{ id: 'empfehlungen', type: 'textarea', label: L('Empfehlungen', 'Recommendations') }
			]
		},
		{
			id: 'freigabe',
			title: L('Verteilung und Freigabe', 'Distribution and approval'),
			fields: [
				{ id: 'verteiler', type: 'text', label: L('Verteiler', 'Distribution') },
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
