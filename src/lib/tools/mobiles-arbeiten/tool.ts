import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'mobiles-arbeiten',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Homeoffice und mobiles Arbeiten', en: 'Home and remote work' },
	summary: {
		de: 'Regeln für Homeoffice, mobiles Arbeiten und eigene Geräte: Regelung und Betriebsrat, Geräte und Zugang, private Geräte, Papier, Ausland und Verlust, mit TOM-Katalog, Schulungsnachweis und AVV-Prüfung verknüpft, bis zur dokumentierten Freigabe.',
		en: 'Rules for working from home, on the move and on own devices: rules and works council, devices and access, private devices, paper, abroad and loss, linked to the TOM catalogue, training records and the processing agreement check, up to a documented approval.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 32' },
		{ law: 'BetrVG', ref: '§ 87 Abs. 1 Nr. 14' }
	]
};

export const mobilesArbeiten: RecordTool = { manifest, definition, engine };
