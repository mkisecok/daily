import { resolve } from '$app/paths';
import { localized } from '#lib/i18n/links.js';
import { m } from '#lib/paraglide/messages.js';
import { text } from '../../i18n.js';
import { getLesson, getQuestionnaire, getRecordTool } from '../../registry.js';
import type { ToolManifest } from '../../types.js';
import type { Demo } from './demo.svelte.js';

/** a tool's page under /werkzeuge, resolved */
const at = (path: string) => resolve(localized(`/werkzeuge/${path}`));

/** a URL's path without its trailing slash, and its query */
function place(href: string): string {
	const url = new URL(href, location.href);
	return url.pathname.replace(/\/$/, '') + url.search;
}

/** goes to `href` unless the user is on that page already */
async function open(demo: Demo, href: string) {
	if (place(location.href) !== place(href)) await demo.navigate(href);
}

/** where the user does the work, for "try it yourself" */
export function workHref(tool: ToolManifest): string {
	if (getQuestionnaire(tool.slug)) return at(`${tool.slug}/pruefen`);
	if (getRecordTool(tool.slug)) return at(`${tool.slug}/eintraege?neu=1`);
	if (getLesson(tool.slug)) return at(`${tool.slug}/vortrag`);
	return at(`${tool.slug}/`);
}

/** a questionnaire: answer, evaluate, read the result */
async function questionnaire(demo: Demo, tool: ToolManifest) {
	await open(demo, at(`${tool.slug}/pruefen`));
	const form = await demo.find<HTMLFormElement>('main form');
	await demo.point(form.querySelector('.section') ?? form, m.demo_q_intro(), 2200);

	// the first questions one by one, the rest quickly; follow-up questions appear as they apply
	for (let n = 0; n < 40; n++) {
		const row = [...form.querySelectorAll<HTMLElement>('fieldset.row')].find(
			(candidate) => !candidate.querySelector('input:checked')
		);
		if (!row) break;
		const choice = row.querySelector<HTMLInputElement>('input[value="yes"]');
		if (!choice) break;
		if (n < 3) {
			await demo.click(choice, n === 0 ? m.demo_q_answer() : undefined, 600);
		} else {
			if (n === 3) demo.say(m.demo_q_rest());
			row.scrollIntoView({ block: 'center' });
			choice.click();
			await demo.wait(140);
		}
	}

	const submit = await demo.find<HTMLButtonElement>('main form button[type="submit"]');
	await demo.click(submit, m.demo_q_submit(), 900);
	await demo.point(await demo.find('.verdict h2'), m.demo_q_result(), 4000);
	const steps = document.querySelector('main section.next');
	if (steps) await demo.point(steps, m.demo_q_next(), 2600);
	await demo.point(await demo.find('[data-demo="print"]'), m.demo_q_print(), 2400);
}

/** a register or workflow: the form with the example, and the entry it becomes */
async function record(demo: Demo, tool: ToolManifest) {
	const recordTool = getRecordTool(tool.slug)!;
	const definition = recordTool.definition;
	const example = definition.example;
	await open(demo, at(`${tool.slug}/eintraege?neu=1${example ? '&beispiel=1' : ''}`));
	const form = await demo.find<HTMLFormElement>('form.record-form');
	await demo.point(
		form.querySelector('.section') ?? form,
		example ? m.demo_r_intro_example() : m.demo_r_intro(),
		2400
	);

	// the title typed as a person would; with the example it ends as it began
	const title = document.getElementById(`field-${definition.titleField}`);
	if (title instanceof HTMLInputElement || title instanceof HTMLTextAreaElement) {
		const value =
			typeof example?.[definition.titleField] === 'string'
				? String(example[definition.titleField])
				: m.demo_r_sample_title();
		await demo.type(title, value, m.demo_r_title());
	}

	// a few required fields, named as the form names them
	const required = definition.sections
		.flatMap((section) => section.fields)
		.filter((field) => field.required && field.id !== definition.titleField && !field.partOf);
	for (const field of required.slice(0, 4)) {
		const box = (
			document.getElementById(`field-${field.id}-label`) ??
			document.getElementById(`field-${field.id}`)
		)?.closest('.field, .check');
		if (!box) continue;
		await demo.point(box, m.demo_r_field({ label: text(field.label) }), 1900);
	}

	const index = document.querySelector('nav.index, .sections-menu');
	if (index) await demo.point(index, m.demo_r_sections(), 2200);
	await demo.point(
		await demo.find('form.record-form button[type="submit"]'),
		m.demo_r_save(),
		2400
	);

	if (example) {
		demo.say(m.demo_r_result());
		demo.show({ slug: tool.slug, data: example });
		const panel = await demo.find<HTMLElement>('.demo-result .sheet');
		await demo.wait(1200);
		await demo.glide(panel, 7000);
		await demo.wait(800);
	} else {
		demo.say(m.demo_r_list());
		await demo.wait(3000);
	}
}

