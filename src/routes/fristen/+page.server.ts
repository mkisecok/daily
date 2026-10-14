import { redirect } from '@sveltejs/kit';
import { PUBLIC_PREVIEW } from '$app/env/public';
import type { PageServerLoad } from './$types';

/** Deadlines come from the organisation's records: sign-in required outside the preview. */
export const load: PageServerLoad = ({ locals, url }) => {
	if (!PUBLIC_PREVIEW && !locals.user) {
		redirect(303, `/auth/login?next=${encodeURIComponent(url.pathname)}`);
	}
	return { preview: PUBLIC_PREVIEW };
};
