import { expect, test } from '@playwright/test';

test('preview: a long form has a section index and a save bar that stays in view', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/dsfa/eintraege/?neu=1', { waitUntil: 'networkidle' });

	const index = page.getByRole('navigation', { name: 'Abschnitte' });
	const items = index.getByRole('button');
	await expect(items).toHaveCount(9);
	await expect(items.first()).toContainText('0/14');
	await expect(page.locator('.save-bar .required')).toHaveText('Pflichtangaben offen: 1');

	await page.locator('form.record-form input[type=text]').first().fill('Bewerbervorauswahl');
	await expect(items.first()).toContainText('1/14');
	await expect(items.first().locator('.mark')).toHaveAttribute('data-state', 'partial');
	await expect(page.locator('.save-bar .required')).toBeHidden();

	// the save bar is reachable without scrolling to the end of a 77-field form
	await expect(page.getByRole('button', { name: 'Speichern' })).toBeInViewport();

	await items.nth(3).click();
	await expect(items.nth(3)).toHaveAttribute('aria-current', 'location');
	await expect(
		page.getByRole('heading', { level: 2, name: 'Verlust oder Nichtverfügbarkeit' })
	).toBeInViewport();
	await expect(index).toBeInViewport();
});

test('preview: on a phone the sections open from the save bar', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('werkzeuge/dsfa/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await expect(page.getByRole('navigation', { name: 'Abschnitte' })).toBeHidden();

	const menu = page.locator('.sections-menu');
	await menu.locator('summary').click();
	await menu.getByRole('button', { name: /Ergebnis/ }).click();
	await expect(menu).not.toHaveAttribute('open');
	await expect(menu.locator('summary')).toHaveAccessibleName('Abschnitte 9/9');
	await expect(page.locator(':focus')).toBeInViewport();
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test('preview: a form of two sections has the save bar but no index', async ({ page }) => {
	await page.goto('werkzeuge/ki-kompetenz/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await expect(page.getByRole('navigation', { name: 'Abschnitte' })).toHaveCount(0);
	await expect(page.locator('.sections-menu')).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Speichern' })).toBeInViewport();
});
