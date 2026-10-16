import { expect, test } from '@playwright/test';

test('has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
});

test('shell: skip link, sidebar landmark, no deadline counter when signed out, print hides the shell', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/werkzeuge');
	await page.keyboard.press('Tab');
	await expect(page.getByRole('link', { name: 'Zum Inhalt' })).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page.locator('main')).toBeFocused();

	const sidebar = page.locator('.sidebar');
	await expect(sidebar.getByRole('navigation', { name: 'Hauptnavigation' })).toBeVisible();
	await expect(sidebar.getByRole('link', { name: 'Werkzeuge' })).toHaveAttribute(
		'aria-current',
		'page'
	);
	await expect(sidebar.getByRole('link', { name: /Fristen/ })).toHaveCount(0);
	expect(errors).toEqual([]);

	await page.emulateMedia({ media: 'print' });
	await expect(sidebar).toBeHidden();
	await expect(page.locator('.topbar')).toBeHidden();
});
