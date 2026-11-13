import { expect, test } from '@playwright/test';
import { answerAll, chip, choose, pickDate } from './e2e-helpers.js';

test('preview: Navigator pages and search work under the base path', async ({ page }) => {
	// the search loads its index on input, which needs the hydrated page
	await page.goto('normen/', { waitUntil: 'networkidle' });
	await page.getByLabel('In allen Gesetzen suchen').fill('Art. 22');
	await expect(page.locator('.hits li')).toHaveCount(2);
	await page.locator('.hits a', { hasText: 'DSGVO' }).click();
	await expect(page).toHaveURL(/\/daily\/normen\/dsgvo\/art-22\/$/);
	await expect(page.getByRole('heading', { level: 1 })).toContainText(
		'Automatisierte Entscheidungen'
	);
	await expect(page.locator('.cited')).toContainText('KI und DSGVO');
});

test('preview: notes stay in the browser and reports read the browser records', async ({
	page
}) => {
	await page.goto('notizen/');
	await page.getByRole('button', { name: 'Heutige Notiz' }).click();
	await expect(page.getByRole('heading', { level: 2 })).toContainText('Notiz vom');
	await page.reload();
	await expect(page.getByRole('heading', { level: 2 })).toContainText('Notiz vom');

	await page.goto('werkzeuge/datenpanne/eintraege/?neu=1');
	await page.getByLabel('Bezeichnung').fill('Vorschau-Panne');
	await pickDate(page, 'Kenntnis am', '2026-10-14T09:00');
	await page.getByLabel('Was ist geschehen?').fill('Test');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await page.goto('berichte/?art=datenschutz&von=2026-01-01&bis=2026-12-31');
	await expect(page.locator('.tool', { hasText: 'Datenpanne' }).first()).toContainText(
		'Vorschau-Panne'
	);
	await expect(page.locator('.report')).toContainText('nur in der vollständigen Installation');
});

test('preview: a chosen chip stays distinguishable in forced colours', async ({ page }) => {
	await page.emulateMedia({ forcedColors: 'active' });
	await page.goto('werkzeuge/datenpanne/eintraege/?neu=1');
	const group = page.getByRole('group', { name: 'Datenkategorien' });
	const first = group.getByRole('button').first();
	await first.click();
	await expect(first).toHaveAttribute('aria-pressed', 'true');
	// colours are forced, so the check mark (instead of the plus) carries the state
	await expect(first.locator('path')).toHaveCount(1);
	await expect(group.getByRole('button').nth(1).locator('path')).toHaveCount(2);
});

test('preview: the calendar fills a date field and the record keeps it', async ({ page }) => {
	await page.goto('werkzeuge/ki-register/eintraege/?neu=1');
	await page.getByLabel('Bezeichnung').fill('Kalendertest');
	await page.getByLabel('Zweck und Einsatzbereich').fill('Test');
	await choose(page.getByLabel('Rolle der Organisation'), 'betreiber');
	await choose(page.locator('#field-status'), 'aktiv');
	const field = page.getByRole('group', { name: 'Wiedervorlage', exact: true });
	await field.getByRole('button', { name: 'Kalender öffnen' }).click();
	const day = page.locator('[data-calendar-day]:not([data-outside-month])', { hasText: /^15$/ });
	const iso = await day.getAttribute('data-value');
	await day.click();
	await expect(field.locator('[data-segment="day"]')).toHaveText('15');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);
	const [year, month] = (iso ?? '').split('-');
	await expect(page.locator('.record-view')).toContainText(`15.${month}.${year}`);
});

