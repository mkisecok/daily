import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'dsfa',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Datenschutz-Folgenabschätzung', en: 'Data protection impact assessment' },
	summary: {
		de: 'Vollständige DSFA nach Art. 35 Abs. 7: Beschreibung, Notwendigkeit, fünf Risikoquellen vor und nach Abhilfemaßnahmen in der Risikomatrix, Rat des DSB, Freigabe oder vorherige Konsultation nach Art. 36 mit Frist für die Stellungnahme. Druckfassung als Bericht.',
		en: 'Full DPIA under Art. 35(7): description, necessity, five risk sources before and after measures in a risk matrix, DPO advice, sign-off or prior consultation under Art. 36 with the deadline for the opinion. Print version as report.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 35' },
		{ law: 'DSGVO', ref: 'Art. 36' }
	]
};

export const dsfa: RecordTool = { manifest, definition, engine };
