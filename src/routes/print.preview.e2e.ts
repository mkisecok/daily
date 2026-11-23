import { expect, test, type Page } from '@playwright/test';
import { allFields } from '../lib/records/validate.js';
import { text } from '../lib/tools/i18n.js';
import { getLesson, getRecordTool, tools } from '../lib/tools/registry.js';
import { choose, pickDate } from './e2e-helpers.js';

/**
 * every tool prints as a document: the frame is there, nothing to click is
 * visible, nothing is wider than the A4 text area, and a Prüfbericht or
 * Vorgangsblatt stays short. Utilities get their
 * documents in a later step of the print plan; until then they are listed
 * here, and the list is the progress bar.
 */
const PENDING = new Set(['repo-check', 'guardrail-test', 'pseudonymisierer']);

/**
 * at most this many pages for a Prüfbericht answered "no" throughout; an
 * AIMS gap analysis answered so lists 19 gaps with 20 remedies
 */
const REPORT_PAGES: Record<string, number> = { 'aims-gap': 4 };

/**
 * at most this many pages for a Vorgangsblatt of the example or of the
 * required fields; the DSFA adds its landscape risk picture after the
 * report, the SDM cube its views
 */
const ENTRY_PAGES: Record<string, number> = {
	// the EDPB template's safeguards, decision and approval, then the landscape risk picture
	dsfa: 6,
	// the example's notes on seven goals, what to fix first and the cube's two views
	'sdm-wuerfel': 6,
	// 23 checkpoints, and a Rechtsstand line naming five laws
	bestandsaufnahme: 4
};

/** at most this many pages for the handout of a training module */
const HANDOUT_PAGES: Record<string, number> = {
	// fifteen slides with the fundamental right and the deletion concept, and five questions
	'schulung-grundlagen': 5
};
const HANDOUT_DEFAULT = 4;

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
			// the entry saved just before, whatever its example calls it
			await control.click();
			await page.getByRole('option').first().click();
		}
	}
}

async function produce(page: Page, slug: string) {
	// a lesson prints its handout from its own page
	if (getLesson(slug)) {
		await page.goto(`werkzeuge/${slug}/`, { waitUntil: 'networkidle' });
		return;
	}
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

		const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true });
		const pages = pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;
		if (tool.shape === 'lesson') {
			// the slides, then the review questions on a page of their own
			expect(pages, 'pages of the handout').toBeLessThanOrEqual(
				HANDOUT_PAGES[tool.slug] ?? HANDOUT_DEFAULT
			);
		} else if (tool.shape === 'questionnaire') {
			expect(pages, 'pages of the Prüfbericht').toBeLessThanOrEqual(REPORT_PAGES[tool.slug] ?? 2);
		} else {
			expect(pages, 'pages of the Vorgangsblatt').toBeLessThanOrEqual(ENTRY_PAGES[tool.slug] ?? 3);
		}
	});
}

test('print: the pending list holds only tools that exist', () => {
	const slugs = new Set(tools.map((t) => t.slug));
	expect([...PENDING].filter((slug) => !slugs.has(slug))).toEqual([]);
});

test('print: a register prints as a Registerauszug with one sheet per entry', async ({ page }) => {
	await page.setViewportSize({ width: A4_TEXT, height: 1000 });
	for (const name of ['Zugriffsrechte', 'Zutrittskontrolle']) {
		await page.goto('werkzeuge/pruefkatalog/eintraege/?neu=1', { waitUntil: 'networkidle' });
		await page.locator('#field-titel').fill(name);
		await page.getByRole('button', { name: 'Speichern' }).click();
		await expect(page).toHaveURL(/eintrag=/);
	}
	await page.goto('werkzeuge/pruefkatalog/eintraege/', { waitUntil: 'networkidle' });
	await page.emulateMedia({ media: 'print' });

	const register = page.locator('.print-register');
	await expect(register.locator('[data-print-frame]')).toContainText('Registerauszug');
	await expect(register.locator('.overview tbody tr')).toHaveCount(2);
	await expect(register.locator('.sheet')).toHaveCount(2);
	await expect(register.locator('.sheet h2.heading').first()).toContainText('1.');
	const interactive = page.locator(
		'button:visible, input:visible, select:visible, textarea:visible, nav:visible, .page-header:visible'
	);
	expect(await interactive.count(), 'controls on paper').toBe(0);
});