test('preview: on a phone the menu opens as a sheet, navigates and closes', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 740 });
	await page.goto('werkzeuge/');
	await expect(page.locator('.sidebar')).toBeHidden();
	const button = page.getByRole('button', { name: 'Menü' });
	await button.click();
	const sheet = page.getByRole('dialog');
	const menu = sheet.getByRole('navigation', { name: 'Hauptnavigation' });
	await expect(menu.getByRole('link')).toHaveCount(6);
	await expect(sheet.getByRole('link', { name: /Werkzeuge/ })).toHaveAttribute(
		'aria-current',
		'page'
	);
	const box = await sheet.getByRole('link', { name: /Normen/ }).boundingBox();
	expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
	for (const control of [
		sheet.getByRole('link', { name: 'DE', exact: true }),
		sheet.getByRole('link', { name: 'EN', exact: true }),
		sheet.locator('.switch')
	]) {
		const size = await control.boundingBox();
		expect(Math.min(size?.width ?? 0, size?.height ?? 0)).toBeGreaterThanOrEqual(44);
	}

	await sheet.getByRole('link', { name: /Normen/ }).click();
	await expect(page).toHaveURL(/\/daily\/normen\/$/);
	await expect(sheet).toBeHidden();

	await button.click();
	await expect(sheet).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(sheet).toBeHidden();
	await expect(button).toBeFocused();
	expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});

test('preview: clearing a reference field removes the link when saved', async ({ page }) => {
	await page.goto('werkzeuge/auditprogramm/eintraege/?neu=1');
	await page.getByLabel('Titel').fill('Vorschau-Audit');
	await page.getByLabel('Gegenstand und Umfang').fill('Personal');
	await chip(page, 'DSGVO');
	await pickDate(page, 'Geplant am', '2026-11-10');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await page.goto('werkzeuge/feststellungen/eintraege/?neu=1');
	await page.getByLabel('Kurzbezeichnung').fill('Vorschau-Feststellung');
	await choose(page.locator('#field-audit'), { label: 'Vorschau-Audit' });
	await choose(page.locator('#field-kategorie'), 'gering');
	await page.getByLabel('Sachverhalt').fill('Test');
	await pickDate(page, 'Umsetzen bis', '2026-12-15');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('.record-view')).toContainText('Vorschau-Audit');

	await page.getByRole('button', { name: 'Bearbeiten' }).click();
	await page.locator('#field-audit').fill('');
	await page.getByLabel('Sachverhalt').click();
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('.record-view')).not.toContainText('Vorschau-Audit');
});

test('preview: an optional dropdown can be set back to nothing', async ({ page }) => {
	await page.goto('werkzeuge/datenpanne/eintraege/?neu=1');
	const risk = page.locator('#field-risiko');
	await choose(risk, 'kein');
	await expect(risk).toContainText('Voraussichtlich kein Risiko');
	await choose(risk, '');
	await expect(risk).toContainText('bitte wählen');
});

test('preview: date fields tell assistive technology they are required', async ({ page }) => {
	await page.goto('werkzeuge/datenpanne/eintraege/?neu=1');
	const day = page
		.getByRole('group', { name: 'Kenntnis am', exact: true })
		.locator('[data-segment="day"]');
	await expect(day).toHaveAttribute('aria-required', 'true');
});

test('preview: contents rows keep space between number and title', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 740 });
	await page.goto('normen/ki-vo/');
	const smallest = await page.locator('.toc').evaluate((toc) => {
		let min = Infinity;
		for (const a of toc.querySelectorAll('a')) {
			const ref = a.querySelector('.ref');
			const title = [...a.childNodes].find((n) => n.nodeType === 3 && n.textContent?.trim());
			if (!ref || !title) continue;
			const range = document.createRange();
			range.selectNodeContents(title);
			min = Math.min(min, range.getBoundingClientRect().left - ref.getBoundingClientRect().right);
		}
		return min;
	});
	expect(smallest).toBeGreaterThanOrEqual(4);
});

test('preview: the phone menu keeps focus inside, closes on desktop width, theme stays in step', async ({
	page
}) => {
	await page.setViewportSize({ width: 375, height: 740 });
	await page.goto('werkzeuge/');
	await page.getByRole('button', { name: 'Menü' }).click();
	const sheet = page.getByRole('dialog');
	for (let i = 0; i < 14; i++) await page.keyboard.press('Tab');
	expect(await sheet.evaluate((d) => d.contains(document.activeElement))).toBe(true);

	const before = await page.evaluate(() => document.documentElement.dataset.theme);
	await sheet.locator('.switch').click();
	await page.setViewportSize({ width: 1280, height: 800 });
	await expect(sheet).toBeHidden();
	await page.locator('.sidebar .switch').click();
	expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(before);
});

