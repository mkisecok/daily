import { readFile } from 'node:fs/promises';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { expect, test, type Page } from '@playwright/test';
import { strFromU8, unzipSync } from 'fflate';
import { openDocx } from '../lib/tools/pseudonymisierer/document/docx.js';
import { makeDocx, p } from '../lib/tools/pseudonymisierer/document/fixture.js';
import { lockKey } from '../lib/tools/pseudonymisierer/document/key.js';
import { boxOnPage, pdf } from './e2e-helpers.js';

// the Word code reads XML with the browser's DOM; here in Node it gets xmldom
Object.assign(globalThis, { DOMParser, XMLSerializer });

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PASSWORD = 'ein-langes-passwort';

const letter = makeDocx({
	body: [
		p('Sehr geehrte Frau Katharina Brandt,'),
		p('Notiz: Sie wünscht einen Rückruf nach dem Urlaub.'),
		p('Sie erreichen uns unter k.brandt@example.org.')
	].join(''),
	creator: 'Anna Berg'
});

async function download(page: Page, button: string): Promise<Buffer> {
	const [file] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: button, exact: true }).click()
	]);
	return readFile((await file.path())!);
}

test('preview: a Word file is boxed, pseudonymised and restored', async ({ page }) => {
	await page.goto('werkzeuge/pseudonymisierer/dokument/', { waitUntil: 'networkidle' });
	await page
		.getByText('Word- oder PDF-Datei hochladen')
		.locator('input')
		.setInputFiles({
			name: 'Brief Katharina Brandt.docx',
			mimeType: DOCX,
			buffer: Buffer.from(letter)
		});
	await expect(page.getByText('Brief Katharina Brandt.docx gelesen (Seiten: 1).')).toBeVisible();
	await expect(page.locator('.marked .anon-mark', { hasText: 'Katharina Brandt' })).toBeVisible();

	// a box from the first word of the passage to its last
	await page.locator('.marked').scrollIntoViewIfNeeded();
	const first = await page
		.locator('.marked [data-at]', { hasText: /^Sie $/ })
		.first()
		.boundingBox();
	const last = await page.locator('.marked [data-at]', { hasText: 'Urlaub.' }).boundingBox();
	await page.mouse.move(first!.x + 2, first!.y + 2);
	await page.mouse.down();
	await page.mouse.move(last!.x + last!.width - 4, last!.y + last!.height - 2, { steps: 5 });
	await page.mouse.up();

	const pending = page.getByRole('form', { name: 'Neue Variable' });
	await expect(pending.locator('blockquote')).toHaveText(
		'Sie wünscht einen Rückruf nach dem Urlaub.'
	);
	await expect(pending.getByLabel('nur an dieser Stelle')).toBeChecked();
	await pending.getByLabel('Name der Variablen').fill('Notiz');
	await expect(pending).toContainText('«NOTIZ_n»');
	await pending.getByRole('button', { name: 'Übernehmen' }).click();
	await expect(page.locator('.variables')).toContainText('«NOTIZ_1»');

	// the file name loses the name it carried
	await expect(page.getByLabel('Dateiname')).toHaveValue(/^Brief NAME_\d-pseudonymisiert$/);
	const exporting = page.locator('form.export');
	await exporting.getByLabel('Passwort für den Schlüssel').fill(PASSWORD);
	await exporting.getByLabel('Passwort wiederholen').fill(PASSWORD);
	await page.getByRole('button', { name: 'Dateien erstellen' }).click();
	await expect(page.getByText('Ersetzte Werte: ')).toBeVisible();
	await expect(page.getByText('Dokumenteigenschaften wie Autor und Titel: 2')).toBeVisible();

	const pseudonymised = await download(page, 'Dokument herunterladen');
	const out = openDocx(new Uint8Array(pseudonymised)).text;
	expect(out).toContain('Notiz: «NOTIZ_1»');
	expect(out).toMatch(/Frau «NAME_\d»/);
	expect(out).not.toMatch(/Brandt|Rückruf|example\.org/);
	const everything = Object.values(unzipSync(new Uint8Array(pseudonymised)))
		.map((data) => strFromU8(data))
		.join('\n');
	expect(everything).not.toContain('Anna Berg');

	const key = await download(page, 'Schlüssel herunterladen');
	expect(key.toString('utf8')).not.toContain('Brandt');

	// back again, from the two downloaded files and the password
	await page.getByLabel('Pseudonymisierte Datei (Word oder PDF)').setInputFiles({
		name: 'brief.docx',
		mimeType: DOCX,
		buffer: pseudonymised
	});
	await page.getByLabel('Schlüsseldatei').setInputFiles({
		name: 'brief.schluessel.json',
		mimeType: 'application/json',
		buffer: key
	});
	await page.locator('.restore').getByLabel('Passwort für den Schlüssel').fill(PASSWORD);
	await page.getByRole('button', { name: 'Wiederherstellen', exact: true }).click();
	await expect(page.getByText(/Platzhalter zurückübersetzt/)).toBeVisible();
	await expect(page.getByText('bearbeitet oder gehört zu einem anderen Schlüssel')).toHaveCount(0);
	const restored = await download(page, 'Wiederhergestellte Datei herunterladen');
	expect(openDocx(new Uint8Array(restored)).text).toBe(openDocx(letter, { clean: true }).text);
});

