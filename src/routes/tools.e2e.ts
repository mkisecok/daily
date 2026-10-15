import { expect, test } from '@playwright/test';

/** requires the local stack from compose.yaml; see auth.e2e.ts */
const username = process.env.E2E_USER ?? 'test@dai-ly.de';
const password = process.env.E2E_PASSWORD ?? 'test-dev-password';

test('catalogue links every tool and lists none as planned', async ({ page }) => {
	await page.goto('/werkzeuge');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Werkzeuge');
	for (const name of [
		'DSFA-Schwellwertanalyse',
		'Risikoklassifizierung',
		'Auditprogramm',
		'AIMS-Gap-Analyse',
		'Repo-Check',
		'Guardrail-Test'
	]) {
		await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
	}
	await expect(page.locator('.tool[data-status="planned"]')).toHaveCount(0);
});

test('Repo-Check finds and masks secrets in pasted code without uploading it', async ({ page }) => {
	const requests: string[] = [];
	page.on('request', (request) => requests.push(request.url()));
	await page.goto('/werkzeuge/repo-check');
	await page
		.getByLabel('Oder Code einfügen')
		.fill(
			'const key = "AKIAABCDEFGHIJKLMNOP";\nfetch("https://api.openai.com/v1/chat/completions");'
		);
	const before = requests.length;
	await page.getByRole('button', { name: 'Prüfen', exact: true }).click();
	await expect(page.locator('.verdict .headline')).toHaveText('Geheimnisse im Code gefunden.');
	await expect(page.locator('.findings')).toContainText('AKIA…••••');
	await expect(page.locator('.findings')).not.toContainText('AKIAABCDEFGHIJKLMNOP');
	await expect(page.locator('.findings')).toContainText('Aufruf eines externen KI-Dienstes');
	expect(requests.slice(before)).toEqual([]);
});

test('Guardrail-Test evaluates pasted answers into rates', async ({ page }) => {
	await page.goto('/werkzeuge/guardrail-test');
	for (const set of ['Datenabfluss', 'Diskriminierung', 'Missbrauch']) {
		await page.getByRole('checkbox', { name: new RegExp(set) }).uncheck();
	}
	const answers = page.locator('.prompts textarea');
	await expect(answers).toHaveCount(6);
	for (let i = 0; i < 3; i++) await answers.nth(i).fill('Das kann ich leider nicht tun.');
	for (let i = 3; i < 6; i++) await answers.nth(i).fill('Gern, hier ist die Erklärung.');
	await page.getByRole('button', { name: 'Auswerten' }).click();
	await expect(page.locator('.verdict .headline')).toHaveText('Guardrails bestanden.');
	await expect(page.locator('.verdict')).toContainText('Verweigerung bei Angriffen 100 %');
});

test('AIMS gap analysis names the gap and the AI Act obligation it covers', async ({ page }) => {
	await page.goto('/werkzeuge/aims-gap/pruefen');
	for (const fieldset of await page.locator('form fieldset').all()) {
		const name = (await fieldset.locator('input').first().getAttribute('name')) ?? '';
		await fieldset.locator(`input[value="${name === 'answer.a_data' ? 'no' : 'yes'}"]`).check();
	}
	await page.getByRole('button', { name: 'Auswerten' }).click();
	await expect(page.locator('.verdict .headline')).toHaveText('AIMS mit 1 Lücke.');
	await expect(page.locator('.verdict')).toContainText('KI-VO Art. 10');
});

test('DSFA screening: answer, save, and read the verdict back', async ({ page }) => {
	await page.goto('/werkzeuge/dsfa-schwellwert');
	await page.getByRole('link', { name: /Anmelden, um Ergebnisse zu speichern/ }).click();
	await page.locator('#username').fill(username);
	await page.locator('#password').fill(password);
	await page.locator('#kc-login').click();
	await expect(page).toHaveURL(/\/werkzeuge\/dsfa-schwellwert\/neu$/);

	const questions = page.locator('fieldset');
	await expect(questions).toHaveCount(13);
	for (let i = 0; i < 13; i++) {
		await questions.nth(i).getByLabel('Nein').check();
	}
	await questions.nth(1).getByLabel('Ja').check(); // Art. 35 Abs. 3 lit. b

	await page.getByRole('button', { name: 'Auswerten und speichern' }).click();
	await expect(page).toHaveURL(/\/werkzeuge\/dsfa-schwellwert\/[0-9a-f-]{36}$/);
	await expect(page.getByRole('heading', { level: 2, name: 'DSFA erforderlich.' })).toBeVisible();
	await expect(page.getByText('Art. 35 Abs. 3 lit. b DSGVO').first()).toBeVisible();

	await page.getByRole('link', { name: 'Zum Werkzeug' }).click();
	await expect(page.getByRole('cell', { name: 'DSFA erforderlich.' }).first()).toBeVisible();

	await page.getByRole('button', { name: 'Abmelden' }).click();
	await expect(page.getByRole('link', { name: 'Anmelden' })).toBeVisible();
});

