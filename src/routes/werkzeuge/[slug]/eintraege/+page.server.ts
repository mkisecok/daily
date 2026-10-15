import { redirect } from '@sveltejs/kit';
import { PUBLIC_PREVIEW } from '$app/env/public';
import type { PageServerLoad } from './$types';

/**
 * records belong to an organisation, so the full app needs a signed-in
 * user. The static preview keeps records in the browser and needs nobody.
 */
export const load: PageServerLoad = ({ locals, url }) => {
	if (!PUBLIC_PREVIEW && !locals.user) {
		redirect(303, `/auth/login?next=${encodeURIComponent(url.pathname + url.search)}`);
	}
	return { preview: PUBLIC_PREVIEW };
};
