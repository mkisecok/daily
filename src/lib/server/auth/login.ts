import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/env';
import { APP_ORIGIN } from '$app/env/private';

/** Short-lived cookie carrying the PKCE verifier and state across the redirect. */
export const LOGIN_COOKIE = 'daily_login';
const LOGIN_MAX_AGE_SECONDS = 10 * 60;

export type LoginState = {
	verifier: string;
	state: string;
	next: string;
};

export const REDIRECT_URI = `${APP_ORIGIN}/auth/callback`;
export const POST_LOGOUT_REDIRECT_URI = `${APP_ORIGIN}/`;

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

/** Only same-origin paths may be used as a post-login destination. */
export function safeNextPath(candidate: string | null | undefined): string {
	if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) return '/';
	return candidate;
}
