import { expect, test } from '@playwright/test';
import { pickDate } from './e2e-helpers.js';

test('preview: the start page shows what is due and which cases are open', async ({ page }) => {
	await page.clock.setFixedTime(new Date('2026-11-13T09:00:00Z'));
	await page.goto('', { waitUntil: 'networkidle' });
	const today = page.getByRole('region', { name: 'Heute' });
	await expect(today).toContainText('Nichts ist überfällig');
	await expect(today).toContainText('Kein offener Vorgang');
	await expect(
		today.getByRole('navigation', { name: 'Neu anlegen' }).getByRole('link')
	).toHaveCount(8);

	// a breach known since yesterday: its 72 hours run out this week
	await today.getByRole('link', { name: 'Datenpanne' }).click();
	await expect(page).toHaveURL(/datenpanne\/eintraege\/?\?neu=1/);
	await page.locator('#field-bezeichnung').fill('Fehlversand Gehaltsabrechnung');
	await pickDate(page, 'Kenntnis am', '2026-11-12T08:00');
	await page.locator('#field-beschreibung').fill('Abrechnung an falsche Adresse.');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await page.goto('', { waitUntil: 'networkidle' });
	const due = today.getByRole('region', { name: 'Überfällig und diese Woche fällig' });
	await expect(due).toContainText('Meldung an die Aufsichtsbehörde');
	const cases = today.getByRole('region', { name: 'Offene Vorgänge' });
	await expect(cases.getByRole('link', { name: 'Fehlversand Gehaltsabrechnung' })).toBeVisible();
	await expect(cases).toContainText('Datenpanne');
	await expect(cases).toContainText('übermorgen');
});
