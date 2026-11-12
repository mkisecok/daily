import { expect, test } from '@playwright/test';
import { answerAll } from './e2e-helpers.js';

test('preview: the risk classification stops at "not an AI system" and suggests the next tool', async ({
	page
}) => {
	await page.goto('werkzeuge/risikoklassifizierung/pruefen/', { waitUntil: 'networkidle' });
	const progress = page.locator('.form-bar .progress');
	const first = page.locator('fieldset.row').first();

	await first.getByText('Ja', { exact: true }).click();
	await first.getByText('Nein', { exact: true }).click();
	await expect(progress).toHaveText('1 von 1 beantwortet');
	await expect(page.locator('section.section[data-asked=false]')).toHaveCount(4);
	await expect(page.getByText('Entfällt nach den bisherigen Antworten.').first()).toBeVisible();

	await page.getByRole('button', { name: 'Auswerten' }).click();
	await expect(page.locator('.verdict .headline')).toHaveText('Kein KI-System.');
	const next = page.getByRole('region', { name: 'Nächster Schritt' });
	await expect(next.getByRole('link', { name: 'Neue Software einführen' })).toHaveAttribute(
		'href',
		/werkzeuge\/software-einfuehrung\/eintraege\/\?neu=1$/
	);
	// only the question that was asked is listed with the result
	await expect(page.locator('.answers li')).toHaveCount(1);
});

test('preview: a remembered answer returns when a part is asked again', async ({ page }) => {
	await page.goto('werkzeuge/risikoklassifizierung/pruefen/', { waitUntil: 'networkidle' });
	const first = page.locator('fieldset.row').first();
	await first.getByText('Ja', { exact: true }).click();
	const employment = page.locator('input[name="answer.h_employment"][value="yes"]');
	await employment.check({ force: true });
	// an Annex III area reveals the Art. 6(3) exception
	await expect(page.locator('input[name="answer.x_procedural"]').first()).toBeAttached();

	await first.getByText('Nein', { exact: true }).click();
	await expect(employment).toHaveCount(0);
	await first.getByText('Ja', { exact: true }).click();
	await expect(employment).toBeChecked();
});

test('preview: transparency asks only the part of the role and follow-ups after their question', async ({
	page
}) => {
	await page.goto('werkzeuge/transparenzpflichten/pruefen/', { waitUntil: 'networkidle' });
	await page.locator('input[name="answer.r_provider"][value="no"]').check({ force: true });
	await page.locator('input[name="answer.r_deployer"][value="yes"]').check({ force: true });
	await expect(page.locator('input[name="answer.a_interaction"]')).toHaveCount(0);
	await expect(page.locator('input[name="answer.r_existing"]')).toHaveCount(0);
	await expect(page.locator('input[name="answer.b_artistic"]')).toHaveCount(0);
	await page.locator('input[name="answer.b_deepfake"][value="yes"]').check({ force: true });
	await expect(page.locator('input[name="answer.b_artistic"]').first()).toBeAttached();

	await answerAll(page, () => 'no');
	await page.getByRole('button', { name: 'Auswerten' }).click();
	await expect(page.locator('.verdict .headline')).toHaveText('Transparenzpflichten bestehen.');
	await expect(
		page
			.getByRole('region', { name: 'Nächster Schritt' })
			.getByRole('link', { name: 'KI-Nutzungsrichtlinie' })
	).toBeVisible();
});
