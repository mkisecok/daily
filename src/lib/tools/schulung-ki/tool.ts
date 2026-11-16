import type { ToolManifest } from '../types.js';
import { lesson } from './lesson.js';

const manifest: ToolManifest = {
	slug: 'schulung-ki',
	category: 'schulung',
	status: 'beta',
	shape: 'lesson',
	version: lesson.version,
	name: { de: 'KI im Arbeitsalltag', en: 'AI in daily work' },
	summary: {
		de: 'Unterweisung zur KI-Kompetenz nach Art. 4 KI-VO, etwa 20 Minuten: was KI kann und was nicht, freigegebene Werkzeuge, was nicht in die KI gehört, Ergebnisse prüfen, Entscheidungen über Menschen, Kennzeichnung, das Verbot der Emotionserkennung am Arbeitsplatz und wohin Pannen gehen. Füllt im Schulungsnachweis den Teil zur KI-Kompetenz aus.',
		en: 'Briefing on AI literacy under Art. 4 AI Act, about 20 minutes: what AI can and cannot do, approved tools, what stays out of AI, checking results, decisions about people, labelling, the workplace ban on emotion recognition and where breaches go. Fills in the AI literacy part of the Schulungsnachweis.'
	},
	legalBasis: [
		{ law: 'KI-VO', ref: 'Art. 4' },
		{ law: 'KI-VO', ref: 'Art. 5 Abs. 1 lit. f' },
		{ law: 'DSGVO', ref: 'Art. 22' }
	]
};

export const schulungKi = { manifest, lesson };
