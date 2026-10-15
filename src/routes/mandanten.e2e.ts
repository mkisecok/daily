import { expect, test } from '@playwright/test';

/** requires the local stack from compose.yaml; see auth.e2e.ts */
const username = process.env.E2E_USER ?? 'test@dai-ly.de';
const password = process.env.E2E_PASSWORD ?? 'test-dev-password';

test('client organisations keep records apart and the masthead names the workspace', async ({
	page
}) => {
	const client = `E2E-Mandant ${Date.now()}`;
	const system = `E2E-Mandantensystem ${Date.now()}`;

	await page.goto('/mandanten');
	await page.locator('#username').fill(username);
	await page.locator('#password').fill(password);
	await page.locator('#kc-login').click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mandanten');
	const own = page.locator('.orgs li', { hasText: 'Eigene Organisation' });

	await page.getByLabel('Mandant anlegen').fill(client);
	await page.getByRole('button', { name: 'Mandant anlegen' }).click();
	await expect(page.getByRole('status')).toHaveText(`Sie arbeiten jetzt in ${client}.`);
	await expect(page.locator('.masthead .org')).toHaveText(client);
	// a long name is cut off instead of widening the masthead
	const chipWidth = await page.locator('.masthead .org').evaluate((el) => {
		el.textContent = 'Mustermann und Partner Rechtsanwälte mbB Steuerberatungsgesellschaft';
		return el.getBoundingClientRect().width;
	});
	expect(chipWidth).toBeLessThanOrEqual(14 * 16 + 1);

	await page.goto('/werkzeuge/ki-register/eintraege?neu=1');
	await page.getByLabel('Bezeichnung').fill(system);
	await page.getByLabel('Zweck und Einsatzbereich').fill('Nur beim Mandanten');
	await page.getByLabel('Rolle der Organisation').selectOption('betreiber');
	await page.locator('#field-status').selectOption('geplant');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await page.goto('/mandanten');
	await own.getByRole('button', { name: 'Wechseln' }).click();
	await expect(own.locator('.current')).toHaveText('Aktiv');
	await page.goto('/werkzeuge/ki-register/eintraege');
	await expect(page.getByRole('link', { name: 'Neuer Eintrag' })).toBeVisible();
	await expect(page.getByRole('link', { name: system })).toHaveCount(0);

	await page.goto('/mandanten');
	await page
		.locator('.orgs li', { hasText: client })
		.getByRole('button', { name: 'Wechseln' })
		.click();
	await page.goto('/werkzeuge/ki-register/eintraege');
	await expect(page.getByRole('link', { name: system })).toBeVisible();

	// leave the user in the own organisation for the other tests
	await page.goto('/mandanten');
	await own.getByRole('button', { name: 'Wechseln' }).click();
	await expect(own.locator('.current')).toHaveText('Aktiv');
});
