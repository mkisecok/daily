import type { Handle } from '@sveltejs/kit/hooks';
import { sequence } from '@sveltejs/kit/hooks';
import { getTextDirection } from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';
import { loadSession } from '#lib/server/auth/session.js';
import { db } from '#lib/server/db/index.js';
import { ORG_COOKIE, resolveOrganisation } from '#lib/server/org.js';
import { parseTheme, THEME_COOKIE } from '#lib/theme.js';

/**
 * Locale comes from Paraglide (URL, then cookie, then base locale). Theme
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

/** Resolves the session and the active organisation once per request into `locals`. */
const handleAuth: Handle = async ({ event, resolve }) => {
	const session = await loadSession(event.cookies);
	event.locals.session = session;
	event.locals.user = session?.user;
	event.locals.organisation = session
		? await resolveOrganisation(db, session.user.id, event.cookies.get(ORG_COOKIE))
		: undefined;
	return resolve(event);
};

export const handle: Handle = sequence(handleParaglide, handleAuth);
