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

test('preview: video surveillance adds the storage part with recording and asks for the balancing test', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/videoueberwachung/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.getByLabel('Anlage oder Standort').fill('Lager Nord');
	await expect(page.locator('#sec-speicherung')).toContainText(
		'Entfällt für den gewählten Umfang.'
	);
	await expect(page.locator('.check', { hasText: 'Tonaufnahme abgeschaltet' })).toHaveCount(0);

	const scope = page.locator('#sec-anlage');
	await scope
		.getByRole('button', { name: 'Bilder werden gespeichert, nicht nur live gezeigt' })
		.click();
	await scope
		.getByRole('button', { name: 'Kameras können schwenken, zoomen oder Ton aufnehmen' })
		.click();
	await expect(page.locator('.check', { hasText: 'Speicherdauer festgelegt' })).toBeVisible();
	await expect(page.locator('.check', { hasText: 'Tonaufnahme abgeschaltet' })).toBeVisible();
	await page
		.locator('.check', { hasText: 'Speicherdauer festgelegt' })
		.getByText('Nein', { exact: true })
		.click();
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await expect(page.locator('.verdict .headline')).toHaveText('Noch nicht freigabefähig.');
	await expect(page.locator('.verdict')).toContainText(
		'Noch durchzuführen: Interessenabwägung, DSFA-Schwellwertanalyse.'
	);
	await expect(
		page.locator('.record-view .row', { hasText: 'Interessenabwägung' }).getByRole('link', {
			name: /Prüfung durchführen/
		})
	).toBeVisible();
});

test('preview: a website with tracking gets the consent part and asks for the consent check', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/website-start/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.getByLabel('Website oder Shop').fill('beispiel.de');
	await expect(page.locator('#sec-einwilligung')).toContainText(
		'Entfällt für den gewählten Umfang.'
	);

	await page
		.locator('#sec-vorhaben')
		.getByRole('button', { name: 'Analyse- oder Marketing-Werkzeuge, nicht nötige Cookies' })
		.click();
	await expect(
		page.locator('.check', { hasText: 'Ablehnen schon auf der ersten Ebene' })
	).toBeVisible();
	await expect(page.locator('.check', { hasText: 'Videos, Karten' })).toHaveCount(0);
	await page
		.locator('.check', { hasText: 'Ablehnen schon auf der ersten Ebene' })
		.getByText('Nein', { exact: true })
		.click();
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await expect(page.locator('.verdict .headline')).toHaveText('Noch nicht startklar.');
	await expect(page.locator('.verdict')).toContainText(
		'Noch durchzuführen: Einwilligungs-Check für das Banner.'
	);
});

test('preview: a complaint to the authority starts from the example and shows the open request as a gap', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/aufsichtsanfrage/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.getByRole('link', { name: 'Beispiel laden' }).click();
	await expect(page.getByLabel('Betreff')).toHaveValue('Beschwerde wegen Auskunft (Beispiel)');
	await expect(page.locator('#sec-vor_ort')).toContainText('Entfällt für den gewählten Umfang.');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await expect(page.locator('.verdict .headline')).toHaveText('Noch nicht antwortbereit.');
	await expect(page.locator('.verdict')).toContainText('Beschwerde: Das ursprüngliche Anliegen');
	await expect(page.locator('.verdict')).toContainText(
		'Die zugrunde liegende Betroffenenanfrage verknüpfen.'
	);
	await expect(page.locator('section.deadlines')).toContainText('Antwort an die Aufsichtsbehörde');
});

test('preview: remote work adds the private-device part when own devices are allowed', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/mobiles-arbeiten/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.getByLabel('Bezeichnung', { exact: true }).fill('Mobiles Arbeiten Vertrieb');
	await expect(page.locator('#sec-privat')).toContainText('Entfällt für den gewählten Umfang.');
	await page
		.locator('#sec-vorhaben')
		.getByRole('button', { name: 'Private Geräte dürfen genutzt werden' })
		.click();
	await page
		.locator('.check', { hasText: 'Dienstliche Daten getrennt' })
		.getByText('Nein', { exact: true })
		.click();
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await expect(page.locator('.verdict .headline')).toHaveText('Noch nicht freigabefähig.');
	await expect(page.locator('.verdict')).toContainText(
		'Private Geräte: Dienstliche Daten getrennt'
	);
	await expect(page.locator('.verdict')).toContainText('Den TOM-Katalog verknüpfen.');
});

