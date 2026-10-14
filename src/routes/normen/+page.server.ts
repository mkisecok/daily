import { LAWS } from '#lib/normen/laws.js';
import { lawText } from '#lib/server/normen.js';
import type { PageServerLoad } from './$types';

/** The laws with their size; the search index loads in the browser on demand. */
export const load: PageServerLoad = () => ({
	laws: LAWS.map((law) => ({ ...law, count: lawText(law.id).provisions.length }))
});
