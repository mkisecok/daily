import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'sdm-wuerfel',
	category: 'datenschutz',
	status: 'beta',
	shape: 'register',
	version: definition.version,
	name: { de: 'SDM-Würfel', en: 'SDM cube' },
	summary: {
		de: 'Eine Verarbeitungstätigkeit im Würfel des Standard-Datenschutzmodells: Vorgänge oder Lebenszyklus-Phasen, die Ebenen Fachverfahren, Fachapplikation und Infrastruktur und die sieben Gewährleistungsziele. Das Ergebnis zeigt den Würfel mit allen Lücken und offenen Zellen.',
		en: 'A processing activity in the cube of the Standard Data Protection Model: operations or life-cycle phases, the levels business process, application and infrastructure, and the seven protection goals. The result shows the cube with every gap and open cell.'
	},
	legalBasis: [
		{ law: 'DSK', ref: 'Standard-Datenschutzmodell V3.1a, D2.6' },
		{ law: 'DSGVO', ref: 'Art. 25' }
	]
};

export const sdmWuerfel: RecordTool = { manifest, definition, engine };
