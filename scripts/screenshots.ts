/**
 * Captures reference screenshots of the running dev server into docs/design.
 *
 *   node scripts/screenshots.ts            # expects http://localhost:5174
 *   BASE_URL=... node scripts/screenshots.ts
 *
 * Signs in with the seeded local Keycloak user so the (app) pages render.
 */
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:5174';
const username = process.env.E2E_USER ?? 'test@dai-ly.de';
const password = process.env.E2E_PASSWORD ?? 'test-dev-password';
const outDir = 'docs/design';

const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: 1280, height: 900 },
	deviceScaleFactor: 1
});
await mkdir(outDir, { recursive: true });

async function shot(name: string, fullPage = true) {
	await page.waitForLoadState('networkidle');
	await page.screenshot({ path: `${outDir}/${name}.png`, fullPage });
	console.log('saved', name);
}

await page.goto(`${baseUrl}/`);
await shot('landing');
await page.goto(`${baseUrl}/werkzeuge`);
await shot('werkzeuge');
await page.goto(`${baseUrl}/werkzeuge/dsfa-schwellwert`);
await shot('tool-dsfa-schwellwert');

await page.goto(`${baseUrl}/auth/login?next=%2Fwerkzeuge%2Fdsfa-schwellwert%2Fneu`);
await page.locator('#username').fill(username);
await page.locator('#password').fill(password);
await page.locator('#kc-login').click();
await page.waitForURL(/\/werkzeuge\/dsfa-schwellwert\/neu$/);
await shot('tool-dsfa-schwellwert-form');

const answers: Record<string, string> = {
	art35_a: 'no',
	art35_b: 'no',
	art35_c: 'no',
	dsk_list: 'no',
	c1: 'no',
	c2: 'no',
	c3: 'yes',
	c4: 'no',
	c5: 'no',
	c6: 'no',
	c7: 'yes',
	c8: 'unknown',
	c9: 'no'
};
for (const [id, value] of Object.entries(answers)) {
	await page.locator(`input[name="answer.${id}"][value="${value}"]`).check();
}
await page.getByRole('button', { name: /Auswerten/ }).click();
await page.waitForURL(/\/werkzeuge\/dsfa-schwellwert\/[0-9a-f-]{36}$/);
await shot('tool-dsfa-schwellwert-result');

await page.emulateMedia({ media: 'print' });
await shot('tool-dsfa-schwellwert-print');

await browser.close();
