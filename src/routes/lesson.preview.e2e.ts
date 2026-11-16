import { expect, test } from '@playwright/test';

test('preview: a training module is presented slide by slide and prints as a handout', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/', { waitUntil: 'networkidle' });
	await page.locator('.chips').getByRole('button', { name: 'Schulung' }).click();
	await page.getByRole('link', { name: /Datenpannen erkennen und melden/ }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(
		'Datenpannen erkennen und melden'
	);
	await expect(page.locator('.outline li')).toHaveCount(10);
	await expect(page.locator('.lesson')).toContainText('etwa 20 Minuten · 10 Folien');

	await page.getByRole('link', { name: 'Vortragen' }).click();
	const presenter = page.locator('.presenter');
	await expect(presenter.locator('h1')).toHaveText('Datenpannen erkennen und melden');
	await page.keyboard.press('ArrowRight');
	await expect(page).toHaveURL(/folie=1/);
	await expect(presenter.locator('h1')).toHaveText('Was ist eine Datenpanne?');
	await expect(presenter.locator('.cite')).toContainText('Art. 4 Nr. 12 DSGVO');
	await page.keyboard.press('n');
	await expect(presenter.locator('.notes')).toContainText('Alltagsfehler');

	// the place the organisation fills in is marked, not passed off as text
	await page.keyboard.press('End');
	await expect(page).toHaveURL(/folie=10/);
	await expect(presenter.locator('mark')).toHaveText(['[Meldeweg]']);
	await expect(presenter.getByRole('button', { name: 'Weiter' })).toBeDisabled();

	// a reload stays on the slide
	await page.goto(page.url().replace(/folie=\d+/, 'folie=5'), { waitUntil: 'networkidle' });
	await expect(presenter.locator('h1')).toHaveText('Sofort melden: an wen');
	await presenter.getByRole('button', { name: 'Zurück' }).click();
	await expect(presenter.locator('h1')).toHaveText('Die Uhr läuft: 72 Stunden');

	await page.keyboard.press('Escape');
	await expect(page).not.toHaveURL(/vortrag/);
	await page.emulateMedia({ media: 'print' });
	const head = page.locator('[data-print-frame]');
	await expect(head.locator('h1')).toHaveText('Datenpannen erkennen und melden');
	await expect(head).not.toContainText('Keine Rechtsberatung');
	await expect(page.locator('.handout .slide')).toHaveCount(10);
	await expect(page.locator('.handout')).not.toContainText('Alltagsfehler');
});

test('preview: the presenter fits a phone without sideways scrolling', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 640 });
	await page.goto('werkzeuge/schulung-datenpanne/vortrag/?folie=2', { waitUntil: 'networkidle' });
	await expect(page.locator('.presenter h1')).toHaveText('So sieht das im Alltag aus');
	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
	expect(overflow).toBe(0);
});
