import { browser } from '$app/env';
import { loadDetails } from '#lib/organisation/load.js';
import { definition } from '#lib/organisation/tool.js';
import { getLesson } from '#lib/tools/registry.js';
import type { PageLoad } from './$types';

/** the details come from the store, so the page renders on the client only */
export const ssr = false;

/** `?fuer=<lesson>` leads back to that training module after saving */
export const load: PageLoad = async ({ data, url, depends }) => {
	depends('records:data');
	const lesson = url.searchParams.get('fuer');
	const back = lesson && getLesson(lesson) ? lesson : null;
	if (!browser) return { ...data, definition, back, record: null };
	const { record } = await loadDetails();
	return { ...data, definition, back, record };
};
