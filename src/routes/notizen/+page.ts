import { browser } from '$app/env';
import { NOTES } from '#lib/notes/tool.js';
import { getStore } from '#lib/records/store/index.js';
import type { StoredRecord } from '#lib/records/types.js';
import type { PageLoad } from './$types';

/** Notes come from the store, so the page renders on the client only. */
export const ssr = false;

export type Prefill = { titel: string; quelle: string; text: string };

/** `?notiz=<id>` shows a note, `?neu=1` the editor (prefilled from the query), otherwise the list. */
export const load: PageLoad = async ({ data, url, depends }) => {
	depends('records:data');
	const base = { ...data, notes: [] as StoredRecord[] };
	// Prerendering still calls load; the browser loads again.
	if (!browser) return { ...base, view: 'list' as const };
	const store = getStore();
	const id = url.searchParams.get('notiz');
	if (id) return { ...base, view: 'note' as const, detail: await store.get(id) };
	if (url.searchParams.get('neu') === '1') {
		const prefill: Prefill = {
			titel: url.searchParams.get('titel') ?? '',
			quelle: url.searchParams.get('quelle') ?? '',
			text: url.searchParams.get('text') ?? ''
		};
		return { ...base, view: 'new' as const, prefill };
	}
	return { ...base, view: 'list' as const, notes: await store.list(NOTES) };
};
