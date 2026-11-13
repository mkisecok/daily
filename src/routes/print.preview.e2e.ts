import { expect, test, type Page } from '@playwright/test';
import { allFields } from '../lib/records/validate.js';
import { text } from '../lib/tools/i18n.js';
import { getRecordTool, tools } from '../lib/tools/registry.js';
import { choose, pickDate } from './e2e-helpers.js';

/**
 * every tool prints as a document: the frame is there, nothing to click is
 * visible and nothing is wider than the A4 text area. Utilities get their
 * documents in a later step of the print plan; until then they are listed
 * here, and the list is the progress bar.
 */
const PENDING = new Set(['repo-check', 'guardrail-test', 'pseudonymisierer']);

/** the text width of A4 with 18 mm margins, in CSS pixels */
const A4_TEXT = Math.floor(((210 - 36) / 25.4) * 96);

/**
 * answers the questions one at a time with "no" where it can, else with the
 * first choice: an answer can hide the questions after it
 */
async function answerEverything(page: Page) {
	for (let step = 0; step < 200; step++) {
		const next = await page.locator('form fieldset.row').evaluateAll((rows) => {
			const row = rows.find((r) => !r.querySelector('input:checked'));
			if (!row) return null;
			const inputs = [...row.querySelectorAll('input')];
			const pick = inputs.find((input) => input.value === 'no') ?? inputs[0];
			return { name: pick.name, value: pick.value };
		});
		if (!next) return;
		await page.locator(`input[name="${next.name}"][value="${next.value}"]`).check({ force: true });
	}
}

/** fills every required field of a new entry that is still empty */
async function fillRequired(page: Page, slug: string) {
	const { definition } = getRecordTool(slug)!;
	for (const field of allFields(definition).filter((f) => f.required)) {
		const control = page.locator(`#field-${field.id}`);
		if (field.type === 'text' || field.type === 'textarea') {
			if ((await control.inputValue()) === '') await control.fill('Druckprobe');
		} else if (field.type === 'select') {
			await choose(control, field.options[0].value);
		} else if (field.type === 'date' || field.type === 'datetime') {
			const value = field.type === 'date' ? '2026-11-13' : '2026-11-13T09:00';
			await pickDate(page, text(field.label), value);
		} else if (field.type === 'reference') {
			await choose(control, { label: 'Druckprobe' });
		}
	}
}

async function produce(page: Page, slug: string) {
	const record = getRecordTool(slug);
	if (!record) {
		await page.goto(`werkzeuge/${slug}/pruefen/`, { waitUntil: 'networkidle' });
		await answerEverything(page);
		await page.getByRole('button', { name: 'Auswerten' }).click();
		return;
	}
	// a field that links another tool's entry needs one to link
	for (const field of allFields(record.definition)) {
		if (field.type === 'reference' && field.required) await produce(page, field.tool);
	}
	const example = record.definition.example ? '&beispiel=1' : '';
	await page.goto(`werkzeuge/${slug}/eintraege/?neu=1${example}`, { waitUntil: 'networkidle' });
	await fillRequired(page, slug);
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);
}

for (const tool of tools.filter((t) => t.status !== 'planned' && !PENDING.has(t.slug))) {
	test(`print: ${tool.slug} prints as a document`, async ({ page }) => {
		await page.setViewportSize({ width: A4_TEXT, height: 1000 });
		await produce(page, tool.slug);
		await page.emulateMedia({ media: 'print' });

		const frame = page.locator('[data-print-frame]');
		await expect(frame).toBeVisible();
		await expect(frame.locator('h1')).not.toBeEmpty();

		const interactive = page.locator(
			'button:visible, input:visible, select:visible, textarea:visible, nav:visible, .page-header:visible'
		);
		expect(await interactive.count(), 'controls on paper').toBe(0);

		// a part set on its own named page (the DSFA dashboard prints landscape) is measured there
		const tooWide = await page.evaluate((limit) => {
			const onOwnPage = (el: Element | null): boolean =>
				!!el && (getComputedStyle(el).page !== 'auto' || onOwnPage(el.parentElement));
			return [...document.querySelectorAll('main *')]
				.filter((el) => el.getBoundingClientRect().right > limit + 1 && !onOwnPage(el))
				.map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`)
				.slice(0, 5);
		}, A4_TEXT);
		expect(tooWide, 'wider than the A4 text area').toEqual([]);
	});
}

test('print: the pending list holds only tools that exist', () => {
	const slugs = new Set(tools.map((t) => t.slug));
	expect([...PENDING].filter((slug) => !slugs.has(slug))).toEqual([]);
});
