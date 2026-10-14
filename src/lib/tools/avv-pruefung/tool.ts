import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'avv-pruefung',
	category: 'datenschutz',
	status: 'beta',
	shape: 'register',
	version: definition.version,
	name: { de: 'AVV-Prüfung', en: 'Processor contract check' },
	summary: {
		de: 'Register der Auftragsverarbeiter mit Prüfliste nach Art. 28 Abs. 3 Satz 1 und lit. a bis h, Unterauftragsverarbeitern, Nachweis hinreichender Garantien und Wiedervorlage.',
		en: 'Register of processors with a checklist for Art. 28(3) first sentence and points (a) to (h), sub-processors, evidence of sufficient guarantees and review dates.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 28' },
		{ law: 'EDPB', ref: 'Leitlinien 07/2020' }
	]
};

export const avvPruefung: RecordTool = { manifest, definition, engine };
