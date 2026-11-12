import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'ki-personal',
	category: 'ki',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'KI im Personalbereich', en: 'AI for staff' },
	summary: {
		de: 'KI, die Beschäftigte bewertet oder Entscheidungen über sie vorbereitet: Verbot der Emotionserkennung, Einstufung nach Anhang III Nr. 4, Betriebsrat nach §§ 80, 87, 90 und 95 BetrVG, Information nach Art. 26 Abs. 7, menschliche Entscheidung und die Hochrisiko-Pflichten.',
		en: 'AI that rates staff or prepares decisions about them: the ban on emotion recognition, classification under Annex III no. 4, the works council under §§ 80, 87, 90 and 95 BetrVG, information under Art. 26(7), a human decision and the high-risk duties.'
	},
	legalBasis: [
		{ law: 'KI-VO', ref: 'Art. 26 Abs. 7, Anhang III Nr. 4' },
		{ law: 'BetrVG', ref: '§ 90 Abs. 1 Nr. 3' }
	]
};

export const kiPersonal: RecordTool = { manifest, definition, engine };
