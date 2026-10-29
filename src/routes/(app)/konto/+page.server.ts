import { error, fail, redirect } from '@sveltejs/kit';
import { accountOverview, deleteAccount } from '#lib/server/account.js';
import { buildDeleteAccountUrl } from '#lib/server/auth/login.js';
import { destroySession } from '#lib/server/auth/session.js';
import { db } from '#lib/server/db/index.js';
import type { Actions, PageServerLoad } from './$types';

/** needs a signed-in user and the database; never part of a static build */
export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) error(401, 'Not signed in');
	return { account: await accountOverview(db, locals.user.id) };
};

export const actions: Actions = {
	/**
	 * deletes the user's data in Daily, ends the session and hands over to
	 * Keycloak, where the user confirms deleting the login itself
	 */
	loeschen: async ({ locals, cookies }) => {
		if (!locals.user) error(401, 'Not signed in');
		const result = await deleteAccount(db, locals.user.id);
		if (!result.ok) return fail(409, { shared: result.organisations });
		await destroySession(cookies);
		redirect(303, (await buildDeleteAccountUrl()).href, { external: true });
	}
};
