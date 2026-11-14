import type { RecordToolDefinition } from '../../records/types.js';

const L = (de: string, en: string) => ({ de, en });

/** data protection training: one record per session or e-learning campaign */
export const definition: RecordToolDefinition = {
	slug: 'schulungsnachweis',
	version: 1,
	intro: L(
		'Ein Eintrag je Schulung oder E-Learning-Kampagne, auch zur KI-Kompetenz nach Art. 4 KI-VO. Die Wiederholung wird zur Frist. Schulungen gehören zu den Aufgaben des Datenschutzbeauftragten (Art. 39 Abs. 1 lit. b DSGVO) und belegen, dass Beschäftigte nur auf Weisung verarbeiten (Art. 32 Abs. 4).',
		'One entry per training session or e-learning campaign, also on AI literacy under Art. 4 AI Act. The repetition becomes a deadline. Training is among the tasks of the data protection officer (Art. 39(1)(b) GDPR) and evidences that staff process only on instructions (Art. 32(4)).'
	),
	sources: [
		{ law: 'DSGVO', ref: 'Art. 39 Abs. 1 lit. b' },
		{ law: 'DSGVO', ref: 'Art. 32 Abs. 4' },
		{ law: 'DSGVO', ref: 'Art. 5 Abs. 2' },
		{ law: 'KI-VO', ref: 'Art. 4, Art. 26 Abs. 2' }
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
					integer: true,
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
					integer: true,
					label: L('Wiederholung nach', 'Repeat after'),
					unit: L('Monaten', 'months'),
					min: 1,
					help: L('Üblich sind 12 bis 24 Monate.', 'Usually 12 to 24 months.')
				},
				{ id: 'notizen', type: 'textarea', label: L('Notizen', 'Notes') }
			]
		},
		{
			id: 'ki',
			title: L('KI-Kompetenz (Art. 4 KI-VO)', 'AI literacy (Art. 4 AI Act)'),
			intro: L(
				'Wenn die Schulung den Umgang mit KI behandelt: Inhalte und Tiefe richten sich nach der Rolle, den Vorkenntnissen und dem Einsatz. Wer Hochrisiko-Systeme beaufsichtigt, braucht die Kompetenz ausdrücklich (Art. 26 Abs. 2).',
				'When the training covers AI: content and depth follow the role, prior knowledge and use. Whoever oversees high-risk systems needs the competence expressly (Art. 26(2)).'
			),
			when: (data) => Array.isArray(data.themen) && data.themen.includes('ki'),
			fields: [
				{
					id: 'ki_befassung',
					type: 'select',
					label: L('Art der Befassung mit KI', 'Kind of involvement with AI'),
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
					cite: { law: 'KI-VO', ref: 'Art. 4' }
				},
				{
					id: 'ki_systeme',
					type: 'textarea',
					label: L('Genutzte KI-Systeme', 'AI systems used'),
					help: L('Bezeichnungen wie im KI-Register.', 'Names as in the AI system register.')
				},
				{
					id: 'ki_vorkenntnisse',
					type: 'select',
					label: L('Vorkenntnisse', 'Prior knowledge'),
					options: [
						{ value: 'keine', label: L('Keine', 'None') },
						{ value: 'grundlagen', label: L('Grundlagen', 'Basic') },
						{ value: 'fortgeschritten', label: L('Fortgeschritten', 'Advanced') }
					]
				},
				{
					id: 'ki_inhalte',
					type: 'multiselect',
					label: L('KI-Inhalte', 'AI content'),
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
					id: 'ki_kontext',
					type: 'textarea',
					label: L('Einsatzkontext und betroffene Personen', 'Context of use and persons affected'),
					cite: { law: 'KI-VO', ref: 'Art. 4' }
				}
			]
		}
	],
	example: {
		titel: 'Datenschutz-Grundschulung 2026 (Beispiel)',
		themen: ['grundlagen', 'phishing', 'pannen', 'betroffenenrechte', 'ki'],
		datum: '2026-09-15',
		form: 'online',
		referent: 'Datenschutzbeauftragte',
		zielgruppe: 'Alle Beschäftigten der Verwaltung',
		anzahl: 42,
		nachweis: 'liste',
		vertraulichkeit: true,
		wiederholung_monate: 12,
		ki_befassung: 'anwendung',
		ki_inhalte: ['risiken', 'daten']
	}
};
