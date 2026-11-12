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
		de: 'Software oder Cloud-Dienst einführen: eine Checkliste für Datenschutz, Sicherheit, Drittland, Beschäftigte und Freigabe, die die vorhandenen Prüfungen verknüpft statt sie zu wiederholen, bis zur dokumentierten Freigabe.',
		en: 'Introducing a software or cloud service: a checklist for data protection, security, third countries, staff and approval that links the existing checks instead of repeating them, up to a documented approval.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 24, 25, 28, 32' },
		{ law: 'BetrVG', ref: '§ 87 Abs. 1 Nr. 6' }
	]
};

export const softwareEinfuehrung: RecordTool = { manifest, definition, engine };
