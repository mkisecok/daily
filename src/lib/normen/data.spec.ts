import { describe, expect, it } from 'vitest';
import bdsg from './data/bdsg.json' with { type: 'json' };
import dsgvo from './data/dsgvo.json' with { type: 'json' };
import kiVo from './data/ki-vo.json' with { type: 'json' };
import tdddg from './data/tdddg.json' with { type: 'json' };
import type { Block, Lang, LawText } from './types.js';

const laws = [dsgvo, kiVo, bdsg, tdddg] as unknown as LawText[];

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
});
