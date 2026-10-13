import { expect, test } from '@playwright/test';

test('links on English pages stay in English', async ({ page }) => {
	await page.goto('/en/werkzeuge');
	const nav = page.getByRole('navigation', { name: 'Main navigation' });
	await expect(nav.getByRole('link', { name: 'News' })).toHaveAttribute(
		'href',
		/\/en\/nachrichten$/
	);
	await expect(nav.getByRole('link', { name: 'Tools' })).toHaveAttribute('aria-current', 'page');

	await nav.getByRole('link', { name: 'News' }).click();
	await expect(page).toHaveURL(/\/en\/nachrichten$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('News');
});

test('links on German pages have no locale prefix', async ({ page }) => {
	await page.goto('/werkzeuge');
	const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
	await expect(nav.getByRole('link', { name: 'Nachrichten' })).toHaveAttribute(
		'href',
		/^\/nachrichten$/
	);
});
