import { expect, test } from '@playwright/test';
import { chip, choose, pickDate } from './e2e-helpers.js';

test('preview: Navigator pages and search work under the base path', async ({ page }) => {
	await page.goto('normen/');
	await page.getByLabel('In allen Gesetzen suchen').fill('Art. 22');
	await expect(page.locator('.hits li')).toHaveCount(2);
	await page.locator('.hits a', { hasText: 'DSGVO' }).click();
	await expect(page).toHaveURL(/\/daily\/normen\/dsgvo\/art-22\/$/);
	await expect(page.getByRole('heading', { level: 1 })).toContainText(
		'Automatisierte Entscheidungen'
	);
	await expect(page.locator('.cited')).toContainText('KI und DSGVO');
});

test('preview: notes stay in the browser and reports read the browser records', async ({
	page
}) => {
	await page.goto('notizen/');
	await page.getByRole('button', { name: 'Heutige Notiz' }).click();
	await expect(page.getByRole('heading', { level: 2 })).toContainText('Notiz vom');
	await page.reload();
	await expect(page.getByRole('heading', { level: 2 })).toContainText('Notiz vom');

	await page.goto('werkzeuge/datenpanne/eintraege/?neu=1');
	await page.getByLabel('Bezeichnung').fill('Vorschau-Panne');
	await pickDate(page, 'Kenntnis am', '2026-10-14T09:00');
	await page.getByLabel('Was ist geschehen?').fill('Test');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await page.goto('berichte/?art=datenschutz&von=2026-01-01&bis=2026-12-31');
	await expect(page.locator('.tool', { hasText: 'Datenpanne' }).first()).toContainText(
		'Vorschau-Panne'
	);
	await expect(page.locator('.report')).toContainText('nur in der vollständigen Installation');
});

test('preview: a chosen chip stays distinguishable in forced colours', async ({ page }) => {
	await page.emulateMedia({ forcedColors: 'active' });
	await page.goto('werkzeuge/datenpanne/eintraege/?neu=1');
	const group = page.getByRole('group', { name: 'Datenkategorien' });
	const first = group.getByRole('button').first();
	await first.click();
	await expect(first).toHaveAttribute('aria-pressed', 'true');
	// colours are forced, so the check mark (instead of the plus) carries the state
	await expect(first.locator('path')).toHaveCount(1);
	await expect(group.getByRole('button').nth(1).locator('path')).toHaveCount(2);
});

test('preview: the calendar fills a date field and the record keeps it', async ({ page }) => {
	await page.goto('werkzeuge/ki-register/eintraege/?neu=1');
	await page.getByLabel('Bezeichnung').fill('Kalendertest');
	await page.getByLabel('Zweck und Einsatzbereich').fill('Test');
	await choose(page.getByLabel('Rolle der Organisation'), 'betreiber');
	await choose(page.locator('#field-status'), 'aktiv');
	const field = page.getByRole('group', { name: 'Wiedervorlage', exact: true });
	await field.getByRole('button', { name: 'Kalender öffnen' }).click();
	const day = page.locator('[data-calendar-day]:not([data-outside-month])', { hasText: /^15$/ });
	const iso = await day.getAttribute('data-value');
	await day.click();
	await expect(field.locator('[data-segment="day"]')).toHaveText('15');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);
	const [year, month] = (iso ?? '').split('-');
	await expect(page.locator('.record-view')).toContainText(`15.${month}.${year}`);
});

test('preview: on a phone the menu opens as a sheet, navigates and closes', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 740 });
	await page.goto('werkzeuge/');
	await expect(page.locator('.sidebar')).toBeHidden();
	const button = page.getByRole('button', { name: 'Menü' });
	await button.click();
	const sheet = page.getByRole('dialog');
	const menu = sheet.getByRole('navigation', { name: 'Hauptnavigation' });
	await expect(menu.getByRole('link')).toHaveCount(6);
	await expect(sheet.getByRole('link', { name: /Werkzeuge/ })).toHaveAttribute(
		'aria-current',
		'page'
	);
	const box = await sheet.getByRole('link', { name: /Normen/ }).boundingBox();
	expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
	for (const control of [
		sheet.getByRole('link', { name: 'DE', exact: true }),
		sheet.getByRole('link', { name: 'EN', exact: true }),
		sheet.locator('.switch')
	]) {
		const size = await control.boundingBox();
		expect(Math.min(size?.width ?? 0, size?.height ?? 0)).toBeGreaterThanOrEqual(44);
	}

	await sheet.getByRole('link', { name: /Normen/ }).click();
	await expect(page).toHaveURL(/\/daily\/normen\/$/);
	await expect(sheet).toBeHidden();

	await button.click();
	await expect(sheet).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(sheet).toBeHidden();
	await expect(button).toBeFocused();
	expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});

