import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'loeschkonzept',
	category: 'datenschutz',
	status: 'beta',
	shape: 'register',
	version: definition.version,
	name: { de: 'Löschkonzept', en: 'Retention schedule' },
	summary: {
		de: 'Aufbewahrungsfristen je Datenart mit gesetzlicher Grundlage (HGB, AO, EStG, AGG), Fristbeginn, Löschregel und Löschläufen als Fristen; prüft zu kurze und zu lange Fristen.',
		en: 'Retention periods per data type with their legal basis (HGB, AO, EStG, AGG), start of the period, erasure rule and erasure runs as deadlines; checks periods that are too short or too long.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. e' },
		{ law: 'DSGVO', ref: 'Art. 17' },
		{ law: 'BDSG', ref: '§ 35' }
	]
};

export const loeschkonzept: RecordTool = { manifest, definition, engine };
