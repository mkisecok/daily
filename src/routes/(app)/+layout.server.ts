import { redirect } from '@sveltejs/kit';
import { PUBLIC_PREVIEW } from '$app/env/public';
import { resolve } from '$app/paths';
import { localized } from '#lib/i18n/links.js';
import type { LayoutServerLoad } from './$types';

/**
 * everything in the (app) group requires a signed-in user. The static
 * preview has no sign-in, so it points to the page that explains that.
 */
export const load: LayoutServerLoad = ({ locals, url }) => {
	if (!locals.user) {
		if (PUBLIC_PREVIEW) redirect(307, resolve(localized('/vorschau')));
		const next = encodeURIComponent(url.pathname + url.search);
		redirect(303, `/auth/login?next=${next}`);
	}
	return { user: locals.user };
};
