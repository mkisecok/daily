import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'standortwechsel',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Standortwechsel', en: 'Office move' },
	summary: {
		de: 'Umzug eines Büros oder Serverraums: Checkliste von der Planung über Transport und Serverraum bis zur Sicherheit am neuen Standort und zum Rückbau am alten, mit Risikoanalyse in der Risikomatrix der DSK und den Fristen bis zur Begehung.',
		en: 'Moving an office or server room: a checklist from planning through transport and the server room to security at the new site and clearing the old one, with a risk analysis on the DSK risk matrix and the deadlines up to the walk-through.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 32' },
		{ law: 'BSI', ref: 'INF.1, INF.2, INF.7, CON.6' }
	]
};

export const standortwechsel: RecordTool = { manifest, definition, engine };
