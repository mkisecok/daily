import { expect, test } from '@playwright/test';
import { choose, pickDate } from './e2e-helpers.js';

test('preview: a matter gets a running number, a next step and its advice memos', async ({
	page
}) => {
	await page.clock.setFixedTime(new Date('2026-11-13T09:00:00Z'));
	await page.goto('werkzeuge/vorgang/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await expect(page.locator('#field-nummer')).toHaveValue('2026-11-001');
	await page.locator('#field-bezeichnung').fill('Videoüberwachung Lager');
	await page.locator('#field-naechster_schritt').fill('Lageplan anfordern');
	await pickDate(page, 'Bis wann', '2026-11-16');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);
	const matter = page.url();

	// the next matter continues the count, also when started from the example
	await page.goto('werkzeuge/vorgang/eintraege/?neu=1&beispiel=1', { waitUntil: 'networkidle' });
	await expect(page.locator('#field-nummer')).toHaveValue('2026-11-002');

	await page.goto('werkzeuge/beratungsvermerk/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.locator('#field-betreff').fill('Speicherdauer der Aufnahmen');
	await pickDate(page, 'Datum', '2026-11-13');
	await choose(page.locator('#field-vorgang'), { label: 'Videoüberwachung Lager' });
	await page.locator('#field-frage').fill('30 Tage speichern?');
	await page.locator('#field-empfehlung').fill('72 Stunden; vor 30 Tagen gewarnt.');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await page.goto(matter, { waitUntil: 'networkidle' });
	await expect(page.locator('section.links')).toContainText('Speicherdauer der Aufnahmen');

	await page.goto('', { waitUntil: 'networkidle' });
	const today = page.getByRole('region', { name: 'Heute' });
	await expect(
		today.getByRole('region', { name: 'Überfällig und diese Woche fällig' })
	).toContainText('Lageplan anfordern');
	await expect(today.getByRole('region', { name: 'Offene Vorgänge' })).toContainText(
		'Videoüberwachung Lager'
	);
});
