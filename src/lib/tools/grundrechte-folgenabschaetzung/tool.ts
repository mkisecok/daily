import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'grundrechte-folgenabschaetzung',
	category: 'ki',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Grundrechte-Folgenabschätzung', en: 'Fundamental rights impact assessment' },
	summary: {
		de: 'Abschätzung nach Art. 27 für öffentliche Stellen, private Stellen mit öffentlichen Aufgaben sowie Kredit- und Versicherungsbetreiber: Anwendbarkeit, Elemente lit. a bis f, berührte Grundrechte, Verweis auf die DSFA, Mitteilung an die Marktüberwachungsbehörde und erste Verwendung als Frist.',
		en: 'Assessment under Art. 27 for public bodies, private entities providing public services and credit or insurance deployers: applicability, elements (a) to (f), rights concerned, reference to the DPIA, notification of the market surveillance authority and first use as a deadline.'
	},
	legalBasis: [
		{ law: 'KI-VO', ref: 'Art. 27' },
		{ law: 'KI-VO', ref: 'Anhang III Nr. 5' }
	]
};

export const grundrechteFolgenabschaetzung: RecordTool = { manifest, definition, engine };
