import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'personalwechsel',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Eintritt und Austritt von Beschäftigten', en: 'Staff joining and leaving' },
	summary: {
		de: 'Eintritt, Wechsel der Aufgabe oder Austritt einer Person: Verpflichtung auf die Vertraulichkeit, Hinweise, Zugänge, Geräte, Postfach und Löschfristen, mit Unterweisung, Löschkonzept und Einwilligung verknüpft, bis zum dokumentierten Abschluss.',
		en: 'A person joining, changing role or leaving: confidentiality commitment, notices, access, devices, mailbox and deletion periods, linked to training, the deletion concept and consent, up to a documented close.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 13, 29, 32 Abs. 4' },
		{ law: 'DSK', ref: 'Kurzpapier Nr. 19' }
	]
};

export const personalwechsel: RecordTool = { manifest, definition, engine };
