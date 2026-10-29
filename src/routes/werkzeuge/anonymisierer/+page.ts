import { error } from '@sveltejs/kit';
import { getTool } from '#lib/tools/registry.js';
import type { PageLoad } from './$types';

/** detection and restoring run in the browser; the page itself is static */
export const load: PageLoad = () => {
	const tool = getTool('anonymisierer');
	if (!tool) error(404, 'Werkzeug nicht gefunden');
	return { tool };
};
