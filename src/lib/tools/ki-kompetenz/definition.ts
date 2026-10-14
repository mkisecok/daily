import type { RecordToolDefinition } from '../../records/types.js';

const L = (de: string, en: string) => ({ de, en });

/** AI literacy per role or group of people: what they use, what they learn, when. */
export const definition: RecordToolDefinition = {
	slug: 'ki-kompetenz',
	version: 1,
	intro: L(
		'Ein Eintrag je Rolle oder Personengruppe, die KI-Systeme bedient oder verantwortet. Inhalte und Tiefe richten sich nach Vorkenntnissen, Einsatzkontext und den Personen, die von den Ergebnissen betroffen sind (Art. 4 KI-VO). Für Personen mit menschlicher Aufsicht über Hochrisiko-Systeme verlangt Art. 26 Abs. 2 die nötige Kompetenz ausdrücklich.',
		'One entry per role or group of people operating or responsible for AI systems. Content and depth depend on prior knowledge, the context of use and the persons affected by the outputs (Art. 4 AI Act). For persons overseeing high-risk systems, Art. 26(2) expressly requires the necessary competence.'
	),
	sources: [
		{ law: 'KI-VO', ref: 'Art. 4' },
		{ law: 'KI-VO', ref: 'Art. 26 Abs. 2' },
		{ law: 'KI-VO', ref: 'Art. 3 Nr. 56' }
	],
	titleField: 'rolle',
	sections: [
		{
			id: 'rolle',
			title: L('Rolle und Einsatz', 'Role and use'),
			fields: [
				{
					id: 'rolle',
					type: 'text',
					label: L('Rolle oder Personengruppe', 'Role or group of people'),
					help: L(
						'Z. B. „Sachbearbeitung Personal“, „Entwicklung Datenplattform“.',
						'E.g. "HR clerks", "Data platform developers".'
					),
					required: true,
					listColumn: true
				},
				{
					id: 'nutzung',
					type: 'select',
					label: L('Art der Befassung', 'Kind of involvement'),
					options: [
						{ value: 'anwendung', label: L('Nutzung im Arbeitsalltag', 'Everyday use') },
						{
							value: 'aufsicht',
							label: L(
								'Menschliche Aufsicht über Hochrisiko-Systeme',
								'Human oversight of high-risk systems'
							)
						},
						{
							value: 'entwicklung',
							label: L('Entwicklung oder Anpassung', 'Development or adaptation')
						},
						{
							value: 'leitung',
							label: L('Leitung, Beschaffung, Freigabe', 'Management, procurement, approval')
						}
					],
					required: true,
					listColumn: true
				},
				{
					id: 'ki_systeme',
					type: 'textarea',
					label: L('Genutzte KI-Systeme', 'AI systems used'),
					help: L('Bezeichnungen wie im KI-Register.', 'Names as in the AI system register.')
				},
				{
					id: 'vorkenntnisse',
					type: 'select',
					label: L('Vorkenntnisse', 'Prior knowledge'),
					options: [
						{ value: 'keine', label: L('Keine', 'None') },
						{ value: 'grundlagen', label: L('Grundlagen', 'Basic') },
						{ value: 'fortgeschritten', label: L('Fortgeschritten', 'Advanced') }
					]
				},
				{
					id: 'kontext',
					type: 'textarea',
					label: L('Einsatzkontext und betroffene Personen', 'Context of use and persons affected'),
					cite: { law: 'KI-VO', ref: 'Art. 4' }
				}
			]
		},
		{
			id: 'massnahme',
			title: L('Maßnahme', 'Measure'),
			fields: [
				{
					id: 'inhalte',
					type: 'multiselect',
					label: L('Inhalte', 'Content'),
					options: [
						{
							value: 'funktionsweise',
							label: L('Funktionsweise und Grenzen', 'How it works and its limits')
						},
						{
							value: 'risiken',
							label: L(
								'Fehler, Verzerrungen, erfundene Inhalte',
								'Errors, bias, fabricated content'
							)
						},
						{
							value: 'daten',
							label: L(
								'Umgang mit vertraulichen und personenbezogenen Daten',
								'Handling confidential and personal data'
							)
						},
						{
							value: 'richtlinie',
							label: L('Interne KI-Nutzungsrichtlinie', 'Internal AI usage policy')
						},
						{
							value: 'aufsicht',
							label: L('Menschliche Aufsicht und Eingreifen', 'Human oversight and intervention')
						},
						{ value: 'recht', label: L('KI-Verordnung und DSGVO', 'AI Act and GDPR') },
						{
							value: 'urheberrecht',
							label: L('Urheberrecht und Kennzeichnung', 'Copyright and labelling')
						}
					]
				},
				{
					id: 'form',
					type: 'select',
					label: L('Form', 'Format'),
					options: [
						{ value: 'schulung', label: L('Schulung', 'Training') },
						{ value: 'elearning', label: L('E-Learning', 'E-learning') },
						{
							value: 'workshop',
							label: L('Workshop mit Praxisfällen', 'Workshop with practical cases')
						},
						{ value: 'anleitung', label: L('Schriftliche Anleitung', 'Written guidance') }
					]
				},
				{
					id: 'anzahl',
					type: 'number',
					label: L('Anzahl Personen', 'Number of people'),
					unit: L('Personen', 'persons'),
					min: 0
				},
				{
					id: 'status',
					type: 'select',
					label: L('Status', 'Status'),
					options: [
						{ value: 'geplant', label: L('Geplant', 'Planned') },
						{ value: 'durchgefuehrt', label: L('Durchgeführt', 'Done') }
					],
					required: true,
					listColumn: true
				},
				{
					id: 'durchgefuehrt_am',
					type: 'date',
					label: L('Durchgeführt am', 'Done on'),
					listColumn: true
				},
				{
					id: 'nachweis',
					type: 'select',
					label: L('Nachweis', 'Evidence'),
					options: [
						{ value: 'liste', label: L('Teilnehmerliste', 'Attendance list') },
						{
							value: 'system',
							label: L('Abschluss im Lernsystem', 'Completion in the learning system')
						},
						{ value: 'test', label: L('Bestandener Test', 'Passed test') },
						{ value: 'keiner', label: L('Kein Nachweis', 'No evidence') }
					]
				},
				{
					id: 'wiederholung_monate',
					type: 'number',
					label: L('Auffrischung nach', 'Refresh after'),
					unit: L('Monaten', 'months'),
					min: 1
				},
				{ id: 'notizen', type: 'textarea', label: L('Notizen', 'Notes') }
			]
		}
	]
};
