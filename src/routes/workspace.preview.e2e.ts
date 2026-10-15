import { expect, test } from '@playwright/test';
import { choose, pickDate } from './e2e-helpers.js';

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
