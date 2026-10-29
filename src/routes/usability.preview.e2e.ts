import { expect, test, type Page } from '@playwright/test';

/** a Prüfkatalog entry: the register with a single required field */
async function createTopic(page: Page, title: string) {
	await page.goto('werkzeuge/pruefkatalog/eintraege/?neu=1');
	await page.getByLabel('Prüfthema').fill(title);
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible();
}

test('preview: archived entries are listed apart and can be restored', async ({ page }) => {
	await createTopic(page, 'Altes Prüfthema');
	await page.getByRole('button', { name: 'Archivieren' }).click();
	const dialog = page.getByRole('dialog', { name: 'Eintrag archivieren?' });
	await dialog.getByRole('textbox').fill('archivieren');
	await dialog.getByRole('button', { name: 'Archivieren' }).click();
	await expect(page.getByText('Noch keine Einträge.')).toBeVisible();

	await page.getByRole('link', { name: 'Archiv' }).click();
	await expect(page).toHaveURL(/archiviert=1/);
	await page.getByRole('link', { name: 'Altes Prüfthema' }).click();
	await page.getByRole('button', { name: 'Wiederherstellen' }).click();
	await expect(page.getByRole('status')).toHaveText('Wiederhergestellt.');
	await expect(page.locator('.history')).toContainText('Wiederhergestellt');
	await expect(page.getByRole('button', { name: 'Bearbeiten' })).toBeVisible();

	await page.goto('werkzeuge/pruefkatalog/eintraege/');
	await expect(page.getByRole('link', { name: 'Altes Prüfthema' })).toBeVisible();
	await page.getByRole('link', { name: 'Archiv' }).click();
	await expect(page.getByText('Keine archivierten Einträge.')).toBeVisible();
});

test('preview: search and sort live in the URL and survive a reload', async ({ page }) => {
	for (const title of ['Zugriffsrechte', 'Auftragsverarbeitung', 'Zutrittskontrolle']) {
		await createTopic(page, title);
	}
	await page.goto('werkzeuge/pruefkatalog/eintraege/');
	const rows = page.locator('tbody th');
	await expect(rows).toHaveText(['Zutrittskontrolle', 'Auftragsverarbeitung', 'Zugriffsrechte']);

	await page.getByRole('button', { name: 'Nach Prüfthema sortieren' }).click();
	await expect(rows).toHaveText(['Auftragsverarbeitung', 'Zugriffsrechte', 'Zutrittskontrolle']);
	await expect(page.locator('th[aria-sort="ascending"]')).toContainText('Prüfthema');

	await page.getByPlaceholder('Suchen').fill('zu');
	await expect(rows).toHaveText(['Zugriffsrechte', 'Zutrittskontrolle']);
	await expect(page.getByText('2 von 3 Einträgen')).toBeVisible();
	await expect(page).toHaveURL(/suche=zu/);

	await page.reload();
	await expect(page.getByPlaceholder('Suchen')).toHaveValue('zu');
	await expect(rows).toHaveText(['Zugriffsrechte', 'Zutrittskontrolle']);

	await page.getByPlaceholder('Suchen').fill('nichts davon');
	await expect(page.getByText('Keine Einträge passen zur Suche.')).toBeVisible();
});

test('preview: leaving a form with unsaved input asks first', async ({ page }) => {
	await page.goto('werkzeuge/pruefkatalog/eintraege/?neu=1');
	await page.getByLabel('Prüfthema').fill('Nicht gespeichert');

	await page
		.getByRole('navigation', { name: 'Hauptnavigation' })
		.getByRole('link', { name: 'Fristen' })
		.click();
	const dialog = page.getByRole('dialog', { name: 'Änderungen verwerfen?' });
	await expect(dialog).toBeVisible();
	await dialog.getByRole('button', { name: 'Abbrechen' }).click();
	await expect(page).toHaveURL(/neu=1/);
	await expect(page.getByLabel('Prüfthema')).toHaveValue('Nicht gespeichert');

	await page.getByRole('button', { name: 'Abbrechen' }).click();
	await dialog.getByRole('button', { name: 'Verwerfen' }).click();
	await expect(page).toHaveURL(/\/werkzeuge\/pruefkatalog\/eintraege\/$/);
	await expect(page.getByText('Noch keine Einträge.')).toBeVisible();
});

test('preview: a version conflict keeps the input', async ({ page, context }) => {
	await createTopic(page, 'Gemeinsames Thema');
	const url = page.url();
	await page.getByRole('button', { name: 'Bearbeiten' }).click();

	// someone else saves the same entry in another tab
	const other = await context.newPage();
	await other.goto(url);
	await other.getByRole('button', { name: 'Bearbeiten' }).click();
	await other.getByLabel('Prüfthema').fill('Thema aus dem anderen Tab');
	await other.getByRole('button', { name: 'Speichern' }).click();
	await expect(other.getByRole('status')).toHaveText('Gespeichert.');
	await other.close();

	await page.getByLabel('Prüfthema').fill('Meine Fassung');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.getByRole('alert')).toContainText('inzwischen geändert');
	await expect(page.getByLabel('Prüfthema')).toHaveValue('Meine Fassung');

	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.getByRole('heading', { level: 2, name: 'Meine Fassung' })).toBeVisible();
	await expect(page.locator('.history')).toContainText('Thema aus dem anderen Tab');
});
