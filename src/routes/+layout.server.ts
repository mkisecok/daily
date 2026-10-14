import { PUBLIC_PREVIEW } from '$app/env/public';
import { getLocale } from '#lib/paraglide/runtime.js';
import { parseTheme, THEME_COOKIE } from '#lib/theme.js';
import type { LayoutServerLoad } from './$types';

/**
 * The static preview prerenders every page. Directories with index.html
 * (trailing slash) keep /en and /en/… from colliding on GitHub Pages.
 */
export const prerender = PUBLIC_PREVIEW;
export const trailingSlash = PUBLIC_PREVIEW ? 'always' : 'never';

/** First day of publication; the dateline counts issues from here. */
const FIRST_ISSUE = new Date('2026-10-13T00:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

export const load: LayoutServerLoad = ({ cookies, locals }) => {
	const now = new Date();
	return {
		locale: getLocale(),
		theme: parseTheme(cookies.get(THEME_COOKIE)),
		today: now.toISOString(),
		issue: Math.floor((now.getTime() - FIRST_ISSUE.getTime()) / DAY) + 1,
		user: locals.user ? { displayName: locals.user.displayName, roles: locals.user.roles } : null,
		organisation: locals.organisation
			? { name: locals.organisation.name, kind: locals.organisation.kind }
			: null
	};
};
