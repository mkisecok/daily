import type { ToolManifest } from '../types.js';

export const manifest: ToolManifest = {
	slug: 'anonymisierer',
	category: 'datenschutz',
	status: 'beta',
	shape: 'utility',
	version: 1,
	name: { de: 'Anonymisierer', en: 'Anonymiser' },
	summary: {
		de: 'Text im Browser pseudonymisieren, bevor er in einen KI-Chat geht, und die Antwort danach mit den echten Werten zurückübersetzen. Nichts verlässt den Browser.',
		en: 'Pseudonymise text in the browser before it goes into an AI chat, then restore the real values in the reply. Nothing leaves the browser.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 4 Nr. 5' },
		{ law: 'DSGVO', ref: 'Art. 25' },
		{ law: 'DSGVO', ref: 'Art. 32' }
	]
};

export const anonymisierer = { manifest };
