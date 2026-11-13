import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'unternehmenskauf',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Unternehmenskauf und Betriebsübergang', en: 'Company purchase and transfer' },
	summary: {
		de: 'Kauf, Verkauf oder Verschmelzung: Datenraum in der Due Diligence, Kundendaten im Asset Deal nach den Fallgruppen der DSK von 2024, Konzernflüsse im Share Deal, Betriebsübergang nach § 613a BGB und die Integration danach.',
		en: 'Buying, selling or merging: the data room in due diligence, customer data in an asset deal by the DSK case groups of 2024, group flows in a share deal, transfer of undertaking under § 613a BGB and the integration afterwards.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 6' },
		{ law: 'BGB', ref: '§ 613a' }
	]
};

export const unternehmenskauf: RecordTool = { manifest, definition, engine };
