import { expect, test } from '@playwright/test';

test('preview: checklist points take ja/nein/entfällt, a note and a due date that becomes a deadline', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/standortwechsel/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.getByLabel('Bezeichnung').fill('Umzug Köln → Berlin');
	await page
		.locator('#sec-vorhaben')
		.getByRole('button', { name: 'Papierakten und Archiv' })
		.click();

	// the server room is not part of this move: folded, and marked so in the index
	await expect(page.locator('#sec-serverraum')).toContainText('Entfällt für den gewählten Umfang.');
	await expect(page.locator('#sec-serverraum .check')).toHaveCount(0);
	const index = page.getByRole('navigation', { name: 'Abschnitte' });
	await expect(index.getByRole('button', { name: /Serverraum/ }).first()).toContainText('–');

	const post = page.locator('.check', { hasText: 'Nachsendeauftrag' });
	await post.getByText('Nein', { exact: true }).click();
	// a "Nein" opens the note and due date by itself
	await expect(post.getByRole('button', { name: 'Notiz, Frist' })).toHaveAttribute(
		'aria-expanded',
		'true'
	);
	await post.getByLabel('Notiz').fill('Antrag bei der Post stellen');
	await post
		.getByRole('group', { name: 'Frist', exact: true })
		.locator('[data-segment="day"]')
		.click();
	await page.keyboard.type('20122026');

	const leftovers = page.locator('.check', { hasText: 'Begehung nach dem Auszug' });
	await leftovers.getByText('Entfällt').click();
	await expect(leftovers.locator('input[value="entfaellt"]')).toBeChecked();

	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	const view = page.locator('.record-view');
	await expect(view).toContainText('Nein · Frist 20.12.2026 · Antrag bei der Post stellen');
	await expect(view).toContainText('Entfällt');
	await expect(page.locator('section.deadlines')).toContainText(
		'Lücke schließen: Nachsendeauftrag'
	);
	await expect(view).not.toContainText('– Notiz');
});

test('preview: a clause the law always requires offers no "Entfällt"', async ({ page }) => {
	await page.goto('werkzeuge/avv-pruefung/eintraege/?neu=1', { waitUntil: 'networkidle' });
	const clause = page.locator('.check').first();
	await expect(clause.getByRole('radio')).toHaveCount(2);
	await expect(clause.getByText('Entfällt')).toHaveCount(0);
});
