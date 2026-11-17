import { describe, expect, it } from 'vitest';
import { countOptions, matches, readNewsFilter } from './filter.js';

const tags = { regulation: ['dsgvo', 'ki-vo'], kind: ['bussgeld', 'leitlinie'] };
const items = [
	{ tags: ['dsgvo', 'bussgeld'] },
	{ tags: ['dsgvo', 'leitlinie'] },
	{ tags: ['ki-vo', 'leitlinie'] },
	{ tags: ['dsgvo'] }
];

describe('readNewsFilter', () => {
	it('reads both groups', () => {
		expect(readNewsFilter(new URLSearchParams('art=bussgeld&regelwerk=ki-vo'), tags)).toEqual({
			art: 'bussgeld',
			regelwerk: 'ki-vo'
		});
	});

	it('ignores unknown values and tags of the other group', () => {
		expect(readNewsFilter(new URLSearchParams('art=dsgvo&regelwerk=x'), tags)).toEqual({
			art: null,
			regelwerk: null
		});
	});
});

describe('matches', () => {
	it('combines Art and Regelwerk', () => {
		const filter = { art: 'leitlinie', regelwerk: 'dsgvo' };
		expect(items.filter((item) => matches(item, filter))).toEqual([items[1]]);
	});
});

describe('countOptions', () => {
	it('counts each option under the other group’s choice', () => {
		const filter = { art: 'leitlinie', regelwerk: 'dsgvo' };
		expect(countOptions(items, filter, 'art', tags.kind)).toEqual(
			new Map([
				['bussgeld', 1],
				['leitlinie', 1]
			])
		);
		expect(countOptions(items, filter, 'regelwerk', tags.regulation)).toEqual(
			new Map([
				['dsgvo', 1],
				['ki-vo', 1]
			])
		);
	});
});
