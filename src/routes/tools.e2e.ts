import { expect, test } from '@playwright/test';

/** Requires the local stack from compose.yaml; see auth.e2e.ts. */
const username = process.env.E2E_USER ?? 'test@dai-ly.de';
const password = process.env.E2E_PASSWORD ?? 'test-dev-password';

test('catalogue lists the DSFA screening as available and planned tools without links', async ({
	page
}) => {
	await page.goto('/werkzeuge');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Werkzeuge');
	await expect(page.getByRole('link', { name: 'DSFA-Schwellwertanalyse' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Risikoklassifizierung' })).toBeVisible();
	await expect(
		page.locator('.tool .title', { hasText: 'Grundrechte-Folgenabschätzung' })
	).toBeVisible();
	await expect(page.getByRole('link', { name: 'Grundrechte-Folgenabschätzung' })).toHaveCount(0);
});

test('DSFA screening: answer, save, and read the verdict back', async ({ page }) => {
	await page.goto('/werkzeuge/dsfa-schwellwert');
	await page.getByRole('link', { name: /Anmelden, um Ergebnisse zu speichern/ }).click();
	await page.locator('#username').fill(username);
	await page.locator('#password').fill(password);
	await page.locator('#kc-login').click();
	await expect(page).toHaveURL(/\/werkzeuge\/dsfa-schwellwert\/neu$/);

	const questions = page.locator('fieldset');
	await expect(questions).toHaveCount(13);
	for (let i = 0; i < 13; i++) {
		await questions.nth(i).getByLabel('Nein').check();
	}
	await questions.nth(1).getByLabel('Ja').check(); // Art. 35 Abs. 3 lit. b

	await page.getByRole('button', { name: 'Auswerten und speichern' }).click();
	await expect(page).toHaveURL(/\/werkzeuge\/dsfa-schwellwert\/[0-9a-f-]{36}$/);
	await expect(page.getByRole('heading', { level: 2, name: 'DSFA erforderlich.' })).toBeVisible();
	await expect(page.getByText('Art. 35 Abs. 3 lit. b DSGVO').first()).toBeVisible();

	await page.getByRole('link', { name: 'Zum Werkzeug' }).click();
	await expect(page.getByRole('cell', { name: 'DSFA erforderlich.' }).first()).toBeVisible();

	await page.getByRole('button', { name: 'Abmelden' }).click();
	await expect(page.getByRole('link', { name: 'Anmelden' })).toBeVisible();
});

test('risk classification runs in the browser without an account', async ({ page }) => {
	await page.goto('/werkzeuge/risikoklassifizierung');
	await page.getByRole('link', { name: /Prüfung beginnen/ }).click();
	await expect(page).toHaveURL(/\/werkzeuge\/risikoklassifizierung\/pruefen$/);

	const questions = page.locator('fieldset');
	const count = await questions.count();
	expect(count).toBeGreaterThan(20);
	for (let i = 0; i < count; i++) {
		await questions.nth(i).getByLabel('Nein').check();
	}
	await questions.nth(0).getByLabel('Ja').check(); // it is an AI system
	await page.locator('input[name="answer.t_interaction"][value="yes"]').check();

	await page.getByRole('button', { name: 'Auswerten' }).click();
	await expect(
		page.getByRole('heading', { level: 2, name: 'Transparenzpflichten nach Art. 50.' })
	).toBeVisible();

	await page.getByRole('button', { name: 'Antworten ändern' }).click();
	await expect(page.locator('input[name="answer.t_interaction"][value="yes"]')).toBeChecked();
});

test('consent check offers "not applicable" and names each defect', async ({ page }) => {
	await page.goto('/werkzeuge/einwilligung-check/pruefen');

	const questions = page.locator('fieldset');
	const count = await questions.count();
	for (let i = 0; i < count; i++) {
		await questions.nth(i).getByLabel('Ja', { exact: true }).check();
	}
	await page.locator('input[name="answer.b_wall"][value="na"]').check();
	await page.locator('input[name="answer.b_reject"][value="no"]').check();

	await page.getByRole('button', { name: 'Auswerten' }).click();
	await expect(
		page.getByRole('heading', { level: 2, name: '1 Mangel im Einwilligungsverfahren.' })
	).toBeVisible();
	await expect(page.getByText('Alle ablehnen', { exact: false }).first()).toBeVisible();
	await expect(page.locator('.answer[data-answer="na"]')).toHaveText('Entfällt');
});
