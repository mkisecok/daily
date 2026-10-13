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
