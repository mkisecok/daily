import { expect, test, type Page } from '@playwright/test';

const at = '2026-11-20T08:00:00.000Z';
const stored = (
	id: string,
	toolSlug: string,
	title: string,
	data: object,
	state: string | null = null
) => ({
	id,
	toolSlug,
	definitionVersion: 1,
	state,
	title,
	data,
	version: 1,
	createdAt: at,
	updatedAt: at,
	archivedAt: null
});

/** a payroll activity with its processor, the system it runs on and a DPIA */
async function seed(page: Page) {
	const records = [
		stored('vvt-1', 'vvt', 'Lohnabrechnung', {
			bezeichnung: 'Lohnabrechnung',
			rolle: 'verantwortlicher',
			zwecke: 'Abrechnung von Lohn und Gehalt',
			betroffene: ['beschaeftigte'],
			datenkategorien: ['stammdaten', 'zahlung', 'art9'],
			herkunft: 'beides',
			quelle: 'Finanzamt',
			empfaenger: ['auftragsverarbeiter', 'behoerden'],
			drittland: true,
			drittland_details: 'USA',
			garantien: ['scc'],
			loeschfristen: '8 Jahre nach § 147 AO',
			status: 'aktiv'
		}),
		stored('avv-1', 'avv-pruefung', 'Lohnbüro Muster GmbH', {
			dienstleister: 'Lohnbüro Muster GmbH',
			vvt: 'vvt-1',
			leistung: 'Lohnabrechnung',
			sitz: 'eu',
			genehmigung: 'allgemein',
			unterauftragnehmer: 'Rechenzentrum Frankfurt',
			status: 'freigegeben'
		}),
		stored('tom-1', 'tom-katalog', 'Personalsystem', {
			system: 'Personalsystem',
			vvt: 'vvt-1',
			schutzbedarf: 'hoch',
			status: 'umgesetzt'
		}),
		stored(
			'dsfa-1',
			'dsfa',
			'Lohnabrechnung',
			{ bezeichnung: 'Lohnabrechnung', vvt: 'vvt-1' },
			'entwurf'
		)
	];
	await page.goto('', { waitUntil: 'networkidle' });
	await page.evaluate(
		(all) => localStorage.setItem('daily.records.v1', JSON.stringify({ records: all, events: [] })),
		records
	);
}

test('preview: a VVT entry draws its data flow from the entries that link to it', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await seed(page);
	await page.goto('werkzeuge/vvt/eintraege/?eintrag=vvt-1', { waitUntil: 'networkidle' });

	const flow = page.getByRole('region', { name: 'Datenfluss' });
	const plane = flow.getByRole('img', { name: /Datenfluss als Diagramm mit \d+ Stationen/ });
	await expect(plane).toBeVisible();
	const box = (name: string) => plane.locator('.box', { hasText: name });
	await expect(box('Speicherung')).toContainText('Personalsystem');
	await expect(box('Lohnbüro Muster GmbH')).toBeVisible();
	await expect(box('Rechenzentrum Frankfurt')).toBeVisible();
	await expect(box('Erhebung')).toHaveAttribute('data-tone', 'sensitive');
	await expect(plane.locator('.edge.transfer')).toHaveCount(1);
	await expect(flow.locator('.warnings')).toHaveCount(0);

	// the list carries the same stations
	await flow.getByRole('button', { name: 'Liste' }).click();
	await expect(plane).toBeHidden();
	await expect(flow.locator('.stages')).toContainText('Lohnbüro Muster GmbH');

	const [download] = await Promise.all([
		page.waitForEvent('download'),
		flow.getByRole('button', { name: 'Als SVG herunterladen' }).click()
	]);
	expect(download.suggestedFilename()).toBe('datenfluss-Lohnabrechnung.svg');
});

test('preview: a DSFA shows the data flow of its processing activity', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await seed(page);
	await page.goto('werkzeuge/dsfa/eintraege/?eintrag=dsfa-1', { waitUntil: 'networkidle' });
	const flow = page.getByRole('region', { name: 'Datenfluss' });
	await expect(flow.locator('.box', { hasText: 'Lohnbüro Muster GmbH' })).toBeVisible();
});

test('preview: on a phone the data flow starts as a list without overflowing', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await seed(page);
	await page.goto('werkzeuge/vvt/eintraege/?eintrag=vvt-1', { waitUntil: 'networkidle' });
	const flow = page.getByRole('region', { name: 'Datenfluss' });
	await expect(flow.locator('.stages')).toBeVisible();
	await expect(flow.getByRole('button', { name: 'Liste' })).toHaveAttribute('aria-pressed', 'true');
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test('preview: the printed register fills in the controller and lists what links to an entry', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await seed(page);
	await page.goto('organisation/', { waitUntil: 'networkidle' });
	await page.locator('#field-anschrift').fill('Musterstraße 1, 70173 Stuttgart');
	await page.locator('#field-dsb').fill('Dr. Petra Schmidt, dsb@beispiel.de');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('.notice')).toContainText('Gespeichert.');

	await page.goto('werkzeuge/vvt/eintraege/', { waitUntil: 'networkidle' });
	await page.emulateMedia({ media: 'print' });
	const register = page.locator('.vvt-print');
	await expect(register).toContainText('Musterstraße 1, 70173 Stuttgart');
	await expect(register).toContainText('Dr. Petra Schmidt, dsb@beispiel.de');
	await expect(register).toContainText(
		'Auftragsverarbeiter (AVV-Prüfung): Lohnbüro Muster GmbH (EU/EWR)'
	);
	await expect(register).toContainText('Systeme im TOM-Katalog: Personalsystem');
	await expect(register.locator('tr', { hasText: 'Datenschutz-Folgenabschätzung' })).toContainText(
		'Lohnabrechnung'
	);
});
