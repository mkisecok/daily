import type { RecordToolDefinition } from '../../records/types.js';

const L = (de: string, en: string) => ({ de, en });

/** data protection training: one record per session or e-learning campaign */
export const definition: RecordToolDefinition = {
	slug: 'schulungsnachweis',
	version: 1,
	intro: L(
		'Ein Eintrag je Schulung oder E-Learning-Kampagne. Die Wiederholung wird zur Frist. Schulungen gehören zu den Aufgaben des Datenschutzbeauftragten (Art. 39 Abs. 1 lit. b DSGVO) und belegen, dass Beschäftigte nur auf Weisung verarbeiten (Art. 32 Abs. 4).',
		'One entry per training session or e-learning campaign. The repetition becomes a deadline. Training is among the tasks of the data protection officer (Art. 39(1)(b) GDPR) and evidences that staff process only on instructions (Art. 32(4)).'
	),
	sources: [
		{ law: 'DSGVO', ref: 'Art. 39 Abs. 1 lit. b' },
		{ law: 'DSGVO', ref: 'Art. 32 Abs. 4' },
		{ law: 'DSGVO', ref: 'Art. 5 Abs. 2' }
	],
	titleField: 'titel',
	sections: [
		{
			id: 'schulung',
			title: L('Schulung', 'Training'),
			fields: [
				{ id: 'titel', type: 'text', label: L('Titel', 'Title'), required: true, listColumn: true },
				{
					id: 'themen',
					type: 'multiselect',
					label: L('Themen', 'Topics'),
					options: [
						{ value: 'grundlagen', label: L('Datenschutz-Grundlagen', 'Data protection basics') },
						{ value: 'sicherheit', label: L('Informationssicherheit', 'Information security') },
						{
							value: 'phishing',
							label: L('Phishing und Social Engineering', 'Phishing and social engineering')
						},
						{
							value: 'pannen',
							label: L('Datenpannen erkennen und melden', 'Recognising and reporting breaches')
						},
						{
							value: 'betroffenenrechte',
							label: L('Anfragen Betroffener', 'Data subject requests')
						},
						{
							value: 'fachbereich',
							label: L('Fachspezifische Verarbeitungen', 'Department-specific processing')
						},
						{ value: 'ki', label: L('Umgang mit KI-Systemen', 'Using AI systems') }
					]
				},
				{ id: 'datum', type: 'date', label: L('Datum', 'Date'), required: true, listColumn: true },
				{
					id: 'form',
					type: 'select',
					label: L('Form', 'Format'),
					options: [
						{ value: 'praesenz', label: L('Präsenz', 'In person') },
						{ value: 'online', label: L('Online-Seminar', 'Online seminar') },
						{ value: 'elearning', label: L('E-Learning', 'E-learning') },
						{
							value: 'unterweisung',
							label: L('Unterweisung am Arbeitsplatz', 'Briefing at the workplace')
						}
					]
				},
				{ id: 'referent', type: 'text', label: L('Durchgeführt von', 'Delivered by') }
			]
		},
		{
			id: 'teilnahme',
			title: L('Teilnahme und Nachweis', 'Attendance and evidence'),
			fields: [
				{
					id: 'zielgruppe',
					type: 'text',
					label: L('Zielgruppe', 'Target group'),
					listColumn: true
				},
				{
					id: 'teilnehmende',
					type: 'textarea',
					label: L('Teilnehmende', 'Participants'),
					help: L(
						'Namen oder Verweis auf die Teilnehmerliste.',
						'Names or reference to the attendance list.'
					)
				},
				{
					id: 'anzahl',
					type: 'number',
					label: L('Anzahl', 'Number'),
					unit: L('Personen', 'persons'),
					min: 0,
					listColumn: true
				},
				{
					id: 'nachweis',
					type: 'select',
					label: L('Nachweis', 'Evidence'),
					options: [
						{
							value: 'liste',
							label: L('Unterschriebene Teilnehmerliste', 'Signed attendance list')
						},
						{
							value: 'system',
							label: L('Abschluss im Lernsystem', 'Completion in the learning system')
						},
						{ value: 'test', label: L('Bestandener Test', 'Passed test') },
						{ value: 'keiner', label: L('Kein Nachweis', 'No evidence') }
					],
					cite: { law: 'DSGVO', ref: 'Art. 5 Abs. 2' }
				},
				{
					id: 'vertraulichkeit',
					type: 'boolean',
					label: L(
						'Verpflichtung auf Vertraulichkeit erfolgt',
						'Confidentiality undertaking given'
					),
					cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 4' }
				},
				{
					id: 'wiederholung_monate',
					type: 'number',
					label: L('Wiederholung nach', 'Repeat after'),
					unit: L('Monaten', 'months'),
					min: 1,
					help: L('Üblich sind 12 bis 24 Monate.', 'Usually 12 to 24 months.')
				},
				{ id: 'notizen', type: 'textarea', label: L('Notizen', 'Notes') }
			]
		}
	]
};
