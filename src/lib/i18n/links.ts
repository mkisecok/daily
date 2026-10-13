import type { Path } from '$app/types';
import { localizeHref, type locales } from '#lib/paraglide/runtime.js';

type Locale = (typeof locales)[number];

/**
 * An internal route path in the current (or given) locale, ready for
 * `resolve()`: `/werkzeuge` stays `/werkzeuge` on German pages and becomes
 * `/en/werkzeuge` on English ones. Without this, every link on an English
 * page would lead back to German.
 */
export function localized(path: string, locale?: Locale): Path {
	return localizeHref(path, locale ? { locale } : undefined) as Path;
}
