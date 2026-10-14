import type { ToolManifest } from './types.js';

/**
 * Tools on the roadmap. Each becomes its own folder when it is built; until
 * then the manifest only exists here so the catalogue shows what is coming
 * and under which legal duty.
 */
export const planned: ToolManifest[] = [
	// ---------- Datenschutz ----------
	// ---------- Künstliche Intelligenz ----------
	// ---------- Audit ----------

	// ---------- Entwickler ----------
	{
		slug: 'repo-check',
		category: 'entwickler',
		status: 'planned',
		shape: 'workflow',
		version: 0,
		name: { de: 'Repo-Check', en: 'Repository check' },
		summary: {
			de: 'Quellcode auf personenbezogene Muster, Geheimnisse und Aufrufe externer KI-Dienste prüfen; Befundliste für den DSB.',
			en: 'Scan source code for personal-data patterns, secrets and calls to external AI services; findings list for the DPO.'
		},
		legalBasis: [
			{ law: 'DSGVO', ref: 'Art. 25' },
			{ law: 'DSGVO', ref: 'Art. 32' }
		]
	},
	{
		slug: 'guardrail-test',
		category: 'entwickler',
		status: 'planned',
		shape: 'workflow',
		version: 0,
		name: { de: 'Guardrail-Test', en: 'Guardrail test' },
		summary: {
			de: 'Prompt-Sätze gegen einen Chatbot-Endpunkt ausführen; Verweigerungs- und Leckraten als Nachweis im Risikomanagement.',
			en: 'Run prompt sets against a chatbot endpoint; refusal and leak rates as risk-management evidence.'
		},
		legalBasis: [
			{ law: 'KI-VO', ref: 'Art. 9' },
			{ law: 'KI-VO', ref: 'Art. 15' }
		]
	}
];
