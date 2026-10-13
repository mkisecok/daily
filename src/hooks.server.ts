import type { Handle } from '@sveltejs/kit/hooks';
import { getTextDirection } from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';
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

export const handle: Handle = handleParaglide;
