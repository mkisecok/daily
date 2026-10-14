import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'auditprogramm',
	category: 'audit',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Auditprogramm', en: 'Audit programme' },
	summary: {
		de: 'Audits planen und verfolgen: Gegenstand, Kriterien (DSGVO, BDSG, KI-VO, ISO 27001, ISO 42001, TISAX), unabhängige Auditoren, Methoden und Termine; Prüfkatalog, Feststellungen und Bericht verknüpfen sich mit dem Audit.',
		en: 'Plan and track audits: subject, criteria (GDPR, BDSG, AI Act, ISO 27001, ISO 42001, TISAX), independent auditors, methods and dates; checklists, findings and the report link to the audit.'
	},
	legalBasis: [
		{ law: 'ISO 27001', ref: 'Kap. 9.2' },
		{ law: 'ISO 42001', ref: 'Kap. 9.2' }
	]
};

export const auditprogramm: RecordTool = { manifest, definition, engine };
