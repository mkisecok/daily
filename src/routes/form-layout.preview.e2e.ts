import { expect, test, type Page } from '@playwright/test';

const box = async (page: Page, selector: string) => {
	const b = await page.locator(selector).first().boundingBox();
	if (!b) throw new Error(`no box for ${selector}`);
	return b;
};

test('preview: controls from Bits UI stay under their label', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/auditbericht/eintraege/?neu=1', { waitUntil: 'networkidle' });
	const field = '.field[data-type="reference"]';
	const label = await box(page, `${field} .label-row`);
	const control = await box(page, `${field} .daily-control`);
	expect(control.x).toBe(label.x);
	expect(control.y).toBeGreaterThan(label.y + label.height);
});

test('preview: fields side by side start on one line and are equally tall', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/aufsichtsanfrage/eintraege/?neu=1', { waitUntil: 'networkidle' });
	const rows = await page.locator('#sec-vorgang .cell').evaluateAll((all) => {
		const control = (c: Element) =>
			c.querySelector('input:not([type=radio]), textarea, .daily-control')!.getBoundingClientRect();
		const byRow = new Map<number, { top: number; height: number; type: string }[]>();
		for (const c of all) {
			const t = Math.round(c.getBoundingClientRect().top);
			const r = control(c);
			byRow.set(t, [
				...(byRow.get(t) ?? []),
				{
					top: Math.round(r.top * 10) / 10,
					height: Math.round(r.height * 10) / 10,
					type: c.querySelector('.field')!.getAttribute('data-type')!
				}
			]);
		}
		return [...byRow.values()].filter((r) => r.length === 2);
	});
	// the section pairs text, select and date fields
	expect(rows.flat().map((c) => c.type)).toEqual(
		expect.arrayContaining(['date', 'text', 'select'])
	);
	for (const [left, right] of rows) {
		expect(left.top).toBe(right.top);
		expect(left.height).toBe(right.height);
	}
});

test('preview: a pair ending a two-column section loses both hairlines', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('werkzeuge/bewerbungsverfahren/eintraege/?neu=1', { waitUntil: 'networkidle' });
	const borders = await page
		.locator('#sec-abschluss .cell')
		.evaluateAll((all) => all.map((c) => getComputedStyle(c).borderBottomWidth));
	expect(borders).toEqual(['0px', '0px']);
});
