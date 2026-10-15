import { error } from '@sveltejs/kit';
import { getLocale } from '#lib/paraglide/runtime.js';
import { lawById } from '#lib/normen/laws.js';
import { allProvisionIds, provisionPage } from '#lib/server/normen.js';
import type { EntryGenerator, PageServerLoad } from './$types';

/** every provision of every law, so the static preview has them all */
export const entries: EntryGenerator = () => allProvisionIds();

export const load: PageServerLoad = ({ params }) => {
	const law = lawById(params.law);
	if (!law) error(404, 'Gesetz nicht gefunden');
	const page = provisionPage(law.id, params.id, getLocale() === 'en' ? 'en' : 'de');
	if (!page) error(404, 'Vorschrift nicht gefunden');
	return { law, ...page };
};
