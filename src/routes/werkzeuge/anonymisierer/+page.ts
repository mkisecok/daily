import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { localized } from '#lib/i18n/links.js';
import type { PageLoad } from './$types';

/**
 * the tool was called Anonymisierer until November 2026; old links and
 * bookmarks land on its new address. Prerendered, this becomes a page that
 * forwards by meta refresh.
 */
export const load: PageLoad = () => {
	redirect(308, resolve(localized('/werkzeuge/pseudonymisierer')));
};
