import { resolve } from '$app/paths';
import { localized } from '#lib/i18n/links.js';
import { m } from '#lib/paraglide/messages.js';
import { text } from '../../i18n.js';
import { getLesson, getQuestionnaire, getRecordTool } from '../../registry.js';
import type { ToolManifest } from '../../types.js';
import type { Demo, Step } from './demo.svelte.js';

/** a tool's page under /werkzeuge, resolved */
const at = (path: string) => resolve(localized(`/werkzeuge/${path}`));

/** a URL's path without its trailing slash, and its query */
function place(href: string): string {
	const url = new URL(href, location.href);
	return url.pathname.replace(/\/$/, '') + url.search;
}

/** the element if the page has it now, without waiting for it */
const here = <T extends Element = HTMLElement>(selector: string) =>
	document.querySelector<T & Element>(selector);

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
function questionnaire(tool: ToolManifest): Step[] {
	return [
		async (demo) => {
			await open(demo, at(`${tool.slug}/pruefen`));
			const form = await demo.find<HTMLFormElement>('main form');
			await demo.point(form.querySelector('.section') ?? form, m.demo_q_intro(), 2200);
		},
		async (demo) => {
			// the first questions one by one, the rest quickly; follow-up questions appear as they apply
			const form = await demo.find<HTMLFormElement>('main form');
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
		},
		async (demo) =>
			demo.click(
				await demo.find<HTMLButtonElement>('main form button[type="submit"]'),
				m.demo_q_submit(),
				900
			),
		async (demo) => demo.point(await demo.find('.verdict h2'), m.demo_q_result(), 3600),
		async (demo) => {
			const steps = here('main section.next');
			if (steps) await demo.point(steps, m.demo_q_next(), 2600);
		},
		async (demo) => demo.point(await demo.find('[data-demo="print"]'), m.demo_q_print(), 2400)
	];
}

/** a part of the entry as it would look once saved, in the demo's sheet */
const inSheet = <T extends HTMLElement = HTMLElement>(demo: Demo, selector: string) =>
	demo.find<T>(`.demo-result .sheet ${selector}`);

/** what a record demo shows of a tool beyond its form: a field, the parts of its result */
type Tour = { form?: Step[]; result?: Step[]; list?: () => string };

const TOURS: Record<string, Tour> = {
	dsfa: {
		form: [
			async (demo) => {
				const risk = here('#field-vertraulichkeit_quellen-label, #field-vertraulichkeit_quellen');
				const box = risk?.closest('.field, .check');
				if (box) await demo.point(box, m.demo_d_risk(), 2600);
			}
		],
		result: [
			async (demo) =>
				demo.point(await inSheet(demo, '.dashboard .figures'), m.demo_d_figures(), 3200),
			async (demo) =>
				demo.point(await inSheet(demo, '.dashboard .matrices'), m.demo_d_matrix(), 2800),
			async (demo) =>
				demo.point(await inSheet(demo, '.dashboard .head .toolbar'), m.demo_d_export(), 2600),
			async (demo) =>
				demo.point(await inSheet(demo, '.dashboard .signoff-card'), m.demo_d_signoff(), 2800),
			async (demo) => demo.point(await inSheet(demo, '.dashboard .tom-card'), m.demo_d_tom(), 2400)
		]
	},
	vvt: {
		result: [async (demo) => demo.point(await inSheet(demo, '.flow'), m.demo_v_flow(), 3600)],
		list: () => m.demo_v_register()
	}
};

