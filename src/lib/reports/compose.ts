import { stateLabel } from '../records/format.js';
import type { Deadline, RecordTool, StoredRecord } from '../records/types.js';
import { isTerminal } from '../records/workflow.js';
import type { Localized, ToolCategory, VerdictLevel } from '../tools/types.js';

export type ReportKind = 'gesamt' | 'datenschutz' | 'ki' | 'audit';

export const KIND_CATEGORIES: Record<ReportKind, ToolCategory[]> = {
	gesamt: ['datenschutz', 'ki', 'audit', 'entwickler'],
	datenschutz: ['datenschutz'],
	ki: ['ki'],
	audit: ['audit']
};

export type Period = { from: string; to: string };

/** A saved questionnaire run as the report needs it. */
export type RunSummary = {
	toolSlug: string;
	createdAt: string;
	verdict: VerdictLevel | null;
	headline: Localized | null;
};

export type OutcomeCount = { headline: Localized; verdict: VerdictLevel; count: number };

export type ToolSection = {
	slug: string;
	name: Localized;
	total: number;
	created: number;
	updated: number;
	/** Workflow tools: records per state, in the order of the definition. */
	states: { label: string; count: number; terminal: boolean }[];
	/** Records grouped by the tool's own assessment of them. */
	outcomes: OutcomeCount[];
	/** Records created or changed in the period, newest change first. */
	items: { id: string; title: string; state: string; updatedAt: string }[];
};

export type Report = {
	sections: ToolSection[];
	deadlines: { overdue: Deadline[]; upcoming: Deadline[] };
	runs: { slug: string; name: Localized; count: number; outcomes: OutcomeCount[] }[];
};

/** `to` is inclusive: the whole last day counts. */
function within(iso: string, period: Period): boolean {
	const day = iso.slice(0, 10);
	return day >= period.from && day <= period.to;
}

function countOutcomes(
	entries: { headline: Localized | null; verdict: VerdictLevel | null }[]
): OutcomeCount[] {
	const groups = new Map<string, OutcomeCount>();
	for (const e of entries) {
		if (!e.headline || !e.verdict) continue;
		const key = `${e.verdict}|${e.headline.de}`;
		const group = groups.get(key) ?? { headline: e.headline, verdict: e.verdict, count: 0 };
		group.count++;
		groups.set(key, group);
	}
	const order: VerdictLevel[] = ['positive', 'conditional', 'negative'];
	return [...groups.values()].sort(
		(a, b) => order.indexOf(a.verdict) - order.indexOf(b.verdict) || b.count - a.count
	);
}

/**
 * The report for a period: per tool what exists, what is new or changed,
 * where workflows stand and how the tool rates its records; open
 * deadlines; questionnaire runs. Pure, so the page and the tests agree.
 */
export function composeReport(input: {
	tools: RecordTool[];
	questionnaires: { slug: string; name: Localized }[];
	records: Record<string, StoredRecord[]>;
	deadlines: Deadline[];
	runs: RunSummary[];
	period: Period;
	locale: string;
	now: Date;
}): Report {
	const { period, locale } = input;
	const sections: ToolSection[] = input.tools.map((tool) => {
		const records = input.records[tool.manifest.slug] ?? [];
		const workflow = tool.definition.workflow;
		const active = records.filter(
			(r) => within(r.updatedAt, period) || within(r.createdAt, period)
		);
		return {
			slug: tool.manifest.slug,
			name: tool.manifest.name,
			total: records.length,
			created: records.filter((r) => within(r.createdAt, period)).length,
			updated: records.filter((r) => within(r.updatedAt, period) && !within(r.createdAt, period))
				.length,
			states: workflow
				? workflow.states
						.map((s) => ({
							label: stateLabel(tool.definition, s.id, locale),
							count: records.filter((r) => r.state === s.id).length,
							terminal: isTerminal(tool.definition, s.id)
						}))
						.filter((s) => s.count > 0)
				: [],
			outcomes: countOutcomes(
				records.map((r) => {
					const result = tool.engine.assess?.(r) ?? null;
					return { headline: result?.headline ?? null, verdict: result?.verdict ?? null };
				})
			),
			items: active
				.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
				.map((r) => ({
					id: r.id,
					title: r.title,
					state: workflow ? stateLabel(tool.definition, r.state, locale) : '',
					updatedAt: r.updatedAt
				}))
		};
	});

	const slugs = new Set(input.tools.map((t) => t.manifest.slug));
	const relevant = input.deadlines.filter((d) => slugs.has(d.toolSlug));
	const now = input.now.toISOString();
	const horizon = new Date(input.now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

	const runs = input.questionnaires
		.map((q) => {
			const own = input.runs.filter((r) => r.toolSlug === q.slug && within(r.createdAt, period));
			return { slug: q.slug, name: q.name, count: own.length, outcomes: countOutcomes(own) };
		})
		.filter((r) => r.count > 0);

	return {
		sections: sections.filter((s) => s.total > 0),
		deadlines: {
			overdue: relevant.filter((d) => d.dueAt < now),
			upcoming: relevant.filter((d) => d.dueAt >= now && d.dueAt <= horizon)
		},
		runs
	};
}
