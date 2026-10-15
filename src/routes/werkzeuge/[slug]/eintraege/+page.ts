import { error } from '@sveltejs/kit';
import { browser } from '$app/env';
import type { Titles } from '#lib/records/format.js';
import { createLinks, type Backlinks } from '#lib/records/links.js';
import { getStore } from '#lib/records/store/index.js';
import type { Option, RecordTool, StoredRecord } from '#lib/records/types.js';
import { fieldById } from '#lib/records/validate.js';
import { getRecordTool, getTool, listRecordTools, tools } from '#lib/tools/registry.js';
import type { EntryGenerator, PageLoad } from './$types';

/**
 * records come from the store (browser storage or the API), so the page
 * renders on the client only.
 */
export const ssr = false;

/** every built record tool, so static builds can prerender each list page */
export const entries: EntryGenerator = () =>
	tools
		.filter((tool) => tool.status !== 'planned' && getRecordTool(tool.slug))
		.map((tool) => ({ slug: tool.slug }));

/** a referenced record shown in full, with the records pointing to it */
export type Composed = { tool: RecordTool; record: StoredRecord; backlinks: Backlinks };

/** `?eintrag=<id>` shows a record, `?neu=1` the empty form, otherwise the list */
export const load: PageLoad = async ({ params, data, url, depends }) => {
	const tool = getTool(params.slug);
	const recordTool = getRecordTool(params.slug);
	if (!tool || tool.status === 'planned' || !recordTool) error(404, 'Werkzeug nicht gefunden');
	depends('records:data');

	const definition = recordTool.definition;
	const base = {
		...data,
		tool,
		definition,
		titles: {} as Titles,
		choices: {} as Record<string, Option[]>,
		backlinks: [] as Backlinks,
		composed: [] as Composed[]
	};
	// prerendering still calls load; the store only exists in the browser, which loads again
	if (!browser) return { ...base, view: 'list' as const, records: [] };

	const store = getStore();
	const links = createLinks(store, listRecordTools());
	const id = url.searchParams.get('eintrag');

	if (id) {
		const detail = await store.get(id);
		if (!detail) return { ...base, view: 'detail' as const, detail };
		const [titles, choices, backlinks] = await Promise.all([
			links.titles(definition),
			links.choices(definition),
			links.backlinks(tool.slug, id)
		]);
		const composed = await Promise.all(
			(definition.composes ?? []).map(async (fieldId): Promise<Composed | null> => {
				const field = fieldById(definition, fieldId);
				const target = detail.record.data[fieldId];
				if (field?.type !== 'reference' || typeof target !== 'string') return null;
				const targetTool = getRecordTool(field.tool);
				const targetDetail = await store.get(target);
				if (!targetTool || !targetDetail) return null;
				return {
					tool: targetTool,
					record: targetDetail.record,
					backlinks: await links.backlinks(field.tool, target)
				};
			})
		);
		return {
			...base,
			view: 'detail' as const,
			detail,
			titles,
			choices,
			backlinks,
			composed: composed.filter((c): c is Composed => c !== null)
		};
	}
	if (url.searchParams.get('neu') === '1') {
		return { ...base, view: 'new' as const, choices: await links.choices(definition) };
	}
	const [records, titles] = await Promise.all([store.list(tool.slug), links.titles(definition)]);
	return { ...base, view: 'list' as const, records, titles };
};