/** a register or workflow: the form with the example, the entry it becomes, and the list */
function record(tool: ToolManifest): Step[] {
	const { definition } = getRecordTool(tool.slug)!;
	const example = definition.example;
	const tour = TOURS[tool.slug] ?? {};
	const form = () => document.querySelector<HTMLFormElement>('form.record-form');

	// a few required fields, named as the form names them
	const required = definition.sections
		.flatMap((section) => section.fields)
		.filter((field) => field.required && field.id !== definition.titleField && !field.partOf)
		.slice(0, 3);

	const result: Step[] = example
		? [
				async (demo) => {
					demo.say(m.demo_r_result());
					demo.show({ slug: tool.slug, data: example });
					await inSheet(demo, '');
					await demo.wait(1600);
				},
				async (demo) => {
					const verdict = here('.demo-result .sheet .verdict');
					if (verdict) await demo.point(verdict, m.demo_r_verdict(), 2600);
				},
				...(tour.result ?? [
					async (demo) => {
						const panel = await demo.find<HTMLElement>('.demo-result .sheet');
						await demo.glide(panel, 4500);
					}
				])
			]
		: [];

	return [
		async (demo) => {
			await open(demo, at(`${tool.slug}/eintraege?neu=1${example ? '&beispiel=1' : ''}`));
			const shown = await demo.find<HTMLFormElement>('form.record-form');
			await demo.point(
				shown.querySelector('.section') ?? shown,
				example ? m.demo_r_intro_example() : m.demo_r_intro(),
				2400
			);
		},
		async (demo) => {
			// the title typed as a person would; with the example it ends as it began
			const title = document.getElementById(`field-${definition.titleField}`);
			if (!(title instanceof HTMLInputElement || title instanceof HTMLTextAreaElement)) return;
			const value =
				typeof example?.[definition.titleField] === 'string'
					? String(example[definition.titleField])
					: m.demo_r_sample_title();
			await demo.type(title, value, m.demo_r_title());
		},
		...required.map((field): Step => async (demo) => {
			const box = (
				document.getElementById(`field-${field.id}-label`) ??
				document.getElementById(`field-${field.id}`)
			)?.closest('.field, .check');
			if (box) await demo.point(box, m.demo_r_field({ label: text(field.label) }), 1900);
		}),
		...(tour.form ?? []),
		async (demo) => {
			const index = here('nav.index, .sections-menu');
			if (index) await demo.point(index, m.demo_r_sections(), 2200);
		},
		async (demo) => {
			const submit = form()?.querySelector('button[type="submit"]');
			if (submit) await demo.point(submit, m.demo_r_save(), 2200);
		},
		...result,
		async (demo) => {
			await demo.navigate(at(`${tool.slug}/eintraege`));
			await demo.point(
				await demo.find('main .page-header .actions'),
				tour.list?.() ?? m.demo_r_more(),
				3600
			);
		}
	];
}

/** a training: the presentation, a quiz question and the record of it */
function lesson(tool: ToolManifest): Step[] {
	const content = getLesson(tool.slug)!;
	const first = content.slides.length + 1;
	return [
		async (demo) => {
			await open(demo, at(tool.slug));
			await demo.click(
				await demo.find<HTMLElement>(`main a[href*="/${tool.slug}/vortrag"]`),
				m.demo_l_start(),
				1200
			);
		},
		async (demo) => {
			for (let n = 0; n < 2; n++) {
				await demo.click(
					await demo.find<HTMLElement>('.presenter .controls .step:last-child'),
					n === 0 ? m.demo_l_next() : undefined,
					1800
				);
			}
		},
		async (demo) => {
			await demo.navigate(at(`${tool.slug}/vortrag?folie=${first}`));
			demo.say(m.demo_l_quiz());
			await demo.wait(1800);
		},
		async (demo) => {
			const right = content.quiz[0]?.options.findIndex((option) => option.correct) ?? 0;
			const options = await demo.find('.presenter .options');
			const button = options.querySelectorAll<HTMLElement>('.option')[Math.max(0, right)];
			if (button) await demo.click(button, m.demo_l_answer(), 3200);
		},
		async (demo) => {
			await demo.navigate(at(`${tool.slug}/vortrag?folie=${first + content.quiz.length}`));
			await demo.point(await demo.find('.presenter .end-actions a'), m.demo_l_end(), 3200);
		}
	];
}