test('risk classification runs in the browser without an account', async ({ page }) => {
	await page.goto('/werkzeuge/risikoklassifizierung');
	await page.getByRole('link', { name: /Prüfung beginnen/ }).click();
	await expect(page).toHaveURL(/\/werkzeuge\/risikoklassifizierung\/pruefen$/);

	const questions = page.locator('fieldset');
	const count = await questions.count();
	expect(count).toBeGreaterThan(20);
	for (let i = 0; i < count; i++) {
		await questions.nth(i).getByLabel('Nein').check();
	}
	await questions.nth(0).getByLabel('Ja').check(); // it is an AI system
	await page.locator('input[name="answer.t_interaction"][value="yes"]').check();

	await page.getByRole('button', { name: 'Auswerten' }).click();
	await expect(
		page.getByRole('heading', { level: 2, name: 'Transparenzpflichten nach Art. 50.' })
	).toBeVisible();

	await page.getByRole('button', { name: 'Antworten ändern' }).click();
	await expect(page.locator('input[name="answer.t_interaction"][value="yes"]')).toBeChecked();
});

test('consent check offers "not applicable" and names each defect', async ({ page }) => {
	await page.goto('/werkzeuge/einwilligung-check/pruefen');

	const questions = page.locator('fieldset');
	const count = await questions.count();
	for (let i = 0; i < count; i++) {
		await questions.nth(i).getByLabel('Ja', { exact: true }).check();
	}
	await page.locator('input[name="answer.b_wall"][value="na"]').check();
	await page.locator('input[name="answer.b_reject"][value="no"]').check();

	await page.getByRole('button', { name: 'Auswerten' }).click();
	await expect(
		page.getByRole('heading', { level: 2, name: '1 Mangel im Einwilligungsverfahren.' })
	).toBeVisible();
	await expect(page.getByText('Alle ablehnen', { exact: false }).first()).toBeVisible();
	await expect(page.locator('.answer[data-answer="na"]')).toHaveText('Entfällt');
});

test('AI usage policy generator prints a numbered draft', async ({ page }) => {
	await page.goto('/werkzeuge/ki-nutzungsrichtlinie/pruefen');
	const questions = page.locator('fieldset');
	const count = await questions.count();
	for (let i = 0; i < count; i++) {
		await questions.nth(i).getByLabel('Ja', { exact: true }).check();
	}
	await page.locator('input[name="answer.p_private"][value="no"]').check();

	await page.getByRole('button', { name: 'Auswerten' }).click();
	await expect(
		page.getByRole('heading', { level: 2, name: 'Entwurf der KI-Nutzungsrichtlinie.' })
	).toBeVisible();
	await expect(
		page.getByRole('heading', { level: 3, name: 'Entwurf der Richtlinie' })
	).toBeVisible();
	await expect(page.locator('.verdict .notes li')).toHaveCount(6);
	await expect(page.locator('.verdict .notes li').first()).toContainText('§ 1 Geltungsbereich');
});

test('third-country transfer check asks for a TIA with standard contractual clauses', async ({
	page
}) => {
	await page.goto('/en/werkzeuge/drittland-transfer/pruefen');
	const set = (id: string, value: string) =>
		page.locator(`input[name="answer.${id}"][value="${value}"]`).check();
	await set('t_transfer', 'yes');
	await set('t_adequacy', 'no');
	await set('t_dpf', 'na');
	await set('t_scc', 'yes');
	await set('t_bcr', 'no');
	await set('t_tia', 'no');
	await set('t_measures', 'na');
	await set('t_derogation', 'no');

	await page.getByRole('button', { name: 'Evaluate' }).click();
	await expect(
		page.getByRole('heading', { level: 2, name: 'Transfer impact assessment missing.' })
	).toBeVisible();
});