test('print: the VVT prints as the record under Art. 30 DSGVO', async ({ page }) => {
	await page.setViewportSize({ width: A4_TEXT, height: 1000 });
	await page.goto('werkzeuge/vvt/eintraege/?neu=1&beispiel=1', { waitUntil: 'networkidle' });
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);
	await page.goto('werkzeuge/vvt/eintraege/', { waitUntil: 'networkidle' });
	await page.emulateMedia({ media: 'print' });

	const record = page.locator('.vvt-print');
	await expect(record.locator('[data-print-frame]')).toContainText(
		'Verzeichnis nach Art. 30 DSGVO'
	);
	await expect(record).toContainText('Name und Kontaktdaten des Verantwortlichen');
	const letters = await record.locator('.processing .letter').allTextContents();
	expect(letters.filter(Boolean)).toEqual(['b)', 'c)', 'c)', 'd)', 'e)', 'f)', 'g)']);
	await expect(page.locator('.print-register')).toHaveCount(0);
});

/** the frame is there and nothing to click is visible */
async function printsAsDocument(page: Page, kind: string) {
	await page.emulateMedia({ media: 'print' });
	await expect(page.locator('[data-print-frame]')).toContainText(kind);
	const interactive = page.locator(
		'button:visible, input:visible, select:visible, textarea:visible, nav:visible, .page-header:visible, summary:visible'
	);
	expect(await interactive.count(), 'controls on paper').toBe(0);
}

test('print: deadlines print as a list with dates', async ({ page }) => {
	await page.setViewportSize({ width: A4_TEXT, height: 1000 });
	await page.goto('werkzeuge/hinweisgebersystem/eintraege/?neu=1&beispiel=1', {
		waitUntil: 'networkidle'
	});
	await pickDate(page, 'Start geplant am', '2027-02-01');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);
	await page.goto('fristen', { waitUntil: 'networkidle' });
	await expect(page.getByRole('button', { name: 'Drucken' })).toBeVisible();
	await printsAsDocument(page, 'Fristenliste');
	const table = page.locator('.print-body table');
	await expect(table).toContainText('01.02.2027');
	await expect(table).toContainText('Hinweisgebersystem einrichten');
	await expect(page.locator('.print-body')).not.toContainText(/\b(in|vor) \d+ (Tag|Woche|Monat)/);

	// the report lists the same deadline, also with its date only
	await page.emulateMedia({ media: 'screen' });
	await page.goto('berichte', { waitUntil: 'networkidle' });
	await page.emulateMedia({ media: 'print' });
	const report = page.locator('.report');
	await expect(report.locator('.print-table')).toContainText('01.02.2027');
	expect(
		await report
			.locator(':visible')
			.evaluateAll((els) =>
				els.some(
					(el) =>
						/\b(in|vor) \d+ (Tag|Woche|Monat)/.test(el.textContent ?? '') &&
						el.children.length === 0
				)
			)
	).toBe(false);
});

test('print: a note, a law article and a report print in the frame', async ({ page }) => {
	await page.setViewportSize({ width: A4_TEXT, height: 1000 });
	await page.goto('notizen?neu=1', { waitUntil: 'networkidle' });
	await page.getByLabel('Titel').fill('Druck-Notiz');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('article.note')).toBeVisible();
	await printsAsDocument(page, 'Notiz');
	await expect(page.locator('[data-print-frame] h1')).toHaveText('Druck-Notiz');

	await page.emulateMedia({ media: 'screen' });
	await page.goto('normen/dsgvo/art-33', { waitUntil: 'networkidle' });
	await expect(page.getByRole('button', { name: 'Drucken' })).toBeVisible();
	await printsAsDocument(page, 'Normtext');
	await expect(page.locator('[data-print-frame]')).toContainText('Abgerufen am');

	await page.emulateMedia({ media: 'screen' });
	await page.goto('berichte', { waitUntil: 'networkidle' });
	await printsAsDocument(page, 'Bericht');
	await expect(page.locator('.cover')).toBeHidden();
});

