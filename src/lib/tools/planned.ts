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
