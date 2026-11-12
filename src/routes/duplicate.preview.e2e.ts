import { expect, test } from '@playwright/test';

test('preview: an entry is duplicated without its dates, results and checklist answers', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/software-einfuehrung/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.getByLabel('Software oder Dienst').fill('Personio');
	await page.getByLabel('Anbieter').fill('Personio SE');
	await page
		.locator('#sec-vorhaben')
		.getByRole('button', { name: 'Verarbeitet personenbezogene Daten' })
		.click();
	await page
		.locator('.check', { hasText: 'Zweck und Rechtsgrundlage' })
		.getByText('Ja', { exact: true })
		.click();
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await page.getByRole('link', { name: 'Duplizieren' }).click();
	await expect(page.getByRole('heading', { name: 'Kopie von „Personio“' })).toBeVisible();
	await expect(page.getByLabel('Software oder Dienst')).toHaveValue('Personio (Kopie)');
	await expect(page.getByLabel('Anbieter')).toHaveValue('Personio SE');
	await expect(
		page
			.locator('#sec-vorhaben')
			.getByRole('button', { name: 'Verarbeitet personenbezogene Daten' })
	).toHaveAttribute('data-state', 'on');
	await expect(
		page.locator('.check', { hasText: 'Zweck und Rechtsgrundlage' }).locator('input[value="ja"]')
	).not.toBeChecked();

	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);
	await expect(page.getByRole('heading', { name: 'Personio (Kopie)' })).toBeVisible();
});

test('preview: the example fills a new entry and the empty form offers it', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/vvt/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.getByRole('link', { name: 'Beispiel laden' }).click();
	await expect(page.getByRole('heading', { name: 'Neuer Eintrag aus dem Beispiel' })).toBeVisible();
	await expect(page.getByText('Ein erfundenes Beispiel')).toBeVisible();
	await expect(page.getByLabel('Bezeichnung', { exact: true })).toHaveValue(
		'Lohn- und Gehaltsabrechnung'
	);
	await expect(page.getByRole('link', { name: 'Beispiel laden' })).toHaveCount(0);

	// a tool without an example offers none
	await page.goto('werkzeuge/datenpanne/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await expect(page.getByRole('link', { name: 'Beispiel laden' })).toHaveCount(0);
});
