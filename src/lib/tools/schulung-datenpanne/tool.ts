import type { ToolManifest } from '../types.js';
import { lesson } from './lesson.js';

const manifest: ToolManifest = {
	slug: 'schulung-datenpanne',
	category: 'schulung',
	status: 'beta',
	shape: 'lesson',
	version: lesson.version,
	name: { de: 'Datenpannen erkennen und melden', en: 'Spotting and reporting data breaches' },
	summary: {
		de: 'Unterweisung für alle Beschäftigten, etwa 20 Minuten: was eine Datenpanne ist, Beispiele aus dem Alltag, warum schon ein Verdacht gemeldet wird, der Meldeweg der Organisation, die 72 Stunden und was danach geschieht. Zum Vortragen und als Handout.',
		en: 'Briefing for all staff, about 20 minutes: what a data breach is, everyday examples, why even a suspicion is reported, the organisation’s reporting channel, the 72 hours and what happens next. To present and as a handout.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 4 Nr. 12' },
		{ law: 'DSGVO', ref: 'Art. 33' }
	]
};

export const schulungDatenpanne = { manifest, lesson };
