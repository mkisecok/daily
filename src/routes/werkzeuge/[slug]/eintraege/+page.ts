import { error } from '@sveltejs/kit';
import { getStore } from '#lib/records/store/index.js';
import { getRecordTool, getTool, tools } from '#lib/tools/registry.js';
import type { EntryGenerator, PageLoad } from './$types';

/**
 * Records come from the store (browser storage or the API), so the page
 * renders on the client only; prerendering emits an empty shell.
 */
export const ssr = false;

/** Every built record tool, so static builds can prerender each list page. */
export const entries: EntryGenerator = () =>
	tools
		.filter((tool) => tool.status !== 'planned' && getRecordTool(tool.slug))
		.map((tool) => ({ slug: tool.slug }));

/** `?eintrag=<id>` shows a record, `?neu=1` the empty form, otherwise the list. */
export const load: PageLoad = async ({ params, data, url, depends }) => {
	const tool = getTool(params.slug);
	const recordTool = getRecordTool(params.slug);
	if (!tool || tool.status === 'planned' || !recordTool) error(404, 'Werkzeug nicht gefunden');
	depends('records:data');

	const base = { ...data, tool, definition: recordTool.definition };
	const id = url.searchParams.get('eintrag');
	if (id) return { ...base, view: 'detail' as const, detail: await getStore().get(id) };
	if (url.searchParams.get('neu') === '1') return { ...base, view: 'new' as const };
	return { ...base, view: 'list' as const, records: await getStore().list(tool.slug) };
};
