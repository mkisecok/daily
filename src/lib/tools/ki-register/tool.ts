import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'ki-register',
	category: 'ki',
	status: 'beta',
	shape: 'register',
	version: definition.version,
	name: { de: 'KI-Register', en: 'AI system register' },
	summary: {
		de: 'Inventar der KI-Systeme: Zweck, Rolle (Anbieter/Betreiber), Modell, Datenkategorien, Risikoklasse mit übernommener Risikoklassifizierung, Verantwortliche und Wiedervorlage. Mit Pflichtenübersicht, Verlauf, CSV-Export und Druckfassung.',
		en: 'Inventory of AI systems: purpose, role (provider/deployer), model, data categories, risk class backed by the risk classification, owner and review date. With an obligations overview, history, CSV export and print version.'
	},
	legalBasis: [
		{ law: 'KI-VO', ref: 'Art. 3' },
		{ law: 'KI-VO', ref: 'Art. 6' },
		{ law: 'KI-VO', ref: 'Art. 26' }
	]
};

export const kiRegister: RecordTool = { manifest, definition, engine };
