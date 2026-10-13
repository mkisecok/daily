import type { Path } from '$app/types';
import { PUBLIC_BASE_PATH } from '$app/env/public';
import { localizeHref, type locales } from '#lib/paraglide/runtime.js';

type Locale = (typeof locales)[number];

/** Paraglide's URL patterns include the base path; `resolve()` adds it again, so drop it. */
function withoutBase(href: string): Path {
	if (PUBLIC_BASE_PATH && href.startsWith(PUBLIC_BASE_PATH)) {
		return (href.slice(PUBLIC_BASE_PATH.length) || '/') as Path;
	}
	return href as Path;
}

/**
 * An internal route path in the current (or given) locale, ready for
 * `resolve()`: `/werkzeuge` stays `/werkzeuge` on German pages and becomes
 * `/en/werkzeuge` on English ones. Without this, every link on an English
 * page would lead back to German.
 */
export function localized(path: string, locale?: Locale): Path {
	return withoutBase(localizeHref(PUBLIC_BASE_PATH + path, locale ? { locale } : undefined));
}

/** The page at `pathname` (as in `page.url.pathname`, base included) in another locale. */
export function inLocale(pathname: string, locale: Locale): Path {
	return withoutBase(localizeHref(pathname, { locale }));
}
