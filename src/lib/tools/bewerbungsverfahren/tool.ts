import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'bewerbungsverfahren',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Bewerbungsverfahren', en: 'Hiring procedure' },
	summary: {
		de: 'Eine Stelle besetzen: Hinweise, Eingangsweg, Zugriff, Recherche, Betriebsrat, Führungszeugnis, KI in der Auswahl und Talentpool, mit der Löschfrist nach dem AGG ab der Absage.',
		en: 'Filling a job: notice, way in, access, research, works council, certificate of conduct, AI in selection and talent pool, with the deletion period under the AGG from the rejection.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 13, 17' },
		{ law: 'AGG', ref: '§ 15 Abs. 4' }
	]
};

export const bewerbungsverfahren: RecordTool = { manifest, definition, engine };