/** the text for an AI chat and back, then a Word letter with a passage boxed */
function pseudonymisierer(tool: ToolManifest): Step[] {
	return [
		async (demo) => {
			await open(demo, at(`${tool.slug}/`));
			await demo.click(await demo.find('[data-demo="sample"]'), m.demo_p_text(), 1200);
		},
		async (demo) => demo.point(await demo.find('.detection .summary'), m.demo_p_found(), 2400),
		async (demo) => demo.point(await demo.find('.marked .anon-mark'), m.demo_p_mark(), 2400),
		async (demo) => demo.point(await demo.find('#anon-output'), m.demo_p_output(), 2400),
		async (demo) => demo.point(await demo.find('[data-demo="copy"]'), m.demo_p_copy(), 2400),
		async (demo) => {
			// the AI's answer uses a placeholder from the text it was given
			const output = (await demo.find<HTMLTextAreaElement>('#anon-output')).value;
			const token = /«NAME_\d+»/.exec(output)?.[0] ?? /«[^»]+»/.exec(output)?.[0] ?? '';
			await demo.type(
				await demo.find<HTMLTextAreaElement>('#anon-reply'),
				m.demo_p_reply_text({ token }),
				m.demo_p_reply()
			);
		},
		async (demo) => demo.point(await demo.find('#anon-restored'), m.demo_p_restored(), 2800),
		async (demo) =>
			demo.click(
				await demo.find<HTMLElement>('nav.modes a:not([aria-current])'),
				m.demo_p_mode(),
				900
			),
		async (demo) => {
			await demo.click(await demo.find('[data-demo="sample"]'), m.demo_p_doc_load(), 1200);
		},
		async (demo) => demo.point(await demo.find('.sheet .marked'), m.demo_p_doc_pages(), 2600),
		async (demo) => {
			// a box around the paragraph with the diagnosis
			const page = await demo.find<HTMLElement>('.sheet .marked.boxing');
			const words = [...page.querySelectorAll<HTMLElement>('[data-at]')];
			const from = words.find((word) => word.textContent?.trim() === 'Nach');
			const to = words.find((word) => word.textContent?.includes('Januar'));
			if (!from || !to) return;
			demo.say(m.demo_p_doc_box());
			from.scrollIntoView({ block: 'center', behavior: 'smooth' });
			await demo.wait(500);
			const frame = page.getBoundingClientRect();
			const a = from.getBoundingClientRect();
			const b = to.getBoundingClientRect();
			const share = (x: number, y: number): [number, number] => [
				(x - frame.left) / frame.width,
				(y - frame.top) / frame.height
			];
			await demo.drag(page, share(a.left - 4, a.top - 3), share(b.right + 4, b.bottom + 3), 1100);
			await demo.wait(600);
		},
		async (demo) => {
			const pending = await demo.find<HTMLFormElement>('form.pending');
			const label = pending.querySelector<HTMLInputElement>('input[type="text"]');
			if (label) await demo.type(label, m.demo_p_doc_label(), m.demo_p_doc_name());
			await demo.click(
				pending.querySelector<HTMLButtonElement>('button[type="submit"]')!,
				undefined,
				900
			);
		},
		async (demo) => demo.point(await demo.find('ul.variables'), m.demo_p_doc_vars(), 2800),
		async (demo) =>
			demo.point(
				(await demo.find('#anon-doc-export')).closest('section')!,
				m.demo_p_doc_export(),
				2800
			),
		async (demo) =>
			demo.point(
				(await demo.find('#anon-doc-restore')).closest('section')!,
				m.demo_p_doc_restore(),
				2800
			)
	];
}

function guardrail(tool: ToolManifest): Step[] {
	return [
		async (demo) => {
			await open(demo, at(`${tool.slug}/`));
			await demo.point(await demo.find('.setup'), m.demo_g_sets(), 2600);
		},
		async (demo) =>
			demo.type(
				await demo.find<HTMLTextAreaElement>('textarea[id^="answer-"]'),
				m.demo_g_reply(),
				m.demo_g_answer()
			),
		async (demo) => demo.click(await demo.find('[data-demo="run"]'), m.demo_g_run(), 1200),
		async (demo) => demo.point(await demo.find('.verdict h2'), m.demo_g_result(), 4000)
	];
}