/** a training: the presentation, a quiz question and the record of it */
async function lesson(demo: Demo, tool: ToolManifest) {
	const content = getLesson(tool.slug)!;
	await open(demo, at(tool.slug));
	await demo.click(
		await demo.find<HTMLElement>(`main a[href*="/${tool.slug}/vortrag"]`),
		m.demo_l_start(),
		1200
	);
	for (let n = 0; n < 2; n++) {
		await demo.click(
			await demo.find<HTMLElement>('.presenter .controls .step:last-child'),
			n === 0 ? m.demo_l_next() : undefined,
			1800
		);
	}
	const first = content.slides.length + 1;
	await demo.navigate(at(`${tool.slug}/vortrag?folie=${first}`));
	demo.say(m.demo_l_quiz());
	await demo.wait(1800);
	const right = content.quiz[0]?.options.findIndex((option) => option.correct) ?? 0;
	const options = await demo.find('.presenter .options');
	const button = options.querySelectorAll<HTMLElement>('.option')[Math.max(0, right)];
	if (button) await demo.click(button, m.demo_l_answer(), 3200);
	await demo.navigate(at(`${tool.slug}/vortrag?folie=${first + content.quiz.length}`));
	await demo.point(await demo.find('.presenter .end-actions a'), m.demo_l_end(), 3200);
}

async function pseudonymisierer(demo: Demo, tool: ToolManifest) {
	await open(demo, at(`${tool.slug}/`));
	await demo.click(await demo.find('[data-demo="sample"]'), m.demo_p_text(), 1200);
	await demo.point(await demo.find('.detection .summary'), m.demo_p_found(), 2600);
	await demo.point(await demo.find('.marked .anon-mark'), m.demo_p_mark(), 2600);
	await demo.point(await demo.find('#anon-output'), m.demo_p_output(), 2600);
	await demo.point(await demo.find('[data-demo="copy"]'), m.demo_p_copy(), 2400);
}

async function guardrail(demo: Demo, tool: ToolManifest) {
	await open(demo, at(`${tool.slug}/`));
	await demo.point(await demo.find('.setup'), m.demo_g_sets(), 2600);
	await demo.type(
		await demo.find<HTMLTextAreaElement>('textarea[id^="answer-"]'),
		m.demo_g_reply(),
		m.demo_g_answer()
	);
	await demo.click(await demo.find('[data-demo="run"]'), m.demo_g_run(), 1200);
	await demo.point(await demo.find('.verdict h2'), m.demo_g_result(), 4000);
}

async function repoCheck(demo: Demo, tool: ToolManifest) {
	await open(demo, at(`${tool.slug}/`));
	await demo.point(await demo.find('main .input .toolbar'), m.demo_c_files(), 2400);
	await demo.type(
		await demo.find<HTMLTextAreaElement>('#paste'),
		"const reply = await fetch('https://api.openai.com/v1/chat/completions', { body });",
		m.demo_c_paste()
	);
	await demo.click(await demo.find('[data-demo="run"]'), m.demo_c_run(), 1200);
	await demo.point(await demo.find('.verdict h2'), m.demo_c_result(), 4000);
}

