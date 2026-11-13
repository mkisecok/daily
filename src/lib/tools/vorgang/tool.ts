import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'vorgang',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Vorgänge', en: 'Matters' },
	summary: {
		de: 'Die eigene Arbeit im Griff: jeder Vorgang mit laufender Nummer, für wen er ist, dem nächsten Schritt und bis wann. Offene Vorgänge und fällige Schritte stehen auf der Startseite.',
		en: 'Your own work in hand: each matter with a running number, who it is for, the next step and by when. Open matters and steps due show on the start page.'
	},
	legalBasis: [{ law: 'DSGVO', ref: 'Art. 39 Abs. 1 lit. a, b' }]
};

export const vorgang: RecordTool = { manifest, definition, engine };
