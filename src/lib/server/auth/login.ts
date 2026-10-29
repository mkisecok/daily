import type { Cookies } from '@sveltejs/kit';
import * as client from 'openid-client';
import { dev } from '$app/env';
import { APP_ORIGIN } from '$app/env/private';
import { getOidcConfiguration } from './oidc.js';

/** short-lived cookie carrying the PKCE verifier and state across the redirect */
export const LOGIN_COOKIE = 'daily_login';
const LOGIN_MAX_AGE_SECONDS = 10 * 60;

export type LoginState = {
	verifier: string;
	state: string;
	next: string;
};

export const REDIRECT_URI = `${APP_ORIGIN}/auth/callback`;
export const POST_LOGOUT_REDIRECT_URI = `${APP_ORIGIN}/`;
/** where Keycloak returns after its "Delete account" step; registered in the realm */
export const ACCOUNT_DELETED_URI = `${APP_ORIGIN}/konto/geloescht`;

/**
 * Keycloak's own "Delete account" step (application-initiated action
 * `delete_account`): the user confirms there and Keycloak deletes the login,
 * so Daily never needs rights to manage users. No code is exchanged on the
 * way back; the landing page only confirms.
 */
export async function buildDeleteAccountUrl(): Promise<URL> {
	const configuration = await getOidcConfiguration();
	return client.buildAuthorizationUrl(configuration, {
		redirect_uri: ACCOUNT_DELETED_URI,
		scope: 'openid',
		kc_action: 'delete_account'
	});
}

export function storeLoginState(cookies: Cookies, value: LoginState): void {
	cookies.set(LOGIN_COOKIE, JSON.stringify(value), {
		path: '/auth',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: LOGIN_MAX_AGE_SECONDS
	});
}

export function takeLoginState(cookies: Cookies): LoginState | undefined {
	const raw = cookies.get(LOGIN_COOKIE);
	cookies.delete(LOGIN_COOKIE, { path: '/auth' });
	if (!raw) return undefined;
	try {
		const parsed: unknown = JSON.parse(raw);
		if (
			parsed &&
			typeof parsed === 'object' &&
			typeof (parsed as LoginState).verifier === 'string' &&
			typeof (parsed as LoginState).state === 'string' &&
			typeof (parsed as LoginState).next === 'string'
		) {
			return parsed as LoginState;
		}
	} catch {
		// fall through
	}
	return undefined;
}

/** only same-origin paths may be used as a post-login destination */
export function safeNextPath(candidate: string | null | undefined): string {
	if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) return '/';
	return candidate;
}
