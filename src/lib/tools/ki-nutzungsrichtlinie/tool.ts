import type { QuestionnaireCatalog, ToolManifest } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;

const manifest: ToolManifest = {
	slug: 'ki-nutzungsrichtlinie',
	category: 'ki',
	status: 'stable',
	shape: 'questionnaire',
	version: catalog.version,
	name: { de: 'KI-Nutzungsrichtlinie', en: 'AI usage policy' },
	summary: {
		de: 'Entwurf einer internen Richtlinie für generative KI aus zwölf Entscheidungen: freigegebene Werkzeuge, private Konten, personenbezogene und vertrauliche Daten, Prüfung, Kennzeichnung, Code, Entscheidungen über Personen, Schulung, Zuständigkeit, Vorfälle, Betriebsrat. Riskante Entscheidungen werden markiert.',
		en: 'Draft internal policy for generative AI from twelve decisions: approved tools, private accounts, personal and confidential data, review, labelling, code, decisions about persons, training, responsibility, incidents, works council. Risky choices are flagged.'
	},
	legalBasis: [
		{ law: 'KI-VO', ref: 'Art. 4' },
		{ law: 'DSGVO', ref: 'Art. 5, 22, 28' },
		{ law: 'BetrVG', ref: '§ 87 Abs. 1 Nr. 6' }
	]
};

export const kiNutzungsrichtlinie = { manifest, catalog, engine: evaluate };
