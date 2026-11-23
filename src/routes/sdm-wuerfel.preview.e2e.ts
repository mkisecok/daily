import { expect, test, type Page } from '@playwright/test';

/** saves the tool's example and opens the entry */
async function saveExample(page: Page) {
	await page.goto('werkzeuge/sdm-wuerfel/eintraege/?neu=1&beispiel=1', {
		waitUntil: 'networkidle'
	});
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.getByRole('heading', { name: 'Bewerbermanagement (Beispiel)' })).toBeVisible();
}

test('preview: the SDM cube pulls a slice out and links to rating the cell', async ({ page }) => {
	await saveExample(page);
	const cube = page.getByRole('application', { name: /SDM-Würfel in 3D mit 84 Zellen/ });
	await expect(cube).toBeVisible();

	// to data minimisation (goal 4), level 2, then pull its slice out
	await cube.focus();
	await page.keyboard.press('PageDown');
	await page.keyboard.press('PageDown');
	await page.keyboard.press('PageDown');
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
	const slice = page.locator('.slice');
	await expect(slice.getByRole('heading', { name: 'Datenminimierung' })).toBeVisible();
	await expect(slice.locator('.detail')).toContainText(
		'Kollektion · Fachapplikation · Datenminimierung'
	);
	await expect(slice.locator('.detail .pill')).toHaveText('Lücke');
	await expect(slice.locator('.detail')).toContainText('Nur erforderliche Felder');

	// the level slice of the same cell lists every goal
	await slice.getByRole('button', { name: 'Ebene', exact: true }).click();
	await expect(slice.getByRole('heading', { name: 'Fachapplikation' })).toBeVisible();

	await slice.getByRole('link', { name: 'Im Formular öffnen' }).click();
	await expect(page.getByRole('button', { name: 'Speichern' })).toBeVisible();
	await expect(page.getByText('Ebene 2: Fachapplikation').nth(3)).toBeInViewport();
});

test('preview: the SDM result ranks what to fix first and counts the ratings', async ({ page }) => {
	await saveExample(page);
	await expect(page.locator('.cube-dash .progress')).toContainText(
		'20 von 21 Bewertungen der Ziele je Ebene'
	);
	const focus = page.getByRole('region', { name: 'Zuerst angehen' });
	// minimisation comes first: a gap in the application, two levels partly, storing and erasing
	const first = focus.locator('li').first();
	await expect(first.locator('strong')).toHaveText('Datenminimierung');
	await expect(first.locator('.pill')).toHaveText([
		'Ebene 2 · Lücke',
		'Ebene 1 · Teilweise',
		'Ebene 3 · Teilweise'
	]);
	await expect(first).toContainText('Löschfristen tragen');
	await expect(focus.locator('li strong')).toHaveText([
		'Datenminimierung',
		'Intervenierbarkeit',
		'Transparenz',
		'Integrität'
	]);
	await focus.locator('li').first().getByRole('link', { name: 'Bewertung bearbeiten' }).click();
	await expect(page.getByRole('button', { name: 'Speichern' })).toBeVisible();
});

test('preview: a cell of the SDM cube is rated in place and stays rated', async ({ page }) => {
	await saveExample(page);
	const cube = page.getByRole('application', { name: /SDM-Würfel in 3D/ });
	const viewB = page.getByRole('region', { name: /Sicht b/ });
	const minimisation = viewB.getByRole('row', { name: /Datenminimierung/ }).locator('.pill');
	await expect(minimisation).toHaveText(['Teilweise', 'Lücke', 'Teilweise']);

	// data minimisation on level 2, rated in the slice panel
	await cube.focus();
	for (let i = 0; i < 3; i++) await page.keyboard.press('PageDown');
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
	const rate = page.locator('.slice .rate');
	await expect(rate.locator('legend')).toHaveText('Datenminimierung auf Ebene 2');
	await rate.getByRole('radio', { name: 'Umgesetzt', exact: true }).check();
	await expect(page.locator('.slice .outcome')).toHaveText('Gespeichert');
	await expect(page.locator('.slice .detail .pill')).toHaveText('Umgesetzt');
	await expect(minimisation).toHaveText(['Teilweise', 'Umgesetzt', 'Teilweise']);

	// the key 3 rates the level of the cell the arrow keys are on as a gap
	await cube.focus();
	await page.keyboard.press('3');
	await expect(minimisation).toHaveText(['Teilweise', 'Lücke', 'Teilweise']);

	// collecting is no part of the processing any more: the column falls away for every goal
	await rate.getByLabel('Sammeln (Sn) kommt in der Verarbeitung vor').uncheck();
	await expect(page.locator('.slice .detail .pill')).toHaveText('Nicht relevant');

	await page.reload({ waitUntil: 'networkidle' });
	await expect(minimisation).toHaveText(['Teilweise', 'Lücke', 'Teilweise']);
	// 120 relevant cells before; collecting had 21, one of them not relevant already
	await expect(page.locator('.figure strong').first()).toHaveText('100');
});
