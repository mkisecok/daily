import { expect, test } from '@playwright/test';
import { choose, pickDate, chip } from './e2e-helpers.js';

/** requires the local stack from compose.yaml; see auth.e2e.ts */
const username = process.env.E2E_USER ?? 'test@dai-ly.de';
const password = process.env.E2E_PASSWORD ?? 'test-dev-password';

test('an audit report composes the audit with its checklist and findings', async ({ page }) => {
	const stamp = Date.now();
	const audit = `E2E-Audit ${stamp}`;
	const finding = `E2E-Feststellung ${stamp}`;
	const report = `E2E-Bericht ${stamp}`;

	await page.goto('/werkzeuge/auditprogramm/eintraege?neu=1');
	await page.locator('#username').fill(username);
	await page.locator('#password').fill(password);
	await page.locator('#kc-login').click();
	await expect(page).toHaveURL(/\/werkzeuge\/auditprogramm\/eintraege\?neu=1$/);
	await page.getByLabel('Titel').fill(audit);
	await page.getByLabel('Gegenstand und Umfang').fill('Personalverwaltung');
	await chip(page, 'DSGVO');
	await pickDate(page, 'Geplant am', '2026-11-10');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('.verdict .headline')).toHaveText('Audit geplant.');

	await page.goto('/werkzeuge/feststellungen/eintraege?neu=1');
	await page.getByLabel('Kurzbezeichnung').fill(finding);
	await choose(page.locator('#field-audit'), { label: audit });
	await choose(page.locator('#field-kategorie'), 'gering');
	await page.getByLabel('Sachverhalt').fill('Löschfristen nicht dokumentiert');
	await pickDate(page, 'Umsetzen bis', '2026-12-15');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('.verdict .headline')).toHaveText('Geringfügige Abweichung offen.');
	await expect(page.locator('.record-view')).toContainText(audit);

	await page.goto('/werkzeuge/auditbericht/eintraege?neu=1');
	await page.getByLabel('Titel').fill(report);
	await choose(page.locator('#field-audit'), { label: audit });
	await page.getByLabel('Zusammenfassung').fill('Grundsätzlich wirksam, eine Abweichung');
	await page.getByRole('button', { name: 'Speichern' }).click();

	const composed = page.locator('.composed');
	await expect(composed).toContainText(`Auditprogramm: ${audit}`);
	await expect(composed).toContainText('Feststellungen (1)');
	await expect(composed).toContainText(finding);
	await expect(composed).toContainText('Löschfristen nicht dokumentiert');

	await composed.getByRole('link', { name: audit }).click();
	const links = page.locator('.links');
	await expect(links).toContainText('Feststellungen');
	await expect(links.getByRole('link', { name: finding })).toBeVisible();
	await expect(links.getByRole('link', { name: report })).toBeVisible();
});
