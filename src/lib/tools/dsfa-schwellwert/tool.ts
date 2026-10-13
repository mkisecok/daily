import type { QuestionnaireCatalog, ToolManifest } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;

const manifest: ToolManifest = {
	slug: 'dsfa-schwellwert',
	category: 'datenschutz',
	status: 'stable',
	shape: 'questionnaire',
	version: catalog.version,
	name: { de: 'DSFA-Schwellwertanalyse', en: 'DPIA screening' },
	summary: {
		de: 'Ist eine Datenschutz-Folgenabschätzung erforderlich? Prüfung der Regelbeispiele des Art. 35 Abs. 3, der DSK-Muss-Liste und der neun Kriterien aus WP 248.',
		en: 'Is a data protection impact assessment required? Checks the Art. 35(3) examples, the DSK must-list and the nine WP 248 criteria.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 35 Abs. 3' },
		{ law: 'DSGVO', ref: 'Art. 35 Abs. 4' },
		{ law: 'WP29', ref: 'WP 248 rev. 01' }
	]
};

export const dsfaSchwellwert = { manifest, catalog, engine: evaluate };
