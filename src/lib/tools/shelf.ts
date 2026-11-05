/**
 * the viewer's recently opened and pinned tools. They live in this browser's
 * localStorage only, as a convenience: blocked or cleared storage just means
 * an empty shelf.
 */
export const RECENT_KEY = 'daily.tools.recent.v1';
export const PINNED_KEY = 'daily.tools.pinned.v1';
export const RECENT_MAX = 4;

/** the slug first, without duplicates, at most `max` entries */
export function remember(list: readonly string[], slug: string, max = RECENT_MAX): string[] {
	return [slug, ...list.filter((entry) => entry !== slug)].slice(0, max);
}

/** pinned slugs keep the order they were pinned in */
export function togglePin(list: readonly string[], slug: string): string[] {
	return list.includes(slug) ? list.filter((entry) => entry !== slug) : [...list, slug];
}

export function readList(key: string): string[] {
	try {
		const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
		return Array.isArray(value) ? value.filter((entry) => typeof entry === 'string') : [];
	} catch {
		return [];
	}
}

export function writeList(key: string, list: readonly string[]): void {
	try {
		localStorage.setItem(key, JSON.stringify(list));
	} catch {
		// storage blocked: the shelf lasts for this page only
	}
}

/** record a visit to a tool page */
export function rememberVisit(slug: string): void {
	writeList(RECENT_KEY, remember(readList(RECENT_KEY), slug));
}
