import { expect, test } from '@playwright/test';

/** Requires the local stack from compose.yaml; see auth.e2e.ts. */
const username = process.env.E2E_USER ?? 'test@dai-ly.de';
const password = process.env.E2E_PASSWORD ?? 'test-dev-password';

test('notes: today, Markdown with citations, a note from a provision, search', async ({ page }) => {
	const stamp = Date.now();
	await page.goto('/notizen');
	await page.locator('#username').fill(username);
	await page.locator('#password').fill(password);
	await page.locator('#kc-login').click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Notizen');

	await page.getByRole('button', { name: 'Heutige Notiz' }).click();
	await expect(page).toHaveURL(/notiz=/);
	await expect(page.getByRole('heading', { level: 2 })).toContainText('Notiz vom');
	const todayUrl = page.url();

	await page.getByRole('button', { name: 'Bearbeiten' }).click();
	await page
		.locator('.editor textarea')
		.fill(
			`## Termin ${stamp}\n\n- **Rechtsgrundlage** nach Art. 6 Abs. 1 lit. f DSGVO prüfen\n- [EDPB](https://edpb.europa.eu)`
		);
	await page.getByRole('tab', { name: 'Vorschau' }).click();
	await expect(page.locator('.preview a.norm')).toHaveText('Art. 6 Abs. 1 lit. f DSGVO');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.getByRole('status')).toHaveText('Gespeichert.');
	await expect(page.locator('.note h3')).toHaveText(`Termin ${stamp}`);
	await expect(page.locator('.note a.norm')).toHaveAttribute('href', '/normen/dsgvo/art-6');

	// The same button opens the same note again.
	await page.getByRole('link', { name: 'Alle Notizen' }).click();
	await page.getByRole('button', { name: 'Heutige Notiz' }).click();
	await expect(page).toHaveURL(todayUrl);

	await page.goto('/normen/bdsg/p-26');
	await page.getByRole('link', { name: 'Notiz zu dieser Vorschrift' }).click();
	await expect(page.locator('.editor input[type="text"]').first()).toHaveValue(/^§ 26 BDSG – /);
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('.note a.norm')).toHaveText('§ 26 BDSG');

	await page.getByRole('link', { name: 'Alle Notizen' }).click();
	await page.getByPlaceholder('Notizen durchsuchen').fill(`Termin ${stamp}`);
	await expect(page.locator('.notes li')).toHaveCount(1);
});
