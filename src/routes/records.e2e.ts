import { expect, test, type Page } from '@playwright/test';

/** requires the local stack from compose.yaml; see auth.e2e.ts */
const username = process.env.E2E_USER ?? 'test@dai-ly.de';
const password = process.env.E2E_PASSWORD ?? 'test-dev-password';

async function signIn(page: Page, path: string) {
	await page.goto(path);
	await expect(page).toHaveURL(/\/realms\/daily\/protocol\/openid-connect\/auth/);
	await page.locator('#username').fill(username);
	await page.locator('#password').fill(password);
	await page.locator('#kc-login').click();
}

/** clicks a workflow step and confirms it in the dialog */
async function step(page: Page, name: string) {
	await page.getByRole('button', { name, exact: true }).click();
	await page
		.getByRole('dialog', { name: 'Status ändern?' })
		.getByRole('button', { name, exact: true })
		.click();
}

/** `YYYY-MM-DDTHH:mm` in German time, as a datetime-local input wants it */
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

	// handoff: classify as high-risk (employment, Annex III) and attach the result
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

	await step(page, 'Bewertung abschließen');
	await expect(page.locator('[aria-current="step"]')).toHaveText('Bewertet');
	await expect(page.getByRole('button', { name: 'Meldung erfasst' })).toBeDisabled();
	await step(page, 'Als nicht meldepflichtig dokumentieren');
	await step(page, 'Abschließen');
	await expect(page.locator('[aria-current="step"]')).toHaveText('Abgeschlossen');

	await page.getByRole('link', { name: 'Fristen' }).click();
	await expect(page.locator('h1')).toHaveText('Fristen');
	await expect(page.locator('.deadlines li', { hasText: title })).toHaveCount(0);
});

test('VVT: completeness check and DSFA screening handoff', async ({ page }) => {
	const name = `E2E-Verarbeitung ${Date.now()}`;
	await signIn(page, '/werkzeuge/vvt/eintraege?neu=1');
	await expect(page).toHaveURL(/\/werkzeuge\/vvt\/eintraege\?neu=1$/);

	const group = (label: string) => page.locator('fieldset', { hasText: label });
	await page.getByLabel('Bezeichnung').fill(name);
	await page.locator('#field-rolle').selectOption('verantwortlicher');
	await page.getByLabel('Zwecke der Verarbeitung').fill('Versand des Newsletters');
	await group('Kategorien betroffener Personen').getByLabel('Kunden', { exact: true }).check();
	await group('Kategorien personenbezogener Daten').getByLabel('Kontaktdaten').check();
	await group('Kategorien von Empfängern').getByLabel('Interne Stellen').check();
	await page.locator('#field-status').selectOption('aktiv');
	await page.getByRole('button', { name: 'Speichern' }).click();

	await expect(page.locator('.verdict .headline')).toHaveText('Eintrag unvollständig.');
	await expect(page.locator('.verdict .reasons')).toContainText('Fristen für die Löschung');
	await expect(page.locator('.verdict .reasons')).toContainText('Art. 30 Abs. 1 lit. g DSGVO');

	await page
		.getByRole('link', { name: /Prüfung durchführen/ })
		.last()
		.click();
	await expect(page.getByText(`Prüfung für den Eintrag „${name}“`)).toBeVisible();
	for (const fieldset of await page.locator('form fieldset').all()) {
		await fieldset.locator('input[value="no"]').check();
	}
	await page.getByRole('button', { name: 'Auswerten' }).click();
	await expect(page.locator('.verdict .headline')).toHaveText('Keine DSFA erforderlich.');
	await page.getByRole('button', { name: /übernehmen/ }).click();

	await expect(page).toHaveURL(/\/werkzeuge\/vvt\/eintraege\?eintrag=/);
	await expect(page.locator('.record-view')).toContainText('Nicht erforderlich');
	await expect(page.locator('.history')).toContainText('Bewertung übernommen');
});

