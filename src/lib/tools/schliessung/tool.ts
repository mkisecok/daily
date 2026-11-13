import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'schliessung',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Standort schließen oder Geschäft aufgeben', en: 'Closing a site or business' },
	summary: {
		de: 'Einen Standort schließen oder das Unternehmen aufgeben: Bestand, Aufbewahrung gegen Löschung, Verwahrung nach der Liquidation, sicheres Vernichten von Akten und Geräten, Dienstleister, Online-Angebote und wer danach für Auskünfte erreichbar bleibt.',
		en: 'Closing a site or winding up the business: inventory, retention against deletion, custody after liquidation, secure destruction of files and devices, providers, online services and who stays reachable for access requests afterwards.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 17' },
		{ law: 'GmbHG', ref: '§ 74 Abs. 2' }
	]
};

export const schliessung: RecordTool = { manifest, definition, engine };
