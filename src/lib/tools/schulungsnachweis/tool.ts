import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'schulungsnachweis',
	category: 'datenschutz',
	status: 'beta',
	shape: 'register',
	version: definition.version,
	name: { de: 'Schulungsnachweis', en: 'Training log' },
	summary: {
		de: 'Schulungen zu Datenschutz und KI-Kompetenz mit Themen, Zielgruppe, Teilnahme und Nachweis; für KI die Inhalte je Rolle nach Art. 4 KI-VO, für die Aufsicht über Hochrisiko-Systeme nach Art. 26 Abs. 2. Die Wiederholung erscheint als Frist.',
		en: 'Training on data protection and AI literacy with topics, target group, attendance and evidence; for AI the content per role under Art. 4 AI Act, for oversight of high-risk systems under Art. 26(2). The repetition appears as a deadline.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 39 Abs. 1 lit. b' },
		{ law: 'DSGVO', ref: 'Art. 32 Abs. 4' },
		{ law: 'KI-VO', ref: 'Art. 4' }
	]
};

export const schulungsnachweis: RecordTool = { manifest, definition, engine };