test('preview: changing a cloud provider adds the Data Act switching points', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/dienstleisterwechsel/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.getByLabel('Bezeichnung', { exact: true }).fill('Ticketsystem');
	await expect(page.locator('#sec-cloud')).toContainText('Entfällt für den gewählten Umfang.');
	await page
		.locator('#sec-vorhaben')
		.getByRole('button', { name: 'Cloud- oder anderer Datenverarbeitungsdienst (Data Act)' })
		.click();
	await expect(page.locator('.check', { hasText: 'höchstens zwei Monate' })).toBeVisible();
	await page
		.locator('.check', { hasText: 'Schriftliche Bestätigung der Löschung' })
		.getByText('Nein', { exact: true })
		.click();
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await expect(page.locator('.verdict .headline')).toHaveText('Noch nicht abschließbar.');
	await expect(page.locator('.verdict')).toContainText('Art. 25, 29 Data Act');
});

test('preview: a hiring procedure adds the AI part and names the deletion date', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/bewerbungsverfahren/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.getByLabel('Stelle', { exact: true }).fill('Buchhaltung');
	await expect(page.locator('#sec-ki')).toContainText('Entfällt für den gewählten Umfang.');
	await page
		.locator('#sec-vorhaben')
		.getByRole('button', { name: 'KI sichtet, filtert oder bewertet Bewerbungen' })
		.click();
	await expect(page.locator('.check', { hasText: 'ein Mensch entscheidet' })).toBeVisible();
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await expect(page.locator('.verdict .headline')).toHaveText('Verfahren läuft.');
	await expect(page.locator('.verdict')).toContainText(
		'Noch durchzuführen: Risikoklassifizierung.'
	);
});

test('preview: a phone campaign asks for documented consent under § 7a UWG', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/werbekampagne/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.getByLabel('Bezeichnung', { exact: true }).fill('Rückruf-Aktion');
	await page
		.locator('#sec-vorhaben')
		.getByRole('button', { name: 'Anrufe bei Verbrauchern' })
		.click();
	await expect(page.locator('#sec-email')).toContainText('Entfällt für den gewählten Umfang.');
	await page
		.locator('.check', { hasText: 'fünf Jahre ab Erteilung' })
		.getByText('Nein', { exact: true })
		.click();
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await expect(page.locator('.verdict .headline')).toHaveText('Noch nicht versandbereit.');
	await expect(page.locator('.verdict')).toContainText(
		'Telefon: Einwilligung bei Erteilung dokumentiert'
	);
	await expect(page.locator('.verdict')).toContainText('§ 7a UWG');
});

test('preview: AI for staff names the works council duties and the emotion ban', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/ki-personal/eintraege/?neu=1&beispiel=1', {
		waitUntil: 'networkidle'
	});
	await expect(page.locator('.check', { hasText: 'Keine Ableitung von Emotionen' })).toBeVisible();
	await expect(page.locator('#sec-hochrisiko')).toContainText('Entfällt für den gewählten Umfang.');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await expect(page.locator('.verdict .headline')).toHaveText('Noch nicht freigabefähig.');
	await expect(page.locator('.verdict')).toContainText(
		'Betriebsrat: Mitbestimmung bei technischer'
	);
	await expect(page.locator('.verdict')).toContainText(
		'Noch durchzuführen: Risikoklassifizierung, DSFA-Schwellwertanalyse.'
	);
});

test('preview: a self-built chatbot without the AI notice shows the gap and the checks to run', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/chatbot/eintraege/?neu=1&beispiel=1', { waitUntil: 'networkidle' });
	await expect(page.locator('.check', { hasText: 'Grundlage für die Übermittlung' })).toBeVisible();
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await expect(page.locator('.verdict .headline')).toHaveText('Noch nicht startklar.');
	await expect(page.locator('.verdict')).toContainText(
		'Transparenz: Klar erkennbar und barrierefrei'
	);
	await expect(page.locator('.verdict')).toContainText(
		'Noch durchzuführen: Risikoklassifizierung, Prüfung der Transparenzpflichten, Drittlandprüfung.'
	);
});
