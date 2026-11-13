import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'beratungsvermerk',
	category: 'datenschutz',
	status: 'beta',
	shape: 'register',
	version: definition.version,
	name: { de: 'Beratungsvermerke', en: 'Advice memos' },
	summary: {
		de: 'Was wurde gefragt, was empfohlen, an wen und wann, und wurde es umgesetzt? Vermerke je Beratung, einem Vorgang zugeordnet, mit Erinnerung zum Nachfragen.',
		en: 'What was asked, what was recommended, to whom and when, and was it followed? Memos per piece of advice, filed under a matter, with a reminder to ask again.'
	},
	legalBasis: [{ law: 'DSGVO', ref: 'Art. 39 Abs. 1 lit. a' }]
};

export const beratungsvermerk: RecordTool = { manifest, definition, engine };
