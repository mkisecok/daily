import { expect, test } from '@playwright/test';

test('preview: the catalogue opens a tool by situation and shows first steps to newcomers', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/', { waitUntil: 'networkidle' });

	const situations = page.getByRole('region', { name: 'Was steht an?' });
	await expect(situations.locator('a.situation')).toHaveCount(8);
	const more = situations.getByRole('button', { name: 'Weitere Anlässe' });
	await expect(more).toHaveAttribute('aria-expanded', 'false');
	await more.click();
	await expect(situations.locator('a.situation')).toHaveCount(16);
	await expect(situations.getByRole('button', { name: 'Weniger Anlässe' })).toHaveAttribute(
		'aria-expanded',
		'true'
	);

	// nothing opened yet: three first steps
	const steps = page.getByRole('navigation', { name: 'Erste Schritte' });
	await expect(steps.getByRole('link')).toHaveText([
		'Verarbeitungen erfassen',
		'Maßnahmen festhalten',
		'Fristen im Blick'
	]);

	// a search narrows the tiles and puts the situations away
	await page.getByRole('searchbox', { name: 'Werkzeuge durchsuchen' }).fill('Art. 35');
	await expect(situations).toBeHidden();
	await page.getByRole('searchbox', { name: 'Werkzeuge durchsuchen' }).fill('');

	await situations.getByRole('link', { name: /Eine Datenpanne ist passiert/ }).click();
	await expect(page).toHaveURL(/werkzeuge\/datenpanne\/$/);

	// once a tool was opened, the first steps give way
	await page.goto('werkzeuge/', { waitUntil: 'networkidle' });
	await expect(page.getByRole('navigation', { name: 'Erste Schritte' })).toHaveCount(0);
});
