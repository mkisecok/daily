import { describe, expect, it } from 'vitest';
import { detect, suggest } from '../detect.js';
import { bareName, chunks, standsAlone } from './chunks.js';

describe('text pieces for the name model', () => {
	it('cuts long texts after a sentence and keeps every offset', () => {
		const text = 'Erster Satz hier. Zweiter Satz folgt gleich. Dritter Satz.';
		const pieces = chunks(text, 4);
		expect(pieces.map((piece) => piece.text.trim())).toEqual([
			'Erster Satz hier.',
			'Zweiter Satz folgt gleich.',
			'Dritter Satz.'
		]);
		for (const piece of pieces) expect(text.slice(piece.offset).startsWith(piece.text)).toBe(true);
	});

	it('strips titles and trailing punctuation from a found name', () => {
		expect(bareName('Dr. Ruth Albrecht-Bayer')).toBe('Ruth Albrecht-Bayer');
		expect(bareName('Herr Brandt,')).toBe('Brandt');
	});

	it('takes only whole words, so a span cut off mid-word is dropped', () => {
		const text = 'Bericht von Marie-Luise Ostermann-Kühn.';
		expect(standsAlone(text, 'Ostermann-Kühn')).toBe(true);
		expect(standsAlone(text, 'Ostermann-K')).toBe(false);
	});

	it('offers the model’s names as suggestions, unless already replaced', () => {
		const text = 'Die Meldung kam von Jovanović; Katharina Brandt war informiert.';
		const spans = detect(text, new Set(['name']), new Map(), new Set());
		expect(
			suggest(text, spans, ['Jovanović', 'Katharina Brandt']).map((s) => [s.value, s.reason])
		).toEqual([['Jovanović', 'model']]);
	});
});