test('preview: the Dokument view refuses .doc files and a wrong password', async ({ page }) => {
	await page.goto('werkzeuge/pseudonymisierer/dokument/', { waitUntil: 'networkidle' });
	await page
		.getByText('Word- oder PDF-Datei hochladen')
		.locator('input')
		.setInputFiles({
			name: 'alt.doc',
			mimeType: 'application/msword',
			buffer: Buffer.from('x')
		});
	await expect(page.getByText('alt.doc ist im alten Word-Format (.doc).')).toBeVisible();

	const key = await lockKey(
		{ fingerprint: '', created: '', values: { '«NAME_1»': 'Anna' } },
		PASSWORD,
		1000
	);
	await page.getByLabel('Pseudonymisierte Datei (Word oder PDF)').setInputFiles({
		name: 'a.docx',
		mimeType: DOCX,
		buffer: Buffer.from(makeDocx({ body: p('Hallo «NAME_1»') }))
	});
	await page.getByLabel('Schlüsseldatei').setInputFiles({
		name: 'a.json',
		mimeType: 'application/json',
		buffer: Buffer.from(key)
	});
	await page.locator('.restore').getByLabel('Passwort für den Schlüssel').fill('falsch');
	await page.getByRole('button', { name: 'Wiederherstellen', exact: true }).click();
	await expect(page.getByRole('alert')).toHaveText('Das Passwort passt nicht zu diesem Schlüssel.');
});

test('preview: the text and Dokument views link to each other', async ({ page }) => {
	await page.goto('werkzeuge/pseudonymisierer/', { waitUntil: 'networkidle' });
	const modes = page.getByRole('navigation', { name: 'Arbeitsweise' });
	await expect(modes.getByRole('link', { name: 'Text' })).toHaveAttribute('aria-current', 'page');
	await modes.getByRole('link', { name: 'Dokument' }).click();
	await expect(page).toHaveURL(/pseudonymisierer\/dokument\/?$/);
	await expect(page.getByText('Word- oder PDF-Datei hochladen')).toBeVisible();
});

/** the text of a PDF as pdf.js reads it */
async function pdfText(bytes: Buffer): Promise<string> {
	const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
	const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes), useWorkerFetch: false })
		.promise;
	const out: string[] = [];
	for (let n = 1; n <= doc.numPages; n++) {
		const content = await (await doc.getPage(n)).getTextContent();
		out.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
	}
	await doc.loadingTask.destroy();
	return out.join('\n');
}

