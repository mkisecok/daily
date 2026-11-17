import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { choose, pickDate } from './e2e-helpers.js';

test('preview: a backup brings the entries and their links back into a cleared browser', async ({
	page
}) => {
	await page.goto('werkzeuge/vorgang/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.locator('#field-bezeichnung').fill('Videoüberwachung Lager');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);
	await page.goto('werkzeuge/beratungsvermerk/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.locator('#field-betreff').fill('Speicherdauer der Aufnahmen');
	await pickDate(page, 'Datum', '2026-11-13');
	await choose(page.locator('#field-vorgang'), { label: 'Videoüberwachung Lager' });
	await page.locator('#field-frage').fill('30 Tage speichern?');
	await page.locator('#field-empfehlung').fill('72 Stunden.');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await page.goto('organisation/', { waitUntil: 'networkidle' });
	const backup = page.getByRole('region', { name: 'Datensicherung' });
	await expect(backup).toContainText('noch keine Sicherung');
	const download = page.waitForEvent('download');
	await backup.getByRole('button', { name: 'Sicherung herunterladen' }).click();
	const file = await (await download).path();
	expect((await download).suggestedFilename()).toMatch(/^daily-\d{4}-\d{2}-\d{2}\.json$/);
	await expect(backup).toContainText('Letzte Sicherung aus diesem Browser');
	const content = JSON.parse(await readFile(file, 'utf8'));
	expect(content.format).toBe('daily-backup');

	// a cleared browser: nothing left
	await page.evaluate(() => localStorage.clear());
	await page.goto('werkzeuge/vorgang/eintraege/', { waitUntil: 'networkidle' });
	await expect(page.getByText('Videoüberwachung Lager')).toHaveCount(0);

	await page.goto('organisation/', { waitUntil: 'networkidle' });
	await backup.getByLabel('Sicherung einlesen').setInputFiles(file);
	await expect(backup).toContainText('In der Datei: 2 · neu: 2 · schon vorhanden: 0');
	await backup.getByRole('button', { name: 'Neue Einträge übernehmen' }).click();
	await expect(backup).toContainText('Übernommen: 2.');

	// read again, the same file adds nothing
	await backup.getByLabel('Sicherung einlesen').setInputFiles(file);
	await expect(backup).toContainText('schon vorhanden: 2');
	await expect(backup).toContainText('Alle Einträge der Datei sind schon vorhanden.');

	await page.goto('werkzeuge/vorgang/eintraege/', { waitUntil: 'networkidle' });
	await page
		.getByRole('link', { name: /Videoüberwachung Lager/ })
		.first()
		.click();
	await expect(page.locator('section.links')).toContainText('Speicherdauer der Aufnahmen');

	// a file from elsewhere is refused
	await page.goto('organisation/', { waitUntil: 'networkidle' });
	await backup.getByLabel('Sicherung einlesen').setInputFiles({
		name: 'liste.json',
		mimeType: 'application/json',
		buffer: Buffer.from('{"eintraege": []}')
	});
	await expect(backup).toContainText('Diese Datei ist keine Daily-Sicherung.');
});
