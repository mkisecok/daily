/**
 * the name model, off the main thread: loads the model once (from the
 * browser's cache when it is there), then finds person names in the texts it
 * is sent. The text never leaves this worker; only the model and its tokenizer
 * are fetched, from huggingface.co.
 */
import { Gliner } from 'gliner';
import ort from 'onnxruntime-web';
// served by Daily itself, not by a CDN; onnxruntime-web does not export it, hence the path
import wasmUrl from '../../../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm?url';
import { bareName, chunks, standsAlone } from './chunks.js';
import { MODEL_CACHE, MODEL_REPO, MODEL_URL, type FromWorker, type ToWorker } from './protocol.js';

/** names below this score are dropped; the model is unsure even when right, so it only suggests */
const THRESHOLD = 0.25;

const ENTITIES = ['person', 'organization', 'location', 'email', 'phone number'];

let gliner: Gliner | null = null;

const post = (message: FromWorker) => self.postMessage(message);

/** the model file, from the cache or downloaded with progress and then cached */
async function modelBytes(): Promise<ArrayBuffer> {
	const cache = await caches.open(MODEL_CACHE);
	const cached = await cache.match(MODEL_URL);
	if (cached) return cached.arrayBuffer();

	const response = await fetch(MODEL_URL);
	if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
	const total = Number(response.headers.get('content-length')) || 0;
	const reader = response.body.getReader();
	const parts: Uint8Array[] = [];
	let loaded = 0;
	let reported = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		parts.push(value);
		loaded += value.length;
		if (loaded - reported > 2_000_000) {
			reported = loaded;
			post({ type: 'progress', loaded, total });
		}
	}
	const bytes = new Uint8Array(loaded);
	let at = 0;
	for (const part of parts) {
		bytes.set(part, at);
		at += part.length;
	}
	try {
		await cache.put(
			MODEL_URL,
			new Response(bytes, { headers: { 'content-type': 'application/octet-stream' } })
		);
	} catch {
		// a full disk or a private window refuses 349 MB: the model works for this visit, uncached
	}
	return bytes.buffer;
}

async function load() {
	// one thread: the page is not cross-origin isolated, and a worker is already off the main thread
	ort.env.wasm.numThreads = 1;
	ort.env.wasm.wasmBinary = await (await fetch(wasmUrl)).arrayBuffer();
	const model = await modelBytes();
	gliner = new Gliner({
		tokenizerPath: MODEL_REPO,
		onnxSettings: { modelPath: model, executionProvider: 'wasm', multiThread: false },
		transformersSettings: { allowLocalModels: false, useBrowserCache: true },
		maxWidth: 12,
		modelType: 'span-level'
	});
	await gliner.initialize();
}

async function find(text: string) {
	if (!gliner) return [];
	const names = new Map<string, number>();
	for (const piece of chunks(text)) {
		const [found] = await gliner.inference({
			texts: [piece.text],
			// asked for persons alone, the model scores them lower than among other kinds; only persons are kept
			entities: ENTITIES,
			flatNer: true,
			threshold: THRESHOLD,
			multiLabel: false
		});
		for (const entity of found ?? []) {
			if (entity.label !== 'person') continue;
			const value = bareName(entity.spanText);
			// the model's own spans can stop mid-word (seen after an umlaut); only whole words count
			if (value.length < 3 || !standsAlone(text, value)) continue;
			names.set(value, Math.max(names.get(value) ?? 0, entity.score));
		}
	}
	return [...names].map(([value, score]) => ({ value, score }));
}

self.onmessage = async (event: MessageEvent<ToWorker>) => {
	const message = event.data;
	try {
		if (message.type === 'load') {
			await load();
			post({ type: 'ready' });
		} else {
			post({ type: 'found', id: message.id, names: await find(message.text) });
		}
	} catch (error) {
		post({ type: 'error', message: error instanceof Error ? error.message : String(error) });
	}
};
