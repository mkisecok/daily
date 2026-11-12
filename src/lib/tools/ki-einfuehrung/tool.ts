import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'ki-einfuehrung',
	category: 'ki',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'KI-Tool einführen', en: 'Introducing an AI tool' },
	summary: {
		de: 'Ein KI-Tool wie einen Assistenten oder Chatbot einführen: Anbieter, Nutzungsregeln, Daten, Beschäftigte, Transparenz und Entscheidungen über Personen, mit den Hochrisiko-Pflichten, sobald die Risikoklassifizierung sie verlangt, bis zur dokumentierten Freigabe.',
		en: 'Introducing an AI tool such as an assistant or chatbot: provider, rules of use, data, staff, transparency and decisions about people, with the high-risk duties once the risk classification requires them, up to a documented approval.'
	},
	legalBasis: [
		{ law: 'KI-VO', ref: 'Art. 4, 26, 50' },
		{ law: 'DSGVO', ref: 'Art. 22, 28, 35' },
		{ law: 'BetrVG', ref: '§ 90 Abs. 1 Nr. 3' }
	]
};

export const kiEinfuehrung: RecordTool = { manifest, definition, engine };
