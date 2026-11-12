import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'website-start',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Website oder Shop starten', en: 'Launching a website or shop' },
	summary: {
		de: 'Website oder Shop starten oder umbauen: Impressum, Datenschutzerklärung, Cookie-Banner, Drittdienste, Formulare, Shop, Newsletter und Chatbot, mit Einwilligungs-Check, Drittlandprüfung und Transparenzpflichten verknüpft, bis zur dokumentierten Freigabe.',
		en: 'Launching or rebuilding a website or shop: legal notice, privacy notice, cookie banner, third-party services, forms, shop, newsletter and chatbot, linked to the consent check, third-country check and transparency duties, up to a documented approval.'
	},
	legalBasis: [
		{ law: 'TDDDG', ref: '§ 25' },
		{ law: 'DDG', ref: '§ 5' },
		{ law: 'DSGVO', ref: 'Art. 13' }
	]
};

export const websiteStart: RecordTool = { manifest, definition, engine };
