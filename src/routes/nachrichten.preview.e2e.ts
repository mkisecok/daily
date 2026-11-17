import { expect, test } from '@playwright/test';

/**
 * the news filters live in the query string and apply on the spot. The feed
 * is fetched at build time, so the checks hold for any set of items.
 */
test('Art and Regelwerk combine, show as chips and clear one by one', async ({ page }) => {
	await page.goto('nachrichten/?art=bussgeld&regelwerk=dsgvo', { waitUntil: 'networkidle' });

	const filters = page.getByRole('navigation', { name: 'Filter' });
	const chips = filters.getByRole('list', { name: 'Aktive Filter' });
	await expect(chips.getByRole('link', { name: 'Filter Bußgeld entfernen' })).toBeVisible();
	await expect(chips.getByRole('link', { name: 'Filter DSGVO entfernen' })).toBeVisible();
	await expect(filters.getByRole('link', { name: /^Bußgeld/ })).toHaveAttribute(
		'aria-current',
		'true'
	);
	await expect(filters.getByLabel('Regelwerk')).toHaveValue('dsgvo');
	await expect(filters.getByRole('button')).toHaveCount(0);

	const shown = await page.locator('li.item').count();
	await expect(filters.getByText(/^\d+ von \d+ Meldungen$/)).toHaveText(
		new RegExp(`^${shown} von `)
	);
	for (const tags of await page.locator('li.item .tags').allInnerTexts()) {
		expect(tags).toContain('Bußgeld');
		expect(tags).toContain('DSGVO');
	}

	await chips.getByRole('link', { name: 'Filter Bußgeld entfernen' }).click();
	await expect(page).toHaveURL(/\/nachrichten\/?\?regelwerk=dsgvo$/);
	await expect(filters.getByRole('link', { name: 'Alle', exact: true })).toHaveAttribute(
		'aria-current',
		'true'
	);

	await filters.getByLabel('Regelwerk').selectOption('');
	await expect(page).toHaveURL(/\/nachrichten\/?$/);
	await expect(chips).toBeHidden();
	await expect(filters.getByText(/^\d+ Meldungen$/)).toBeVisible();
});

test('changing the Regelwerk applies at once and keeps the Art', async ({ page }) => {
	await page.goto('nachrichten/?art=leitlinie&regelwerk=nis2', { waitUntil: 'networkidle' });
	const filters = page.getByRole('navigation', { name: 'Filter' });
	await expect(filters.getByLabel('Regelwerk')).toHaveValue('nis2');

	await filters.getByLabel('Regelwerk').selectOption('');
	await expect(page).toHaveURL(/\/nachrichten\/?\?art=leitlinie$/);

	await filters.getByRole('link', { name: 'Filter zurücksetzen' }).click();
	await expect(page).toHaveURL(/\/nachrichten\/?$/);
});

test('unknown filter values are ignored', async ({ page }) => {
	await page.goto('nachrichten/?art=dsgvo&regelwerk=unbekannt', { waitUntil: 'networkidle' });
	const filters = page.getByRole('navigation', { name: 'Filter' });
	await expect(filters.getByRole('list', { name: 'Aktive Filter' })).toBeHidden();
	await expect(filters.getByRole('link', { name: 'Alle', exact: true })).toHaveAttribute(
		'aria-current',
		'true'
	);
});
