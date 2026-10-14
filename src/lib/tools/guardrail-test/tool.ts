import type { ToolManifest } from '../types.js';

export const manifest: ToolManifest = {
	slug: 'guardrail-test',
	category: 'entwickler',
	status: 'beta',
	shape: 'utility',
	version: 1,
	name: { de: 'Guardrail-Test', en: 'Guardrail test' },
	summary: {
		de: 'Prompt-Sätze zu Injection, Datenabfluss, Diskriminierung und Missbrauch sowie Kontrollfragen gegen einen Chatbot prüfen, per eingefügter Antworten oder direkt gegen einen OpenAI-kompatiblen Endpunkt; Verweigerungs-, Leck- und Überverweigerungsrate als Nachweis im Risikomanagement.',
		en: 'Test prompt sets for injection, data leakage, discrimination and misuse plus control questions against a chatbot, by pasting answers or directly against an OpenAI-compatible endpoint; refusal, leak and over-refusal rates as risk-management evidence.'
	},
	legalBasis: [
		{ law: 'KI-VO', ref: 'Art. 9' },
		{ law: 'KI-VO', ref: 'Art. 15' }
	]
};

export const guardrailTest = { manifest };
