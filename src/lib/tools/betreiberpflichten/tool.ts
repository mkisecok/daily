import type { QuestionnaireCatalog, ToolManifest } from '../types.js';
import catalogJson from './catalog.json' with { type: 'json' };
import { evaluate } from './engine.js';

const catalog = catalogJson as QuestionnaireCatalog;

const manifest: ToolManifest = {
	slug: 'betreiberpflichten',
	category: 'ki',
	status: 'stable',
	shape: 'questionnaire',
	version: catalog.version,
	name: { de: 'Betreiberpflichten', en: 'Deployer obligations' },
	summary: {
		de: 'Prüfliste für Betreiber von Hochrisiko-KI-Systemen: Betriebsanleitung, menschliche Aufsicht, Eingabedaten, Überwachung, Protokolle, Information von Beschäftigten und Betroffenen, DSFA, Grundrechte-Folgenabschätzung. Jede Lücke mit Abhilfe.',
		en: 'Checklist for deployers of high-risk AI systems: instructions for use, human oversight, input data, monitoring, logs, informing staff and affected persons, DPIA, fundamental rights impact assessment. Every gap with a remedy.'
	},
	legalBasis: [
		{ law: 'KI-VO', ref: 'Art. 26' },
		{ law: 'KI-VO', ref: 'Art. 4, 27, 86' }
	]
};

export const betreiberpflichten = { manifest, catalog, engine: evaluate };
