import type { LegalBasis, Localized } from '../tools/types.js';
import { provisionsOf } from './cite.js';

export type CitingTool = { slug: string; name: Localized };
export type ToolCitations = CitingTool & { cites: LegalBasis[] };

/** Which tools cite which provision, keyed `law/id`, each tool once per provision. */
export function citationIndex(tools: ToolCitations[]): Map<string, CitingTool[]> {
	const index = new Map<string, CitingTool[]>();
	for (const tool of tools) {
		const keys = new Set(
			tool.cites.flatMap((basis) => provisionsOf(basis).map((r) => `${r.law}/${r.id}`))
		);
		for (const key of keys) {
			const list = index.get(key) ?? [];
			list.push({ slug: tool.slug, name: tool.name });
			index.set(key, list);
		}
	}
	return index;
}