test('preview: a searchable field says when nothing matches', async ({ page }) => {
	await page.goto('werkzeuge/feststellungen/eintraege/?neu=1');
	await page.locator('#field-audit').click();
	await page.locator('#field-audit').pressSequentially('zzzz');
	await expect(page.getByText('Keine Treffer')).toBeVisible();
});

test('preview: the command palette jumps to a tool and searches the laws', async ({ page }) => {
	// the shortcut listener exists once the page is hydrated
	await page.goto('werkzeuge/', { waitUntil: 'networkidle' });
	await page.keyboard.press('Control+k');
	const palette = page.getByRole('dialog', { name: 'Suche öffnen' });
	await expect(palette).toBeVisible();
	await page.keyboard.type('Datenpanne');
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/daily\/werkzeuge\/datenpanne\/$/);
	await expect(palette).toBeHidden();

	await page.keyboard.press('/');
	await expect(palette).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(palette).toBeHidden();

	await page.getByRole('button', { name: 'Suche öffnen' }).click();
	await page.keyboard.type('Art. 22');
	await palette.getByRole('option', { name: /In den Normen suchen/ }).click();
	await expect(page).toHaveURL(/\/daily\/normen\/\?q=Art\.%2022$/);
	await expect(page.getByLabel('In allen Gesetzen suchen')).toHaveValue('Art. 22');
});

test('preview: typing "/" in a text field does not open the palette', async ({ page }) => {
	await page.goto('notizen/?neu=1');
	// real keystrokes: fill() sends no keydown and would pass without the guard
	await page.getByLabel('Titel').pressSequentially('a/b');
	await expect(page.getByLabel('Titel')).toHaveValue('a/b');
	await expect(page.getByRole('dialog', { name: 'Suche öffnen' })).toBeHidden();
});

test('preview: the note preview slides over the text and back', async ({ page }) => {
	await page.goto('notizen/?neu=1', { waitUntil: 'networkidle' });
	const text = page.getByRole('textbox', { name: 'Text' });
	await text.fill('## Termin\n\nsiehe Art. 6 DSGVO');
	const preview = page.getByRole('region', { name: 'Vorschau' });
	await expect(preview).toBeHidden();

	await page.getByRole('button', { name: 'Vorschau öffnen' }).click();
	const toggle = page.getByRole('button', { name: 'Vorschau schließen' });
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	await expect(preview.getByRole('heading', { name: 'Termin' })).toBeVisible();
	await expect(preview.locator('a.norm')).toHaveText('Art. 6 DSGVO');
	// the sheet lands exactly on the text box and the page never scrolls sideways
	const box = await text.boundingBox();
	await expect
		.poll(async () => (await preview.locator('.sheet').boundingBox())?.x)
		.toBeCloseTo(box!.x, 0);
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
		await page.evaluate(() => document.documentElement.clientWidth)
	);

	// Esc closes it and returns to the text
	await toggle.press('Escape');
	await expect(page.getByRole('button', { name: 'Vorschau öffnen' })).toHaveAttribute(
		'aria-expanded',
		'false'
	);
	await expect(text).toBeFocused();
	await expect(preview).toBeHidden();
});