test('print: a data breach prints as a notification under Art. 33 DSGVO', async ({ page }) => {
	await page.setViewportSize({ width: A4_TEXT, height: 1000 });
	// line b names the DPO from the organisation's details
	await page.goto('organisation/', { waitUntil: 'networkidle' });
	await page.locator('#field-dsb').fill('Dr. Petra Schmidt\ndsb@beispiel.de');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('.notice')).toContainText('Gespeichert.');
	await page.goto('werkzeuge/datenpanne/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.locator('#field-bezeichnung').fill('Fehlversand Gehaltsabrechnung');
	await pickDate(page, 'Kenntnis am', '2026-11-10T08:00');
	await page.locator('#field-beschreibung').fill('Abrechnung an falsche E-Mail-Adresse geschickt.');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);
	await page.emulateMedia({ media: 'print' });

	const notice = page.locator('.print-parts');
	await expect(page.locator('[data-print-frame]')).toContainText('Meldung nach Art. 33 DSGVO');
	await expect(notice).toContainText('72 Stunden enden');
	await expect(notice).toContainText('13.11.2026 08:00');
	const letters = (await notice.locator('.letter').allTextContents()).filter((l) => l.trim());
	expect(letters).toEqual(['a)', 'a)', 'a)', 'b)', 'c)', 'c)', 'd)']);
	await expect(notice).toContainText('Dr. Petra Schmidt, dsb@beispiel.de');
	await expect(notice).toContainText('fehlt');
	// a letter to the supervisory authority carries none of Daily's internal lines
	const head = page.locator('[data-print-frame]');
	await expect(head).toContainText('Betreff');
	await expect(head).toContainText('Fehlversand Gehaltsabrechnung');
	for (const internal of ['Daily', 'Werkzeug', 'Juristische Prüfung', 'Keine Rechtsberatung']) {
		await expect(head).not.toContainText(internal);
	}
});

test('print: an AI incident prints as a report under Art. 73 KI-VO', async ({ page }) => {
	await page.setViewportSize({ width: A4_TEXT, height: 1000 });
	await page.goto('werkzeuge/vorfallmeldung/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await fillRequired(page, 'vorfallmeldung');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);
	await page.emulateMedia({ media: 'print' });

	await expect(page.locator('[data-print-frame]')).toContainText('Meldung nach Art. 73 KI-VO');
	const report = page.locator('.print-parts');
	await expect(report).toContainText('15 Tage (Art. 73 Abs. 2)');
	await expect(report).toContainText('Untersuchung und Korrektur (Art. 73 Abs. 6)');
	const head = page.locator('[data-print-frame]');
	await expect(head).toContainText('Betreff');
	for (const internal of ['Daily', 'Werkzeug', 'Juristische Prüfung', 'Keine Rechtsberatung']) {
		await expect(head).not.toContainText(internal);
	}
});

test('print: a VVT entry prints its privacy notice under Art. 13 DSGVO', async ({ page }) => {
	await page.setViewportSize({ width: A4_TEXT, height: 1000 });
	await page.goto('organisation/', { waitUntil: 'networkidle' });
	await page.locator('#field-anschrift').fill('Musterstraße 1, 70173 Stuttgart');
	await page.locator('#field-dsb').fill('Dr. Petra Schmidt, dsb@beispiel.de');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page.locator('.notice')).toContainText('Gespeichert.');

	await page.goto('werkzeuge/vvt/eintraege/?neu=1&beispiel=1', { waitUntil: 'networkidle' });
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);
	// the button prints the notice, and the entry sheet comes back after printing
	await page.evaluate(() => (window.print = () => {}));
	await page.getByRole('button', { name: 'Datenschutzhinweise drucken' }).click();
	const title = page.locator('[data-print-frame] h1');
	await expect(title).toHaveText('Datenschutzhinweise nach Art. 13 DSGVO');
	await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
	await expect(title).not.toHaveText('Datenschutzhinweise nach Art. 13 DSGVO');

	await page.goto(`${page.url()}&druck=hinweise`, { waitUntil: 'networkidle' });
	await page.emulateMedia({ media: 'print' });
	const head = page.locator('[data-print-frame]');
	await expect(head.locator('h1')).toHaveText('Datenschutzhinweise nach Art. 13 DSGVO');
	for (const internal of ['Daily', 'Werkzeug', 'Juristische Prüfung', 'Keine Rechtsberatung']) {
		await expect(head).not.toContainText(internal);
	}
	const notice = page.locator('.print-parts');
	await expect(notice.locator('h2')).toHaveText([
		'Angaben nach Art. 13 Abs. 1 DSGVO',
		'Angaben nach Art. 13 Abs. 2 DSGVO'
	]);
	await expect(notice).toContainText('Musterstraße 1, 70173 Stuttgart');
	await expect(notice).toContainText('Dr. Petra Schmidt, dsb@beispiel.de');
	await expect(notice).toContainText('Art. 77 DSGVO');
	await expect(notice.locator('.signature')).toHaveCount(0);
	// the notice takes the place of the entry sheet, which comes back for "Drucken"
	await expect(page.locator('.print-body')).toHaveCount(1);
});

