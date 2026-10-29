import type { Handle } from '@sveltejs/kit/hooks';
import { KEYCLOAK_ISSUER } from '$app/env/private';
import { sequence } from '@sveltejs/kit/hooks';
import { getTextDirection } from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';
import { loadSession } from '#lib/server/auth/session.js';
import { db } from '#lib/server/db/index.js';
import { ORG_COOKIE, resolveOrganisation } from '#lib/server/org.js';
import { applySecurityHeaders } from '#lib/server/security-headers.js';
import { parseTheme, THEME_COOKIE } from '#lib/theme.js';

/**
 * locale comes from Paraglide (URL, then cookie, then base locale). Theme
 * comes from a cookie so the server renders the right paper colour and the
 * page never flashes.
 */
const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		const theme = parseTheme(event.cookies.get(THEME_COOKIE));
		return resolve(
			{ ...event, request },
			{
				transformPageChunk: ({ html }) =>
					html
						.replace('%paraglide.lang%', locale)
						.replace('%paraglide.dir%', getTextDirection(locale))
						.replace('%daily.theme%', theme)
			}
		);
	});

/** resolves the session and the active organisation once per request into `locals` */
const handleAuth: Handle = async ({ event, resolve }) => {
	const session = await loadSession(event.cookies);
	event.locals.session = session;
	event.locals.user = session?.user;
	event.locals.organisation = session
		? await resolveOrganisation(db, session.user.id, event.cookies.get(ORG_COOKIE))
		: undefined;
	return resolve(event);
};

/** the sign-in origin, allowed as a form target for the logout redirect */
const identityOrigin = (() => {
	try {
		return new URL(KEYCLOAK_ISSUER).origin;
	} catch {
		return '';
	}
})();

/** security headers on every response; see #lib/server/security-headers.ts */
const handleSecurityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	try {
		applySecurityHeaders(response.headers, identityOrigin);
	} catch {
		// responses passed through from fetch() have immutable headers
	}
	return response;
};

export const handle: Handle = sequence(handleSecurityHeaders, handleParaglide, handleAuth);
