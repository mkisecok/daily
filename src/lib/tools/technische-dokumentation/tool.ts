import type { QuestionnaireCatalog, ToolManifest } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;

const manifest: ToolManifest = {
	slug: 'technische-dokumentation',
	category: 'ki',
	status: 'stable',
	shape: 'questionnaire',
	version: catalog.version,
	name: { de: 'Technische Dokumentation', en: 'Technical documentation' },
	summary: {
		de: 'Ist die technische Dokumentation eines Hochrisiko-KI-Systems vollständig? Die neun Abschnitte des Anhangs IV, laufende Aktualisierung und zehnjährige Aufbewahrung, mit Abhilfe für jeden fehlenden Teil und dem Hinweis auf die vereinfachte Form für KMU.',
		en: 'Is the technical documentation of a high-risk AI system complete? The nine sections of Annex IV, ongoing updates and ten-year retention, with a remedy for every missing part and a pointer to the simplified form for SMEs.'
	},
	legalBasis: [
		{ law: 'KI-VO', ref: 'Art. 11' },
		{ law: 'KI-VO', ref: 'Anhang IV' }
	]
};

export const technischeDokumentation = { manifest, catalog, engine: evaluate };
