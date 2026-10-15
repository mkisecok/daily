import { expect, test } from '@playwright/test';

/**
 * requires the local stack from compose.yaml (Keycloak with the imported
 * "daily" realm). Credentials default to the seeded test user in
 * infra/keycloak/realm-daily.json.
 */
const username = process.env.E2E_USER ?? 'test@dai-ly.de';
const password = process.env.E2E_PASSWORD ?? 'test-dev-password';

test('protected page redirects to Keycloak, signs in, and signs out again', async ({ page }) => {
	await page.goto('/notizen');
	await expect(page).toHaveURL(/\/realms\/daily\/protocol\/openid-connect\/auth/);

	await page.locator('#username').fill(username);
	await page.locator('#password').fill(password);
	await page.locator('#kc-login').click();

	await expect(page).toHaveURL(/\/notizen$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Notizen');
	await expect(page.getByRole('button', { name: 'Abmelden' })).toBeVisible();

	await page.getByRole('button', { name: 'Abmelden' }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole('link', { name: 'Anmelden' })).toBeVisible();

	await page.goto('/notizen');
	await expect(page).toHaveURL(/\/realms\/daily\/protocol\/openid-connect\/auth/);
});
