import { error, json } from '@sveltejs/kit';
import { and, asc, eq, gte, lt, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { toolRuns } from '#lib/server/db/schema.js';
import type { RunSummary } from '#lib/reports/compose.js';
import type { Localized, VerdictLevel } from '#lib/tools/types.js';
import type { RequestHandler } from './$types';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** `GET /api/runs?from=YYYY-MM-DD&to=YYYY-MM-DD`: saved questionnaire runs of the active organisation */
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) error(401, 'Not signed in');
	if (!locals.organisation) error(403, 'No organisation');
	const from = url.searchParams.get('from') ?? '';
	const to = url.searchParams.get('to') ?? '';
	if (!DAY.test(from) || !DAY.test(to)) error(400, 'from and to must be dates');
	const end = new Date(`${to}T00:00:00.000Z`);
	end.setUTCDate(end.getUTCDate() + 1);

	const rows = await db
		.select({
			toolSlug: toolRuns.toolSlug,
			createdAt: toolRuns.createdAt,
			verdict: sql<VerdictLevel | null>`${toolRuns.verdict}`,
			headline: sql<Localized | null>`${toolRuns.result} -> 'headline'`
		})
		.from(toolRuns)
		.where(
			and(
				eq(toolRuns.organisationId, locals.organisation.id),
				gte(toolRuns.createdAt, new Date(`${from}T00:00:00.000Z`)),
				lt(toolRuns.createdAt, end)
			)
		)
		.orderBy(asc(toolRuns.createdAt));

	const runs: RunSummary[] = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
	return json(runs);
};
