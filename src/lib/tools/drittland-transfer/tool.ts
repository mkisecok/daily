import type { QuestionnaireCatalog, ToolManifest } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;

const manifest: ToolManifest = {
	slug: 'drittland-transfer',
	category: 'datenschutz',
	status: 'stable',
	shape: 'questionnaire',
	version: catalog.version,
	name: { de: 'Drittland-Transfer', en: 'Third-country transfer' },
	summary: {
		de: 'Ist die Übermittlung außerhalb des EWR zulässig? Prüfung in der Reihenfolge von Kapitel V: Angemessenheitsbeschluss und Data Privacy Framework, Standardvertragsklauseln oder BCR mit Transfer Impact Assessment und ergänzenden Maßnahmen, Ausnahmen nach Art. 49.',
		en: 'Is the transfer outside the EEA lawful? Checked in the order of Chapter V: adequacy decision and Data Privacy Framework, standard contractual clauses or BCRs with transfer impact assessment and supplementary measures, Art. 49 derogations.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 44–49' },
		{ law: 'EuGH', ref: 'C-311/18 (Schrems II)' }
	]
};

export const drittlandTransfer = { manifest, catalog, engine: evaluate };
