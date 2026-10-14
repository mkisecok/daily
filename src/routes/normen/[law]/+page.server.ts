import { error } from '@sveltejs/kit';
import { getLocale } from '#lib/paraglide/runtime.js';
import { lawById } from '#lib/normen/laws.js';
import { ALL_LAWS, lawText, tableOfContents } from '#lib/server/normen.js';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = () => ALL_LAWS.map((law) => ({ law }));

export const load: PageServerLoad = ({ params }) => {
	const law = lawById(params.law);
	if (!law) error(404, 'Gesetz nicht gefunden');
	const lang = getLocale() === 'en' ? 'en' : 'de';
	const text = lawText(law.id);
	return {
		law,
		toc: tableOfContents(law.id, lang),
		source: text.source[lang] ?? text.source.de!,
		retrieved: text.retrieved
	};
};