test('Betroffenenanfrage: reply deadline on Fristen and closing as answered', async ({ page }) => {
	const title = `E2E-Auskunft ${Date.now()}`;
	await signIn(page, '/werkzeuge/betroffenenanfrage/eintraege?neu=1');
	await expect(page).toHaveURL(/\/werkzeuge\/betroffenenanfrage\/eintraege\?neu=1$/);

	await page.getByLabel('Bezeichnung').fill(title);
	await page.getByLabel('Eingang am').fill(berlinInput(new Date()));
	await page.getByLabel('Auskunft (Art. 15)').check();
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('.verdict .headline')).toContainText('Antwort fällig bis');
	await expect(page.locator('.verdict .notes')).toContainText('Auskunft (Art. 15)');

	await page.getByRole('link', { name: 'Fristen' }).click();
	await expect(page.locator('.deadlines li', { hasText: title })).toContainText(
		'Antwort an die betroffene Person'
	);
	await page
		.locator('.deadlines li', { hasText: title })
		.getByRole('link', { name: title })
		.click();

	await step(page, 'Bearbeitung beginnen');
	await expect(page.locator('[aria-current="step"]')).toHaveText('In Bearbeitung');
	await page.getByRole('button', { name: 'Bearbeiten' }).click();
	await page.getByLabel('Durchgeführte Maßnahmen').fill('Auskunft mit Kopie erteilt');
	await page.getByLabel('Antwort versandt am').fill(berlinInput(new Date()));
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('.verdict .headline')).toHaveText('Fristgerecht beantwortet.');
	await step(page, 'Als beantwortet abschließen');
	await expect(page.locator('[aria-current="step"]')).toHaveText('Beantwortet');
});

test('AVV-Prüfung reports a missing clause; a training refresher appears on Fristen', async ({
	page
}) => {
	const processor = `E2E-Hosting ${Date.now()}`;
	await signIn(page, '/werkzeuge/avv-pruefung/eintraege?neu=1');
	await expect(page).toHaveURL(/\/werkzeuge\/avv-pruefung\/eintraege\?neu=1$/);

	await page.getByLabel('Auftragsverarbeiter', { exact: true }).fill(processor);
	await page.getByLabel('Leistung und Gegenstand der Verarbeitung').fill('Hosting der Website');
	await page.locator('#field-status').selectOption('pruefung');
	for (const id of ['grundlagen', 'lit_a', 'lit_b', 'lit_c', 'lit_d', 'lit_e', 'lit_f', 'lit_h']) {
		await page.locator(`input[name="field-${id}"][value="true"]`).check();
	}
	await page.locator('input[name="field-lit_g"][value="false"]').check();
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('.verdict .headline')).toHaveText(
		'Vertrag erfüllt Art. 28 nicht vollständig.'
	);
	await expect(page.locator('.verdict .reasons')).toContainText('Art. 28 Abs. 3 lit. g DSGVO');

	const training = `E2E-Unterweisung ${Date.now()}`;
	await page.goto('/werkzeuge/schulungsnachweis/eintraege?neu=1');
	await page.getByLabel('Titel').fill(training);
	await page.getByLabel('Datum').fill('2026-01-15');
	await page.getByLabel('Wiederholung nach').fill('12');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('.verdict .headline')).toHaveText('Schulung ohne Nachweis.');

	await page.getByRole('link', { name: 'Fristen' }).click();
	const row = page.locator('.deadlines li', { hasText: training });
	await expect(row).toContainText('15.01.2027');
	await expect(row).toContainText('Wiederholungsschulung Datenschutz');
});

