import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'datenpanne',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Datenpanne', en: 'Personal data breach' },
	summary: {
		de: '72-Stunden-Uhr ab Kenntnis, Risikobewertung (Meldung an die Behörde? Benachrichtigung der Betroffenen?), Inhalt nach Art. 33 Abs. 3, Status von der Erfassung bis zum Abschluss und Dokumentation nach Art. 33 Abs. 5.',
		en: '72-hour clock from awareness, risk assessment (notify the authority? inform data subjects?), Art. 33(3) contents, status from recording to closure and documentation under Art. 33(5).'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 33' },
		{ law: 'DSGVO', ref: 'Art. 34' }
	]
};

export const datenpanne: RecordTool = { manifest, definition, engine };
