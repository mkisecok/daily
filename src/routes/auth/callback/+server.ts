import { error, redirect } from '@sveltejs/kit';
import * as client from 'openid-client';
import { getOidcConfiguration } from '#lib/server/auth/oidc.js';
import { REDIRECT_URI, takeLoginState } from '#lib/server/auth/login.js';
import { createSession } from '#lib/server/auth/session.js';
import type { RequestHandler } from './$types';

/** Keycloak redirects here with `code` and `state`; exchanges them for a session */
export const GET: RequestHandler = async ({ url, cookies }) => {
	const login = takeLoginState(cookies);
	if (!login) error(400, 'Login state missing or expired. Please start again.');

	const configuration = await getOidcConfiguration();

	// Keycloak echoes our redirect URI; rebuild it so a reverse proxy cannot
	// change the host the library compares against.
	const currentUrl = new URL(REDIRECT_URI);
	currentUrl.search = url.search;

	let tokens;
	try {
		tokens = await client.authorizationCodeGrant(configuration, currentUrl, {
			pkceCodeVerifier: login.verifier,
			expectedState: login.state
		});
	} catch (cause) {
		console.error('OIDC code exchange failed', cause);
		error(400, 'Login could not be completed.');
	}

	await createSession(cookies, tokens);
	redirect(303, login.next);
};
