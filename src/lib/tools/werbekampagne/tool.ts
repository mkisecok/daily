import type { RecordTool } from '../../records/types.js';
import type { ToolManifest } from '../types.js';
import { definition, engine } from './engine.js';

const manifest: ToolManifest = {
	slug: 'werbekampagne',
	category: 'datenschutz',
	status: 'beta',
	shape: 'workflow',
	version: definition.version,
	name: { de: 'Newsletter oder Werbekampagne', en: 'Newsletter or campaign' },
	summary: {
		de: 'Werbung per E-Mail, Telefon oder Brief: Einwilligung oder Bestandskundenregel, Dokumentation nach § 7a UWG, Absender und Abmeldung, Widerspruch und Sperrliste, fremde Adresslisten, Messung und Versanddienst, bis zur Freigabe des Versands.',
		en: 'Advertising by email, phone or letter: consent or the existing-customer rule, documentation under § 7a UWG, sender and unsubscribe, objection and suppression list, third-party address lists, tracking and mailing service, up to approval to send.'
	},
	legalBasis: [
		{ law: 'UWG', ref: '§ 7' },
		{ law: 'DSGVO', ref: 'Art. 21' }
	]
};

export const werbekampagne: RecordTool = { manifest, definition, engine };
