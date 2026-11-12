import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'aufsichtsanfrage',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Anfrage der Aufsichtsbehörde', en: 'Supervisory authority inquiry' },
	summary: {
		de: 'Schreiben, Kontrolle oder Bescheid einer Aufsichtsbehörde: Frist, Zuständigkeit, Sachverhalt, Auskunftsverweigerungsrecht, Antwort und Rechtsbehelfsfrist, mit Betroffenenanfrage, Datenpanne und VVT verknüpft.',
		en: 'A letter, inspection or decision of a supervisory authority: deadline, competence, facts, the right to refuse, the reply and the remedy deadline, linked to the data subject request, the breach and the record of processing.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 31, 58' },
		{ law: 'BDSG', ref: '§ 40 Abs. 4, 5' }
	]
};

export const aufsichtsanfrage: RecordTool = { manifest, definition, engine };
