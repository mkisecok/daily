import { error, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { safeNextPath } from '#lib/server/auth/login.js';
import { toggleBookmark } from '#lib/server/feed/query.js';
import type { RequestHandler } from './$types';

const UUID = /^[0-9a-f-]{36}$/;

/**
 * Toggles a bookmark. Called with fetch (JSON reply) from the news page, or
 * as a plain form post without JavaScript (redirect back to `back`). An
 * endpoint instead of a form action keeps the news page prerenderable.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const form = await request.formData();
	const back = safeNextPath(form.get('back')?.toString());
	const wantsJson = request.headers.get('accept')?.includes('application/json') ?? false;

	if (!locals.user) {
		if (wantsJson) error(401, 'Not signed in');
		redirect(303, `/auth/login?next=${encodeURIComponent(back)}`);
	}

	const itemId = form.get('item');
	if (typeof itemId !== 'string' || !UUID.test(itemId)) error(400, 'Invalid item');

	const bookmarked = await toggleBookmark(db, locals.user.id, itemId);
	if (wantsJson) return Response.json({ itemId, bookmarked });
	redirect(303, back);
};
