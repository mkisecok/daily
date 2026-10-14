import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'vorfallmeldung',
	category: 'ki',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Vorfallmeldung', en: 'Serious incident report' },
	summary: {
		de: 'Schwerwiegende Vorfälle mit Hochrisiko-KI-Systemen: Einordnung nach Art. 3 Nr. 49, Meldefrist von 15, 10 oder 2 Tagen ab Kenntnis, Information des Anbieters durch Betreiber, Untersuchung und Hinweis auf eine parallele Datenpanne.',
		en: 'Serious incidents with high-risk AI systems: classification under Art. 3(49), reporting period of 15, 10 or 2 days from awareness, deployers informing the provider, investigation and a pointer to a parallel data breach.'
	},
	legalBasis: [
		{ law: 'KI-VO', ref: 'Art. 73' },
		{ law: 'KI-VO', ref: 'Art. 26 Abs. 5' }
	]
};

export const vorfallmeldung: RecordTool = { manifest, definition, engine };
