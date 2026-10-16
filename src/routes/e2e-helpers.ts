import type { Locator, Page } from '@playwright/test';

/**
 * picks an option in a Daily dropdown. Dropdowns take the stored value like
 * `selectOption`, or `{ label }`. Searchable record fields (an input) always
 * match by label: a plain string is typed as the label to filter by.
 */
export async function choose(control: Locator, option: string | { label: string }) {
	const page = control.page();
	if ((await control.evaluate((el) => el.tagName)) === 'INPUT') {
		const label = typeof option === 'string' ? option : option.label;
		await control.click();
		await control.pressSequentially(label);
		await page.getByRole('option', { name: label, exact: true }).click();
		return;
	}
	await control.click();
	const item =
		typeof option === 'string'
			? page.locator(`[role="option"][data-value="${option}"]`)
			: page.getByRole('option', { name: option.label, exact: true });
	await item.click();
}

/** types a stored date (`YYYY-MM-DD`) or datetime (`YYYY-MM-DDTHH:mm`) into a Daily date field */
export async function pickDate(page: Page, label: string, value: string) {
	const [date, time] = value.split('T');
	const [year, month, day] = date.split('-');
	const field = page.getByRole('group', { name: label, exact: true });
	await field.locator('[data-segment="day"]').click();
	await page.keyboard.type(`${day}${month}${year}${time ? time.replace(':', '') : ''}`);
}

/** switches a chip of a multiple-choice field */
export async function chip(scope: Page | Locator, name: string) {
	await scope.getByRole('button', { name, exact: true }).click();
}
