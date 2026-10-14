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
		de: 'Datenschutzschulungen mit Themen, Zielgruppe, Teilnahme und Nachweis; die Wiederholung erscheint als Frist.',
		en: 'Data protection training with topics, target group, attendance and evidence; the repetition appears as a deadline.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 39 Abs. 1 lit. b' },
		{ law: 'DSGVO', ref: 'Art. 32 Abs. 4' }
	]
};

export const schulungsnachweis: RecordTool = { manifest, definition, engine };
