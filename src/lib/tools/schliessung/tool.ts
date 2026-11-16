import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'schliessung',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: {
		de: 'Standort: Umzug oder Schließung',
		en: 'Site: move or closure'
	},
	summary: {
		de: 'Ein Standort zieht um oder schließt, oder das Unternehmen wird aufgegeben: Bestand und sicheres Vernichten; beim Umzug Transport, Serverraum, Sicherheit am neuen und Rückbau am alten Standort; bei der Schließung Aufbewahrung gegen Löschung, Verwahrung nach der Liquidation, Dienstleister, Online-Angebote und wer für Auskünfte erreichbar bleibt.',
		en: 'A site moves or closes, or the business is wound up: inventory and secure destruction; for a move transport, the server room, security at the new site and clearing the old one; for a closure retention against deletion, custody after liquidation, providers, online services and who stays reachable for access requests.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 17' },
		{ law: 'DSGVO', ref: 'Art. 32' },
		{ law: 'GmbHG', ref: '§ 74 Abs. 2' }
	]
};

export const schliessung: RecordTool = { manifest, definition, engine };
