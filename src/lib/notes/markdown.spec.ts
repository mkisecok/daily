import { describe, expect, it } from 'vitest';
import { inline, parse, plain } from './markdown.js';
import { sourceHref, tags } from './tool.js';

describe('note Markdown', () => {
	it('parses headings, paragraphs, lists and quotes', () => {
		const blocks = parse(
			'# Titel\n\nErste Zeile\nzweite Zeile\n\n- eins\n- zwei\n\n1. a\n2. b\n\n> Zitat'
		);
		expect(blocks.map((b) => b.type)).toEqual(['heading', 'paragraph', 'list', 'list', 'quote']);
		expect(blocks[1]).toEqual({
			type: 'paragraph',
			children: [{ type: 'text', text: 'Erste Zeile zweite Zeile' }]
		});
		expect(blocks[2]).toMatchObject({
			ordered: false,
			items: [[{ text: 'eins' }], [{ text: 'zwei' }]]
		});
		expect(blocks[3]).toMatchObject({ ordered: true });
	});

	it('parses emphasis, code and safe links only', () => {
		expect(inline('**fett** und *kursiv* und `code`').map((n) => n.type)).toEqual([
			'strong',
			'text',
			'em',
			'text',
			'code'
		]);
		expect(inline('[EDPB](https://edpb.europa.eu)')).toEqual([
			{
				type: 'link',
				href: 'https://edpb.europa.eu',
				external: true,
				children: [{ type: 'text', text: 'EDPB' }]
			}
		]);
		expect(inline('[intern](/fristen)')[0]).toMatchObject({ type: 'link', external: false });
		expect(inline('[böse](javascript:alert(1))')[0]).toEqual({ type: 'text', text: 'böse' });
		expect(inline('[x](//evil.example)')[0]).toEqual({ type: 'text', text: 'x' });
	});

	it('links citations into the Navigator and bare URLs', () => {
		expect(inline('siehe Art. 6 Abs. 1 lit. f DSGVO und § 26 BDSG')).toEqual([
			{ type: 'text', text: 'siehe ' },
			{ type: 'norm', path: '/normen/dsgvo/art-6', text: 'Art. 6 Abs. 1 lit. f DSGVO' },
			{ type: 'text', text: ' und ' },
			{ type: 'norm', path: '/normen/bdsg/p-26', text: '§ 26 BDSG' }
		]);
		expect(inline('Quelle: https://www.bfdi.bund.de/x.html.')).toEqual([
			{ type: 'text', text: 'Quelle: ' },
			{
				type: 'link',
				href: 'https://www.bfdi.bund.de/x.html',
				external: true,
				children: [{ type: 'text', text: 'https://www.bfdi.bund.de/x.html' }]
			},
			{ type: 'text', text: '.' }
		]);
		expect(inline('Art. 5 ISO 27001').map((n) => n.type)).toEqual(['text']);
		expect(inline('Art. 5 DSGVO (Art. 6 DSGVO)')).toEqual([
			{ type: 'norm', path: '/normen/dsgvo/art-5', text: 'Art. 5 DSGVO' },
			{ type: 'text', text: ' (' },
			{ type: 'norm', path: '/normen/dsgvo/art-6', text: 'Art. 6 DSGVO' },
			{ type: 'text', text: ')' }
		]);
		expect(inline('XArt. 5 DSGVO').map((n) => n.type)).toEqual(['text']);
	});

	it('gives plain text for lists and search', () => {
		expect(plain('# Titel\n**fett** [Link](https://x.de)')).toBe('Titel fett Link');
		expect(plain('a'.repeat(200), 10)).toBe('aaaaaaaaaa…');
	});
});

describe('note fields', () => {
	it('splits tags and recognises link sources', () => {
		expect(tags(' KI, Bußgeld,KI , ')).toEqual(['KI', 'Bußgeld']);
		expect(sourceHref('https://edpb.europa.eu/x')).toEqual({
			href: 'https://edpb.europa.eu/x',
			external: true
		});
		expect(sourceHref('/werkzeuge/vvt/eintraege?eintrag=1')).toEqual({
			href: '/werkzeuge/vvt/eintraege?eintrag=1',
			external: false
		});
		expect(sourceHref('Telefonat mit HR')).toBeNull();
		expect(sourceHref('//evil.example')).toBeNull();
	});
});
