import { PUBLIC_BASE_PATH } from '$app/env/public';
import { localizeHref, type locales } from '#lib/paraglide/runtime.js';

type Locale = (typeof locales)[number];

/**
 * an internal path with leading slash (and possibly a query), ready for
 * `resolve()`, which only prefixes the base path. Typed as the root route:
 * SvelteKit's generated `Path` union grows with every route, and beyond a
 * couple of dozen members `resolve()` no longer accepts it as a whole.
 */
export type RoutePath = '/';

/** Paraglide's URL patterns include the base path; `resolve()` adds it again, so drop it */
function withoutBase(href: string): RoutePath {
	if (PUBLIC_BASE_PATH && href.startsWith(PUBLIC_BASE_PATH)) {
		return (href.slice(PUBLIC_BASE_PATH.length) || '/') as RoutePath;
	}
	return href as RoutePath;
}

/**
 * an internal route path in the current (or given) locale, ready for
 * `resolve()`: `/werkzeuge` stays `/werkzeuge` on German pages and becomes
 * `/en/werkzeuge` on English ones. Without this, every link on an English
 * page would lead back to German.
 */
export function localized(path: string, locale?: Locale): RoutePath {
	return withoutBase(localizeHref(PUBLIC_BASE_PATH + path, locale ? { locale } : undefined));
}

/** the page at `pathname` (as in `page.url.pathname`, base included) in another locale */
export function inLocale(pathname: string, locale: Locale): RoutePath {
	return withoutBase(localizeHref(pathname, { locale }));
}
