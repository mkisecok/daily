import { describe, expect, it } from 'vitest';
import { citationPath, provisionsOf } from './cite.js';
import { crossReferences } from './crossref.js';
import { provisionLabel } from './laws.js';
import { citationIndex } from './usage.js';

const ids = (law: Parameters<typeof provisionsOf>[0]['law'], ref: string) =>
	provisionsOf({ law, ref }).map((r) => `${r.law}/${r.id}`);

describe('citations into the Navigator', () => {
	it('parses articles, lists, ranges, paragraphs, annexes and recitals', () => {
		expect(ids('DSGVO', 'Art. 35 Abs. 3 lit. a')).toEqual(['dsgvo/art-35']);
		expect(ids('KI-VO', 'Art. 4, 26, 50')).toEqual(['ki-vo/art-4', 'ki-vo/art-26', 'ki-vo/art-50']);
		expect(ids('DSGVO', 'Art. 15–22')).toHaveLength(8);
		expect(ids('BDSG', '§ 26 Abs. 2')).toEqual(['bdsg/p-26']);
		expect(ids('KI-VO', 'Anhang III Nr. 5')).toEqual(['ki-vo/anhang-iii']);
		expect(ids('DSGVO', 'Art. 33 Abs. 1, Art. 34 Abs. 1')).toEqual([
			'dsgvo/art-33',
			'dsgvo/art-34'
		]);
		expect(ids('KI-VO', 'Art. 3 Nr. 49')).toEqual(['ki-vo/art-3']);
	});

	it('ignores laws outside the Navigator', () => {
		expect(ids('ISO 27001', 'Kap. 9.2')).toEqual([]);
		expect(ids('EDPB', 'Leitlinien 9/2022')).toEqual([]);
		expect(citationPath({ law: 'TDDDG', ref: '§ 25' })).toBe('/normen/tdddg/p-25');
		expect(citationPath({ law: 'DSK', ref: 'Kurzpapier Nr. 5' })).toBeNull();
	});

	it('labels provisions in both languages', () => {
		expect(provisionLabel({ kind: 'artikel', number: '5' }, 'de')).toBe('Art. 5');
		expect(provisionLabel({ kind: 'paragraph', number: '26' }, 'en')).toBe('Section 26');
		expect(provisionLabel({ kind: 'erwaegungsgrund', number: '47' }, 'de')).toBe('ErwG 47');
		expect(provisionLabel({ kind: 'anhang', number: 'III' }, 'en')).toBe('Annex III');
	});
});

describe('cross-references in law texts', () => {
	const all = () => true;
	const linked = (text: string, law: Parameters<typeof crossReferences>[1]) =>
		crossReferences(text, law, all)
			.filter((s) => s.id)
			.map((s) => `${s.text} → ${s.law}/${s.id}`);

	it('links articles within the same law, including the paragraph', () => {
		expect(linked('gemäß Artikel 6 Absatz 1 Buchstabe f', 'dsgvo')).toEqual([
			'Artikel 6 Absatz 1 → dsgvo/art-6'
		]);
		expect(linked('referred to in Article 9(2)', 'dsgvo')).toEqual(['Article 9(2) → dsgvo/art-9']);
	});

	it('points references to other acts at the right law or leaves them plain', () => {
		expect(linked('Artikel 9 Absatz 1 der Verordnung (EU) 2016/679', 'ki-vo')).toEqual([
			'Artikel 9 Absatz 1 → dsgvo/art-9'
		]);
		expect(linked('Artikel 16 der Richtlinie (EU) 2016/680', 'dsgvo')).toEqual([]);
		expect(
			linked('Abweichend von Artikel 9 Absatz 1 der Verordnung (EU) 2016/679', 'bdsg')
		).toEqual(['Artikel 9 Absatz 1 → dsgvo/art-9']);
	});

	it('links paragraphs in German statutes but not paragraphs of other acts', () => {
		expect(linked('nach § 26 Absatz 1', 'bdsg')).toEqual(['§ 26 Absatz 1 → bdsg/p-26']);
		expect(linked('nach § 3 des Telekommunikationsgesetzes', 'tdddg')).toEqual([]);
		expect(linked('Artikel 6 ohne Bezug', 'bdsg')).toEqual([]);
	});

	it('keeps the full text and drops ids the law does not have', () => {
		const segments = crossReferences(
			'Artikel 999 und Artikel 5',
			'dsgvo',
			(_l, id) => id === 'art-5'
		);
		expect(segments.map((s) => s.text).join('')).toBe('Artikel 999 und Artikel 5');
		expect(segments.filter((s) => s.id).map((s) => s.id)).toEqual(['art-5']);
	});
});

describe('tools citing a provision', () => {
	it('indexes each tool once per provision', () => {
		const index = citationIndex([
			{
				slug: 'a',
				name: { de: 'A', en: 'A' },
				cites: [
					{ law: 'DSGVO', ref: 'Art. 35' },
					{ law: 'DSGVO', ref: 'Art. 35 Abs. 3' }
				]
			},
			{ slug: 'b', name: { de: 'B', en: 'B' }, cites: [{ law: 'DSGVO', ref: 'Art. 35, 36' }] }
		]);
		expect(index.get('dsgvo/art-35')?.map((t) => t.slug)).toEqual(['a', 'b']);
		expect(index.get('dsgvo/art-36')?.map((t) => t.slug)).toEqual(['b']);
	});
});
