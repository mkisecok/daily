import { expect, test } from '@playwright/test';

/** a PDF with one line of text on each page, built by hand so the test needs no fixture file */
function pdf(pages: string[]): Buffer {
	const objects: string[] = [];
	const kids = pages.map((_, i) => `${4 + i * 2} 0 R`).join(' ');
	objects.push('<< /Type /Catalog /Pages 2 0 R >>');
	objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
	objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
	for (const [i, line] of pages.entries()) {
		const stream = `BT /F1 12 Tf 72 720 Td (${line}) Tj ET`;
		objects.push(
			`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`
		);
		objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
	}
	let out = '%PDF-1.4\n';
	const offsets: number[] = [];
	for (const [i, body] of objects.entries()) {
		offsets.push(out.length);
		out += `${i + 1} 0 obj\n${body}\nendobj\n`;
	}
	const xref = out.length;
	out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	for (const offset of offsets) out += `${String(offset).padStart(10, '0')} 00000 n \n`;
	out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
	return Buffer.from(out, 'latin1');
}

/** the note a standard run puts above the outgoing text */
const NOTE =
	'Hinweis: Personenbezogene Daten in diesem Text sind durch Platzhalter in «…» ersetzt. Bitte übernimm die Platzhalter unverändert in deine Antwort.\n\n';

test('preview: the Pseudonymisierer replaces personal data and restores the reply', async ({
	page
}) => {
	await page.goto('werkzeuge/pseudonymisierer/', { waitUntil: 'networkidle' });
	await page
		.getByLabel('Text', { exact: true })
		.fill(
			'Patientin: Lena Müller, Müllerstraße 5\nE-Mail: lena.mueller@example.de\nDer Transport ist bezahlt.'
		);

	const output = page.getByRole('textbox', { name: 'Pseudonymisierter Text' });
	await expect(output).toHaveValue(
		NOTE + 'Patientin: «NAME_1», «ADDRESS_1»\nE-Mail: «EMAIL_1»\nDer Transport ist bezahlt.'
	);
	await expect(page.locator('.findings li')).toHaveCount(3);

	await page
		.getByLabel('Antwort der KI')
		.fill('Sehr geehrte «NAME_1», wir schreiben an [EMAIL 1] (siehe [Seite 3]). «NAME_7»');
	await expect(page.getByLabel('Antwort mit echten Werten')).toHaveValue(
		'Sehr geehrte Lena Müller, wir schreiben an lena.mueller@example.de (siehe [Seite 3]). «NAME_7»'
	);
	await expect(page.locator('.leftover')).toContainText('«NAME_7»');
	await expect(page.locator('.leftover')).not.toContainText('Seite');

	// switching a finding off sends it in the clear
	await page.locator('.marked .anon-mark', { hasText: 'Müllerstraße 5' }).click();
	await expect(output).toHaveValue(
		NOTE + 'Patientin: «NAME_1», Müllerstraße 5\nE-Mail: «EMAIL_1»\nDer Transport ist bezahlt.'
	);
});

