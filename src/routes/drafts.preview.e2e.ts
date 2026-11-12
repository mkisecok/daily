import { expect, test } from '@playwright/test';

test('preview: a new entry keeps its draft over a reload until saved or discarded', async ({
	page
}) => {
	await page.goto('werkzeuge/vvt/eintraege/?neu=1', { waitUntil: 'networkidle' });
	const name = page.getByLabel('Bezeichnung');
	await name.fill('Bewerbermanagement');
	await page.waitForTimeout(600);
	await page.reload({ waitUntil: 'networkidle' });

	await expect(name).toHaveValue('Bewerbermanagement');
	const notice = page.getByRole('status').filter({ hasText: 'Entwurf vom' });
	await expect(notice).toBeVisible();
	await notice.getByRole('button', { name: 'Entwurf verwerfen' }).click();
	await expect(name).toHaveValue('');
	await expect(notice).toBeHidden();
	await page.reload({ waitUntil: 'networkidle' });
	await expect(name).toHaveValue('');

	// a tool whose only required field is the name, so the entry saves
	await page.goto('werkzeuge/standortwechsel/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.getByLabel('Bezeichnung').fill('Umzug Köln → Berlin');
	await page.waitForTimeout(600);
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);
	await page.goto('werkzeuge/standortwechsel/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await expect(page.getByLabel('Bezeichnung')).toHaveValue('');
});

test('preview: unsaved changes to an entry are offered again on its page', async ({ page }) => {
	await page.goto('werkzeuge/standortwechsel/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.getByLabel('Bezeichnung').fill('Umzug Köln → Berlin');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await page.getByRole('button', { name: 'Bearbeiten' }).click();
	await page.getByLabel('Verantwortlich').fill('Facility Management');
	await page.waitForTimeout(600);
	await page.reload({ waitUntil: 'networkidle' });

	const pending = page.getByRole('status').filter({ hasText: 'Ungespeicherte Änderungen vom' });
	await expect(pending).toBeVisible();
	await pending.getByRole('button', { name: 'Weiter bearbeiten' }).click();
	await expect(page.getByLabel('Verantwortlich')).toHaveValue('Facility Management');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Gespeichert' })).toBeVisible();
	await page.reload({ waitUntil: 'networkidle' });
	await expect(pending).toBeHidden();
});

test('preview: a questionnaire shows progress, keeps answers and finds the first open question', async ({
	page
}) => {
	await page.goto('werkzeuge/dsfa-schwellwert/pruefen/', { waitUntil: 'networkidle' });
	const progress = page.locator('.form-bar .progress');
	await expect(progress).toHaveText('0 von 13 beantwortet');

	const rows = page.locator('fieldset.row');
	await rows.nth(0).getByText('Nein').click();
	await rows.nth(1).getByText('Ja').click();
	await expect(progress).toHaveText('2 von 13 beantwortet');

	await page.reload({ waitUntil: 'networkidle' });
	await expect(page.getByRole('status').filter({ hasText: 'Antworten vom' })).toBeVisible();
	await expect(progress).toHaveText('2 von 13 beantwortet');
	await expect(rows.nth(1).locator('input[value="yes"]')).toBeChecked();

	await page.getByRole('button', { name: 'Zur ersten offenen Frage' }).click();
	await expect(rows.nth(2).locator('input').first()).toBeFocused();

	// the bar stays in view while scrolling through the questions
	await page.setViewportSize({ width: 1280, height: 700 });
	await rows.nth(5).scrollIntoViewIfNeeded();
	await expect(page.locator('.form-bar')).toBeInViewport();

	await page.getByRole('button', { name: 'Neu beginnen' }).click();
	await expect(progress).toHaveText('0 von 13 beantwortet');
	await expect(page.locator('input[type=radio]:checked')).toHaveCount(0);
	await page.reload({ waitUntil: 'networkidle' });
	await expect(progress).toHaveText('0 von 13 beantwortet');
});
