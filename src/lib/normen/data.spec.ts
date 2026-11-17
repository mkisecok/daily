import { describe, expect, it } from 'vitest';
import { toolCites } from '../tools/rechtsstand.js';
import { tools } from '../tools/registry.js';
import { provisionsOf } from './cite.js';
import bdsg from './data/bdsg.json' with { type: 'json' };
import betrvg from './data/betrvg.json' with { type: 'json' };
import dataAct from './data/data-act.json' with { type: 'json' };
import dsgvo from './data/dsgvo.json' with { type: 'json' };
import kiVo from './data/ki-vo.json' with { type: 'json' };
import tdddg from './data/tdddg.json' with { type: 'json' };
import type { Block, Lang, LawText } from './types.js';

const laws = [dsgvo, kiVo, bdsg, tdddg, dataAct, betrvg] as unknown as LawText[];

/** every block of a law in one language, with a readable position */
function blocksOf(law: LawText, lang: Lang): { at: string; block: Block }[] {
	const walk = (blocks: Block[], at: string): { at: string; block: Block }[] =>
		blocks.flatMap((block) => {
			const here = `${at} ${block.label ?? '·'}`;
			return [{ at: here, block }, ...walk(block.children ?? [], here)];
		});
	return law.provisions.flatMap((p) => walk(p.blocks[lang] ?? [], `${law.id}/${p.id} ${lang}`));
}

const all = laws.flatMap((law) => (['de', 'en'] as const).flatMap((lang) => blocksOf(law, lang)));

describe('imported law texts', () => {
	it('has no paragraph without text or sub-items', () => {
		const empty = all.filter(({ block }) => !block.text.trim() && !block.children?.length);
		expect(empty.map((e) => e.at)).toEqual([]);
	});

	it('carries no amendment markers of the consolidated text', () => {
		const marked = all.filter(({ block }) => /[▼►◄]/.test(block.text));
		expect(marked.map((m) => m.at)).toEqual([]);
	});

	it('keeps text that stands beside a corrigendum marker', () => {
		const text = (law: LawText, id: string, lang: Lang, index: number) =>
			law.provisions.find((p) => p.id === id)!.blocks[lang]![index].text;
		// Art. 33(1) GDPR was corrected by corrigendum C1 in German
		expect(text(laws[0], 'art-33', 'de', 0)).toMatch(
			/^Im Falle einer Verletzung .* binnen 72 Stunden, .* Begründung für die Verzögerung beizufügen\.$/
		);
		expect(text(laws[0], 'art-25', 'de', 0)).toContain('Datenschutzgrundsätze');
		expect(text(laws[1], 'art-26', 'en', 4)).toContain('monitor the operation');
	});

	it('reads the English Data Act from the Official Journal, with numbered paragraphs and lists', () => {
		const art25 = laws[4].provisions.find((p) => p.id === 'art-25')!;
		const [, second] = art25.blocks.en!;
		expect(second.label).toBe('2.');
		expect(second.children?.[0].label).toBe('(a)');
		expect(second.children?.[0].children?.[0].label).toBe('(i)');
		const englishArticles = laws[4].provisions.filter((p) => p.kind === 'artikel' && p.blocks.en);
		expect(englishArticles).toHaveLength(50);
	});

	it('has the BetrVG co-determination on technical monitoring', () => {
		const p87 = laws[5].provisions.find((p) => p.id === 'p-87')!;
		expect(p87.blocks.de![0].children?.[5].text).toMatch(
			/^Einführung und Anwendung von technischen/
		);
	});
});

describe('the laws the tools cite', () => {
	it('can open every Data Act and BetrVG provision a tool cites', () => {
		const ids = new Map(laws.map((law) => [law.id, new Set(law.provisions.map((p) => p.id))]));
		const missing = tools
			.flatMap((tool) => toolCites(tool).map((basis) => ({ tool: tool.slug, basis })))
			.filter(({ basis }) => basis.law === 'Data Act' || basis.law === 'BetrVG')
			.flatMap(({ tool, basis }) =>
				provisionsOf(basis)
					.filter((ref) => !ids.get(ref.law)?.has(ref.id))
					.map((ref) => `${tool}: ${basis.law} ${basis.ref} → ${ref.id}`)
			);
		expect(missing).toEqual([]);
	});
});