test('preview: clearing a reference field removes the link when saved', async ({ page }) => {
	await page.goto('werkzeuge/auditprogramm/eintraege/?neu=1');
	await page.getByLabel('Titel').fill('Vorschau-Audit');
	await page.getByLabel('Gegenstand und Umfang').fill('Personal');
	await chip(page, 'DSGVO');
	await pickDate(page, 'Geplant am', '2026-11-10');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await page.goto('werkzeuge/feststellungen/eintraege/?neu=1');
	await page.getByLabel('Kurzbezeichnung').fill('Vorschau-Feststellung');
	await choose(page.locator('#field-audit'), { label: 'Vorschau-Audit' });
	await choose(page.locator('#field-kategorie'), 'gering');
	await page.getByLabel('Sachverhalt').fill('Test');
	await pickDate(page, 'Umsetzen bis', '2026-12-15');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('.record-view')).toContainText('Vorschau-Audit');

	await page.getByRole('button', { name: 'Bearbeiten' }).click();
	await page.locator('#field-audit').fill('');
	await page.getByLabel('Sachverhalt').click();
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('.record-view')).not.toContainText('Vorschau-Audit');
});

test('preview: an optional dropdown can be set back to nothing', async ({ page }) => {
	await page.goto('werkzeuge/datenpanne/eintraege/?neu=1');
	const risk = page.locator('#field-risiko');
	await choose(risk, 'kein');
	await expect(risk).toContainText('Voraussichtlich kein Risiko');
	await choose(risk, '');
	await expect(risk).toContainText('bitte wählen');
});

test('preview: date fields tell assistive technology they are required', async ({ page }) => {
	await page.goto('werkzeuge/datenpanne/eintraege/?neu=1');
	const day = page
		.getByRole('group', { name: 'Kenntnis am', exact: true })
		.locator('[data-segment="day"]');
	await expect(day).toHaveAttribute('aria-required', 'true');
});

test('preview: contents rows keep space between number and title', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 740 });
	await page.goto('normen/ki-vo/');
	const smallest = await page.locator('.toc').evaluate((toc) => {
		let min = Infinity;
		for (const a of toc.querySelectorAll('a')) {
			const ref = a.querySelector('.ref');
			const title = [...a.childNodes].find((n) => n.nodeType === 3 && n.textContent?.trim());
			if (!ref || !title) continue;
			const range = document.createRange();
			range.selectNodeContents(title);
			min = Math.min(min, range.getBoundingClientRect().left - ref.getBoundingClientRect().right);
		}
		return min;
	});
	expect(smallest).toBeGreaterThanOrEqual(4);
});

test('preview: the phone menu keeps focus inside, closes on desktop width, theme stays in step', async ({
	page
}) => {
	await page.setViewportSize({ width: 375, height: 740 });
	await page.goto('werkzeuge/');
	await page.getByRole('button', { name: 'Menü' }).click();
	const sheet = page.getByRole('dialog');
	for (let i = 0; i < 14; i++) await page.keyboard.press('Tab');
	expect(await sheet.evaluate((d) => d.contains(document.activeElement))).toBe(true);

	const before = await page.evaluate(() => document.documentElement.dataset.theme);
	await sheet.locator('.switch').click();
	await page.setViewportSize({ width: 1280, height: 800 });
	await expect(sheet).toBeHidden();
	await page.locator('.sidebar .switch').click();
	expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(before);
});

test('preview: a searchable field says when nothing matches', async ({ page }) => {
	await page.goto('werkzeuge/feststellungen/eintraege/?neu=1');
	await page.locator('#field-audit').click();
	await page.locator('#field-audit').pressSequentially('zzzz');
	await expect(page.getByText('Keine Treffer')).toBeVisible();
});

test('preview: the command palette jumps to a tool and searches the laws', async ({ page }) => {
	// the shortcut listener exists once the page is hydrated
	await page.goto('werkzeuge/', { waitUntil: 'networkidle' });
	await page.keyboard.press('Control+k');
	const palette = page.getByRole('dialog', { name: 'Suche öffnen' });
	await expect(palette).toBeVisible();
	await page.keyboard.type('Datenpanne');
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/daily\/werkzeuge\/datenpanne\/$/);
	await expect(palette).toBeHidden();

	await page.keyboard.press('/');
	await expect(palette).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(palette).toBeHidden();

	await page.getByRole('button', { name: 'Suche öffnen' }).click();
	await page.keyboard.type('Art. 22');
	await palette.getByRole('option', { name: /In den Normen suchen/ }).click();
	await expect(page).toHaveURL(/\/daily\/normen\/\?q=Art\.%2022$/);
	await expect(page.getByLabel('In allen Gesetzen suchen')).toHaveValue('Art. 22');
});

test('preview: typing "/" in a text field does not open the palette', async ({ page }) => {
	await page.goto('notizen/?neu=1');
	await page.getByLabel('Titel').fill('a/b');
	await expect(page.getByLabel('Titel')).toHaveValue('a/b');
	await expect(page.getByRole('dialog', { name: 'Suche öffnen' })).toBeHidden();
});
