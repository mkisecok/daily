import { describe, expect, it, vi } from 'vitest';
import { applyCorrections, locate, recitalCorrections } from './corrigenda.js';

describe('corrigenda', () => {
	it('reads recital corrections in German and English and skips articles', () => {
		const de = recitalCorrections([
			'1.',
			'Seite 9, Erwägungsgrund 47 Satz 1',
			'Anstatt:',
			'„… der betroffenen Person, …“',
			'muss es heißen:',
			'„… der betroffenen Personen, …“.',
			'Seite 36, Artikel 4 Ziffer 18',
			'Anstatt:',
			'„18.',
			'‚Unternehmen‘ eine natürliche und juristische Person“',
			'muss es heißen:',
			'„18.',
			'‚Unternehmen‘ eine natürliche oder juristische Person“'
		]);
		expect(de).toEqual([
			{ recital: '47', from: 'der betroffenen Person,', to: 'der betroffenen Personen,' }
		]);
		const en = recitalCorrections([
			'On page 14, recital 71, fifth sentence:',
			'for:',
			'‘(71)',
			'… Such measure should not concern a child.’,',
			'read:',
			'‘(71)',
			'… Such a measure should not concern a child.’.'
		]);
		expect(en).toEqual([
			{
				recital: '71',
				from: 'Such measure should not concern a child.',
				to: 'Such a measure should not concern a child.'
			}
		]);
	});

	it('trims inexact context until the passage is unique', () => {
		const text = 'insbesondere die Erwartungen der Person, die auf';
		expect(
			locate(
				text,
				'dabei sind die Erwartungen der Person,',
				'dabei sind die Erwartungen der Personen,'
			)
		).toEqual({
			from: 'die Erwartungen der Person,',
			to: 'die Erwartungen der Personen,'
		});
		expect(locate(text, 'gar nicht vorhanden', 'auch nicht')).toBeNull();
	});

	it('applies once, accepts already corrected text and fails on unknown passages', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const recitals = new Map([['145', 'in dem die Person ihren Aufenthaltsort hat;']]);
		const correction = {
			recital: '145',
			from: 'die Person ihren Aufenthaltsort hat;',
			to: 'die Person wohnt;'
		};
		expect(applyCorrections(recitals, [correction], 'test')).toBe(1);
		expect(recitals.get('145')).toBe('in dem die Person wohnt;');
		expect(applyCorrections(recitals, [correction], 'test')).toBe(0);
		expect(() =>
			applyCorrections(recitals, [{ recital: '145', from: 'x y', to: 'z y' }], 'test')
		).toThrow(/passage not found/);
	});
});
