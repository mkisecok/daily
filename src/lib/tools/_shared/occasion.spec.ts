import { describe, expect, it } from 'vitest';
import type { RecordData } from '../../records/types.js';
import {
	blockApplies,
	blockSections,
	checklist,
	gapReasons,
	openNote,
	type Block
} from './occasion.js';

const L = (de: string, en: string) => ({ de, en });
const blocks: Block[] = [
	{
		id: 'a',
		title: L('Immer', 'Always'),
		intro: L('', ''),
		items: [{ id: 'a1', label: L('A1', 'A1') }]
	},
	{
		id: 'b',
		title: L('Cloud', 'Cloud'),
		intro: L('', ''),
		scope: ['cloud'],
		items: [
			{ id: 'b1', label: L('B1', 'B1') },
			{ id: 'b2', label: L('B2', 'B2'), scope: ['drittland'] }
		]
	},
	{
		id: 'c',
		title: L('Bedingt', 'Conditional'),
		intro: L('', ''),
		when: (data) => data.flag === true,
		items: [{ id: 'c1', label: L('C1', 'C1') }]
	}
];

describe('occasion tools', () => {
	it('apply blocks and points by scope and by condition', () => {
		const ids = (data: RecordData) => checklist(data, blocks).points.map(({ item }) => item.id);
		expect(ids({})).toEqual(['a1']);
		expect(ids({ umfang: ['cloud'] })).toEqual(['a1', 'b1']);
		expect(ids({ umfang: ['cloud', 'drittland'], flag: true })).toEqual(['a1', 'b1', 'b2', 'c1']);
		expect(blockApplies({ flag: true }, blocks[2])).toBe(true);
	});

	it('fold sections that do not apply, and give each point a note and due date', () => {
		const sections = blockSections(blocks);
		expect(sections[0].when).toBeUndefined();
		expect(sections[1].when!({ umfang: [] })).toBe(false);
		expect(sections[1].fields.map((f) => f.id)).toEqual([
			'b1',
			'b1_notiz',
			'b1_frist',
			'b2',
			'b2_notiz',
			'b2_frist'
		]);
	});

	it('sort points into gaps, open and done, old yes/no answers included', () => {
		const state = checklist({ umfang: ['cloud'], a1: 'nein', b1: true }, blocks);
		expect(state.gaps.map(({ item }) => item.id)).toEqual(['a1']);
		expect(state.done.map(({ item }) => item.id)).toEqual(['b1']);
		expect(gapReasons(state.gaps)[0].text.de).toBe('Immer: A1');
		expect(openNote(checklist({ umfang: ['cloud'] }, blocks).open)!.de).toBe(
			'Noch offen: Immer 1, Cloud 1.'
		);
		expect(openNote([])).toBeNull();
	});
});
