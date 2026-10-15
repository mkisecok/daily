import { error } from '@sveltejs/kit';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { toolRuns } from '#lib/server/db/schema.js';
import { getTool } from '#lib/tools/registry.js';
import type { Localized, VerdictLevel } from '#lib/tools/types.js';
import type { PageServerLoad } from './$types';

type RunSummary = {
	id: string;
	createdAt: Date;
	verdict: VerdictLevel | null;
	headline: Localized | null;
};

/** public tool page; lists the signed-in user's previous runs for this tool */
export const load: PageServerLoad = async ({ params, locals }) => {
	const tool = getTool(params.slug);
	if (!tool || tool.status === 'planned') error(404, 'Werkzeug nicht gefunden');

	let runs: RunSummary[] = [];
	if (locals.user) {
		const organisationId = locals.organisation?.id;
		if (organisationId) {
			runs = await db
				.select({
					id: toolRuns.id,
					createdAt: toolRuns.createdAt,
					verdict: sql<VerdictLevel | null>`${toolRuns.verdict}`,
					// each tool words its own result; show that, not a generic label
					headline: sql<Localized | null>`${toolRuns.result} -> 'headline'`
				})
				.from(toolRuns)
				.where(and(eq(toolRuns.organisationId, organisationId), eq(toolRuns.toolSlug, tool.slug)))
				.orderBy(desc(toolRuns.createdAt))
				.limit(20);
		}
	}

	return { tool, runs };
};
