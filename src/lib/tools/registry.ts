import type {
	QuestionnaireCatalog,
	QuestionnaireEngine,
	ToolCategory,
	ToolManifest
} from './types.js';
import { dsfaSchwellwert } from './dsfa-schwellwert/tool.js';
import { risikoklassifizierung } from './risikoklassifizierung/tool.js';
import { transparenzpflichten } from './transparenzpflichten/tool.js';
import { betreiberpflichten } from './betreiberpflichten/tool.js';
import { interessenabwaegung } from './interessenabwaegung/tool.js';
import { einwilligungCheck } from './einwilligung-check/tool.js';
import { drittlandTransfer } from './drittland-transfer/tool.js';
import { kiDsgvoSchnittstelle } from './ki-dsgvo-schnittstelle/tool.js';
import { technischeDokumentation } from './technische-dokumentation/tool.js';
import { planned } from './planned.js';

/**
 * Every tool the platform knows about, built or planned. Order within a
 * category is the order shown in the catalogue.
 */
export const tools: readonly ToolManifest[] = [
	dsfaSchwellwert.manifest,
	risikoklassifizierung.manifest,
	transparenzpflichten.manifest,
	betreiberpflichten.manifest,
	interessenabwaegung.manifest,
	einwilligungCheck.manifest,
	drittlandTransfer.manifest,
	kiDsgvoSchnittstelle.manifest,
	technischeDokumentation.manifest,
	...planned
];

export const categories: readonly ToolCategory[] = ['datenschutz', 'ki', 'audit', 'entwickler'];

export function getTool(slug: string): ToolManifest | undefined {
	return tools.find((tool) => tool.slug === slug);
}

export function toolsByCategory(category: ToolCategory): ToolManifest[] {
	return tools.filter((tool) => tool.category === category);
}

/** Runnable questionnaire tools: catalog + engine, keyed by slug. */
const questionnaires: Record<
	string,
	{ catalog: QuestionnaireCatalog; engine: QuestionnaireEngine }
> = {
	[dsfaSchwellwert.manifest.slug]: {
		catalog: dsfaSchwellwert.catalog,
		engine: dsfaSchwellwert.engine
	},
	[risikoklassifizierung.manifest.slug]: {
		catalog: risikoklassifizierung.catalog,
		engine: risikoklassifizierung.engine
	},
	[transparenzpflichten.manifest.slug]: {
		catalog: transparenzpflichten.catalog,
		engine: transparenzpflichten.engine
	},
	[betreiberpflichten.manifest.slug]: {
		catalog: betreiberpflichten.catalog,
		engine: betreiberpflichten.engine
	},
	[interessenabwaegung.manifest.slug]: {
		catalog: interessenabwaegung.catalog,
		engine: interessenabwaegung.engine
	},
	[einwilligungCheck.manifest.slug]: {
		catalog: einwilligungCheck.catalog,
		engine: einwilligungCheck.engine
	},
	[drittlandTransfer.manifest.slug]: {
		catalog: drittlandTransfer.catalog,
		engine: drittlandTransfer.engine
	},
	[kiDsgvoSchnittstelle.manifest.slug]: {
		catalog: kiDsgvoSchnittstelle.catalog,
		engine: kiDsgvoSchnittstelle.engine
	},
	[technischeDokumentation.manifest.slug]: {
		catalog: technischeDokumentation.catalog,
		engine: technischeDokumentation.engine
	}
};

export function getQuestionnaire(slug: string) {
	return questionnaires[slug];
}
