import { expect, test } from '@playwright/test';
import { pickDate } from './e2e-helpers.js';

/** requires the local stack from compose.yaml; see auth.e2e.ts */
const username = process.env.E2E_USER ?? 'test@dai-ly.de';
const password = process.env.E2E_PASSWORD ?? 'test-dev-password';

test('the data protection report lists this year’s records with status and assessment', async ({
	page
}) => {
	const title = `E2E-Berichtspanne ${Date.now()}`;
	await page.goto('/werkzeuge/datenpanne/eintraege?neu=1');
	await page.locator('#username').fill(username);
	await page.locator('#password').fill(password);
	await page.locator('#kc-login').click();
	await page.getByLabel('Bezeichnung').fill(title);
	await pickDate(page, 'Kenntnis am', '2026-10-14T09:00');
	await page.getByLabel('Was ist geschehen?').fill('Test für den Bericht');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await page.getByRole('link', { name: 'Berichte' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Berichte');
	await page.getByLabel('Bericht').selectOption('datenschutz');
	await expect(page).toHaveURL(/art=datenschutz/);
	await expect(page.locator('.cover h2')).toHaveText('Tätigkeitsbericht Datenschutz');

	const breach = page.locator('.tool', { hasText: 'Datenpanne' }).first();
	await expect(breach).toContainText('Erfasst');
	await expect(breach).toContainText('Risiko noch nicht bewertet.');
	await expect(breach.getByRole('link', { name: title })).toBeVisible();
	await expect(page.locator('.report')).toContainText('Durchgeführte Prüfungen');

	await page.getByLabel('Vorbemerkung').fill('Berichtsjahr mit einer Panne.');
	await expect(page.locator('.report .free')).toContainText('Berichtsjahr mit einer Panne.');

	await page.getByLabel('Bericht').selectOption('ki');
	await expect(page.locator('.report')).not.toContainText(title);
});
