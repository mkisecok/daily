import type {
	QuestionnaireCatalog,
	QuestionnaireEngine,
	ToolCategory,
	ToolManifest
} from './types.js';
import { dsfaSchwellwert } from './dsfa-schwellwert/tool.js';
import { planned } from './planned.js';

/**
 * Every tool the platform knows about, built or planned. Order within a
 * category is the order shown in the catalogue.
 */
export const tools: readonly ToolManifest[] = [dsfaSchwellwert.manifest, ...planned];

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
	}
};

export function getQuestionnaire(slug: string) {
	return questionnaires[slug];
}
