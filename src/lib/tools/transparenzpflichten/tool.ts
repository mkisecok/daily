import type { QuestionnaireCatalog, ToolManifest } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;

const manifest: ToolManifest = {
	slug: 'transparenzpflichten',
	category: 'ki',
	status: 'stable',
	shape: 'questionnaire',
	version: catalog.version,
	name: { de: 'Transparenzpflichten', en: 'Transparency obligations' },
	summary: {
		de: 'Welche Hinweise verlangt Art. 50 KI-VO? Chatbot-Hinweis und Kennzeichnung synthetischer Inhalte für Anbieter, Offenlegung von Emotionserkennung, Deepfakes und KI-Texten für Betreiber, mit den Ausnahmen und Fristen.',
		en: 'Which notices does Art. 50 AI Act require? Chatbot notice and marking of synthetic content for providers, disclosure of emotion recognition, deepfakes and AI-generated text for deployers, with the exceptions and dates.'
	},
	legalBasis: [
		{ law: 'KI-VO', ref: 'Art. 50 Abs. 1–5' },
		{ law: 'KI-VO', ref: 'Verordnung (EU) 2026/1744' }
	]
};

export const transparenzpflichten = { manifest, catalog, engine: evaluate };
