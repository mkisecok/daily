import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'betroffenenanfrage',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Betroffenenanfrage', en: 'Data subject request' },
	summary: {
		de: 'Anträge nach Art. 15 bis 22 verfolgen: Monatsfrist ab Eingang mit Verlängerung um zwei Monate, Identitätsprüfung, Prüfliste je Recht, Ablehnung mit Begründung und Register aller Anträge.',
		en: 'Track requests under Art. 15 to 22: one-month period from receipt with a two-month extension, identity check, checklist per right, refusal with reasons and a register of all requests.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 12' },
		{ law: 'DSGVO', ref: 'Art. 15–22' }
	]
};

export const betroffenenanfrage: RecordTool = { manifest, definition, engine };
