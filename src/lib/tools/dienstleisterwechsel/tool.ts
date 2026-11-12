import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'dienstleisterwechsel',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Dienstleister wechseln oder Vertrag beenden', en: 'Changing or leaving a provider' },
	summary: {
		de: 'Einen Auftragsverarbeiter wechseln oder den Vertrag beenden: Rückgabe oder Löschung nach Art. 28 Abs. 3 lit. g, Löschbestätigung auch für Unterauftragnehmer, Zugänge, neuer AVV und die Wechselrechte des Data Act bei Cloud-Diensten.',
		en: 'Changing a processor or ending the contract: return or deletion under Art. 28(3)(g), deletion confirmed for sub-processors too, access, the new processing agreement and the Data Act’s switching rights for cloud services.'
	},
	legalBasis: [
		{ law: 'DSGVO', ref: 'Art. 28 Abs. 3 lit. g' },
		{ law: 'Data Act', ref: 'Art. 25' }
	]
};

export const dienstleisterwechsel: RecordTool = { manifest, definition, engine };
