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

/**
 * answers every question of a questionnaire, including the ones an answer
 * reveals, with the value `pick` gives for the field name (e.g. `answer.s_ai`).
 * The first open row is looked up again after every answer, because an answer
 * can hide rows further down. No `force`: after a client-side navigation the
 * page is still scrolling smoothly to the top, and only Playwright's stability
 * check keeps the click from landing beside the moving radio.
 */
export async function answerAll(page: Page, pick: (name: string) => string) {
	const firstOpen = () =>
		page.locator('form fieldset.row').evaluateAll(
			(rows) =>
				rows
					.find((row) => !row.querySelector('input:checked'))
					?.querySelector('input')
					?.getAttribute('name') ?? null
		);
	for (let name = await firstOpen(); name; name = await firstOpen()) {
		await page.locator(`input[name="${name}"][value="${pick(name)}"]`).check();
	}
}

/**
 * a PDF in Helvetica, a line or several lines on each page, built by hand
 * so a test needs no fixture file
 */
export function pdf(pages: (string | string[])[]): Buffer {
	const objects: string[] = [];
	const kids = pages.map((_, i) => `${4 + i * 2} 0 R`).join(' ');
	objects.push('<< /Type /Catalog /Pages 2 0 R >>');
	objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
	objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
	for (const [i, line] of pages.entries()) {
		const lines = typeof line === 'string' ? [line] : line;
		const stream = `BT /F1 12 Tf 16 TL 72 720 Td ${lines.map((text) => `(${text}) Tj T*`).join(' ')} ET`;
		objects.push(
			`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`
		);
		objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
	}
	let out = '%PDF-1.4\n';
	const offsets: number[] = [];
	for (const [i, body] of objects.entries()) {
		offsets.push(out.length);
		out += `${i + 1} 0 obj\n${body}\nendobj\n`;
	}
	const xref = out.length;
	out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	for (const offset of offsets) out += `${String(offset).padStart(10, '0')} 00000 n \n`;
	out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
	return Buffer.from(out, 'latin1');
}

/** draws a box on a PDF page picture, between two points given in the page's points */
export async function boxOnPage(
	page: Page,
	sheet: Locator,
	[x0, y0]: [number, number],
	[x1, y1]: [number, number],
	size = { width: 612, height: 792 }
) {
	// the box's middle to the middle of the window, clear of the fixed header
	const before = (await sheet.boundingBox())!;
	const middle = before.y + ((y0 + y1) / 2 / size.height) * before.height;
	await page.evaluate((dy) => window.scrollBy(0, dy), middle - page.viewportSize()!.height / 2);
	const frame = (await sheet.boundingBox())!;
	const at = (x: number, y: number) => ({
		x: frame.x + (x / size.width) * frame.width,
		y: frame.y + (y / size.height) * frame.height
	});
	const from = at(x0, y0);
	const to = at(x1, y1);
	await page.mouse.move(from.x, from.y);
	await page.mouse.down();
	await page.mouse.move(to.x, to.y, { steps: 5 });
	await page.mouse.up();
}
