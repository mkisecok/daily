import type { ToolManifest } from '../types.js';
import { lesson } from './lesson.js';

const manifest: ToolManifest = {
	slug: 'schulung-grundlagen',
	category: 'schulung',
	status: 'beta',
	shape: 'lesson',
	version: lesson.version,
	name: { de: 'Datenschutz-Grundlagen', en: 'Data protection basics' },
	summary: {
		de: 'Unterweisung für neue Kolleginnen und Kollegen, knapp 30 Minuten: Datenschutz als Grundrecht, personenbezogene Daten, die Grundsätze der DSGVO, Löschen nach dem Löschkonzept, nur im Rahmen der eigenen Aufgaben, Arbeitsplatz, Passwörter, E-Mail, Phishing erkennen und melden, und wohin Anfragen, Pannen und Fragen gehen.',
		en: 'Briefing for new colleagues, just under 30 minutes: data protection as a fundamental right, personal data, the GDPR principles, deleting by the deletion concept, only within one’s own tasks, workplace, passwords, e-mail, spotting and reporting phishing, and where requests, breaches and questions go.'
	},
	legalBasis: [
		{ law: 'GRCh', ref: 'Art. 8' },
		{ law: 'DSGVO', ref: 'Art. 5' },
		{ law: 'DSGVO', ref: 'Art. 17 Abs. 1' },
		{ law: 'DSGVO', ref: 'Art. 32 Abs. 4' },
		{ law: 'DSGVO', ref: 'Art. 39 Abs. 1 lit. b' }
	]
};

export const schulungGrundlagen = { manifest, lesson };
