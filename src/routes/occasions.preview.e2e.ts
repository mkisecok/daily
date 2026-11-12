import { expect, test } from '@playwright/test';

test('preview: introducing software links the DPIA screening and attaches its result', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/software-einfuehrung/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.getByLabel('Software oder Dienst').fill('Bewerbermanagement');
	const scope = page.locator('#sec-vorhaben');
	await scope.getByRole('button', { name: 'Verarbeitet personenbezogene Daten' }).click();
	await scope.getByRole('button', { name: 'Läuft beim Anbieter (Cloud, SaaS)' }).click();

	// parts outside the scope fold, the cloud points appear
	await expect(page.locator('#sec-drittland')).toContainText('Entfällt für den gewählten Umfang.');
	await expect(page.locator('#sec-beschaeftigte')).toContainText(
		'Entfällt für den gewählten Umfang.'
	);
	await expect(page.locator('.check', { hasText: 'Ausstieg geregelt' })).toBeVisible();
	await page
		.locator('.check', { hasText: 'Zweck und Rechtsgrundlage' })
		.getByText('Ja', { exact: true })
		.click();
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await expect(page.locator('.verdict .headline')).toHaveText('Prüfung läuft.');
	await expect(page.locator('.verdict')).toContainText(
		'Noch durchzuführen: DSFA-Schwellwertanalyse.'
	);

	// run the screening from the entry and take its result back
	await page
		.locator('.record-view .row', { hasText: 'DSFA-Schwellwertanalyse' })
		.getByRole('link', { name: /Prüfung durchführen/ })
		.click();
	await expect(page.getByText('Prüfung für den Eintrag „Bewerbermanagement“')).toBeVisible();
	const names = await page
		.locator('input[type=radio]')
		.evaluateAll((inputs) => [...new Set(inputs.map((i) => (i as HTMLInputElement).name))]);
	for (const name of names)
		await page.locator(`input[name="${name}"][value="no"]`).check({ force: true });
	await page.getByRole('button', { name: 'Auswerten' }).click();
	await page.getByRole('button', { name: 'In Neue Software einführen übernehmen' }).click();

	await expect(page).toHaveURL(/software-einfuehrung\/eintraege\/\?eintrag=/);
	await expect(
		page.locator('.record-view .row', { hasText: 'DSFA-Schwellwertanalyse' })
	).toContainText('Keine DSFA erforderlich.');
	await expect(page.locator('.verdict')).not.toContainText('Noch durchzuführen');
});

test('preview: introducing an AI tool adds the high-risk duties after a high-risk classification', async ({
	page
}) => {
	const at = '2026-11-12T09:00:00.000Z';
	const data = {
		bezeichnung: 'Bewerber-Ranking',
		umfang: ['entscheidungen'],
		einstufung: {
			tool: 'risikoklassifizierung',
			catalogVersion: 1,
			verdict: 'positive',
			outcome: 'hochrisiko',
			headline: { de: 'Hochrisiko-KI-System.', en: 'High-risk AI system.' },
			at
		}
	};
	await page.goto('', { waitUntil: 'networkidle' });
	await page.evaluate(
		(record) =>
			localStorage.setItem('daily.records.v1', JSON.stringify({ records: [record], events: [] })),
		{
			id: 'ki-1',
			toolSlug: 'ki-einfuehrung',
			definitionVersion: 1,
			state: 'pruefung',
			title: data.bezeichnung,
			data,
			version: 1,
			createdAt: at,
			updatedAt: at,
			archivedAt: null
		}
	);
	await page.goto('werkzeuge/ki-einfuehrung/eintraege/?eintrag=ki-1', { waitUntil: 'networkidle' });
	await expect(page.locator('.verdict')).toContainText('2. Dezember 2027');
	await expect(page.locator('.record-view')).toContainText(
		'Menschliche Aufsicht durch kompetente, befugte Personen benannt'
	);

	await page.getByRole('button', { name: 'Bearbeiten' }).click();
	await expect(page.locator('#sec-hochrisiko .check')).toHaveCount(4);
	await expect(page.locator('#sec-transparenz')).toContainText(
		'Entfällt für den gewählten Umfang.'
	);
});

test('preview: a leaver gets the exit points, the gap and the note on access requests', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/personalwechsel/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.getByLabel('Person', { exact: true }).fill('P-1042');
	await page.getByLabel('Vorgang', { exact: true }).click();
	await page.getByRole('option', { name: 'Austritt' }).click();
	await page
		.locator('#sec-vorgang')
		.getByRole('button', { name: 'Administrative Rechte oder gemeinsam genutzte Zugänge' })
		.click();

	// the joining part folds, the exit points and the admin point appear
	await expect(page.locator('#sec-eintritt')).toContainText('Entfällt für den gewählten Umfang.');
	await expect(page.locator('.check', { hasText: 'Gemeinsam genutzte Passwörter' })).toBeVisible();
	await expect(page.locator('.check', { hasText: 'Private Inhalte nicht eingesehen' })).toHaveCount(
		0
	);
	await page
		.locator('.check', { hasText: 'Konten und Zugänge zum letzten Arbeitstag gesperrt' })
		.getByText('Nein', { exact: true })
		.click();
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await expect(page.locator('.verdict .headline')).toHaveText('Noch nicht abschließbar.');
	await expect(page.locator('.verdict')).toContainText(
		'Austritt: Konten und Zugänge zum letzten Arbeitstag gesperrt'
	);
	await expect(page.locator('.verdict')).toContainText('Betroffenenanfrage');
});
