import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { strFromU8, unzipSync } from 'fflate';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildRun, detect } from '../detect.js';
import { PAGE_BREAK } from '../pages.js';
import { RULE_KEYS } from '../rules.js';
import type { RuleKey } from '../types.js';
import { openDocx } from './docx.js';
import { makeDocx, p } from './fixture.js';
import { fingerprint, KeyError, lockKey, unlockKey } from './key.js';
import {
	documentPages,
	pseudonymiseDocx,
	restoreDocx,
	scrubbedName,
	trimmed,
	variableName
} from './run.js';

beforeAll(() => {
	// the browser has these; the unit tests run in Node
	Object.assign(globalThis, { DOMParser, XMLSerializer });
});

const ALL = new Set<RuleKey>(RULE_KEYS);
const file = (bytes: Uint8Array, name: string) => strFromU8(unzipSync(bytes)[name]!);

/** detected spans of a document, with a place for each stretch given */
function spansOf(bytes: Uint8Array, places: { from: string; to: string; label: string }[] = []) {
	const { text } = openDocx(bytes, { clean: true });
	const marks = places.map(({ from, to, label }) => {
		const start = text.indexOf(from);
		return { ...trimmed(text, start, text.indexOf(to, start) + to.length), label };
	});
	const spans = detect(text, ALL, new Map(), new Set(), marks);
	buildRun(text, spans);
	return spans;
}

describe('reading a Word file', () => {
	it('reads paragraphs, tabs and line breaks, then headers, as text with an origin per character', () => {
		const docx = openDocx(
			makeDocx({
				body: `${p('Anna ', 'Berg')}<w:p><w:r><w:t>a</w:t><w:tab/><w:t>b</w:t><w:br/><w:t>c</w:t></w:r></w:p>`,
				header: p('Kopf')
			})
		);
		expect(docx.text).toBe(`Anna Berg\na\tb\nc\n${PAGE_BREAK}Kopf\n`);
		expect(docx.origins).toHaveLength(docx.text.length);
		expect(docx.origins[5]).toMatchObject({ kind: 'text', at: 0 });
		expect(docx.origins[9]).toMatchObject({ kind: 'paragraph' });
	});

	it('leaves deleted text and field codes out', () => {
		const docx = openDocx(
			makeDocx({
				body: `<w:p><w:del w:author="X"><w:r><w:delText>alt</w:delText></w:r></w:del><w:r><w:instrText>HYPERLINK</w:instrText><w:t>neu</w:t></w:r></w:p>`
			})
		);
		expect(docx.text).toBe('neu\n');
	});

	it('pages at the breaks Word recorded, and cuts long stretches', () => {
		const text = `eins\n${PAGE_BREAK}zwei\n${PAGE_BREAK}\n${PAGE_BREAK}drei`;
		expect(documentPages(text).map((page) => text.slice(page.start, page.end).trim())).toEqual([
			'eins',
			'zwei',
			'drei'
		]);
		expect(documentPages('Satz. '.repeat(1000)).length).toBeGreaterThan(1);
	});
});

describe('cleaning a Word file', () => {
	it('accepts tracked changes and drops comments, author, preview picture and template path', async () => {
		const bytes = makeDocx({
			body: `<w:p><w:commentRangeStart w:id="0"/><w:ins w:author="Anna Berg"><w:r><w:t>neu</w:t></w:r></w:ins><w:del w:author="Anna Berg"><w:r><w:delText>geheim</w:delText></w:r></w:del><w:commentRangeEnd w:id="0"/><w:r><w:commentReference w:id="0"/></w:r></w:p>`,
			comments:
				'<w:comment w:id="0" w:author="Anna Berg"><w:p><w:r><w:t>Frag Anna</w:t></w:r></w:p></w:comment>',
			creator: 'Anna Berg',
			thumbnail: true,
			images: 2
		});
		const result = await pseudonymiseDocx(bytes, []);
		expect(result.cleaned).toMatchObject({ revisions: 2, comments: 1, thumbnail: true, images: 2 });
		expect(result.cleaned.properties).toBeGreaterThanOrEqual(2);
		const files = unzipSync(result.bytes);
		expect(files['docProps/thumbnail.jpeg']).toBeUndefined();
		const all = Object.values(files)
			.map((data) => strFromU8(data))
			.join('\n');
		expect(all).not.toContain('geheim');
		expect(all).not.toContain('Anna');
		expect(file(result.bytes, 'word/document.xml')).toContain('neu');
	});
});

