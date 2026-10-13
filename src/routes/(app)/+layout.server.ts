import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/** Everything in the (app) group requires a signed-in user. */
export const load: LayoutServerLoad = ({ locals, url }) => {
	if (!locals.user) {
		const next = encodeURIComponent(url.pathname + url.search);
		redirect(303, `/auth/login?next=${next}`);
	}
	return { user: locals.user };
};
