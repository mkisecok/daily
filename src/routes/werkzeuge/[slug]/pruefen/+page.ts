import { error } from '@sveltejs/kit';
import { getQuestionnaire, getTool, tools } from '#lib/tools/registry.js';
import type { EntryGenerator, PageLoad } from './$types';

/** every built questionnaire tool, so static builds can prerender each one */
export const entries: EntryGenerator = () =>
	tools
		.filter((tool) => tool.status !== 'planned' && getQuestionnaire(tool.slug))
		.map((tool) => ({ slug: tool.slug }));

export const load: PageLoad = ({ params }) => {
	const tool = getTool(params.slug);
	const questionnaire = getQuestionnaire(params.slug);
	if (!tool || tool.status === 'planned' || !questionnaire) error(404, 'Werkzeug nicht gefunden');
	return { tool, catalog: questionnaire.catalog };
};
