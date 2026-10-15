import { error, json } from '@sveltejs/kit';
import { searchIndex } from '#lib/server/normen.js';
import type { EntryGenerator, RequestHandler } from './$types';

/** a static file in every build: the search index per language */
export const prerender = true;

export const entries: EntryGenerator = () => [{ lang: 'de' }, { lang: 'en' }];

export const GET: RequestHandler = ({ params }) => {
	if (params.lang !== 'de' && params.lang !== 'en') error(404, 'Not found');
	return json(searchIndex(params.lang));
};
