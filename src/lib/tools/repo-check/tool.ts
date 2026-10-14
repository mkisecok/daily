import type { ToolManifest } from '../types.js';

export const manifest: ToolManifest = {
	slug: 'repo-check',
	category: 'entwickler',
	status: 'beta',
	shape: 'utility',
	version: 1,
	name: { de: 'Repo-Check', en: 'Repository check' },
	summary: {
		de: 'Quellcode im Browser auf Geheimnisse, personenbezogene Muster, Aufrufe externer KI-Dienste und Tracker prüfen; Befundliste mit maskierten Auszügen für den DSB, als CSV exportierbar. Nichts wird hochgeladen.',
		en: 'Check source code in the browser for secrets, personal-data patterns, calls to external AI services and trackers; findings list with masked excerpts for the DPO, exportable as CSV. Nothing is uploaded.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 25' },
		{ law: 'DSGVO', ref: 'Art. 32' }
	]
};

export const repoCheck = { manifest };