test('print: an answered access request prints as the reply under Art. 15 DSGVO', async ({
	page
}) => {
	await page.setViewportSize({ width: A4_TEXT, height: 1000 });
	await page.goto('werkzeuge/betroffenenanfrage/eintraege/?neu=1&beispiel=1', {
		waitUntil: 'networkidle'
	});
	await expect(page.locator('#sec-auskunft')).toContainText('Inhalt der Auskunft');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);
	await page.emulateMedia({ media: 'print' });

	const head = page.locator('[data-print-frame]');
	await expect(head.locator('h1')).toHaveText('Auskunft nach Art. 15 DSGVO');
	await expect(head).toContainText('Ihr Antrag vom');
	// a letter to the data subject carries none of Daily's internal lines
	for (const internal of ['Daily', 'Werkzeug', 'Juristische Prüfung', 'Keine Rechtsberatung']) {
		await expect(head).not.toContainText(internal);
	}
	const reply = page.locator('.print-parts');
	const letters = (await reply.locator('.letter').allTextContents()).filter((l) => l.trim());
	expect(letters).toEqual(['a)', 'b)', 'c)', 'd)', 'e)', 'f)', 'g)', 'h)']);
	await expect(reply).toContainText('Bei Ihnen selbst erhoben.');
	await expect(reply).toContainText('Liegt bei');
});

test('print: a DSFA prints as a report in the order of Art. 35 Abs. 7 DSGVO', async ({ page }) => {
	await page.setViewportSize({ width: A4_TEXT, height: 1000 });
	await page.goto('werkzeuge/dsfa/eintraege/?neu=1&beispiel=1', { waitUntil: 'networkidle' });
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);
	await page.emulateMedia({ media: 'print' });

	const head = page.locator('[data-print-frame]');
	await expect(head.locator('h1')).toHaveText('Datenschutz-Folgenabschätzung nach Art. 35 DSGVO');
	await expect(head).toContainText('Videoüberwachung der Laderampen');
	for (const internal of ['Daily', 'Werkzeug', 'Juristische Prüfung', 'Keine Rechtsberatung']) {
		await expect(head).not.toContainText(internal);
	}
	const report = page.locator('.print-parts');
	await expect(report.locator('h2')).toHaveText([
		/^1\. Gegenstand/,
		/lit\. a DSGVO\)$/,
		/lit\. b DSGVO\)$/,
		/lit\. c DSGVO\)$/,
		/lit\. d DSGVO\)$/,
		'6. Beteiligung',
		'7. Ergebnis'
	]);
	await expect(report).toContainText('Nicht bewertet');
	// the risk table and the checks before sign-off are in the report, not again in the annex
	await expect(page.locator('.dashboard .matrices')).toBeVisible();
	await expect(page.locator('.dashboard .signoff-card')).toBeHidden();
});

