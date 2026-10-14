import bdsgRaw from '../normen/data/bdsg.json?raw';
import dsgvoRaw from '../normen/data/dsgvo.json?raw';
import kivoRaw from '../normen/data/ki-vo.json?raw';
import tdddgRaw from '../normen/data/tdddg.json?raw';
import { KIND_ORDER, provisionLabel } from '../normen/laws.js';
import { crossReferences } from '../normen/crossref.js';
import type { Block, Lang, LawId, LawText, Provision, RenderedBlock } from '../normen/types.js';
import { citationIndex, type CitingTool, type ToolCitations } from '../normen/usage.js';
import { allFields } from '../records/validate.js';
import { getQuestionnaire, getRecordTool, tools } from '../tools/registry.js';

const RAW: Record<LawId, string> = {
	dsgvo: dsgvoRaw,
	'ki-vo': kivoRaw,
	bdsg: bdsgRaw,
	tdddg: tdddgRaw
};
const cache = new Map<LawId, LawText>();

/** A law's text, parsed once per process. */
export function lawText(id: LawId): LawText {
	let law = cache.get(id);
	if (!law) {
		law = JSON.parse(RAW[id]) as LawText;
		cache.set(id, law);
	}
	return law;
}

export function hasProvision(law: LawId, id: string): boolean {
	return lawText(law).provisions.some((p) => p.id === id);
}

export type TocEntry = { id: string; label: string; title: string };
export type Toc = {
	chapters: { title: string; entries: TocEntry[] }[];
	/** Provisions outside chapters: annexes, then recitals. */
	annexes: TocEntry[];
	recitals: TocEntry[];
};

const pick = (value: Partial<Record<Lang, string>>, lang: Lang) => value[lang] ?? value.de ?? '';

function entry(p: Provision, lang: Lang): TocEntry {
	return { id: p.id, label: provisionLabel(p, lang), title: pick(p.title, lang) };
}

export function tableOfContents(id: LawId, lang: Lang): Toc {
	const law = lawText(id);
	const main = law.provisions.filter((p) => p.kind === 'artikel' || p.kind === 'paragraph');
	const chapters = law.chapters.map((c, index) => ({
		title: pick(c.title, lang),
		entries: main.filter((p) => p.chapter === index).map((p) => entry(p, lang))
	}));
	const unassigned = main.filter((p) => p.chapter === undefined).map((p) => entry(p, lang));
	return {
		chapters: [
			...(unassigned.length > 0 ? [{ title: '', entries: unassigned }] : []),
			...chapters.filter((c) => c.entries.length > 0)
		],
		annexes: law.provisions.filter((p) => p.kind === 'anhang').map((p) => entry(p, lang)),
		recitals: law.provisions.filter((p) => p.kind === 'erwaegungsgrund').map((p) => entry(p, lang))
	};
}

/** Provisions in reading order: articles/paragraphs, annexes, recitals. */
function ordered(law: LawText): Provision[] {
	return KIND_ORDER.flatMap((kind) => law.provisions.filter((p) => p.kind === kind));
}

export function provisionPage(lawId: LawId, id: string, lang: Lang) {
	const law = lawText(lawId);
	const list = ordered(law);
	const index = list.findIndex((p) => p.id === id);
	if (index === -1) return null;
	const provision = list[index];
	const neighbour = (p: Provision | undefined) =>
		p && p.kind === provision.kind ? entry(p, lang) : null;
	const english = Boolean(provision.blocks.en);
	return {
		provision: {
			id: provision.id,
			kind: provision.kind,
			label: provisionLabel(provision, lang),
			title: pick(provision.title, lang),
			blocks: render(
				(lang === 'en' ? provision.blocks.en : undefined) ?? provision.blocks.de ?? [],
				lawId
			),
			chapter:
				provision.chapter !== undefined ? pick(law.chapters[provision.chapter].title, lang) : null,
			/** English page showing the German text because no English one exists. */
			fallback: lang === 'en' && !english
		},
		prev: neighbour(list[index - 1]),
		next: neighbour(list[index + 1]),
		source: law.source[lang] ?? law.source.de!,
		retrieved: law.retrieved,
		citedBy: citingTools(lawId, id)
	};
}

/** Blocks with cross-references resolved into links, ready for the page. */
function render(blocks: Block[], law: LawId): RenderedBlock[] {
	return blocks.map((b) => ({
		...(b.label ? { label: b.label } : {}),
		segments: crossReferences(b.text, law, hasProvision),
		...(b.children ? { children: render(b.children, law) } : {})
	}));
}

export const ALL_LAWS: LawId[] = ['dsgvo', 'ki-vo', 'bdsg', 'tdddg'];

export function allProvisionIds(): { law: LawId; id: string }[] {
	return ALL_LAWS.flatMap((law) => lawText(law).provisions.map((p) => ({ law, id: p.id })));
}

function flatten(blocks: Block[]): string {
	return blocks
		.map((b) => [b.label, b.text, b.children ? flatten(b.children) : ''].filter(Boolean).join(' '))
		.join(' ');
}

export type SearchEntry = { law: LawId; id: string; label: string; title: string; text: string };

/** Everything the client-side search needs, per language. */
export function searchIndex(lang: Lang): SearchEntry[] {
	return ALL_LAWS.flatMap((law) =>
		lawText(law).provisions.map((p) => ({
			law,
			id: p.id,
			label: provisionLabel(p, lang),
			title: pick(p.title, lang),
			text: flatten((lang === 'en' ? p.blocks.en : undefined) ?? p.blocks.de ?? [])
		}))
	);
}

let index: Map<string, CitingTool[]> | undefined;

/** Every citation in manifests, questionnaire catalogs and record definitions. */
function toolCitations(): ToolCitations[] {
	return tools.map((tool) => {
		const catalog = getQuestionnaire(tool.slug)?.catalog;
		const definition = getRecordTool(tool.slug)?.definition;
		return {
			slug: tool.slug,
			name: tool.name,
			cites: [
				...tool.legalBasis,
				...(catalog?.sources ?? []),
				...(catalog?.sections.flatMap((s) =>
					s.questions.flatMap((q) => (q.cite ? [q.cite] : []))
				) ?? []),
				...(definition?.sources ?? []),
				...(definition ? allFields(definition).flatMap((f) => (f.cite ? [f.cite] : [])) : [])
			]
		};
	});
}

export function citingTools(law: LawId, id: string): CitingTool[] {
	index ??= citationIndex(toolCitations());
	return index.get(`${law}/${id}`) ?? [];
}
