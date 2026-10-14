import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'auditbericht',
	category: 'audit',
	status: 'beta',
	shape: 'register',
	version: definition.version,
	name: { de: 'Auditbericht', en: 'Audit report' },
	summary: {
		de: 'Bericht je Audit mit Zusammenfassung, Gesamturteil, Stärken und Empfehlungen; Audit, Prüfkatalog und Feststellungen werden angefügt und mitgedruckt.',
		en: 'Report per audit with summary, overall conclusion, strengths and recommendations; audit, checklists and findings are appended and printed with it.'
	},
	legalBasis: [
		{ law: 'ISO 27001', ref: 'Kap. 9.2.2' },
		{ law: 'ISO 42001', ref: 'Kap. 9.2' }
	]
};

export const auditbericht: RecordTool = { manifest, definition, engine };
