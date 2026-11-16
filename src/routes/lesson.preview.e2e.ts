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
	await page.goto(page.url().replace(/folie=\d+/, 'folie=10'), { waitUntil: 'networkidle' });
	await expect(presenter.locator('mark')).toHaveText(['[E-Mail, Telefon oder Formular]']);

	// the questions follow the slides; the room picks, the right answer shows with its reason
	await page.keyboard.press('ArrowRight');
	await expect(presenter.locator('.eyebrow')).toHaveText('Frage 1 von 4');
	await page.keyboard.press('1');
	await expect(presenter.locator('[data-result="wrong"]')).toContainText('Abwarten');
	await expect(presenter.locator('[data-result="right"]')).toContainText('um Löschung bitten');
	await expect(presenter.locator('.why')).toHaveCount(2);

	await page.keyboard.press('End');
	await expect(page).toHaveURL(/folie=15/);
	await expect(presenter.locator('h1')).toHaveText('Vielen Dank');
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
	await expect(page.locator('.handout .quiz > li')).toHaveCount(4);
	await expect(page.locator('.handout .answers li').first()).toContainText('um Löschung bitten');
});

test('preview: a session of a training module is recorded as a pre-filled Schulungsnachweis', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/schulung-datenpanne/vortrag/?folie=15', { waitUntil: 'networkidle' });
	await page.getByRole('link', { name: 'Schulung erfassen →' }).click();
	await expect(page).toHaveURL(
		/schulungsnachweis\/eintraege\/?\?neu=1&schulung=schulung-datenpanne/
	);
	await expect(page.locator('.mode-title')).toHaveText(
		'Schulung erfassen: Datenpannen erkennen und melden'
	);
	await expect(page.locator('#field-titel')).toHaveValue('Datenpannen erkennen und melden');
	await expect(page.locator('#field-zielgruppe')).toHaveValue('Alle Beschäftigten');
	await expect(page.locator('#field-notizen')).toHaveValue(/Stand 1, mit 4 Wiederholungsfragen/);
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);
	await expect(page.locator('.record-view')).toContainText('Datenpannen erkennen und melden');
	await expect(page.locator('.record-view')).toContainText('Präsenz');
});

test('preview: the presenter fits a phone without sideways scrolling', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 640 });
	await page.goto('werkzeuge/schulung-datenpanne/vortrag/?folie=2', { waitUntil: 'networkidle' });
	await expect(page.locator('.presenter h1')).toHaveText('So sieht das im Alltag aus');
	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
	expect(overflow).toBe(0);
});

test('preview: the organisation details fill the module once entered', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/schulung-datenpanne/', { waitUntil: 'networkidle' });
	const details = page.locator('.details');
	await expect(details).toContainText('0 von 3 eingetragen');
	await expect(details).toContainText('Fehlt: Meldeweg für Datenpannen');

	await details.getByRole('link', { name: 'Angaben eintragen' }).click();
	await expect(page).toHaveURL(/organisation\/?\?fuer=schulung-datenpanne/);
	await page.locator('#field-meldeweg').fill('datenpanne@beispiel.de oder Telefon 0711 123-99');
	await page.locator('#field-dsb').fill('Dr. Petra Schmidt, dsb@beispiel.de');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('.notice')).toContainText('Gespeichert.');
	await page.getByRole('link', { name: 'Zurück zur Schulung →' }).click();

	await expect(details).toContainText('2 von 3 eingetragen');
	await expect(details).toContainText('Fehlt: Außerhalb der Arbeitszeit');

	await page.goto('werkzeuge/schulung-datenpanne/vortrag/?folie=5', { waitUntil: 'networkidle' });
	const slide = page.locator('.presenter .points');
	await expect(slide).toContainText('Meldeweg: datenpanne@beispiel.de oder Telefon 0711 123-99');
	await expect(slide).toContainText('Datenschutzbeauftragte: Dr. Petra Schmidt, dsb@beispiel.de');
	await expect(slide.locator('mark')).toHaveText(['[Vertretung oder IT-Bereitschaft]']);

	await page.goto('werkzeuge/schulung-datenpanne/', { waitUntil: 'networkidle' });
	await page.emulateMedia({ media: 'print' });
	await expect(page.locator('.handout')).toContainText('Meldeweg: datenpanne@beispiel.de');

	// a second visit edits the same entry
	await page.emulateMedia({ media: 'screen' });
	await page.goto('organisation/', { waitUntil: 'networkidle' });
	await expect(page.locator('#field-meldeweg')).toHaveValue(
		'datenpanne@beispiel.de oder Telefon 0711 123-99'
	);
});
