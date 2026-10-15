import { redirect } from '@sveltejs/kit';
import { PUBLIC_PREVIEW } from '$app/env/public';
import type { PageServerLoad } from './$types';

/** notes belong to an organisation: sign-in required outside the preview */
export const load: PageServerLoad = ({ locals, url }) => {
	if (!PUBLIC_PREVIEW && !locals.user) {
		redirect(303, `/auth/login?next=${encodeURIComponent(url.pathname + url.search)}`);
	}
	return { preview: PUBLIC_PREVIEW };
};
