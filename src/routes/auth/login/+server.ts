import { redirect } from '@sveltejs/kit';
import * as client from 'openid-client';
import { getLocale } from '#lib/paraglide/runtime.js';
import { getOidcConfiguration } from '#lib/server/auth/oidc.js';
import { REDIRECT_URI, safeNextPath, storeLoginState } from '#lib/server/auth/login.js';
import type { RequestHandler } from './$types';

/** starts the Authorization Code flow with PKCE against Keycloak */
export const GET: RequestHandler = async ({ url, cookies, locals }) => {
	const next = safeNextPath(url.searchParams.get('next'));
	if (locals.user) redirect(303, next);

	const configuration = await getOidcConfiguration();
	const verifier = client.randomPKCECodeVerifier();
	const challenge = await client.calculatePKCECodeChallenge(verifier);
	const state = client.randomState();

	storeLoginState(cookies, { verifier, state, next });

	const authorizationUrl = client.buildAuthorizationUrl(configuration, {
		redirect_uri: REDIRECT_URI,
		scope: 'openid profile email',
		code_challenge: challenge,
		code_challenge_method: 'S256',
		state,
		ui_locales: getLocale()
	});

	redirect(303, authorizationUrl.href, { external: true });
};