test('preview: the sidebar counter follows saves and clearing without navigation', async ({
	page
}) => {
	await page.goto('werkzeuge/datenpanne/eintraege/?neu=1', { waitUntil: 'networkidle' });
	const counter = page.locator('.sidebar a', { hasText: 'Fristen' }).locator('.count');
	await expect(counter).toHaveCount(0);
	const now = new Date();
	const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T08:00`;
	await page.getByLabel('Bezeichnung').fill('Zählertest');
	await pickDate(page, 'Kenntnis am', today);
	await page.getByLabel('Was ist geschehen?').fill('Test');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(counter).toHaveText('1');

	await page.getByRole('link', { name: 'Zur Übersicht' }).click();
	await page.getByRole('button', { name: 'Lokale Daten löschen' }).click();
	const dialog = page.getByRole('dialog', { name: 'Lokale Daten löschen?' });
	await dialog.getByLabel('Zur Bestätigung „löschen“ eingeben').fill('löschen');
	await dialog.getByRole('button', { name: 'Lokale Daten löschen' }).click();
	await expect(counter).toHaveCount(0);
});

test('preview: phones reach the preview explanation from the menu', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 740 });
	await page.goto('werkzeuge/', { waitUntil: 'networkidle' });
	await page.getByRole('button', { name: 'Menü' }).click();
	await page
		.getByRole('dialog')
		.getByRole('link', { name: /Vorschau/ })
		.click();
	await expect(page).toHaveURL(/\/daily\/vorschau\/$/);
});

test('preview: a questionnaire result with long citations fits a phone screen', async ({
	page
}) => {
	await page.setViewportSize({ width: 375, height: 800 });
	await page.goto('werkzeuge/drittland-transfer/pruefen/', { waitUntil: 'networkidle' });
	for (const fieldset of await page.locator('form fieldset').all()) {
		await fieldset.locator('input[value="unknown"]').check();
	}
	await page.getByRole('button', { name: 'Auswerten' }).click();
	await expect(page.locator('.verdict .headline')).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});

test('preview: the privacy notice describes the preview, not the signed-in app', async ({
	page
}) => {
	await page.goto('datenschutz/');
	const notice = page.locator('article.legal');
	await expect(notice.getByRole('heading', { name: '3. Aufruf der Website' })).toBeVisible();
	await expect(notice).toContainText('GitHub Pages');
	await expect(notice).toContainText('daily.records.v1');
	await expect(notice).not.toContainText('daily_session');
	await expect(notice).not.toContainText('Hetzner');
	await page.goto('en/datenschutz/');
	await expect(
		page.locator('article.legal').getByRole('heading', { name: '1. Controller' })
	).toBeVisible();
});

test('preview: the tool catalogue narrows by search and area', async ({ page }) => {
	await page.goto('werkzeuge/', { waitUntil: 'networkidle' });
	await expect(page.locator('li.tile')).toHaveCount(50);

	await page.getByRole('searchbox', { name: 'Werkzeuge durchsuchen' }).fill('Art. 35');
	await expect(page.locator('.bento')).toBeHidden();
	await expect(page.locator('li.tile .name')).toHaveText([
		'DSFA-Schwellwertanalyse',
		'Datenschutz-Folgenabschätzung'
	]);

	await page.getByRole('searchbox', { name: 'Werkzeuge durchsuchen' }).fill('');
	const audit = page
		.getByRole('group', { name: 'Nach Bereich filtern' })
		.getByRole('button', { name: /^Audit/ });
	await audit.click();
	await expect(audit).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('li.tile')).toHaveCount(5);

	await page.getByRole('searchbox', { name: 'Werkzeuge durchsuchen' }).fill('xyz');
	await expect(page.getByRole('status')).toHaveText('Kein Werkzeug passt zu „xyz“.');
});

test('preview: the bento offers the tool opened last and keeps pinned tools', async ({ page }) => {
	await page.goto('werkzeuge/', { waitUntil: 'networkidle' });
	const feature = page.locator('.bento .feature');
	await expect(feature).toContainText('Zum Einstieg');
	await expect(feature).toContainText('Verzeichnis von Verarbeitungstätigkeiten');
	await expect(page.locator('.bento .hint')).toBeVisible();

	await page.getByRole('button', { name: 'Löschkonzept anheften' }).click();
	await expect(page.getByRole('button', { name: 'Löschkonzept lösen' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect(page.locator('.bento .side').first()).toContainText('Angeheftet');
	await expect(page.locator('.bento .side').first()).toContainText('Löschkonzept');
	await expect(page.locator('.bento .hint')).toBeHidden();

	await page.goto('werkzeuge/datenpanne/', { waitUntil: 'networkidle' });
	await page.goto('werkzeuge/', { waitUntil: 'networkidle' });
	await expect(feature).toContainText('Zuletzt geöffnet');
	await expect(feature).toContainText('Datenpanne');
	await expect(page.getByRole('button', { name: 'Löschkonzept lösen' })).toBeVisible();
});

test('preview: opening the calendar at the end of a long form keeps the scroll position', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.goto('werkzeuge/datenpanne/eintraege/?neu=1', { waitUntil: 'networkidle' });
	const trigger = page.getByRole('button', { name: /Kalender/ }).last();
	await trigger.scrollIntoViewIfNeeded();
	const before = await page.evaluate(() => scrollY);
	expect(before).toBeGreaterThan(500);

	await trigger.click();
	await expect(page.locator('.daily-calendar-popover')).toBeVisible();
	expect(await page.evaluate(() => scrollY)).toBe(before);

	await page.keyboard.press('Escape');
	await expect(page.locator('.daily-calendar-popover')).toBeHidden();
	await expect(trigger).toBeFocused();
	expect(await page.evaluate(() => scrollY)).toBe(before);
});

test('preview: a DPIA shows its risk picture before and after measures', async ({ page }) => {
	const at = '2026-11-05T09:00:00.000Z';
	const data = {
		bezeichnung: 'Bewerbervorauswahl',
		vertraulichkeit_gefaehrdungen: ['G 0.14', 'G 0.23'],
		vertraulichkeit_w: '3',
		vertraulichkeit_s: '4',
		vertraulichkeit_massnahmen: 'Verschlüsselung',
		vertraulichkeit_rw: '2',
		vertraulichkeit_rs: '4',
		integritaet_w: '2',
		integritaet_s: '2',
		integritaet_rw: '2',
		integritaet_rs: '1'
	};
	await page.goto('', { waitUntil: 'networkidle' });
	await page.evaluate(
		(record) =>
			localStorage.setItem('daily.records.v1', JSON.stringify({ records: [record], events: [] })),
		{
			id: 'dsfa-1',
			toolSlug: 'dsfa',
			definitionVersion: 2,
			state: 'entwurf',
			title: data.bezeichnung,
			data,
			version: 1,
			createdAt: at,
			updatedAt: at,
			archivedAt: null
		}
	);
	await page.goto('werkzeuge/dsfa/eintraege/?eintrag=dsfa-1', { waitUntil: 'networkidle' });

	const dashboard = page.getByRole('region', { name: 'Risikobild' });
	await expect(dashboard.locator('.figure strong')).toHaveText(['2', '1', '1', 'Erforderlich']);
	await expect(dashboard.getByRole('img', { name: /^Risikomatrix Vor/ })).toHaveAttribute(
		'aria-label',
		/1 Unbefugte Offenlegung 3 \/ 4 Hohes Risiko; 2 Unbefugte Veränderung 2 \/ 2 Risiko/
	);
	await expect(
		dashboard.getByRole('row', { name: /Unbefugte Offenlegung/ }).locator('.threats')
	).toHaveText('G 0.14, G 0.23');
	const row = dashboard.getByRole('row', { name: /Unbefugte Veränderung/ });
	await expect(row.locator('.level')).toHaveText(['Risiko', 'Geringes Risiko']);
	// lowered without a measure: marked in the table and open before sign-off
	await expect(row.locator('.unbacked')).toHaveText('ohne Maßnahme');
	await expect(dashboard.locator('tbody tr')).toHaveCount(7);
	const signoff = dashboard.getByRole('region', { name: 'Vor der Freigabe' });
	await expect(signoff).toContainText('Offene Punkte: 4');
	await expect(signoff.locator('li .badge')).toHaveText(['Offen', 'Offen', 'Offen', 'Offen']);
	await expect(signoff.locator('li[data-status="offen"] .detail')).toHaveText(
		'Unbefugte Veränderung'
	);

	const [download] = await Promise.all([
		page.waitForEvent('download'),
		dashboard.getByRole('button', { name: 'Excel herunterladen' }).click()
	]);
	expect(download.suggestedFilename()).toMatch(/^dsfa-Bewerbervorauswahl-\d{4}-\d{2}-\d{2}\.xlsx$/);
});

test('preview: the SDM cube shows its faces, slices and views', async ({ page }) => {
	const at = '2026-11-08T09:00:00.000Z';
	const met = (goal: string) => ({
		[`${goal}_e1`]: 'umgesetzt',
		[`${goal}_e2`]: 'umgesetzt',
		[`${goal}_e3`]: 'umgesetzt'
	});
	const data = {
		bezeichnung: 'Bewerbermanagement',
		risikostufe: 'normal',
		vorgaenge: ['sn', 'aw', 'bn', 'bt', 'bs'],
		...met('vertraulichkeit'),
		...met('integritaet'),
		...met('verfuegbarkeit'),
		...met('datenminimierung'),
		...met('nichtverkettung'),
		...met('transparenz'),
		transparenz_e2: 'teilweise',
		transparenz_luecken: ['bt'],
		intervenierbarkeit_e1: 'umgesetzt'
	};
	await page.goto('', { waitUntil: 'networkidle' });
	await page.evaluate(
		(record) =>
			localStorage.setItem('daily.records.v1', JSON.stringify({ records: [record], events: [] })),
		{
			id: 'sdm-1',
			toolSlug: 'sdm-wuerfel',
			definitionVersion: 1,
			state: null,
			title: data.bezeichnung,
			data,
			version: 1,
			createdAt: at,
			updatedAt: at,
			archivedAt: null
		}
	);
	await page.goto('werkzeuge/sdm-wuerfel/eintraege/?eintrag=sdm-1', { waitUntil: 'networkidle' });

	await expect(page.locator('.verdict .headline')).toHaveText('Lücken im SDM-Würfel.');
	const cube = page.getByRole('region', { name: 'SDM-Würfel', exact: true });
	// 5 of 9 operations apply: 105 cells, 1 gap (Bt on level 2), 4 partly, 10 open
	await expect(cube.locator('.figure strong')).toHaveText(['105', '1', '4', '10']);
	const picture = cube.getByRole('img');
	await expect(picture).toHaveAttribute('aria-label', /über alle Ziele\. Relevante Zellen: 105/);
	// a normal risk starts with the four phases; the front has 4 × 3 cells
	await expect(cube.locator('svg.cube rect.cell')).toHaveCount(12);
	await cube.getByRole('button', { name: '9 Vorgangsgruppen' }).click();
	await expect(cube.locator('svg.cube rect.cell')).toHaveCount(27);

	await cube.getByRole('button', { name: /Transparenz/ }).click();
	await expect(cube.getByRole('button', { name: /Transparenz/ })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect(cube.locator('.front')).toHaveText('Vorderseite: Vorgänge × Ebenen für Transparenz');
	await expect(cube.locator('svg.cube .chosen')).toHaveCount(2);

	const viewB = cube.getByRole('region', { name: /Sicht b/ });
	await expect(viewB.getByRole('row', { name: /Transparenz/ }).locator('.pill')).toHaveText([
		'Umgesetzt',
		'Teilweise',
		'Umgesetzt'
	]);
	await expect(viewB.getByRole('row', { name: /Intervenierbarkeit/ }).locator('.pill')).toHaveText([
		'Umgesetzt',
		'Offen',
		'Offen'
	]);
	const viewA = cube.getByRole('region', { name: /Sicht a/ });
	await expect(viewA.getByRole('row', { name: /Transparenz/ }).locator('td.s-luecke')).toHaveCount(
		1
	);
});

test('preview: a DPIA compares its risks with the linked TOM entry', async ({ page }) => {
	const at = '2026-11-05T09:00:00.000Z';
	const stored = (
		id: string,
		toolSlug: string,
		version: number,
		state: string | null,
		data: object
	) => ({
		id,
		toolSlug,
		definitionVersion: version,
		state,
		title: String(
			(data as Record<string, unknown>).system ?? (data as Record<string, unknown>).bezeichnung
		),
		data,
		version: 1,
		createdAt: at,
		updatedAt: at,
		archivedAt: null
	});
	const tom = stored('tom-1', 'tom-katalog', 2, null, {
		system: 'Bewerberportal',
		schutzbedarf: 'normal',
		status: 'teilweise',
		vertraulichkeit_massnahmen: ['mfa', 'ruhe']
	});
	const dsfa = stored('dsfa-2', 'dsfa', 3, 'entwurf', {
		bezeichnung: 'Bewerbervorauswahl',
		tom: 'tom-1',
		vertraulichkeit_gefaehrdungen: ['G 0.23'],
		vertraulichkeit_w: '3',
		vertraulichkeit_s: '4',
		integritaet_w: '2',
		integritaet_s: '2'
	});
	await page.goto('', { waitUntil: 'networkidle' });
	await page.evaluate(
		(records) => localStorage.setItem('daily.records.v1', JSON.stringify({ records, events: [] })),
		[tom, dsfa]
	);
	await page.goto('werkzeuge/dsfa/eintraege/?eintrag=dsfa-2', { waitUntil: 'networkidle' });

	const card = page.getByRole('region', { name: 'Abgleich mit dem TOM-Katalog' });
	await expect(card).toContainText('TOM-Katalog: Bewerberportal · Teilweise umgesetzt');
	await expect(card).toContainText('Ziele mit Lücke: 1');
	await expect(card.locator('.tom-need')).toContainText(
		'Schutzbedarf nach den Ausgangsrisiken dieser DSFA: hoch; im TOM-Katalog: normal.'
	);
	const row = (goal: string) => card.getByRole('row', { name: new RegExp(`^${goal}`) });
	await expect(row('Vertraulichkeit')).toContainText(
		'Mehr-Faktor-Authentisierung, Verschlüsselung gespeicherter Daten'
	);
	await expect(row('Vertraulichkeit').locator('.badge')).toHaveText('Maßnahmen umgesetzt');
	await expect(row('Integrität').locator('.badge')).toHaveText('Lücke');
	await expect(row('Transparenz').locator('.badge')).toHaveText('Offen');
});

test('preview: the risk classification marks the AI Act tier', async ({ page }) => {
	await page.goto('werkzeuge/risikoklassifizierung/pruefen/', { waitUntil: 'networkidle' });
	await answerAll(page, (name) =>
		['answer.s_ai', 'answer.h_employment', 'answer.x_profiling'].includes(name) ? 'yes' : 'no'
	);
	await page.getByRole('button', { name: 'Auswerten' }).click();
	await expect(page.getByRole('img', { name: 'Risikoklasse: Hochrisiko' })).toBeVisible();
	await expect(page.locator('.tier[data-active]')).toHaveAttribute('data-tier', 'hoch');
});

test('preview: a tool and its result show the law they are based on', async ({ page }) => {
	await page.goto('werkzeuge/risikoklassifizierung/', { waitUntil: 'networkidle' });
	const header = page.locator('.rechtsstand').first();
	await expect(header).toContainText('KI-VO in der Fassung vom 27.07.2026');
	await expect(header).toContainText('noch nicht juristisch geprüft');

	await page.goto('werkzeuge/hinweisgebersystem/eintraege/?neu=1&beispiel=1', {
		waitUntil: 'networkidle'
	});
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('.verdict .rechtsstand')).toContainText(
		'DSGVO in der Fassung vom 04.05.2016'
	);
});

test('preview: a transparency result speaks of a passed date in the past tense', async ({
	page
}) => {
	await page.clock.setFixedTime(new Date('2026-11-13T09:00:00Z'));
	await page.goto('werkzeuge/risikoklassifizierung/pruefen/', { waitUntil: 'networkidle' });
	await answerAll(page, (name) =>
		['answer.s_ai', 'answer.t_interaction'].includes(name) ? 'yes' : 'no'
	);
	await page.getByRole('button', { name: 'Auswerten' }).click();
	await expect(page.locator('.verdict')).toContainText('Diese gelten seit dem 2. August 2026');
});
