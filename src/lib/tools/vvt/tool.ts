import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'vvt',
	category: 'datenschutz',
	status: 'beta',
	shape: 'register',
	version: definition.version,
	name: { de: 'Verzeichnis von Verarbeitungstätigkeiten', en: 'Record of processing activities' },
	summary: {
		de: 'Verzeichnis je Organisation nach Art. 30 Abs. 1 oder 2: Zwecke, Rechtsgrundlagen, Betroffene, Datenkategorien, Empfänger, Drittländer, Löschfristen, TOM. Vollständigkeitsprüfung je Buchstabe, Übernahme von DSFA-Schwellwertanalyse und Drittlandprüfung, Druckfassung für die Aufsichtsbehörde.',
		en: 'Record per organisation under Art. 30(1) or (2): purposes, legal bases, data subjects, data categories, recipients, third countries, erasure periods, TOMs. Completeness check per letter, results from the DPIA screening and the transfer check, print version for the authority.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 30' },
		{ law: 'DSGVO', ref: 'Art. 5 Abs. 2' }
	]
};

export const vvt: RecordTool = { manifest, definition, engine };
