import { describe, expect, it } from 'vitest';
import { diffRecord } from './diff.js';
import { testDefinition as def } from './fixtures.js';
import { isEmpty, titleOf, validateRecord } from './validate.js';

describe('validateRecord', () => {
	it('fills every field and drops unknown keys', () => {
		const { data, errors } = validateRecord(def, { name: 'Eins', other: 'x' });
		expect(errors).toEqual({});
		expect(Object.keys(data).sort()).toEqual(
			['check', 'count', 'due', 'flag', 'kind', 'name', 'notes', 'seen', 'tags'].sort()
		);
		expect(data.notes).toBeNull();
		expect('other' in data).toBe(false);
	});

	it('reports missing required fields', () => {
		expect(validateRecord(def, { name: '   ' }).errors).toEqual({ name: 'required' });
	});

	it('coerces form strings to typed values', () => {
		const { data, errors } = validateRecord(def, {
			name: ' Zwei ',
			count: '12',
			flag: 'on',
			due: '2026-10-25',
			seen: '2026-10-14T09:30:00+02:00',
			tags: 'y'
		});
		expect(errors).toEqual({});
		expect(data).toMatchObject({
			name: 'Zwei',
			count: 12,
			flag: true,
			due: '2026-10-25',
			seen: '2026-10-14T07:30:00.000Z',
			tags: ['y']
		});
	});

	it('keeps multiselect values in catalogue order', () => {
		expect(validateRecord(def, { name: 'n', tags: ['z', 'x'] }).data.tags).toEqual(['x', 'z']);
	});

	it('rejects values outside the definition', () => {
		const { errors } = validateRecord(def, {
			name: 'n',
			kind: 'c',
			tags: ['x', 'q'],
			due: '25.10.2026',
			seen: 'gestern',
			count: '-1',
			flag: 'vielleicht',
			check: { tool: 'demo' }
		});
		expect(errors).toEqual({
			kind: 'invalid',
			tags: 'invalid',
			due: 'invalid',
			seen: 'invalid',
			count: 'invalid',
			flag: 'invalid',
			check: 'invalid'
		});
	});

	it('accepts a complete assessment snapshot', () => {
		const check = {
			tool: 'demo',
			catalogVersion: 1,
			verdict: 'positive',
			headline: { de: 'Ja', en: 'Yes' },
			at: '2026-10-14T08:00:00.000Z'
		};
		expect(validateRecord(def, { name: 'n', check }).data.check).toEqual(check);
	});

	it('treats empty strings as empty values', () => {
		const { data } = validateRecord(def, { name: 'n', kind: '', count: '', due: '' });
		expect([data.kind, data.count, data.due]).toEqual([null, null, null]);
	});
});

describe('helpers', () => {
	it('derives the title from the title field', () => {
		expect(titleOf(def, { name: 'Chatbot' })).toBe('Chatbot');
		expect(titleOf(def, { name: null })).toBe('—');
	});

	it('knows what empty means', () => {
		expect([null, undefined, '', []].every(isEmpty)).toBe(true);
		expect([0, false, 'x', ['a']].some(isEmpty)).toBe(false);
	});

	it('diffs field values for the history', () => {
		expect(diffRecord({ a: 1, b: ['x'], c: null }, { a: 1, b: ['x', 'y'], d: 'neu' })).toEqual({
			b: [['x'], ['x', 'y']],
			d: [undefined, 'neu']
		});
	});
});
