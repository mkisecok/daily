import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'videoueberwachung',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Videoüberwachung einrichten', en: 'Setting up video surveillance' },
	summary: {
		de: 'Kameras in Betrieb, Laden oder Verein einrichten: Zweck, Erfassungsbereich, Hinweisschild, Speicherdauer, Zugriff, Fernzugriff und Beschäftigte, mit Interessenabwägung und DSFA-Schwellwertanalyse verknüpft, bis zur dokumentierten Freigabe.',
		en: 'Setting up cameras in a business, shop or association: purpose, coverage, warning sign, storage period, access, remote access and staff, linked to the legitimate-interest assessment and the DPIA screening, up to a documented approval.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 6 Abs. 1 lit. f, 13' },
		{ law: 'DSK', ref: 'Orientierungshilfe Videoüberwachung' }
	]
};

export const videoueberwachung: RecordTool = { manifest, definition, engine };