test('preview: levels and group chips switch the rules, and a selection in the text is marked', async ({
	page
}) => {
	await page.goto('werkzeuge/pseudonymisierer/', { waitUntil: 'networkidle' });
	const source = page.getByLabel('Text', { exact: true });
	await source.fill(
		'Vertrag vom 03.04.2024 mit Svenja Hoffmann, Steuer-ID 86095742719. Projekt Nordlicht.'
	);
	const output = page.getByRole('textbox', { name: 'Pseudonymisierter Text' });
	await expect(output).toHaveValue(
		NOTE + 'Vertrag vom 03.04.2024 mit «NAME_1», Steuer-ID «NUMBER_1». Projekt Nordlicht.'
	);

	// strict replaces every date as well
	await page.getByRole('button', { name: 'Streng' }).click();
	await expect(output).toHaveValue(
		NOTE + 'Vertrag vom «DATE_1» mit «NAME_1», Steuer-ID «NUMBER_1». Projekt Nordlicht.'
	);

	// a group chip switches its rules together and shows how much it found
	const numbers = page
		.getByRole('group', { name: 'Gruppen' })
		.getByRole('button', { name: /Kenn- und Finanznummern/ });
	await expect(numbers).toContainText('1');
	await numbers.click();
	await expect(numbers).toHaveAttribute('aria-pressed', 'false');
	await expect(page.locator('.custom')).toHaveText('Angepasst');
	// the number rules are off; the phone rule still catches eleven digits
	await expect(output).not.toHaveValue(/NUMBER_1/);

	// selecting a word in the highlighted text fills the marking row
	await page.locator('.marked').evaluate((marked) => {
		const node = [...marked.childNodes].find(
			(n) => n.nodeType === 3 && n.textContent?.includes('Nordlicht')
		)!;
		const start = node.textContent!.indexOf('Nordlicht');
		const range = document.createRange();
		range.setStart(node, start);
		range.setEnd(node, start + 'Nordlicht'.length);
		document.getSelection()!.removeAllRanges();
		document.getSelection()!.addRange(range);
	});
	await expect(page.getByLabel('Text, der ersetzt werden soll')).toHaveValue('Nordlicht');
	await page.getByRole('button', { name: 'Markieren' }).click();
	await expect(output).toHaveValue(/Projekt «NAME_2»\.$/);
});

test('preview: own terms hold across visits, and the note for the AI can be left off', async ({
	page
}) => {
	await page.goto('werkzeuge/pseudonymisierer/', { waitUntil: 'networkidle' });
	await page.getByText('Eigene Begriffe').click();
	await page.getByLabel('Immer ersetzen').fill('Projekt Nordlicht');
	await page.getByLabel('Nie ersetzen').fill('Svenja Hoffmann');
	await page.reload({ waitUntil: 'networkidle' });

	await page
		.getByLabel('Text', { exact: true })
		.fill('Projekt Nordlicht: Svenja Hoffmann und Tobias Reinhardt.');
	const output = page.getByRole('textbox', { name: 'Pseudonymisierter Text' });
	await expect(output).toHaveValue(NOTE + '«CUSTOM_1»: Svenja Hoffmann und «NAME_1».');
	await expect(page.locator('.findings li', { hasText: 'Projekt Nordlicht' })).toContainText(
		'Eigener Begriff'
	);

	await page.getByText('Hinweis für die KI voranstellen').click();
	await expect(output).toHaveValue('«CUSTOM_1»: Svenja Hoffmann und «NAME_1».');
});

test('preview: the Pseudonymisierer opens from the search and the home page', async ({ page }) => {
	await page.goto('', { waitUntil: 'networkidle' });
	await page.getByRole('link', { name: 'Text pseudonymisieren' }).click();
	await expect(page).toHaveURL(/\/werkzeuge\/pseudonymisierer\/$/);
	await page.getByRole('button', { name: 'Suche öffnen' }).click();
	await page.keyboard.type('schwärzen');
	await expect(page.getByRole('option', { name: /Text pseudonymisieren/ })).toBeVisible();
});

test('preview: the name model stays off and contacts nobody until it is switched on', async ({
	page
}) => {
	const remote: string[] = [];
	page.on('request', (request) => {
		if (request.url().includes('huggingface')) remote.push(request.url());
	});
	await page.goto('werkzeuge/pseudonymisierer/', { waitUntil: 'networkidle' });
	await page
		.getByLabel('Text', { exact: true })
		.fill('Die Meldung kam von Jovanović aus der Buchhaltung.');
	await expect(page.getByRole('button', { name: 'Modell laden (349 MB)' })).toBeVisible();
	await expect(page.locator('.deep')).toContainText('huggingface.co');
	expect(remote).toEqual([]);
});

