import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { toolRuns } from '#lib/server/db/schema.js';
import { getQuestionnaire, getTool } from '#lib/tools/registry.js';
import type { Answers, QuestionnaireResult } from '#lib/tools/types.js';
import type { PageServerLoad } from './$types';

/** needs a signed-in user and the database; never part of a static build */
export const prerender = false;

export const load: PageServerLoad = async ({ params, locals }) => {
	const tool = getTool(params.slug);
	const questionnaire = getQuestionnaire(params.slug);
	if (!tool || !questionnaire || !locals.user) error(404, 'Werkzeug nicht gefunden');

	const organisationId = locals.organisation?.id;
	if (!organisationId) error(403, 'Keine Organisation');

	const run = await db
		.select()
		.from(toolRuns)
		.where(and(eq(toolRuns.id, params.runId), eq(toolRuns.organisationId, organisationId)))
		.limit(1)
		.then((rows) => rows[0]);
	if (!run) error(404, 'Durchlauf nicht gefunden');

	return {
		tool,
		catalog: questionnaire.catalog,
		run: {
			id: run.id,
			createdAt: run.createdAt.toISOString(),
			catalogVersion: run.catalogVersion,
			answers: run.input as Answers,
			result: run.result as QuestionnaireResult
		}
	};
};
