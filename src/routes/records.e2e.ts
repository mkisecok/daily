import { expect, test, type Page } from '@playwright/test';

/** Requires the local stack from compose.yaml; see auth.e2e.ts. */
const username = process.env.E2E_USER ?? 'test@dai-ly.de';
const password = process.env.E2E_PASSWORD ?? 'test-dev-password';

async function signIn(page: Page, path: string) {
	await page.goto(path);
	await expect(page).toHaveURL(/\/realms\/daily\/protocol\/openid-connect\/auth/);
	await page.locator('#username').fill(username);
	await page.locator('#password').fill(password);
	await page.locator('#kc-login').click();
}

/** `YYYY-MM-DDTHH:mm` in German time, as a datetime-local input wants it. */
function berlinInput(date: Date): string {
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat('en-CA', {
			timeZone: 'Europe/Berlin',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hourCycle: 'h23'
		})
			.formatToParts(date)
			.map((p) => [p.type, p.value])
	);
	return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

test('KI-Register: create, edit, history, CSV and handoff from the risk classification', async ({
	page
}) => {
	const name = `E2E-System ${Date.now()}`;
	await signIn(page, '/werkzeuge/ki-register/eintraege');
	await expect(page).toHaveURL(/\/werkzeuge\/ki-register\/eintraege$/);

	await page.getByRole('link', { name: 'Neuer Eintrag' }).click();
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.getByText('Bitte die markierten Felder prüfen.')).toBeVisible();

	await page.getByLabel('Bezeichnung').fill(name);
	await page.getByLabel('Zweck und Einsatzbereich').fill('Vorsortierung von Bewerbungen');
	await page.getByLabel('Rolle der Organisation').selectOption('betreiber');
	await page.locator('#field-status').selectOption('aktiv');
	await page.getByRole('button', { name: 'Speichern' }).click();

	await expect(page).toHaveURL(/eintrag=/);
	await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
	await expect(page.locator('.verdict .headline')).toHaveText('Risikoklasse ungeklärt.');

	await page.getByRole('button', { name: 'Bearbeiten' }).click();
	await page.getByLabel('Anbieter (Hersteller)').fill('Beispiel GmbH');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.getByRole('status')).toHaveText('Gespeichert.');
	await expect(page.locator('.history')).toContainText('Anbieter (Hersteller)');
	await expect(page.locator('.history')).toContainText('Beispiel GmbH');

	// Handoff: classify as high-risk (employment, Annex III) and attach the result.
	await page.getByRole('link', { name: /Prüfung durchführen/ }).click();
	await expect(page.getByText(`Prüfung für den Eintrag „${name}“ in KI-Register.`)).toBeVisible();
	for (const fieldset of await page.locator('form fieldset').all()) {
		const yes = ['answer.s_ai', 'answer.h_employment'].includes(
			(await fieldset.locator('input').first().getAttribute('name')) ?? ''
		);
		await fieldset.locator(`input[value="${yes ? 'yes' : 'no'}"]`).check();
	}
	await page.getByRole('button', { name: 'Auswerten' }).click();
	await expect(page.locator('.verdict .headline')).toHaveText('Hochrisiko-KI-System.');
	await page.getByRole('button', { name: 'In KI-Register übernehmen' }).click();

	await expect(page).toHaveURL(/\/werkzeuge\/ki-register\/eintraege\?eintrag=/);
	await expect(page.locator('.record-view')).toContainText('Hochrisiko (Art. 6)');
	await expect(page.locator('.history')).toContainText('Bewertung übernommen');

	await page.getByRole('link', { name: 'Zur Übersicht' }).click();
	await expect(page.getByRole('link', { name })).toBeVisible();
	const download = page.waitForEvent('download');
	await page.getByRole('button', { name: 'CSV exportieren' }).click();
	expect((await download).suggestedFilename()).toMatch(/^ki-register-\d{4}-\d{2}-\d{2}\.csv$/);
});

test('Datenpanne: 72-hour deadline on Fristen and the workflow to closure', async ({ page }) => {
	const title = `E2E-Panne ${Date.now()}`;
	const aware = new Date(Date.now() - 60 * 60 * 1000);
	await signIn(page, '/werkzeuge/datenpanne/eintraege?neu=1');
	await expect(page).toHaveURL(/\/werkzeuge\/datenpanne\/eintraege\?neu=1$/);

	await page.getByLabel('Bezeichnung').fill(title);
	await page.getByLabel('Kenntnis am').fill(berlinInput(aware));
	await page.getByLabel('Was ist geschehen?').fill('Liste an falschen Empfänger gesendet.');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('[aria-current="step"]')).toHaveText('Erfasst');

	await page.getByRole('link', { name: 'Fristen' }).click();
	const row = page.locator('.deadlines li', { hasText: title });
	await expect(row).toContainText('Meldung an die Aufsichtsbehörde');
	await row.getByRole('link', { name: title }).click();

	await page.getByRole('button', { name: 'Bearbeiten' }).click();
	await page.getByLabel('Risiko für die Rechte und Freiheiten').selectOption('kein');
	await page.getByLabel('Begründung der Bewertung').fill('Empfänger ist Auftragsverarbeiter.');
	await page.getByLabel('Ergriffene und vorgeschlagene Maßnahmen').fill('Löschung bestätigt.');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('.verdict .headline')).toHaveText(
		'Voraussichtlich keine Meldepflicht.'
	);

	await page.getByRole('button', { name: 'Bewertung abschließen' }).click();
	await expect(page.locator('[aria-current="step"]')).toHaveText('Bewertet');
	await expect(page.getByRole('button', { name: 'Meldung erfasst' })).toBeDisabled();
	await page.getByRole('button', { name: 'Als nicht meldepflichtig dokumentieren' }).click();
	await page.getByRole('button', { name: 'Abschließen' }).click();
	await expect(page.locator('[aria-current="step"]')).toHaveText('Abgeschlossen');

	await page.getByRole('link', { name: 'Fristen' }).click();
	await expect(page.locator('h1')).toHaveText('Fristen');
	await expect(page.locator('.deadlines li', { hasText: title })).toHaveCount(0);
});
