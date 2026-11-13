import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'hinweisgebersystem',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Hinweisgebersystem einrichten', en: 'Set up a whistleblowing system' },
	summary: {
		de: 'Interne Meldestelle nach dem HinSchG: Pflicht ab 50 Beschäftigten, zuständige Personen und Kanäle, Ombudsperson oder Plattform, Anonymität, Vertraulichkeit, Fristen von sieben Tagen und drei Monaten, Löschen nach drei Jahren und die DSFA-Frage.',
		en: 'Internal reporting office under the HinSchG: the duty from 50 employees, people in charge and channels, ombudsperson or platform, anonymity, confidentiality, the seven-day and three-month deadlines, deletion after three years and the DPIA question.'
	},
	legalBasis: [
		{ law: 'HinSchG', ref: '§§ 8, 11, 12, 16, 17' },
		{ law: 'DSGVO', ref: 'Art. 13, 35' }
	]
};

export const hinweisgebersystem: RecordTool = { manifest, definition, engine };
