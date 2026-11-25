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

test('preview: the SDM cube demo turns the cube and pulls a slice out, in 40 seconds', async ({
	page
}) => {
	test.setTimeout(90_000);
	await page.goto('werkzeuge/sdm-wuerfel/', { waitUntil: 'networkidle' });
	const before = await page.evaluate(storage);
	const started = Date.now();
	await page.getByRole('button', { name: "So funktioniert's" }).click();
	const caption = page.locator('.demo-layer > .caption');
	const sheet = page.locator('.demo-result .sheet');
	await expect(sheet.locator('.cube-dash .focus')).toBeVisible({ timeout: 20_000 });
	await expect(sheet.locator('.cube3d .slice h4')).toHaveText('Datenminimierung', {
		timeout: 30_000
	});
	await expect(caption).toContainText('Tasten 1 bis 4');
	await expect(caption).toContainText("Das war's", { timeout: 20_000 });
	expect(Date.now() - started).toBeLessThan(45_000);
	await page.getByRole('button', { name: 'Schließen' }).click();
	await expect(page.locator('.demo-layer')).toHaveCount(0);
	await page.waitForLoadState('networkidle');
	expect(await page.evaluate(storage)).toBe(before);
});

test('preview: the Pseudonymisierer demo goes from text to a Word letter with a boxed passage', async ({
	page
}) => {
	test.setTimeout(90_000);
	await page.goto('werkzeuge/pseudonymisierer/', { waitUntil: 'networkidle' });
	const before = await page.evaluate(storage);
	await page.getByRole('button', { name: "So funktioniert's" }).click();
	const caption = page.locator('.demo-layer > .caption');
	await expect(caption).toContainText('Schritt 1 von 15');
	await expect(page.locator('#anon-restored')).toHaveValue(/Lena Müller-Lüdenscheidt/, {
		timeout: 25_000
	});
	await expect(page.locator('ul.variables')).toContainText('«BEFUND_1»', { timeout: 30_000 });
	await expect(caption).toContainText('Schritt 15 von 15', { timeout: 20_000 });
	await expect(caption).toContainText("Das war's", { timeout: 15_000 });
	await page.getByRole('button', { name: 'Schließen' }).click();
	await expect(page.locator('.demo-layer')).toHaveCount(0);
	await page.waitForLoadState('networkidle');
	expect(await page.evaluate(storage)).toBe(before);
});

test('preview: the DSFA demo walks through the risk picture and ends at the list', async ({
	page
}) => {
	test.setTimeout(90_000);
	await page.goto('werkzeuge/dsfa/', { waitUntil: 'networkidle' });
	await page.getByRole('button', { name: "So funktioniert's" }).click();
	const caption = page.locator('.demo-layer > .caption');
	await expect(caption).toContainText('Risikomatrix', { timeout: 30_000 });
	await expect(caption).toContainText('Excel', { timeout: 10_000 });
	await expect(caption).toContainText('in der Liste', { timeout: 20_000 });
	await expect(page).toHaveURL(/dsfa\/eintraege\/?$/);
	await expect(caption).toContainText("Das war's", { timeout: 15_000 });
});
