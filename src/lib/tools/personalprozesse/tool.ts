import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'personalprozesse',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Personalprozesse', en: 'HR processes' },
	summary: {
		de: 'Der Ablauf von der Bewerbung bis zum Austritt, einmal festgelegt: Ausschreibung und Auswahl, Hintergrundprüfung, KI in der Auswahl, Talentpool, Löschen nach dem AGG, Eintritt mit Vertraulichkeit und Zugängen, Wechsel, Austritt mit Konten, Rückgabe und Postfach.',
		en: 'The process from application to exit, set once: advertisement and selection, background checks, AI in selection, talent pool, erasure after the AGG period, joining with confidentiality and access, changes of role, leaving with accounts, returns and mailbox.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 6, 88' },
		{ law: 'BDSG', ref: '§ 26' }
	]
};

export const personalprozesse: RecordTool = { manifest, definition, engine };
