import type { RecordTool, RecordToolDefinition } from '../records/types.js';

const L = (de: string, en: string) => ({ de, en });

export const ORGANISATION = 'organisation';

/**
 * the organisation's own details that training modules and the documents
 * Daily drafts show: one entry per organisation, kept by the records store like notes, so it is scoped to
 * the active organisation and lives in the browser in the preview. Not a
 * tool of the catalogue. Only details a module or a document uses belong
 * here.
 */
export const definition: RecordToolDefinition = {
	slug: ORGANISATION,
	version: 1,
	intro: L(
		'Die Angaben, die in Schulungen, Handouts und Schreiben wie den Datenschutzhinweisen erscheinen. Sie gelten für die ganze Organisation und werden nur einmal eingetragen.',
		'The details that appear in training sessions, handouts and documents such as privacy notices. They apply to the whole organisation and are entered once.'
	),
	sources: [],
	titleField: 'meldeweg',
	sections: [
		{
			id: 'angaben',
			title: L('Angaben für Schulungen und Schreiben', 'Details for training and documents'),
			fields: [
				{
					id: 'meldeweg',
					type: 'textarea',
					label: L('Meldeweg für Datenpannen', 'Reporting channel for breaches'),
					help: L(
						'Wie Beschäftigte eine Panne oder einen Verdacht melden, z. B. „datenpanne@beispiel.de oder Telefon 0711 123-99“.',
						'How staff report a breach or a suspicion, e.g. "breach@example.com or phone 0711 123-99".'
					),
					cite: { law: 'DSGVO', ref: 'Art. 33 Abs. 1' }
				},
				{
					id: 'dsb',
					type: 'textarea',
					label: L('Datenschutzbeauftragte: Kontakt', 'Data protection officer: contact'),
					help: L('Name, Telefon und E-Mail.', 'Name, phone and e-mail.'),
					cite: { law: 'DSGVO', ref: 'Art. 37 Abs. 7' }
				},
				{
					id: 'anschrift',
					type: 'textarea',
					label: L('Anschrift des Verantwortlichen', 'Address of the controller'),
					help: L(
						'Postanschrift und eine allgemeine Kontaktadresse, z. B. „Musterstraße 1, 70173 Stuttgart, info@beispiel.de“. Steht in den Datenschutzhinweisen.',
						'Postal address and a general contact, e.g. "Musterstraße 1, 70173 Stuttgart, info@example.com". Appears in privacy notices.'
					),
					cite: { law: 'DSGVO', ref: 'Art. 13 Abs. 1 lit. a' }
				},
				{
					id: 'ki',
					type: 'textarea',
					label: L('Freigegebene KI-Werkzeuge', 'Approved AI tools'),
					help: L(
						'Welche KI-Werkzeuge Beschäftigte dienstlich nutzen dürfen und wo die KI-Nutzungsrichtlinie steht, z. B. „Copilot im Firmenkonto; Richtlinie im Intranet unter Richtlinien > KI“.',
						'Which AI tools staff may use for work and where the AI usage policy is kept, e.g. "Copilot in the company account; policy on the intranet under Policies > AI".'
					),
					cite: { law: 'KI-VO', ref: 'Art. 4' }
				},
				{
					id: 'ausserhalb',
					type: 'textarea',
					label: L('Außerhalb der Arbeitszeit', 'Outside working hours'),
					help: L(
						'Wer abends und am Wochenende eine Meldung annimmt, z. B. die IT-Bereitschaft.',
						'Who takes a report in the evening and at weekends, e.g. IT on call.'
					)
				}
			]
		}
	]
};

export const organisation: RecordTool = {
	manifest: {
		slug: ORGANISATION,
		category: 'schulung',
		status: 'stable',
		shape: 'register',
		version: definition.version,
		name: L('Angaben der Organisation', 'Organisation details'),
		summary: definition.intro,
		legalBasis: []
	},
	definition,
	engine: {}
};
