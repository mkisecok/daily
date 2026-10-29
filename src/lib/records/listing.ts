import { formatValue, stateLabel, type Titles } from './format.js';
import type { FieldDef, RecordToolDefinition, StoredRecord } from './types.js';
import { allFields } from './validate.js';

/**
 * search, status filter and sort order of a register list, kept in the URL
 * (`?suche=`, `?status=`, `?sortierung=`) so they survive a reload and work
 * in the prerendered preview. `-` before the sort key means descending.
 */
export type ListQuery = { search: string; status: string; sort: string; descending: boolean };

export const DEFAULT_SORT = 'updated';

/** URL parameters as `page.url` gives them, read-only */
type Params = Pick<URLSearchParams, 'get' | 'toString'>;

export function readListQuery(params: Params): ListQuery {
	const raw = params.get('sortierung') ?? `-${DEFAULT_SORT}`;
	return {
		search: (params.get('suche') ?? '').trim(),
		status: params.get('status') ?? '',
		sort: raw.replace(/^-/, '') || DEFAULT_SORT,
		descending: raw.startsWith('-')
	};
}

/** the query as URL parameters, leaving out the defaults */
export function writeListQuery(params: Params, query: ListQuery): URLSearchParams {
	const next = new URLSearchParams(params.toString());
	const set = (key: string, value: string) => (value ? next.set(key, value) : next.delete(key));
	set('suche', query.search);
	set('status', query.status);
	const sort = `${query.descending ? '-' : ''}${query.sort}`;
	set('sortierung', sort === `-${DEFAULT_SORT}` ? '' : sort);
	return next;
}

/** the columns a list can be sorted by: title, list columns, state, last change */
export function sortKeys(definition: RecordToolDefinition): string[] {
	const columns = allFields(definition)
		.filter((f) => f.listColumn && f.id !== definition.titleField)
		.map((f) => f.id);
	return ['title', ...columns, ...(definition.workflow ? ['state'] : []), DEFAULT_SORT];
}

function sortValue(
	definition: RecordToolDefinition,
	record: StoredRecord,
	key: string,
	field: FieldDef | undefined,
	locale: string,
	titles: Titles
): string | number {
	if (key === 'title') return record.title;
	if (key === DEFAULT_SORT) return record.updatedAt;
	if (key === 'state') return stateLabel(definition, record.state, locale);
	if (!field) return '';
	const value = record.data[key];
	// stored dates and datetimes are ISO strings and sort as they are
	if (field.type === 'number') return typeof value === 'number' ? value : -Infinity;
	if (field.type === 'date' || field.type === 'datetime')
		return typeof value === 'string' ? value : '';
	return formatValue(field, value, locale, titles);
}

/** the records that match the search and status, in the chosen order */
export function applyListQuery(
	definition: RecordToolDefinition,
	records: StoredRecord[],
	query: ListQuery,
	locale: string,
	titles: Titles = {}
): StoredRecord[] {
	const columns = allFields(definition).filter(
		(f) => f.listColumn && f.id !== definition.titleField
	);
	const needle = query.search.toLocaleLowerCase(locale);
	const matches = records.filter((record) => {
		if (query.status && record.state !== query.status) return false;
		if (!needle) return true;
		const haystack = [
			record.title,
			...columns.map((field) => formatValue(field, record.data[field.id], locale, titles))
		]
			.join('\n')
			.toLocaleLowerCase(locale);
		return haystack.includes(needle);
	});

	// an unknown key, e.g. from an old link, falls back to the default order
	const known = sortKeys(definition).includes(query.sort);
	const key = known ? query.sort : DEFAULT_SORT;
	const descending = known ? query.descending : true;
	const field = columns.find((f) => f.id === key);
	const collator = new Intl.Collator(locale === 'en' ? 'en-GB' : 'de-DE', { numeric: true });
	const value = (record: StoredRecord) => sortValue(definition, record, key, field, locale, titles);
	const sorted = [...matches].sort((a, b) => {
		const left = value(a);
		const right = value(b);
		const order =
			typeof left === 'number' && typeof right === 'number'
				? left - right
				: collator.compare(String(left), String(right));
		return order !== 0 ? order : b.updatedAt.localeCompare(a.updatedAt);
	});
	return descending ? sorted.reverse() : sorted;
}
