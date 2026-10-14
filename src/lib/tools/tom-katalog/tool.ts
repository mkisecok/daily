import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'tom-katalog',
	category: 'datenschutz',
	status: 'beta',
	shape: 'register',
	version: definition.version,
	name: { de: 'TOM-Katalog', en: 'Technical and organisational measures' },
	summary: {
		de: 'Maßnahmen je System nach den sieben Gewährleistungszielen des Standard-Datenschutzmodells, mit Schutzbedarf, Prüfung gegen Art. 32 Abs. 1 lit. a bis d und Wiedervorlage der Wirksamkeitsprüfung.',
		en: 'Measures per system along the seven protection goals of the Standard Data Protection Model, with protection requirement, a check against Art. 32(1)(a) to (d) and review dates for effectiveness reviews.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 32' },
		{ law: 'DSK', ref: 'Standard-Datenschutzmodell' }
	]
};

export const tomKatalog: RecordTool = { manifest, definition, engine };
