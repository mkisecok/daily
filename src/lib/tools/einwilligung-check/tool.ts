import type { QuestionnaireCatalog, ToolManifest } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;

const manifest: ToolManifest = {
	slug: 'einwilligung-check',
	category: 'datenschutz',
	status: 'stable',
	shape: 'questionnaire',
	version: catalog.version,
	name: { de: 'Cookie- und Einwilligungs-Check', en: 'Cookie and consent check' },
	summary: {
		de: 'Braucht die Website eine Einwilligung nach § 25 TDDDG, und ist das Banner wirksam? Blockieren vor der Zustimmung, Ablehnen auf der ersten Ebene, keine Vorauswahl, Information, Widerruf, Nachweis und Drittlandübermittlung. Jeder Mangel mit Abhilfe.',
		en: 'Does the website need consent under § 25 TDDDG, and is the banner valid? Blocking before consent, reject on the first layer, no pre-ticked boxes, information, withdrawal, proof and third-country transfers. Every defect with a remedy.'
	},
	legalBasis: [
		{ law: 'TDDDG', ref: '§ 25' },
		{ law: 'DSGVO', ref: 'Art. 7' }
	]
};

export const einwilligungCheck = { manifest, catalog, engine: evaluate };
