import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { toolRuns } from '#lib/server/db/schema.js';
import { getActiveOrganisationId } from '#lib/server/org.js';
import { getQuestionnaire, getTool } from '#lib/tools/registry.js';
import type { Answers, YesNoAnswer } from '#lib/tools/types.js';
import type { Actions, PageServerLoad } from './$types';

const ANSWER_PREFIX = 'answer.';

function isYesNo(value: FormDataEntryValue | null): value is YesNoAnswer {
	return value === 'yes' || value === 'no' || value === 'unknown';
}

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

		const organisationId = await getActiveOrganisationId(locals.user.id);
		if (!organisationId) error(403, 'Keine Organisation');

		const form = await request.formData();
		const answers: Answers = {};
		const missing: string[] = [];
		for (const section of questionnaire.catalog.sections) {
			for (const question of section.questions) {
				const value = form.get(ANSWER_PREFIX + question.id);
				if (isYesNo(value)) answers[question.id] = value;
				else missing.push(question.id);
			}
		}
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

		redirect(303, `/werkzeuge/${tool.slug}/${run.id}`);
	}
};
