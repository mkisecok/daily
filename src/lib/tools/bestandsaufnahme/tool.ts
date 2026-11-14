import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'bestandsaufnahme',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Bestandsaufnahme', en: 'Stocktake' },
	summary: {
		de: 'Der erste Blick auf eine neue Organisation oder einen neuen Mandanten: Organigramm und Benennung, Sicherheit von außen nach innen, Abteilungen und Software, vorhandene Dokumentation, Kontrollplan und Bericht an die Leitung.',
		en: 'The first look at a new organisation or client: org chart and appointment, security from the outside in, departments and software, existing documentation, control plan and report to management.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 38 Abs. 3, Art. 39 Abs. 1' },
		{ law: 'BDSG', ref: '§ 38 Abs. 1' }
	]
};

export const bestandsaufnahme: RecordTool = { manifest, definition, engine };