test('print: the AI usage policy prints as a policy to sign, not as a Prüfbericht', async ({
	page
}) => {
	await page.setViewportSize({ width: A4_TEXT, height: 1000 });
	await page.goto('werkzeuge/ki-nutzungsrichtlinie/pruefen/', { waitUntil: 'networkidle' });
	const answers: Record<string, string> = {
		p_allowlist: 'yes',
		p_private: 'no',
		p_personal: 'no',
		p_confidential: 'no',
		p_review: 'yes',
		p_label: 'yes',
		p_code: 'yes',
		p_people: 'no',
		p_training: 'yes',
		p_contact: 'unknown',
		p_incidents: 'yes',
		p_council: 'yes'
	};
	for (const [name, value] of Object.entries(answers)) {
		await page.locator(`input[name="answer.${name}"][value="${value}"]`).check({ force: true });
	}
	await page.getByRole('button', { name: 'Auswerten' }).click();
	await page.emulateMedia({ media: 'print' });

	const head = page.locator('[data-print-frame]');
	await expect(head.locator('h1')).toHaveText('KI-Nutzungsrichtlinie');
	await expect(head).toContainText('Entwurf, offene Stellen in eckigen Klammern');
	for (const internal of ['Daily', 'Werkzeug', 'Juristische Prüfung', 'Keine Rechtsberatung']) {
		await expect(head).not.toContainText(internal);
	}
	const policy = page.locator('.policy');
	await expect(policy.locator('h2').first()).toHaveText('§ 1 Geltungsbereich');
	// every placeholder is marked to be filled in before signing
	await expect(policy.locator('mark')).toHaveText([
		'[zuständige Stelle]',
		'[Offen: zuständige Stelle]',
		'[zuständige Stelle]'
	]);
	await expect(policy).toContainText('Diese Richtlinie tritt in Kraft am');
	await expect(policy).toContainText('Betriebsrat: Name, Unterschrift');
	// the warnings for the drafter stay on screen
	await expect(page.locator('.print-result')).toHaveCount(0);

	const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true });
	expect(pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)?.length).toBeLessThanOrEqual(2);
});

test('print: an audit report prints in the order of ISO 19011 with its audit, findings and checklist', async ({
	page
}) => {
	await page.setViewportSize({ width: A4_TEXT, height: 1000 });
	const audit = 'Datenschutzaudit Personalabteilung 2026 (Beispiel)';
	await page.goto('werkzeuge/auditprogramm/eintraege/?neu=1&beispiel=1', {
		waitUntil: 'networkidle'
	});
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await page.goto('werkzeuge/feststellungen/eintraege/?neu=1&beispiel=1', {
		waitUntil: 'networkidle'
	});
	await choose(page.locator('#field-audit'), { label: audit });
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await page.goto('werkzeuge/pruefkatalog/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.locator('#field-titel').fill('Löschung in der Personalakte');
	await choose(page.locator('#field-audit'), { label: audit });
	await choose(page.locator('#field-ergebnis'), 'teilweise');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);

	await page.goto('werkzeuge/auditbericht/eintraege/?neu=1', { waitUntil: 'networkidle' });
	await page.locator('#field-titel').fill('Auditbericht Personal 2026');
	await choose(page.locator('#field-audit'), { label: audit });
	await page.locator('#field-zusammenfassung').fill('Wirksam mit einer wesentlichen Abweichung.');
	await choose(page.locator('#field-gesamturteil'), 'abweichungen');
	await page.locator('#field-verteiler').fill('Geschäftsführung, Leitung Personal');
	await page.getByRole('button', { name: 'Speichern' }).click();
	await expect(page).toHaveURL(/eintrag=/);
	await page.emulateMedia({ media: 'print' });

	const head = page.locator('[data-print-frame]');
	await expect(head.locator('h1')).toHaveText('Auditbericht');
	await expect(head).toContainText('Geschäftsführung, Leitung Personal');
	for (const internal of ['Daily', 'Werkzeug', 'Juristische Prüfung', 'Keine Rechtsberatung']) {
		await expect(head).not.toContainText(internal);
	}
	const report = page.locator('.print-parts');
	await expect(report.locator('h2')).toHaveText([
		/^1\. Auditziel/,
		/^2\. Auditteam/,
		'3. Gesamturteil',
		'4. Feststellungen',
		'5. Prüfkataloge',
		/^6\. Stärken/
	]);
	await expect(report).toContainText('1 × Wesentliche Abweichung');
	await expect(report).toContainText('Zugriffsrechte ausgeschiedener Beschäftigter');
	await expect(report).toContainText('Ergebnis: Teilweise erfüllt');
	// the screen view of the composed audit does not print a second time
	await expect(page.locator('.composed').first()).toBeHidden();
	const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true });
	expect(pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)?.length).toBeLessThanOrEqual(3);
	if (process.env.AUDIT_PDF) await page.pdf({ path: process.env.AUDIT_PDF, format: 'A4' });
});
