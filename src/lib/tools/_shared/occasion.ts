import { checkFields, checkStatus, settled, type CheckItem } from '../../records/checks.js';
import type {
	AssessmentSnapshot,
	FieldSection,
	RecordData,
	RecordView
} from '../../records/types.js';
import type { Localized, Reason } from '../types.js';

/**
 * building blocks of an occasion tool: one entry per occasion (a move, a new
 * software, a new AI tool), a scope that decides which parts apply, and a
 * checklist in the order of the work.
 */

/** a checklist point that may apply only to some scopes */
export type OccasionItem = CheckItem & { scope?: string[] };

export type Block = {
	id: string;
	title: Localized;
	intro: Localized;
	/** the block applies when any of these is in scope; none means always */
	scope?: string[];
	/** a further condition, e.g. on an attached questionnaire result */
	when?: (data: RecordData) => boolean;
	items: OccasionItem[];
};

/** whether a block applies to the entry */
export const blockApplies = (data: RecordData, block: Block) =>
	inScope(data, block.scope) && (!block.when || block.when(data));

/** the scope chosen in the entry's multiple-choice field */
export function scopeOf(data: RecordData, field = 'umfang'): string[] {
	const value = data[field];
	return Array.isArray(value) ? value : [];
}

/** whether something limited to `scope` applies */
export function inScope(data: RecordData, scope?: string[], field = 'umfang'): boolean {
	if (!scope) return true;
	const chosen = scopeOf(data, field);
	return scope.some((s) => chosen.includes(s));
}

/** the checklist blocks as form sections; a block outside the scope folds */
export function blockSections(blocks: Block[]): FieldSection[] {
	return blocks.map((block) => ({
		id: block.id,
		title: block.title,
		intro: block.intro,
		when: block.scope || block.when ? (data: RecordData) => blockApplies(data, block) : undefined,
		fields: block.items.flatMap((item) =>
			checkFields(item).map((field) =>
				item.scope ? { ...field, when: (data: RecordData) => inScope(data, item.scope) } : field
			)
		)
	}));
}

/** every point that applies to the entry, with the block it belongs to */
export function applicable(data: RecordData, blocks: Block[]) {
	return blocks
		.filter((block) => blockApplies(data, block))
		.flatMap((block) =>
			block.items.filter((item) => inScope(data, item.scope)).map((item) => ({ item, block }))
		);
}

/** the checklist's state: points answered "nein", points not answered, points done */
export function checklist(data: RecordData, blocks: Block[]) {
	const points = applicable(data, blocks);
	const status = (id: string) => checkStatus(data[id]);
	return {
		points,
		gaps: points.filter(({ item }) => status(item.id) === 'nein'),
		open: points.filter(({ item }) => status(item.id) === null),
		done: points.filter(({ item }) => settled(status(item.id)))
	};
}

/** a gap as a reason: "Part: point", with the point's citation */
export function gapReasons(gaps: { item: OccasionItem; block: Block }[]): Reason[] {
	return gaps.map(({ item, block }) => ({
		questionId: item.id,
		text: { de: `${block.title.de}: ${item.label.de}`, en: `${block.title.en}: ${item.label.en}` },
		cite: item.cite
	}));
}

/** "Still open: Part 2, Part 3" */
export function openNote(open: { block: Block }[]): Localized | null {
	if (open.length === 0) return null;
	const counts = new Map<Block, number>();
	for (const { block } of open) counts.set(block, (counts.get(block) ?? 0) + 1);
	const list = (lang: 'de' | 'en') =>
		[...counts].map(([block, n]) => `${block.title[lang]} ${n}`).join(', ');
	return { de: `Noch offen: ${list('de')}.`, en: `Still open: ${list('en')}.` };
}

/** an attached questionnaire result, or null */
export function snapshot(data: RecordData, field: string): AssessmentSnapshot | null {
	const value = data[field];
	return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

export type { RecordView };
