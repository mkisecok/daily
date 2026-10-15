import { browser } from '$app/env';
import { resolve } from '$app/paths';
import { NOTES } from '#lib/notes/tool.js';
import { getLocale } from '#lib/paraglide/runtime.js';
import {
	composeReport,
	KIND_CATEGORIES,
	type Report,
	type ReportKind,
	type RunSummary
} from '#lib/reports/compose.js';
import { getStore } from '#lib/records/store/index.js';
import type { StoredRecord } from '#lib/records/types.js';
import { getQuestionnaire, getRecordTool, tools } from '#lib/tools/registry.js';
import type { PageLoad } from './$types';

/** records come from the store, so the page renders on the client only */
export const ssr = false;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const KINDS: ReportKind[] = ['gesamt', 'datenschutz', 'ki', 'audit'];

/** `?art=datenschutz&von=2026-01-01&bis=2026-12-31`; defaults to this year's overall report */
export const load: PageLoad = async ({ data, url, fetch, depends }) => {
	depends('records:data');
	const year = new Date().getFullYear();
	const kindParam = url.searchParams.get('art') as ReportKind | null;
	const kind: ReportKind = kindParam && KINDS.includes(kindParam) ? kindParam : 'gesamt';
	const from = url.searchParams.get('von') ?? '';
	const to = url.searchParams.get('bis') ?? '';
	const period = {
		from: DAY.test(from) ? from : `${year}-01-01`,
		to: DAY.test(to) ? to : `${year}-12-31`
	};
	const base = { ...data, kind, period, report: null as Report | null };
	// prerendering still calls load; the browser loads again
	if (!browser) return base;

	const categories = KIND_CATEGORIES[kind];
	const inScope = tools.filter((t) => categories.includes(t.category) && t.status !== 'planned');
	const recordTools = inScope.flatMap((t) => {
		const tool = getRecordTool(t.slug);
		return tool && t.slug !== NOTES ? [tool] : [];
	});
	const questionnaires = inScope
		.filter((t) => getQuestionnaire(t.slug))
		.map((t) => ({ slug: t.slug, name: t.name }));

	const store = getStore();
	const lists = await Promise.all(recordTools.map((t) => store.list(t.manifest.slug)));
	const records: Record<string, StoredRecord[]> = Object.fromEntries(
		recordTools.map((t, i) => [t.manifest.slug, lists[i]])
	);
	let runs: RunSummary[] = [];
	if (!data.preview) {
		const response = await fetch(`${resolve('/api/runs')}?from=${period.from}&to=${period.to}`);
		if (response.ok) runs = (await response.json()) as RunSummary[];
	}
	const report = composeReport({
		tools: recordTools,
		questionnaires,
		records,
		deadlines: await store.deadlines(),
		runs,
		period,
		locale: getLocale(),
		now: new Date()
	});
	return { ...base, report };
};