test('preview: each Art. 9 category has its own chip, and an own standard holds across visits', async ({
	page
}) => {
	await page.goto('werkzeuge/pseudonymisierer/', { waitUntil: 'networkidle' });
	await page
		.getByLabel('Text', { exact: true })
		.fill('Sie ist Mitglied der IG Metall. Diagnose: Asthma.');
	const art9 = page.getByRole('group', { name: 'Besondere Kategorien nach Art. 9 DSGVO einzeln' });
	// the group chip for all of them, then the eight categories
	await expect(art9.getByRole('button')).toHaveCount(9);
	const union = art9.getByRole('button', { name: /Gewerkschaft/ });
	await expect(union).toContainText('1');

	// switching one category off leaves the others on, and that set can be kept
	await union.click();
	const output = page.getByRole('textbox', { name: 'Pseudonymisierter Text' });
	await expect(output).toHaveValue(/Mitglied der IG Metall\. Diagnose: «HEALTH_DATA_1»/);
	await page.getByRole('button', { name: 'Als meinen Standard speichern' }).click();
	await page.reload({ waitUntil: 'networkidle' });
	await expect(page.getByRole('button', { name: 'Mein Standard' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect(
		page
			.getByRole('group', { name: 'Besondere Kategorien nach Art. 9 DSGVO einzeln' })
			.getByRole('button', { name: /Gewerkschaft/ })
	).toHaveAttribute('aria-pressed', 'false');
});

test('preview: an imported PDF shows page by page, and findings can be checked one by one', async ({
	page
}) => {
	await page.goto('werkzeuge/pseudonymisierer/', { waitUntil: 'networkidle' });
	await page.locator('label.file input[type=file]').setInputFiles({
		name: 'akte.pdf',
		mimeType: 'application/pdf',
		buffer: pdf([
			'Herr Brandt meldete den Vorfall am Montag.',
			'Frau Weber hat die Unterlagen geprueft.',
			'Kontakt: info@example.com, Diagnose: Asthma'
		])
	});
	const pager = page.getByRole('navigation', { name: 'Seiten' });
	await expect(pager).toContainText('Seite 1 von 3');
	await expect(page.locator('.marked')).toContainText('Brandt');
	await expect(page.locator('.marked')).not.toContainText('Weber');

	await pager.getByRole('button', { name: /Weiter/ }).click();
	await expect(pager).toContainText('Seite 2 von 3');
	await expect(page.locator('.marked')).toContainText('Weber');
	// the last page holds Art. 9 data, so its box says so
	const last = page
		.getByRole('list', { name: 'Alle Seiten' })
		.getByRole('button', { name: /^Seite 3/ });
	await expect(last).toHaveAttribute('data-art9', 'true');
	await last.click();
	await expect(pager).toContainText('Seite 3 von 3');

	// the AI gets the pages as blank lines, never the page break itself
	const output = page.getByRole('textbox', { name: 'Pseudonymisierter Text' });
	await expect(output).not.toHaveValue(/\f/);

	// finding by finding, with J to go on and a button to keep one in the clear
	await page.getByRole('button', { name: /Fund für Fund/ }).click();
	await expect(page.locator('.finding-review')).toContainText('Fund 1 von 4 · Seite 1');
	await page.keyboard.press('j');
	await expect(page.locator('.finding-review')).toContainText('Fund 2 von 4 · Seite 2');
	await page.getByRole('button', { name: 'Im Klartext lassen' }).click();
	await expect(output).toHaveValue(/Frau Weber hat/);
	await page.getByRole('button', { name: 'Seitenweise' }).click();
	await expect(pager).toContainText('Seite 2 von 3');
});

test('preview: the old Anonymisierer address forwards to the Pseudonymisierer', async ({
	page
}) => {
	await page.goto('werkzeuge/anonymisierer/');
	await expect(page).toHaveURL(/\/daily\/werkzeuge\/pseudonymisierer\/$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pseudonymisierer');
});
