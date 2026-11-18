import { describe, expect, it } from 'vitest';
import { detect } from './detect.js';
import { contextOf, pageAt, pagesOf, segmentsOf } from './pages.js';
import type { RuleKey } from './types.js';

const names = (text: string) => detect(text, new Set<RuleKey>(['name']), new Map(), new Set());

describe('pages of a text', () => {
	it('keeps the page breaks a PDF brought along', () => {
		const text = 'Seite eins\n\fSeite zwei\n\f\fSeite drei';
		expect(pagesOf(text).map((page) => text.slice(page.start, page.end).trim())).toEqual([
			'Seite eins',
			'Seite zwei',
			'Seite drei'
		]);
	});

	it('cuts a long text without breaks at a blank line near a page length', () => {
		const paragraph = 'Ein Absatz mit etwas Text. '.repeat(4);
		const text = `${paragraph}\n\n${paragraph}\n\n${paragraph}`;
		const pages = pagesOf(text, 150);
		expect(pages.length).toBe(3);
		expect(pages.at(-1)!.end).toBe(text.length);
		for (const page of pages.slice(1)) expect(text.slice(page.start - 2, page.start)).toBe('\n\n');
		expect(pagesOf('kurz')).toEqual([{ start: 0, end: 4 }]);
	});

	it('finds the page of an offset', () => {
		const pages = [
			{ start: 0, end: 10 },
			{ start: 10, end: 20 }
		];
		expect([pageAt(pages, 3), pageAt(pages, 10), pageAt(pages, 99)]).toEqual([0, 1, 1]);
	});

	it('cuts a page into text and findings, without the form feed', () => {
		const text = 'Herr Brandt schrieb.\fFrau Weber antwortete.';
		const spans = names(text);
		const [, second] = pagesOf(text);
		expect(segmentsOf(text, spans, second!).map((s) => [s.text, Boolean(s.span)])).toEqual([
			['Frau ', false],
			['Weber', true],
			[' antwortete.', false]
		]);
	});
});

describe('the context of a finding', () => {
	it('stays on the page of the finding', () => {
		const text = 'Erste Seite endet hier.\fHerr Brandt schreibt auf Seite zwei.';
		const span = names(text).find((s) => s.value === 'Brandt')!;
		const [, second] = pagesOf(text);
		const context = contextOf(text, span, 90, second);
		expect(context.before).toBe('Herr ');
		expect(context.cutBefore).toBe(false);
	});

	it('shows the words around it on one line, cut at a word', () => {
		const text =
			'Vorweg ein langer Satz ohne Belang.\nDann schrieb Herr Brandt an die Behörde und bat um Frist.';
		const span = names(text).find((s) => s.value === 'Brandt')!;
		const context = contextOf(text, span, 25);
		expect(context.before).toBe('Dann schrieb Herr ');
		expect(context.after).toMatch(/^ an die Behörde und \S+$/);
		expect([context.cutBefore, context.cutAfter]).toEqual([true, true]);
	});
});
