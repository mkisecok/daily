import type { ToolManifest } from '../types.js';
import { lesson } from './lesson.js';

const manifest: ToolManifest = {
	slug: 'schulung-anfragen',
	category: 'schulung',
	status: 'beta',
	shape: 'lesson',
	version: lesson.version,
	name: { de: 'Anfragen Betroffener erkennen', en: 'Recognising data subject requests' },
	summary: {
		de: 'Unterweisung für Empfang, Kundenservice und Personal, etwa 15 Minuten: welche Rechte es gibt, wie eine Anfrage aussieht, auch ohne Fachbegriffe, warum die Frist ab Eingang läuft, wohin sie noch am selben Tag geht, wer fragt, was man nicht selbst erledigt, und Widerspruch gegen Werbung.',
		en: 'Briefing for front office, customer care and HR, about 15 minutes: which rights there are, what a request looks like even without legal terms, why the deadline runs from receipt, where it goes the same day, who is asking, what not to deal with yourself, and objections to marketing.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 12 Abs. 3' },
		{ law: 'DSGVO', ref: 'Art. 15 bis 21' }
	]
};

export const schulungAnfragen = { manifest, lesson };
