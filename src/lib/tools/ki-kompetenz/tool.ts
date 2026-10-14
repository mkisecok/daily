import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'ki-kompetenz',
	category: 'ki',
	status: 'beta',
	shape: 'register',
	version: definition.version,
	name: { de: 'KI-Kompetenz', en: 'AI literacy' },
	summary: {
		de: 'Maßnahmen zur KI-Kompetenz je Rolle: genutzte Systeme, Vorkenntnisse, Einsatzkontext, Inhalte, Nachweis und Auffrischung als Frist; strengere Prüfung für die menschliche Aufsicht nach Art. 26 Abs. 2.',
		en: 'AI literacy measures per role: systems used, prior knowledge, context of use, content, evidence and refreshers as deadlines; stricter check for human oversight under Art. 26(2).'
	},
	legalBasis: [
		{ law: 'KI-VO', ref: 'Art. 4' },
		{ law: 'KI-VO', ref: 'Art. 26 Abs. 2' }
	]
};

export const kiKompetenz: RecordTool = { manifest, definition, engine };
