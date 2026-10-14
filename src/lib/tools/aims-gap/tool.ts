import type { QuestionnaireCatalog, ToolManifest } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;

const manifest: ToolManifest = {
	slug: 'aims-gap',
	category: 'ki',
	status: 'beta',
	shape: 'questionnaire',
	version: catalog.version,
	name: { de: 'AIMS-Gap-Analyse', en: 'AIMS gap analysis' },
	summary: {
		de: 'Lückenanalyse gegen ISO/IEC 42001: Kontext, Führung, Planung, die Maßnahmenbereiche des Anhangs A und Verbesserung; jede Lücke mit Bezug zu den Pflichten der KI-Verordnung.',
		en: 'Gap analysis against ISO/IEC 42001: context, leadership, planning, the control areas of Annex A and improvement; each gap linked to the AI Act obligations.'
	},
	legalBasis: [
		{ law: 'ISO 42001', ref: 'Kap. 4–10' },
		{ law: 'ISO 42001', ref: 'Anhang A' }
	]
};

export const aimsGap = { manifest, catalog, engine: evaluate };
