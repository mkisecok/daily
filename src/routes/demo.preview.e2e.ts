import { expect, test } from '@playwright/test';

/** the drafts and stored keys a demo must leave as it found them */
const storage = () =>
	JSON.stringify([
		Object.entries(sessionStorage).filter(([key]) => key.startsWith('daily.draft')),
		Object.keys(localStorage).sort()
	]);

test('preview: a record demo fills the form, shows the entry and saves nothing', async ({
	page
}) => {
	test.setTimeout(90_000);
	await page.goto('werkzeuge/beratungsvermerk/', { waitUntil: 'networkidle' });
	const before = await page.evaluate(storage);
	await page.getByRole('button', { name: "So funktioniert's" }).click();
	const caption = page.locator('.demo-layer > .caption');
	await expect(caption).toContainText('Ein neuer Eintrag');
	await expect(page.locator('.demo-result .sheet')).toBeVisible({ timeout: 40_000 });
	await expect(caption).toContainText("Das war's", { timeout: 40_000 });
	await page.getByRole('button', { name: 'Schließen' }).click();
	await expect(page.locator('.demo-layer')).toHaveCount(0);
	await page.waitForLoadState('networkidle');
	expect(await page.evaluate(storage)).toBe(before);
});

test('preview: a demo stops on Escape and leaves the page as it was', async ({ page }) => {
	test.setTimeout(60_000);
	await page.goto('werkzeuge/pseudonymisierer/', { waitUntil: 'networkidle' });
	await page.getByRole('button', { name: "So funktioniert's" }).click();
	await expect(page.getByLabel('Text', { exact: true })).not.toHaveValue('', { timeout: 10_000 });
	await page.keyboard.press('Escape');
	await expect(page.locator('.demo-layer')).toHaveCount(0);
	await page.waitForLoadState('networkidle');
	await expect(page.getByLabel('Text', { exact: true })).toHaveValue('');
});
