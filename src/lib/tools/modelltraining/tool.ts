import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'modelltraining',
	category: 'ki',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Eigenes Modell trainieren', en: 'Train your own model' },
	summary: {
		de: 'Training oder Feinabstimmung eines KI-Modells: Zweck und Anbieterrolle, Rechtsgrundlage und Herkunft der Daten, Web Scraping, Information und Widerspruch, Tests auf gespeicherte Daten, Pflichten für allgemein verwendbare Modelle und Hochrisiko-KI.',
		en: 'Training or fine-tuning an AI model: purpose and provider role, legal basis and origin of the data, web scraping, information and objection, tests for memorised data, duties for general-purpose models and high-risk AI.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 6 Abs. 1 lit. f, Art. 9' },
		{ law: 'EDPB', ref: 'Stellungnahme 28/2024' },
		{ law: 'KI-VO', ref: 'Art. 25, 53' }
	]
};

export const modelltraining: RecordTool = { manifest, definition, engine };
