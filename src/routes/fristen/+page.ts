import { browser } from '$app/env';
import { getStore } from '#lib/records/store/index.js';
import type { PageLoad } from './$types';

/** Deadlines come from the store, so the page renders on the client only. */
export const ssr = false;

export const load: PageLoad = async ({ data }) => {
	// Prerendering still calls load; the browser loads again.
	if (!browser) return { ...data, deadlines: [] };
	return { ...data, deadlines: await getStore().deadlines() };
};
