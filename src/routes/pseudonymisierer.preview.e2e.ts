import { expect, test } from '@playwright/test';

test('preview: the Pseudonymisierer replaces personal data and restores the reply', async ({
	page
}) => {
	await page.goto('werkzeuge/pseudonymisierer/', { waitUntil: 'networkidle' });
	await page
		.getByLabel('Text', { exact: true })
		.fill(
			'Patientin: Lena Müller, Müllerstraße 5\nE-Mail: lena.mueller@example.de\nDer Transport ist bezahlt.'
		);

	const output = page.getByRole('textbox', { name: 'Pseudonymisierter Text' });
	await expect(output).toHaveValue(
		'Patientin: «NAME_1», «ADDRESS_1»\nE-Mail: «EMAIL_1»\nDer Transport ist bezahlt.'
	);
	await expect(page.locator('.findings li')).toHaveCount(3);

	await page
		.getByLabel('Antwort der KI')
		.fill('Sehr geehrte «NAME_1», wir schreiben an [EMAIL 1] (siehe [Seite 3]). «NAME_7»');
	await expect(page.getByLabel('Antwort mit echten Werten')).toHaveValue(
		'Sehr geehrte Lena Müller, wir schreiben an lena.mueller@example.de (siehe [Seite 3]). «NAME_7»'
	);
	await expect(page.locator('.leftover')).toContainText('«NAME_7»');
	await expect(page.locator('.leftover')).not.toContainText('Seite');

	// switching a finding off sends it in the clear
	await page.locator('.marked .mark', { hasText: 'Müllerstraße 5' }).click();
	await expect(output).toHaveValue(
		'Patientin: «NAME_1», Müllerstraße 5\nE-Mail: «EMAIL_1»\nDer Transport ist bezahlt.'
	);
});

test('preview: the old Anonymisierer address forwards to the Pseudonymisierer', async ({
	page
}) => {
	await page.goto('werkzeuge/anonymisierer/');
	await expect(page).toHaveURL(/\/daily\/werkzeuge\/pseudonymisierer\/$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pseudonymisierer');
});