function repoCheck(tool: ToolManifest): Step[] {
	return [
		async (demo) => {
			await open(demo, at(`${tool.slug}/`));
			await demo.point(await demo.find('main .input .toolbar'), m.demo_c_files(), 2400);
		},
		async (demo) =>
			demo.type(
				await demo.find<HTMLTextAreaElement>('#paste'),
				"const reply = await fetch('https://api.openai.com/v1/chat/completions', { body });",
				m.demo_c_paste()
			),
		async (demo) => demo.click(await demo.find('[data-demo="run"]'), m.demo_c_run(), 1200),
		async (demo) => demo.point(await demo.find('.verdict h2'), m.demo_c_result(), 4000)
	];
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
function sdmCube(tool: ToolManifest): Step[] {
	const { definition } = getRecordTool(tool.slug)!;
	const sheet = () => document.querySelector<HTMLElement>('.demo-result .sheet');
	const spread = async (demo: Demo, value: number) => {
		const apart = await inSheet<HTMLInputElement>(demo, '.cube3d .apart input');
		apart.value = String(value);
		apart.dispatchEvent(new Event('input', { bubbles: true }));
	};
	return [
		async (demo) => {
			await open(demo, at(`${tool.slug}/eintraege?neu=1&beispiel=1`));
			await demo.point(await demo.find('form.record-form .section'), m.demo_s_intro(), 2200);
		},
		async (demo) => {
			const rating = (
				document.getElementById('field-datenminimierung_e2-label') ??
				document.getElementById('field-datenminimierung_e2')
			)?.closest('.field');
			if (rating) await demo.point(rating, m.demo_s_rate(), 2400);
		},
		async (demo) =>
			demo.point(await demo.find('form.record-form button[type="submit"]'), m.demo_r_save(), 1600),
		async (demo) => {
			demo.show({ slug: tool.slug, data: definition.example! });
			await demo.point(await inSheet(demo, '.cube-dash .focus li'), m.demo_s_focus(), 3200);
		},
		async (demo) => demo.point(await inSheet(demo, '.scene'), m.demo_s_cube(), 2000),
		async (demo) => {
			// the controls change the cube, so the ring stays on the cube while they do
			const views = sheet()?.querySelectorAll<HTMLElement>('.cube3d .controls .group button');
			await demo.point(await inSheet(demo, '.scene'), m.demo_s_views(), 300);
			views?.[1]?.click();
			await demo.wait(1600);
			views?.[0]?.click();
			await demo.wait(900);
		},
		async (demo) => {
			demo.say(m.demo_s_apart());
			for (const value of [8, 16, 24]) {
				await spread(demo, value);
				await demo.wait(350);
			}
			await demo.wait(900);
		},
		async (demo) => {
			const gaps = [
				...(sheet()?.querySelectorAll<HTMLElement>('.cube3d .controls > .toggle') ?? [])
			].at(-1);
			if (gaps) {
				demo.say(m.demo_s_gaps());
				gaps.click();
				await demo.wait(2400);
				gaps.click();
			}
			await spread(demo, 0);
			await demo.wait(500);
		},
		async (demo) => {
			// data minimisation on level 2: goal 4, the second row
			const scene = await inSheet(demo, '.scene');
			scene.focus({ preventScroll: true });
			for (const key of ['PageDown', 'PageDown', 'PageDown', 'ArrowDown']) press(scene, key);
			await demo.wait(300);
			press(scene, 'Enter');
			await demo.point(await inSheet(demo, '.cube3d .slice h4'), m.demo_s_slice(), 2400);
		},
		async (demo) =>
			demo.point(await inSheet(demo, '.cube3d .slice .rate'), m.demo_s_rate_cube(), 2800),
		async (demo) =>
			demo.point(await inSheet(demo, '.cube3d .slice .detail .label'), m.demo_s_detail(), 2200)
	];
}

/** tools with a demo of their own */
const OWN: Record<string, (tool: ToolManifest) => Step[]> = {
	'sdm-wuerfel': sdmCube,
	pseudonymisierer,
	'guardrail-test': guardrail,
	'repo-check': repoCheck
};

/** the steps of `tool`'s demo, or none for a tool without one */
export function scriptFor(tool: ToolManifest): Step[] | null {
	if (tool.status === 'planned' || tool.status === 'retired') return null;
	const own = OWN[tool.slug];
	if (own) return own(tool);
	if (getQuestionnaire(tool.slug)) return questionnaire(tool);
	if (getRecordTool(tool.slug)) return record(tool);
	if (getLesson(tool.slug)) return lesson(tool);
	return null;
}
