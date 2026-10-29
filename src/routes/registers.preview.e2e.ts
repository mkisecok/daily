import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { choose } from './e2e-helpers.js';

type Register = {
	slug: string;
	/** fills the required fields; `title` goes into the title field */
	fill: (page: Page, title: string) => Promise<void>;
	/** label of the title field, used to rename the entry */
	titleLabel: string;
};

const registers: Register[] = [
	{
		slug: 'tom-katalog',
		titleLabel: 'System oder Umgebung',
		fill: async (page, title) => {
			await page.getByLabel('System oder Umgebung').fill(title);
			await choose(page.locator('#field-schutzbedarf'), 'hoch');
			await choose(page.locator('#field-status'), 'entwurf');
		}
	},
	{
		slug: 'loeschkonzept',
		titleLabel: 'Datenart oder Dokumentenklasse',
		fill: async (page, title) => {
			await page.getByLabel('Datenart oder Dokumentenklasse').fill(title);
			await choose(page.locator('#field-grundlage'), 'bewerbung');
			await page.getByLabel('Löschregel').fill('Sechs Monate nach Absage löschen.');
			await choose(page.locator('#field-status'), 'entwurf');
		}
	},
	{
		slug: 'ki-kompetenz',
		titleLabel: 'Rolle oder Personengruppe',
		fill: async (page, title) => {
			await page.getByLabel('Rolle oder Personengruppe').fill(title);
			await choose(page.locator('#field-nutzung'), 'anwendung');
			await choose(page.locator('#field-status'), 'geplant');
		}
	},
	{
		slug: 'pruefkatalog',
		titleLabel: 'Prüfthema',
		fill: async (page, title) => {
			await page.getByLabel('Prüfthema').fill(title);
		}
	},
	{
		slug: 'grundrechte-folgenabschaetzung',
		titleLabel: 'Bezeichnung',
		fill: async (page, title) => {
			await page.getByLabel('Bezeichnung').fill(title);
		}
	}
];

for (const register of registers) {
	test(`${register.slug}: create, rename, export CSV and print`, async ({ page }) => {
		const title = `E2E ${register.slug}`;
		const renamed = `${title} (geändert)`;

		await page.goto(`werkzeuge/${register.slug}/eintraege/?neu=1`);
		await register.fill(page, title);
		await page.getByRole('button', { name: 'Speichern' }).click();
		await expect(page).toHaveURL(/eintrag=/);
		await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible();

		await page.getByRole('button', { name: 'Bearbeiten' }).click();
		await page.getByLabel(register.titleLabel, { exact: true }).fill(renamed);
		await page.getByRole('button', { name: 'Speichern' }).click();
		await expect(page.getByRole('heading', { level: 2, name: renamed })).toBeVisible();

		await page.goto(`werkzeuge/${register.slug}/eintraege/`);
		await expect(page.getByRole('link', { name: renamed })).toBeVisible();

		const download = page.waitForEvent('download');
		await page.getByRole('button', { name: 'CSV exportieren' }).click();
		const file = await download;
		expect(file.suggestedFilename()).toMatch(
			new RegExp(`^${register.slug}-\\d{4}-\\d{2}-\\d{2}\\.csv$`)
		);
		const csv = await readFile((await file.path())!, 'utf8');
		expect(csv.startsWith('﻿')).toBe(true);
		expect(csv).toContain(renamed);

		await page.emulateMedia({ media: 'print' });
		const printed = page.locator('.print-register');
		await expect(printed).toBeVisible();
		await expect(printed).toContainText(renamed);
	});
}
