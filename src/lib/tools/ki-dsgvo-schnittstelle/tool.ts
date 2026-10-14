import type { QuestionnaireCatalog, ToolManifest } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;

const manifest: ToolManifest = {
	slug: 'ki-dsgvo-schnittstelle',
	category: 'ki',
	status: 'stable',
	shape: 'questionnaire',
	version: catalog.version,
	name: { de: 'KI und DSGVO', en: 'AI and GDPR' },
	summary: {
		de: 'Was verlangt die DSGVO, wenn ein KI-System personenbezogene Daten verarbeitet? Rechtsgrundlage je Phase, Art.-9-Daten, automatisierte Entscheidungen, Datenminimierung, Richtigkeit, Transparenz, Betroffenenrechte, DSFA, Auftragsverarbeitung und Drittlandbezug.',
		en: 'What does the GDPR require when an AI system processes personal data? Legal basis per phase, Art. 9 data, automated decisions, minimisation, accuracy, transparency, data subject rights, DPIA, processors and third-country transfers.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 5, 6, 22, 35' },
		{ law: 'EDPB', ref: 'Stellungnahme 28/2024' }
	]
};

export const kiDsgvoSchnittstelle = { manifest, catalog, engine: evaluate };
