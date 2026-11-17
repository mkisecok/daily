/**
 * the news filters, shared by the server page and the static preview: Art
 * (what happened) and Regelwerk (which law) each pick one tag, and both
 * combine. Bookmarks and paging are read on the server, since they need the
 * database.
 */
export type FeedTags = { regulation: readonly string[]; kind: readonly string[] };

export type NewsFilter = { art: string | null; regelwerk: string | null };

type Tagged = { tags: readonly string[] };

/** the filter in a query string; unknown values are ignored */
export function readNewsFilter(params: URLSearchParams, tags: FeedTags): NewsFilter {
	const art = params.get('art');
	const regelwerk = params.get('regelwerk');
	return {
		art: art && tags.kind.includes(art) ? art : null,
		regelwerk: regelwerk && tags.regulation.includes(regelwerk) ? regelwerk : null
	};
}

export function matches(item: Tagged, filter: NewsFilter): boolean {
	return (
		(!filter.art || item.tags.includes(filter.art)) &&
		(!filter.regelwerk || item.tags.includes(filter.regelwerk))
	);
}

/**
 * hits per option of one group, given the other group's choice: what the
 * list would show after picking that option
 */
export function countOptions(
	items: readonly Tagged[],
	filter: NewsFilter,
	group: keyof NewsFilter,
	options: readonly string[]
): Map<string, number> {
	const rest = { ...filter, [group]: null };
	const counts = new Map(options.map((option) => [option, 0]));
	for (const item of items) {
		if (!matches(item, rest)) continue;
		for (const tag of item.tags) {
			const count = counts.get(tag);
			if (count !== undefined) counts.set(tag, count + 1);
		}
	}
	return counts;
}