describe('pseudonymising and restoring a Word file', () => {
	const letter = makeDocx({
		body: [
			`<w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">Sehr geehrte Frau Katharina </w:t></w:r><w:r><w:t>Brandt,</w:t></w:r></w:p>`,
			p('Ihre E-Mail an k.brandt@example.org ist eingegangen.'),
			p('Diagnose: Die Patientin leidet seit 2019'),
			p('an wiederkehrender Migräne.'),
			p('Mit freundlichen Grüßen')
		].join(''),
		header: p('Akte Brandt'),
		bodyRels:
			'<Relationship Id="rIdL" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="mailto:k.brandt@example.org" TargetMode="External"/>'
	});

	it('writes placeholders into the file in place, keeps the formatting and leaves the key out', async () => {
		const spans = spansOf(letter, [{ from: 'Die Patientin', to: 'Migräne.', label: 'DIAGNOSE' }]);
		const result = await pseudonymiseDocx(letter, spans);
		const out = openDocx(result.bytes);
		expect(out.text).toContain('«NAME_');
		expect(out.text).toContain('«EMAIL_1»');
		expect(out.text).toContain('Diagnose: «DIAGNOSE_1»\nMit freundlichen');
		expect(out.text).not.toMatch(/Brandt|Migräne|example\.org/);
		const xml = file(result.bytes, 'word/document.xml');
		// the name's run keeps the bold of the run it starts in
		expect(xml).toMatch(/<w:b\/><\/w:rPr><w:t xml:space="preserve">Sehr geehrte Frau «NAME_\d»/);
		expect(file(result.bytes, 'word/_rels/document.xml.rels')).not.toContain('example.org');
		expect(Object.values(result.key.values)).toContain(
			'Die Patientin leidet seit 2019\nan wiederkehrender Migräne.'
		);
		expect(result.key.fingerprint).toBe(await fingerprint(out.text));
	});

	it('restores the original text, paragraphs and links from the key', async () => {
		const original = openDocx(letter, { clean: true }).text;
		const spans = spansOf(letter, [{ from: 'Die Patientin', to: 'Migräne.', label: 'DIAGNOSE' }]);
		const { bytes, key } = await pseudonymiseDocx(letter, spans);
		const restored = await restoreDocx(bytes, key);
		expect(openDocx(restored.bytes).text).toBe(original);
		expect(restored).toMatchObject({ count: spans.length, leftover: [], changed: false });
		expect(file(restored.bytes, 'word/_rels/document.xml.rels')).toContain(
			'mailto:k.brandt@example.org'
		);
		// the boxed section is two paragraphs again
		expect(file(restored.bytes, 'word/document.xml').match(/<w:p[ >]/g)).toHaveLength(5);
	});

	it('restores placeholders that Word split across runs or a model respelled, and names unknown ones', async () => {
		const edited = makeDocx({
			body: p('Antwort an «NA', 'ME_1» und [email 1].') + p('Neu: «NAME_9»')
		});
		const restored = await restoreDocx(edited, {
			fingerprint: 'x',
			created: '',
			values: { '«NAME_1»': 'Katharina Brandt', '«EMAIL_1»': 'k.brandt@example.org' }
		});
		expect(openDocx(restored.bytes).text).toBe(
			'Antwort an Katharina Brandt und k.brandt@example.org.\nNeu: «NAME_9»\n'
		);
		expect(restored).toMatchObject({ count: 2, total: 2, leftover: ['«NAME_9»'], changed: true });
	});

	it('restores a value with a tab as a tab', async () => {
		const bytes = makeDocx({ body: p('Konto «NUMBER_1» ok') });
		const restored = await restoreDocx(bytes, {
			fingerprint: '',
			created: '',
			values: { '«NUMBER_1»': 'DE12\t3456' }
		});
		expect(openDocx(restored.bytes).text).toBe('Konto DE12\t3456 ok\n');
		expect(file(restored.bytes, 'word/document.xml')).toContain('<w:tab/>');
	});
});

describe('the key file', () => {
	const content = {
		fingerprint: 'abc',
		created: '2026-11-24',
		values: { '«NAME_1»': 'Anna Berg' }
	};

	it('opens with the password and shows nothing without it', async () => {
		const locked = await lockKey(content, 'richtig-langes-passwort', 1000);
		expect(locked).not.toContain('Anna');
		expect(JSON.parse(locked)).toMatchObject({
			format: 'daily-pseudonymisierer-schluessel',
			version: 1
		});
		await expect(unlockKey(locked, 'richtig-langes-passwort')).resolves.toEqual(content);
	});

	it('refuses a wrong password and a file that is no key', async () => {
		const locked = await lockKey(content, 'richtig-langes-passwort', 1000);
		await expect(unlockKey(locked, 'falsch')).rejects.toEqual(new KeyError('password'));
		await expect(unlockKey('{"a":1}', 'x')).rejects.toEqual(new KeyError('format'));
		await expect(unlockKey('kein json', 'x')).rejects.toEqual(new KeyError('format'));
	});
});

describe('names', () => {
	it('turns a label into a variable name', () => {
		expect(variableName('Diagnose')).toBe('DIAGNOSE');
		expect(variableName(' Gesprächsnotiz 2 ')).toBe('GESPRAECHSNOTIZ_2');
		expect(variableName('Straße/Ort')).toBe('STRASSE_ORT');
		expect(variableName('!!')).toBe('');
	});

	it('takes names out of a file name', () => {
		expect(scrubbedName('Gutachten_Katharina_Brandt', { '«NAME_1»': 'Katharina Brandt' })).toBe(
			'Gutachten_NAME_1'
		);
		expect(scrubbedName('Brief', { '«NAME_1»': 'Al' })).toBe('Brief');
	});
});
