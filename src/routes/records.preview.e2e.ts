import { expect, test } from '@playwright/test';
import { chip, choose, pickDate } from './e2e-helpers.js';

test('preview keeps records in the browser across reloads and can delete them', async ({
	page
}) => {
	await page.goto('werkzeuge/ki-register/');
	await page.getByRole('link', { name: 'Öffnen' }).click();
	await expect(page).toHaveURL(/\/daily\/werkzeuge\/ki-register\/eintraege\/$/);
	await expect(
		page.getByText('Nur in diesem Browser gespeichert.', { exact: false })
	).toBeVisible();

	await page.getByRole('link', { name: 'Neuer Eintrag' }).click();
	await page.getByLabel('Bezeichnung').fill('Chatbot Kundenservice');
	await page.getByLabel('Zweck und Einsatzbereich').fill('Beantwortet Kundenanfragen');
	await choose(page.getByLabel('Rolle der Organisation'), 'betreiber');
	await choose(page.locator('#field-status'), 'aktiv');
	await pickDate(page, 'Wiedervorlage', '2030-01-15');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await page.reload();
	await expect(
		page.getByRole('heading', { level: 2, name: 'Chatbot Kundenservice' })
	).toBeVisible();

	await page.getByRole('link', { name: 'Fristen' }).click();
	await expect(page).toHaveURL(/\/daily\/fristen\/$/);
	await expect(page.locator('.deadlines')).toContainText('Wiedervorlage KI-System');

	await page.goto('werkzeuge/ki-register/eintraege/');
	await expect(page.getByRole('link', { name: 'Chatbot Kundenservice' })).toBeVisible();
	await page.getByRole('button', { name: 'Lokale Daten löschen' }).click();
	const dialog = page.getByRole('dialog', { name: 'Lokale Daten löschen?' });
	await dialog.getByLabel('Zur Bestätigung „löschen“ eingeben').fill('löschen');
	await dialog.getByRole('button', { name: 'Lokale Daten löschen' }).click();
	await expect(page.getByText('Noch keine Einträge.')).toBeVisible();
});

test('preview: a questionnaire result is evaluated again when it is attached', async ({ page }) => {
	await page.goto('werkzeuge/ki-register/eintraege/?neu=1');
	await page.getByLabel('Bezeichnung').fill('Bewerbungsfilter');
	await page.getByLabel('Zweck und Einsatzbereich').fill('Vorsortierung von Bewerbungen');
	await choose(page.getByLabel('Rolle der Organisation'), 'betreiber');
	await choose(page.locator('#field-status'), 'aktiv');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await page.getByRole('link', { name: /Prüfung durchführen/ }).click();
	await expect(
		page.getByText('Prüfung für den Eintrag „Bewerbungsfilter“ in KI-Register.')
	).toBeVisible();
	for (const fieldset of await page.locator('form fieldset').all()) {
		const yes = ['answer.s_ai', 'answer.h_employment'].includes(
			(await fieldset.locator('input').first().getAttribute('name')) ?? ''
		);
		await fieldset.locator(`input[value="${yes ? 'yes' : 'no'}"]`).check();
	}
	await page.getByRole('button', { name: 'Auswerten' }).click();
	await expect(page.locator('.verdict .headline')).toHaveText('Hochrisiko-KI-System.');
	await page.getByRole('button', { name: 'In KI-Register übernehmen' }).click();

	await expect(page).toHaveURL(/\/werkzeuge\/ki-register\/eintraege\/\?eintrag=/);
	await expect(page.locator('.record-view')).toContainText('Hochrisiko (Art. 6)');
	await expect(page.locator('.history')).toContainText('Bewertung übernommen');
});

test('preview: a DSFA links to its VVT entry, which lists it back', async ({ page }) => {
	const group = (label: string) => page.getByRole('group', { name: label });
	await page.goto('werkzeuge/vvt/eintraege/?neu=1');
	await page.getByLabel('Bezeichnung').fill('Videoüberwachung Lager');
	await choose(page.locator('#field-rolle'), 'verantwortlicher');
	await page.getByLabel('Zwecke der Verarbeitung').fill('Schutz vor Diebstahl');
	await chip(group('Kategorien betroffener Personen'), 'Beschäftigte');
	await chip(group('Kategorien personenbezogener Daten'), 'Bild- und Tonaufnahmen');
	await choose(page.locator('#field-status'), 'aktiv');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);
	const vvtUrl = page.url();

	await page.goto('werkzeuge/dsfa/eintraege/?neu=1');
	await page.getByLabel('Verarbeitungsvorgang').fill('DSFA Videoüberwachung');
	await choose(page.locator('#field-vvt'), { label: 'Videoüberwachung Lager' });
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('.record-view')).toContainText('Videoüberwachung Lager');

	await page.goto(vvtUrl);
	const links = page.locator('.links');
	await expect(links).toContainText('Datenschutz-Folgenabschätzung');
	await expect(links.getByRole('link', { name: 'DSFA Videoüberwachung' })).toBeVisible();
});