/** presses a key on the focused element, as the keyboard would */
function press(element: HTMLElement, key: string) {
	element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

/**
 * the SDM cube: the example rated goal by goal, then its result: what to fix
 * first, the cube turned to a view, pulled apart, the gaps alone, and a
 * slice pulled out with the rating in place
 */
async function sdmCube(demo: Demo, tool: ToolManifest) {
	const { definition } = getRecordTool(tool.slug)!;
	await open(demo, at(`${tool.slug}/eintraege?neu=1&beispiel=1`));
	await demo.point(await demo.find('form.record-form .section'), m.demo_s_intro(), 2200);
	const rating = (
		document.getElementById('field-datenminimierung_e2-label') ??
		document.getElementById('field-datenminimierung_e2')
	)?.closest('.field');
	if (rating) await demo.point(rating, m.demo_s_rate(), 2400);
	await demo.point(
		await demo.find('form.record-form button[type="submit"]'),
		m.demo_r_save(),
		1600
	);

	demo.show({ slug: tool.slug, data: definition.example! });
	const sheet = await demo.find<HTMLElement>('.demo-result .sheet');
	const inSheet = <T extends HTMLElement = HTMLElement>(selector: string) =>
		demo.find<T>(`.demo-result .sheet ${selector}`);
	await demo.point(await inSheet('.cube-dash .focus li'), m.demo_s_focus(), 3200);

	const scene = await inSheet('.scene');
	await demo.point(scene, m.demo_s_cube(), 2000);
	// the controls change the cube, so the ring stays on the cube while they do
	const views = sheet.querySelectorAll<HTMLElement>('.cube3d .controls .group button');
	await demo.point(scene, m.demo_s_views(), 300);
	views[1]?.click();
	await demo.wait(1600);
	views[0]?.click();
	await demo.wait(900);

	const apart = await inSheet<HTMLInputElement>('.cube3d .apart input');
	const spread = (value: number) => {
		apart.value = String(value);
		apart.dispatchEvent(new Event('input', { bubbles: true }));
	};
	demo.say(m.demo_s_apart());
	for (const value of [8, 16, 24]) {
		spread(value);
		await demo.wait(350);
	}
	await demo.wait(900);
	const gaps = [...sheet.querySelectorAll<HTMLElement>('.cube3d .controls > .toggle')].at(-1);
	if (gaps) {
		demo.say(m.demo_s_gaps());
		gaps.click();
		await demo.wait(2400);
		gaps.click();
	}
	spread(0);
	await demo.wait(500);

	// data minimisation on level 2: goal 4, the second row
	scene.focus({ preventScroll: true });
	for (const key of ['PageDown', 'PageDown', 'PageDown', 'ArrowDown']) press(scene, key);
	await demo.wait(300);
	press(scene, 'Enter');
	await demo.point(await inSheet('.cube3d .slice h4'), m.demo_s_slice(), 2400);
	await demo.point(await inSheet('.cube3d .slice .rate'), m.demo_s_rate_cube(), 2800);
	await demo.point(await inSheet('.cube3d .slice .detail .label'), m.demo_s_detail(), 2200);
}

/** tools with a demo of their own */
const OWN: Record<string, (demo: Demo, tool: ToolManifest) => Promise<void>> = {
	'sdm-wuerfel': sdmCube,
	pseudonymisierer,
	'guardrail-test': guardrail,
	'repo-check': repoCheck
};

/** the demo of `tool`, or none for a tool without one */
export function scriptFor(tool: ToolManifest): ((demo: Demo) => Promise<void>) | null {
	if (tool.status === 'planned' || tool.status === 'retired') return null;
	const own = OWN[tool.slug];
	if (own) return (demo) => own(demo, tool);
	if (getQuestionnaire(tool.slug)) return (demo) => questionnaire(demo, tool);
	if (getRecordTool(tool.slug)) return (demo) => record(demo, tool);
	if (getLesson(tool.slug)) return (demo) => lesson(demo, tool);
	return null;
}
