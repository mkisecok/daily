import { goto } from '$app/navigation';
import type { RecordData } from '#lib/records/types.js';
import type { ToolManifest } from '../../types.js';

/** a demo never runs longer than this; past it every pause shrinks to a blink */
export const DEMO_MS = 40_000;

/** the end of a record demo: the entry as it would look once saved */
export type DemoResult = { slug: string; data: RecordData };

type Box = { top: number; left: number; width: number; height: number };

/** the browser's storages as they were when the demo began */
type Snapshot = { local: [string, string][]; session: [string, string][] };

function entries(storage: Storage): [string, string][] {
	const out: [string, string][] = [];
	for (let i = 0; i < storage.length; i++) {
		const key = storage.key(i);
		if (key !== null) out.push([key, storage.getItem(key) ?? '']);
	}
	return out;
}

function put(storage: Storage, kept: [string, string][]) {
	storage.clear();
	for (const [key, value] of kept) storage.setItem(key, value);
}

class Stopped extends Error {}

/**
 * the guided demo of a tool: it plays on the real page, with a cursor, a ring
 * around what it points at and a caption, fills in the tool's example and
 * shows the result. It never saves: drafts it leaves behind are undone when
 * it ends, and the page loads afresh.
 */
class Demo {
	tool = $state<ToolManifest | null>(null);
	phase = $state<'idle' | 'running' | 'done'>('idle');
	caption = $state('');
	/** share of the time budget used, 0 to 1 */
	elapsed = $state(0);
	cursor = $state<{ x: number; y: number } | null>(null);
	ring = $state<Box | null>(null);
	result = $state<DemoResult | null>(null);
	/** where the user should go to do it themselves */
	tryHref = $state('');

	#target: Element | null = null;
	#started = 0;
	#timer: ReturnType<typeof setInterval> | undefined;
	#run = 0;
	#snapshot: Snapshot | null = null;
	#from = '';

	get active() {
		return this.phase !== 'idle';
	}

	/** plays `script` from the page the user is on; `tryHref` is where to try it after */
	async start(tool: ToolManifest, script: (demo: Demo) => Promise<void>, tryHref: string) {
		if (this.active) return;
		this.tryHref = tryHref;
		try {
			this.#snapshot = { local: entries(localStorage), session: entries(sessionStorage) };
		} catch {
			this.#snapshot = null;
		}
		this.#from = location.href;
		this.tool = tool;
		this.phase = 'running';
		this.caption = '';
		this.result = null;
		this.cursor = { x: innerWidth / 2, y: innerHeight / 2 };
		this.#started = performance.now();
		this.elapsed = 0;
		this.#timer = setInterval(() => {
			this.elapsed = Math.min(1, (performance.now() - this.#started) / DEMO_MS);
		}, 200);
		const run = ++this.#run;
		try {
			await script(this);
			if (run === this.#run) this.#finish();
		} catch (error) {
			if (!(error instanceof Stopped) && run === this.#run) this.#finish();
		}
	}

	#finish() {
		clearInterval(this.#timer);
		this.elapsed = 1;
		this.phase = 'done';
		this.#target = null;
		this.ring = null;
	}

	/** ends the demo, undoes its drafts and opens `href`, or reloads where it began */
	end(href?: string) {
		this.#run++;
		clearInterval(this.#timer);
		if (this.#snapshot) {
			try {
				put(localStorage, this.#snapshot.local);
				put(sessionStorage, this.#snapshot.session);
			} catch {
				// storage went away during the demo; nothing to undo
			}
		}
		// the scripts pass paths from the root; the start is a whole URL
		const to = href ? location.origin + href : this.#from;
		this.phase = 'idle';
		this.tool = null;
		this.result = null;
		this.ring = null;
		this.cursor = null;
		this.#target = null;
		// the page the demo filled in starts over; another page loads as usual
		if (to === location.href) location.reload();
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- both URLs come from the app's own pages
		else void goto(to);
	}

	#check(run: number) {
		if (run !== this.#run) throw new Stopped();
	}

	/** waits, cut short once the time budget is spent */
	async wait(ms: number) {
		const run = this.#run;
		const left = DEMO_MS - (performance.now() - this.#started);
		await new Promise((done) => setTimeout(done, left > 1500 ? ms : Math.min(ms, 60)));
		this.#check(run);
	}

	say(caption: string) {
		this.caption = caption;
	}

	/** the first element matching `selector`, waiting for it to appear */
	async find<T extends Element = HTMLElement>(selector: string, timeout = 6000): Promise<T> {
		const run = this.#run;
		const until = performance.now() + timeout;
		for (;;) {
			this.#check(run);
			const found = document.querySelector<T & Element>(selector);
			if (found) return found;
			// a page without the element ends the demo early, at its last step
			if (performance.now() > until) throw new Error(`demo: ${selector} not found`);
			await new Promise((done) => setTimeout(done, 80));
		}
	}

	/** re-reads where the ring belongs, after a scroll or a resize */
	track() {
		if (!this.#target) return;
		const box = this.#target.getBoundingClientRect();
		this.ring = { top: box.top, left: box.left, width: box.width, height: box.height };
	}

	/** scrolls `element` into view, rings it and moves the cursor onto it */
	async point(element: Element, caption?: string, hold = 1600) {
		if (caption) this.say(caption);
		// a tall element is shown from its top, where its heading is
		const tall = element.getBoundingClientRect().height > innerHeight * 0.6;
		element.scrollIntoView({ block: tall ? 'start' : 'center', behavior: 'smooth' });
		await this.wait(450);
		this.#target = element;
		this.track();
		const box = element.getBoundingClientRect();
		this.cursor = {
			x: box.left + Math.min(box.width / 2, 40),
			y: box.top + Math.min(box.height / 2, 24)
		};
		await this.wait(hold);
	}

	async click(element: HTMLElement, caption?: string, hold = 900) {
		await this.point(element, caption, 700);
		element.click();
		await this.wait(hold);
	}

	/** types `value` into a text field as a person would, one key at a time */
	async type(field: HTMLInputElement | HTMLTextAreaElement, value: string, caption?: string) {
		await this.point(field, caption, 400);
		field.focus({ preventScroll: true });
		field.value = '';
		field.dispatchEvent(new Event('input', { bubbles: true }));
		const step = Math.max(18, Math.min(70, 1600 / Math.max(1, value.length)));
		for (const char of value) {
			field.value += char;
			field.dispatchEvent(new Event('input', { bubbles: true }));
			await this.wait(step);
		}
		field.dispatchEvent(new Event('change', { bubbles: true }));
		field.blur();
		await this.wait(500);
	}

	/** scrolls a scrolling element down slowly, to show what is in it */
	async glide(element: HTMLElement, ms: number) {
		const run = this.#run;
		const start = performance.now();
		const height = element.scrollHeight - element.clientHeight;
		while (performance.now() - start < ms) {
			this.#check(run);
			element.scrollTop = (height * (performance.now() - start)) / ms;
			await new Promise((done) => requestAnimationFrame(done));
		}
	}

	async navigate(href: string) {
		const run = this.#run;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- the scripts pass resolved paths
		await goto(href);
		this.#check(run);
	}

	show(result: DemoResult) {
		this.#target = null;
		this.ring = null;
		this.result = result;
	}
}

export type { Demo };
export const demo = new Demo();
