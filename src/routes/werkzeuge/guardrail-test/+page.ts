import { error } from '@sveltejs/kit';
import { getTool } from '#lib/tools/registry.js';
import type { PageLoad } from './$types';

/** The test runs in the browser; the page itself is static. */
export const load: PageLoad = () => {
	const tool = getTool('guardrail-test');
	if (!tool) error(404, 'Werkzeug nicht gefunden');
	return { tool };
};
