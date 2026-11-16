import { error } from '@sveltejs/kit';
import { browser } from '$app/env';
import { loadDetails } from '#lib/organisation/load.js';
import type { Details } from '#lib/organisation/slots.js';
import { getLesson, getTool, tools } from '#lib/tools/registry.js';
import type { EntryGenerator, PageLoad } from './$types';

/** the slide comes from the query, which only the browser knows; static builds prerender a shell */
export const ssr = false;

/** every training module, so static builds can prerender its presenter */
export const entries: EntryGenerator = () =>
	tools
		.filter((tool) => tool.status !== 'planned' && getLesson(tool.slug))
		.map((tool) => ({ slug: tool.slug }));

export const load: PageLoad = async ({ params, depends }) => {
	depends('records:data');
	const tool = getTool(params.slug);
	const lesson = getLesson(params.slug);
	if (!tool || tool.status === 'planned' || !lesson) error(404, 'Werkzeug nicht gefunden');
	// the organisation's details live in the store, which only the browser reaches
	const details: Details = browser ? (await loadDetails()).details : {};
	return { tool, lesson, details };
};
