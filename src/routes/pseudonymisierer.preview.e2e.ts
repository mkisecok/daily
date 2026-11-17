import { expect, test } from '@playwright/test';

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
		'Patientin: «NAME_1», «ADDRESS_1»\nE-Mail: «EMAIL_1»\nDer Transport ist bezahlt.'
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
	await page.locator('.marked .mark', { hasText: 'Müllerstraße 5' }).click();
	await expect(output).toHaveValue(
		'Patientin: «NAME_1», Müllerstraße 5\nE-Mail: «EMAIL_1»\nDer Transport ist bezahlt.'
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
		'Vertrag vom 03.04.2024 mit «NAME_1», Steuer-ID «NUMBER_1». Projekt Nordlicht.'
	);

	// strict replaces every date as well
	await page.getByRole('button', { name: 'Streng' }).click();
	await expect(output).toHaveValue(
		'Vertrag vom «DATE_1» mit «NAME_1», Steuer-ID «NUMBER_1». Projekt Nordlicht.'
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

test('preview: the old Anonymisierer address forwards to the Pseudonymisierer', async ({
	page
}) => {
	await page.goto('werkzeuge/anonymisierer/');
	await expect(page).toHaveURL(/\/daily\/werkzeuge\/pseudonymisierer\/$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pseudonymisierer');
});