test('DSFA: a high residual risk blocks sign-off until the authority is consulted', async ({
	page
}) => {
	const name = `E2E-DSFA ${Date.now()}`;
	await signIn(page, '/werkzeuge/dsfa/eintraege?neu=1');
	await expect(page).toHaveURL(/\/werkzeuge\/dsfa\/eintraege\?neu=1$/);

	await page.getByLabel('Verarbeitungsvorgang').fill(name);
	await page.getByLabel('Systematische Beschreibung der Verarbeitung').fill('Kameras im Lager');
	await page.getByLabel('Zwecke und berechtigte Interessen').fill('Diebstahlschutz');
	await page.getByLabel('Notwendigkeit und Verhältnismäßigkeit').fill('Mildere Mittel geprüft');
	for (const id of ['vertraulichkeit', 'integritaet', 'verfuegbarkeit', 'zweck', 'rechte']) {
		await page.locator(`#field-${id}_w`).selectOption('2');
		await page.locator(`#field-${id}_s`).selectOption('2');
	}
	await page.locator('#field-vertraulichkeit_w').selectOption('4');
	await page.locator('#field-vertraulichkeit_s').selectOption('4');
	await page.locator('#field-vertraulichkeit_massnahmen').fill('Verschlüsselung');
	await page.getByLabel('Entscheidung des Verantwortlichen').fill('Freigabe unter Auflagen');
	await page.getByRole('button', { name: 'Speichern' }).click();

	await expect(page.locator('.verdict .headline')).toHaveText(
		'Hohes Restrisiko: Aufsichtsbehörde vorher konsultieren.'
	);
	await step(page, 'Bewertung abschließen');
	await expect(page.locator('[aria-current="step"]')).toHaveText('Bewertet');
	await expect(page.getByRole('button', { name: 'Freigeben' })).toBeDisabled();
	await expect(page.locator('.state-bar')).toContainText('Art. 36 Abs. 1');
});

test('Vorfallmeldung: a death shortens the reporting period to 10 days', async ({ page }) => {
	const title = `E2E-Vorfall ${Date.now()}`;
	await signIn(page, '/werkzeuge/vorfallmeldung/eintraege?neu=1');
	await expect(page).toHaveURL(/\/werkzeuge\/vorfallmeldung\/eintraege\?neu=1$/);

	await page.getByLabel('Bezeichnung').fill(title);
	await page.locator('#field-rolle').selectOption('anbieter');
	await page.getByLabel('Kenntnis am').fill(berlinInput(new Date()));
	await page.getByLabel('Was ist geschehen?').fill('Fehlklassifikation in der Triage');
	await page.getByLabel('Tod oder schwere Schädigung der Gesundheit (lit. a)').check();
	await page.locator('input[name="field-todesfall"][value="true"]').check();
	await page.locator('#field-kausalitaet').selectOption('wahrscheinlich');
	await page.getByRole('button', { name: 'Speichern' }).click();

	await expect(page.locator('.verdict .headline')).toHaveText(
		'Meldepflichtig: spätestens 10 Tage ab Kenntnis.'
	);
	await page.getByRole('link', { name: 'Fristen' }).click();
	await expect(page.locator('.deadlines li', { hasText: title })).toContainText(
		'Meldung an die Marktüberwachungsbehörde (spätestens 10 Tage)'
	);
});

test('dialogs: archiving needs the typed word, Esc cancels, citations explain themselves', async ({
	page
}) => {
	const title = `E2E-Dialog ${Date.now()}`;
	await signIn(page, '/werkzeuge/datenpanne/eintraege?neu=1');
	await expect(page).toHaveURL(/\/werkzeuge\/datenpanne\/eintraege\?neu=1$/);
	await page.getByLabel('Bezeichnung').fill(title);
	await page.getByLabel('Kenntnis am').fill(berlinInput(new Date()));
	await page.getByLabel('Was ist geschehen?').fill('Test');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	const citation = page.locator('.citation-link').first();
	await citation.focus();
	await expect(page.getByRole('tooltip', { name: 'In den Normen öffnen' })).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('tooltip')).toBeHidden();

	await page.getByRole('button', { name: 'Archivieren' }).click();
	const dialog = page.getByRole('dialog', { name: 'Eintrag archivieren?' });
	await expect(dialog).toBeVisible();
	const confirm = dialog.getByRole('button', { name: 'Archivieren' });
	await expect(confirm).toBeDisabled();
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	await expect(page.getByText(/Archiviert am/)).toHaveCount(0);

	await page.getByRole('button', { name: 'Archivieren' }).click();
	await dialog.getByLabel('Zur Bestätigung „archivieren“ eingeben').fill(' Archivieren ');
	await expect(confirm).toBeEnabled();
	await confirm.click();
	await expect(page).toHaveURL(/\/werkzeuge\/datenpanne\/eintraege$/);
	await expect(page.getByRole('link', { name: title })).toHaveCount(0);
});
