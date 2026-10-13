import type { QuestionnaireCatalog, ToolManifest } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;

const manifest: ToolManifest = {
	slug: 'risikoklassifizierung',
	category: 'ki',
	status: 'stable',
	shape: 'questionnaire',
	version: catalog.version,
	name: { de: 'Risikoklassifizierung', en: 'Risk classification' },
	summary: {
		de: 'In welche Risikoklasse der KI-Verordnung fällt ein KI-System? Entscheidungsbaum von Art. 5 über Anhang I und III und die Ausnahme des Art. 6 Abs. 3 bis Art. 50, mit Pflichten und Geltungsdatum nach der Omnibus-Verordnung 2026/1744.',
		en: 'Which AI Act risk class does an AI system fall into? Decision tree from Art. 5 through Annexes I and III and the Art. 6(3) exception to Art. 50, with obligations and the application date after Omnibus Regulation 2026/1744.'
	},
	legalBasis: [
		{ law: 'KI-VO', ref: 'Art. 5' },
		{ law: 'KI-VO', ref: 'Art. 6' },
		{ law: 'KI-VO', ref: 'Anhang III' },
		{ law: 'KI-VO', ref: 'Art. 50' },
		{ law: 'KI-VO', ref: 'Art. 113' }
	]
};

export const risikoklassifizierung = { manifest, catalog, engine: evaluate };
