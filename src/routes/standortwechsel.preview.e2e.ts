import { expect, test } from '@playwright/test';

const at = '2026-11-10T09:00:00.000Z';
const data = {
	bezeichnung: 'Umzug Köln → Berlin',
	alter_standort: 'Köln',
	neuer_standort: 'Berlin',
	umzugstermin: '2026-12-05',
	umfang: ['arbeitsplaetze', 'serverraum'],
	bundesland_wechsel: true,
	p_inventar: true,
	p_dienstleister: true,
	s_sicherung: true,
	s_zutritt: false,
	t_verschluesselt: true,
	r_transport_w: '3',
	r_transport_s: '3',
	r_transport_massnahmen: 'Verschlüsselung, Begleitung',
	r_transport_rw: '1',
	r_transport_rs: '3',
	r_umgebung_w: '3',
	r_umgebung_s: '4'
};

test('preview: an office move shows its gaps, checklist and risk matrices', async ({ page }) => {
	await page.goto('', { waitUntil: 'networkidle' });
	await page.evaluate(
		(record) =>
			localStorage.setItem('daily.records.v1', JSON.stringify({ records: [record], events: [] })),
		{
			id: 'sw-1',
			toolSlug: 'standortwechsel',
			definitionVersion: 1,
			state: 'planung',
			title: data.bezeichnung,
			data,
			version: 1,
			createdAt: at,
			updatedAt: at,
			archivedAt: null
		}
	);
	await page.goto('werkzeuge/standortwechsel/eintraege/?eintrag=sw-1', {
		waitUntil: 'networkidle'
	});

	await expect(page.locator('.verdict .headline')).toHaveText(
		'Hohes Restrisiko beim Standortwechsel.'
	);
	await expect(page.getByRole('img', { name: 'Einstufung: Handlungsbedarf' })).toBeVisible();
	const reasons = page.locator('.verdict .reasons li');
	await expect(reasons.first()).toContainText('Schäden im neuen Serverraum');
	await expect(reasons.nth(1)).toContainText('Serverraum: Neuer Serverraum');
	await expect(page.locator('.verdict')).toContainText('§ 40 Abs. 2 BDSG');

	const move = page.getByRole('region', { name: 'Stand des Umzugs' });
	const row = (name: string) => move.locator('.progress tbody tr', { hasText: name });
	await expect(row('Serverraum').locator('td.num')).toHaveText(['1/6', '1', '4']);
	await expect(row('Rückbau am alten Standort').locator('td.num').first()).toHaveText('0/5');
	await expect(
		move.getByRole('img', { name: /^Vor Maßnahmen: 1 Verlust oder Diebstahl/ })
	).toBeVisible();
	await expect(move.locator('.risks tbody tr')).toHaveCount(6);
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
		await page.evaluate(() => document.documentElement.clientWidth)
	);
});
