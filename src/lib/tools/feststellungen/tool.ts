import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'feststellungen',
	category: 'audit',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Feststellungen', en: 'Findings' },
	summary: {
		de: 'Wesentliche und geringfügige Abweichungen, Verbesserungspotenzial und positive Feststellungen mit Nachweis, Ursache, Korrekturmaßnahme, Frist und Wirksamkeitsprüfung.',
		en: 'Major and minor nonconformities, opportunities for improvement and positive findings with evidence, root cause, corrective action, deadline and effectiveness check.'
	},
	legalBasis: [
		{ law: 'ISO 27001', ref: 'Kap. 10.2' },
		{ law: 'ISO 42001', ref: 'Kap. 10.2' }
	]
};

export const feststellungen: RecordTool = { manifest, definition, engine };
