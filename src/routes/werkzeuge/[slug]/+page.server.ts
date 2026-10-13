import { error } from '@sveltejs/kit';
import { desc, eq, and } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { toolRuns } from '#lib/server/db/schema.js';
import { getActiveOrganisationId } from '#lib/server/org.js';
import { getTool } from '#lib/tools/registry.js';
import type { PageServerLoad } from './$types';

/** Public tool page; lists the signed-in user's previous runs for this tool. */
export const load: PageServerLoad = async ({ params, locals }) => {
	const tool = getTool(params.slug);
	if (!tool || tool.status === 'planned') error(404, 'Werkzeug nicht gefunden');

	let runs: { id: string; createdAt: Date; verdict: string | null }[] = [];
	if (locals.user) {
		const organisationId = await getActiveOrganisationId(locals.user.id);
		if (organisationId) {
			runs = await db
				.select({ id: toolRuns.id, createdAt: toolRuns.createdAt, verdict: toolRuns.verdict })
				.from(toolRuns)
				.where(and(eq(toolRuns.organisationId, organisationId), eq(toolRuns.toolSlug, tool.slug)))
				.orderBy(desc(toolRuns.createdAt))
				.limit(20);
		}
	}

	return { tool, runs };
};
