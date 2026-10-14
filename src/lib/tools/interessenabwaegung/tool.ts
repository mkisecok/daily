import type { QuestionnaireCatalog, ToolManifest } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;

const manifest: ToolManifest = {
	slug: 'interessenabwaegung',
	category: 'datenschutz',
	status: 'stable',
	shape: 'questionnaire',
	version: catalog.version,
	name: { de: 'Interessenabwägung', en: 'Legitimate interests assessment' },
	summary: {
		de: 'Trägt Art. 6 Abs. 1 lit. f DSGVO? Dreistufige Prüfung nach den EDSA-Leitlinien 1/2024: berechtigtes Interesse, Erforderlichkeit und eine gewichtete Abwägung mit Kindern, Art.-9-Daten, Erwartungen und Schutzmaßnahmen.',
		en: 'Does Art. 6(1)(f) GDPR hold? Three-step test under EDPB Guidelines 1/2024: legitimate interest, necessity and a weighted balancing of children, Art. 9 data, expectations and safeguards.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 6 Abs. 1 lit. f' },
		{ law: 'EDPB', ref: 'Leitlinien 1/2024' }
	]
};

export const interessenabwaegung = { manifest, catalog, engine: evaluate };
