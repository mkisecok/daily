import { localized, type RoutePath } from '#lib/i18n/links.js';
import { m } from '#lib/paraglide/messages.js';
import type { IconName } from './icons.js';

export type NavItem = {
	route: string;
	path: RoutePath;
	label: string;
	icon: IconName;
	current: boolean;
};

/** route ids are identical on server and client, unlike resolved hrefs */
export function isCurrent(routeId: string | null, route: string): boolean {
	const id = routeId ?? '';
	return id === route || id.startsWith(route + '/') || id.startsWith('/(app)' + route);
}

/**
 * the main areas, shared by the sidebar and the phone menu. Deadlines and
 * reports read records, so they appear when signed in or in the preview.
 */
export function navItems(withRecords: boolean, routeId: string | null): NavItem[] {
	const areas: { route: string; label: string; icon: IconName }[] = [
		{ route: '/nachrichten', label: m.nav_feed(), icon: 'news' },
		{ route: '/werkzeuge', label: m.nav_tools(), icon: 'tool' },
		{ route: '/normen', label: m.nav_norms(), icon: 'scale' },
		{ route: '/notizen', label: m.nav_notes(), icon: 'notes' },
		...(withRecords
			? [
					{ route: '/fristen', label: m.deadlines_title(), icon: 'clock' as const },
					{ route: '/berichte', label: m.nav_reports(), icon: 'file-text' as const }
				]
			: [])
	];
	return areas.map((area) => ({
		...area,
		path: localized(area.route),
		current: isCurrent(routeId, area.route)
	}));
}
