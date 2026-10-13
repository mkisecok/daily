import { expect, test } from '@playwright/test';

test('news page renders filters and applies them through the query string', async ({ page }) => {
	await page.goto('/nachrichten');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nachrichten');

	const filters = page.getByRole('navigation', { name: 'Filter' });
	await expect(filters.getByRole('link', { name: 'DSGVO' })).toBeVisible();
	await expect(filters.getByRole('link', { name: 'Bußgeld' })).toBeVisible();

	await filters.getByRole('link', { name: 'Bußgeld' }).click();
	await expect(page).toHaveURL(/\/nachrichten\?tag=bussgeld$/);
	await expect(filters.getByRole('link', { name: 'Bußgeld' })).toHaveAttribute(
		'aria-current',
		'true'
	);

	await filters.getByRole('link', { name: 'EU', exact: true }).click();
	await expect(page).toHaveURL(/tag=bussgeld/);
	await expect(page).toHaveURL(/region=eu/);
});

test('news page is available in English', async ({ page }) => {
	await page.goto('/en/nachrichten');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('News');
	await expect(page.getByRole('navigation', { name: 'Filters' })).toBeVisible();
});

test('signed-in users can bookmark and unbookmark an item', async ({ page }) => {
	await page.goto('/auth/login?next=%2Fnachrichten');
	await page.locator('#username').fill(process.env.E2E_USER ?? 'test@dai-ly.de');
	await page.locator('#password').fill(process.env.E2E_PASSWORD ?? 'test-dev-password');
	await page.locator('#kc-login').click();
	await expect(page).toHaveURL(/\/nachrichten$/);

	const first = page.locator('li.item').first();
	const button = first.getByRole('button', { name: /^(Merken|Gemerkt)$/ });
	const before = await button.getAttribute('aria-pressed');

	await button.click();
	await expect(button).toHaveAttribute('aria-pressed', before === 'true' ? 'false' : 'true');
	await button.click();
	await expect(button).toHaveAttribute('aria-pressed', before ?? 'false');
});
