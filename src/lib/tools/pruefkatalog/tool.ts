import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'pruefkatalog',
	category: 'audit',
	status: 'beta',
	shape: 'register',
	version: definition.version,
	name: { de: 'Prüfkatalog', en: 'Audit checklist' },
	summary: {
		de: 'Prüfthemen je Audit mit Fragensätzen für DSGVO, TOM, Betroffenenrechte, Auftragsverarbeitung, Datenpannen, KI-VO, ISMS und AIMS sowie Stichproben, Interviewnotizen, Nachweisen und Ergebnis.',
		en: 'Topics per audit with question sets for GDPR, TOMs, data subject rights, processing on behalf, breaches, AI Act, ISMS and AIMS, plus samples, interview notes, evidence and result.'
	},
	legalBasis: [
		{ law: 'ISO 27001', ref: 'Kap. 9.2' },
		{ law: 'DSGVO', ref: 'Art. 39 Abs. 1 lit. b' }
	]
};

export const pruefkatalog: RecordTool = { manifest, definition, engine };
