import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'veranstaltung',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Veranstaltung mit Fotos und Gästeliste', en: 'Event with photos and guest list' },
	summary: {
		de: 'Feier, Messe oder Konferenz: Anmeldung und Hinweise, Ernährung und Barrierefreiheit, Fotos und Widerspruch, Kinder, Veröffentlichung, Aufzeichnung und das Löschen der Gästeliste danach.',
		en: 'Party, trade fair or conference: registration and notices, dietary and accessibility needs, photos and objection, children, publication, recording and deleting the guest list afterwards.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 6, 13' },
		{ law: 'KUG', ref: '§ 22, § 23' }
	]
};

export const veranstaltung: RecordTool = { manifest, definition, engine };
