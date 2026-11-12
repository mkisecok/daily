import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'chatbot',
	category: 'ki',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Chatbot auf der Website', en: 'Chatbot on the website' },
	summary: {
		de: 'Einen KI-Chatbot auf Website, Shop oder App einsetzen: Rolle als Anbieter oder Betreiber, Kennzeichnung nach Art. 50, Datenschutzhinweise, Laden erst beim Öffnen, Speicherdauer, Training, Anbieter, Missbrauch und Entscheidungen durch den Bot.',
		en: 'Using an AI chatbot on a website, shop or app: role as provider or deployer, the Art. 50 notice, privacy notice, loading only on open, storage period, training, provider, misuse and decisions by the bot.'
	},
	legalBasis: [
		{ law: 'KI-VO', ref: 'Art. 50 Abs. 1' },
		{ law: 'DSGVO', ref: 'Art. 13, 28' }
	]
};

export const chatbot: RecordTool = { manifest, definition, engine };
