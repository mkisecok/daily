import { expect, test } from '@playwright/test';
import { choose, pickDate } from './e2e-helpers.js';

test('preview keeps records in the browser across reloads and can delete them', async ({
	page
}) => {
	await page.goto('werkzeuge/ki-register/');
	await page.getByRole('link', { name: 'Öffnen' }).click();
	await expect(page).toHaveURL(/\/daily\/werkzeuge\/ki-register\/eintraege\/$/);
	await expect(
		page.getByText('Nur in diesem Browser gespeichert.', { exact: false })
	).toBeVisible();

	await page.getByRole('link', { name: 'Neuer Eintrag' }).click();
	await page.getByLabel('Bezeichnung').fill('Chatbot Kundenservice');
	await page.getByLabel('Zweck und Einsatzbereich').fill('Beantwortet Kundenanfragen');
	await choose(page.getByLabel('Rolle der Organisation'), 'betreiber');
	await choose(page.locator('#field-status'), 'aktiv');
	await pickDate(page, 'Wiedervorlage', '2030-01-15');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await page.reload();
	await expect(
		page.getByRole('heading', { level: 2, name: 'Chatbot Kundenservice' })
	).toBeVisible();

	await page.getByRole('link', { name: 'Fristen' }).click();
	await expect(page).toHaveURL(/\/daily\/fristen\/$/);
	await expect(page.locator('.deadlines')).toContainText('Wiedervorlage KI-System');

	await page.goto('werkzeuge/ki-register/eintraege/');
	await expect(page.getByRole('link', { name: 'Chatbot Kundenservice' })).toBeVisible();
	await page.getByRole('button', { name: 'Lokale Daten löschen' }).click();
	const dialog = page.getByRole('dialog', { name: 'Lokale Daten löschen?' });
	await dialog.getByLabel('Zur Bestätigung „löschen“ eingeben').fill('löschen');
	await dialog.getByRole('button', { name: 'Lokale Daten löschen' }).click();
	await expect(page.getByText('Noch keine Einträge.')).toBeVisible();
});
