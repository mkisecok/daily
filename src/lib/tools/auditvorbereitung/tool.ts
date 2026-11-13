import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'auditvorbereitung',
	category: 'audit',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Audit als geprüfte Stelle vorbereiten', en: 'Prepare for being audited' },
	summary: {
		de: 'Zertifizierung nach ISO 27001 oder ISO 42001, Überwachungsaudit oder Kundenaudit: Rahmen und Nachweise, Vertraulichkeit, Managementsystem, Prüfrecht im AVV, Rundgang und die Feststellungen danach.',
		en: 'Certification to ISO 27001 or ISO 42001, surveillance audit or customer audit: frame and evidence, confidentiality, management system, the audit right in the processing agreement, the walk-through and the findings afterwards.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 5 Abs. 2, Art. 28 Abs. 3 lit. h' },
		{ law: 'ISO 27001', ref: 'Kap. 9.2, 10.2' }
	]
};

export const auditvorbereitung: RecordTool = { manifest, definition, engine };
