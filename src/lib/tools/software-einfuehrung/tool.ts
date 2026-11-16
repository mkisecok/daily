import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'software-einfuehrung',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Neue Software einführen', en: 'Introducing software' },
	summary: {
		de: 'Software oder Cloud-Dienst einführen: eine Checkliste für Datenschutz, Sicherheit, Drittland, Beschäftigte und Freigabe, die die vorhandenen Prüfungen verknüpft statt sie zu wiederholen, bis zur dokumentierten Freigabe. Löst sie einen Dienstleister ab: Kündigung, Rückgabe oder Löschung nach Art. 28 Abs. 3 lit. g, Löschbestätigung auch für Unterauftragnehmer und die Wechselrechte des Data Act.',
		en: 'Introducing a software or cloud service: a checklist for data protection, security, third countries, staff and approval that links the existing checks instead of repeating them, up to a documented approval. When it replaces a provider: notice, return or deletion under Art. 28(3)(g), deletion confirmed for sub-processors too and the Data Act’s switching rights.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 24, 25, 28, 32' },
		{ law: 'BetrVG', ref: '§ 87 Abs. 1 Nr. 6' }
	]
};

export const softwareEinfuehrung: RecordTool = { manifest, definition, engine };
