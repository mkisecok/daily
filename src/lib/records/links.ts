import type { Option } from './types.js';
import type { RecordStore } from './store/types.js';
import type { FieldDef, RecordTool, RecordToolDefinition, StoredRecord } from './types.js';
import type { Titles } from './format.js';
import { allFields } from './validate.js';

export type ReferenceField = FieldDef & { type: 'reference' };

export function referenceFields(definition: RecordToolDefinition): ReferenceField[] {
	return allFields(definition).filter((f): f is ReferenceField => f.type === 'reference');
}

/** Records that point to `id` of `toolSlug`, grouped by the tool they belong to. */
export type Backlinks = { tool: RecordTool; records: StoredRecord[] }[];

/**
 * Cross-record lookups for the records page. Everything goes through the
 * store, so it is scoped to the organisation (or the browser) like any
 * other read; an id that does not resolve simply shows as unknown.
 */
export function createLinks(store: RecordStore, tools: RecordTool[]) {
	const cache = new Map<string, Promise<StoredRecord[]>>();
	const list = (slug: string) => {
		let records = cache.get(slug);
		if (!records) {
			records = store.list(slug);
			cache.set(slug, records);
		}
		return records;
	};

	return {
		/** Titles of every record a reference field of `definition` can point to. */
		async titles(definition: RecordToolDefinition): Promise<Titles> {
			const slugs = [...new Set(referenceFields(definition).map((f) => f.tool))];
			const lists = await Promise.all(slugs.map(list));
			return Object.fromEntries(lists.flat().map((r) => [r.id, r.title]));
		},

		/** Options for each reference field of `definition`, by field id. */
		async choices(definition: RecordToolDefinition): Promise<Record<string, Option[]>> {
			const fields = referenceFields(definition);
			const lists = await Promise.all(fields.map((f) => list(f.tool)));
			return Object.fromEntries(
				fields.map((f, i) => [
					f.id,
					lists[i].map((r) => ({ value: r.id, label: { de: r.title, en: r.title } }))
				])
			);
		},

		/** Records of any tool whose reference fields point to this record. */
		async backlinks(toolSlug: string, id: string): Promise<Backlinks> {
			const sources = tools
				.map((tool) => ({
					tool,
					fields: referenceFields(tool.definition).filter((f) => f.tool === toolSlug)
				}))
				.filter((s) => s.fields.length > 0);
			const groups = await Promise.all(
				sources.map(async ({ tool, fields }) => ({
					tool,
					records: (await list(tool.manifest.slug)).filter((r) =>
						fields.some((f) => r.data[f.id] === id)
					)
				}))
			);
			return groups.filter((g) => g.records.length > 0);
		}
	};
}
