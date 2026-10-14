import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { toolRuns } from '#lib/server/db/schema.js';
import { localizeHref } from '#lib/paraglide/runtime.js';
import { readAnswers } from '#lib/tools/answers.js';
import { getQuestionnaire, getTool } from '#lib/tools/registry.js';
import type { Actions, PageServerLoad } from './$types';

/** Needs a signed-in user and the database; never part of a static build. */
export const prerender = false;

export const load: PageServerLoad = ({ params }) => {
	const tool = getTool(params.slug);
	const questionnaire = getQuestionnaire(params.slug);
	if (!tool || !questionnaire) error(404, 'Werkzeug nicht gefunden');
	return { tool, catalog: questionnaire.catalog };
};

export const actions: Actions = {
	default: async ({ params, request, locals }) => {
		const tool = getTool(params.slug);
		const questionnaire = getQuestionnaire(params.slug);
		if (!tool || !questionnaire || !locals.user) error(404, 'Werkzeug nicht gefunden');

		const organisationId = locals.organisation?.id;
		if (!organisationId) error(403, 'Keine Organisation');

		const { answers, missing } = readAnswers(questionnaire.catalog, await request.formData());
		if (missing.length > 0) return fail(400, { missing, answers });

		const result = questionnaire.engine(questionnaire.catalog, answers);
		const [run] = await db
			.insert(toolRuns)
			.values({
				organisationId,
				userId: locals.user.id,
				toolSlug: tool.slug,
				shape: 'questionnaire',
				catalogVersion: questionnaire.catalog.version,
				input: answers,
				result,
				verdict: result.verdict
			})
			.returning({ id: toolRuns.id });

		redirect(303, localizeHref(`/werkzeuge/${tool.slug}/${run.id}`));
	}
};
