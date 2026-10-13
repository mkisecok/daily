import { redirect } from '@sveltejs/kit';
import * as client from 'openid-client';
import { getOidcConfiguration } from '#lib/server/auth/oidc.js';
import { POST_LOGOUT_REDIRECT_URI } from '#lib/server/auth/login.js';
import { destroySession } from '#lib/server/auth/session.js';
import type { RequestHandler } from './$types';

/** Ends the local session, then the Keycloak SSO session (RP-initiated logout). */
export const POST: RequestHandler = async ({ cookies, locals }) => {
	const idToken = locals.session?.idToken;
	await destroySession(cookies);

	if (idToken) {
		const configuration = await getOidcConfiguration();
		const endSessionUrl = client.buildEndSessionUrl(configuration, {
			id_token_hint: idToken,
			post_logout_redirect_uri: POST_LOGOUT_REDIRECT_URI
		});
		redirect(303, endSessionUrl.href, { external: true });
	}

	redirect(303, '/');
};