test('preview: a PDF is boxed on its page picture, rebuilt with placeholders and restored', async ({
	page
}) => {
	await page.goto('werkzeuge/pseudonymisierer/dokument/', { waitUntil: 'networkidle' });
	await page
		.getByText('Word- oder PDF-Datei hochladen')
		.locator('input')
		.setInputFiles({
			name: 'Brief.pdf',
			mimeType: 'application/pdf',
			buffer: pdf([
				[
					'Sehr geehrte Frau Katharina Brandt,',
					'Notiz:',
					'Sie wuenscht einen Rueckruf.',
					'Mit freundlichen Gruessen'
				],
				'Seite zwei ohne Namen.'
			])
		});
	await expect(page.getByText('Brief.pdf gelesen (Seiten: 2).')).toBeVisible();
	const sheet = page.getByRole('group', { name: /^Seite 1: Ziehen Sie einen Kasten/ });
	await expect(sheet.locator('.anon-mark').first()).toBeVisible();

	// the third line: its baseline 32pt below 720 on a 792pt page, 12pt type
	await boxOnPage(page, sheet, [60, 96], [560, 106]);

	const pending = page.getByRole('form', { name: 'Neue Variable' });
	await expect(pending.locator('blockquote')).toHaveText('Sie wuenscht einen Rueckruf.');
	await pending.getByLabel('Name der Variablen').fill('Notiz');
	await pending.getByRole('button', { name: 'Übernehmen' }).click();
	await expect(page.locator('.variables')).toContainText('«NOTIZ_1»');

	// the same text, word by word
	await page.getByRole('button', { name: 'Text auswählen' }).click();
	await expect(page.locator('.marked')).toContainText('Sehr geehrte Frau');
	await page.getByRole('button', { name: 'Kasten ziehen' }).click();

	await expect(page.getByLabel('Dateiname')).toHaveValue('Brief-pseudonymisiert');
	const exporting = page.locator('form.export');
	await exporting.getByLabel('Passwort für den Schlüssel').fill(PASSWORD);
	await exporting.getByLabel('Passwort wiederholen').fill(PASSWORD);
	await page.getByRole('button', { name: 'Dateien erstellen' }).click();
	await expect(page.getByText('aus Bildern ihrer Seiten neu aufgebaut')).toBeVisible();

	const pseudonymised = await download(page, 'Dokument herunterladen');
	expect(pseudonymised.subarray(0, 5).toString()).toBe('%PDF-');
	const out = await pdfText(pseudonymised);
	expect(out).toContain('«NAME_1»');
	expect(out).toContain('«NOTIZ_1»');
	expect(out).toContain('Seite zwei ohne Namen.');
	expect(out).not.toMatch(/Brandt|Rueckruf/);
	expect(pseudonymised.includes('Brandt')).toBe(false);
	const key = await download(page, 'Schlüssel herunterladen');

	await page.getByLabel('Pseudonymisierte Datei (Word oder PDF)').setInputFiles({
		name: 'Brief-pseudonymisiert.pdf',
		mimeType: 'application/pdf',
		buffer: pseudonymised
	});
	await page.getByLabel('Schlüsseldatei').setInputFiles({
		name: 'Brief.schluessel.json',
		mimeType: 'application/json',
		buffer: key
	});
	await page.locator('.restore').getByLabel('Passwort für den Schlüssel').fill(PASSWORD);
	await page.getByRole('button', { name: 'Wiederherstellen', exact: true }).click();
	await expect(page.getByText('Eine lesbare Kopie')).toBeVisible();
	await expect(page.getByText('bearbeitet oder gehört zu einem anderen Schlüssel')).toHaveCount(0);
	const restored = await pdfText(await download(page, 'Wiederhergestellte Datei herunterladen'));
	expect(restored).toContain('Katharina Brandt');
	expect(restored).toContain('Sie wuenscht einen Rueckruf.');
	expect(restored).not.toContain('«');
});
