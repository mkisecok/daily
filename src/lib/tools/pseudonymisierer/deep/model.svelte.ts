import { MODEL_CACHE, MODEL_URL, type FromWorker, type ToWorker } from './protocol.js';
import { spawnModelWorker } from './spawn.js';

export type DeepStatus = 'off' | 'loading' | 'ready' | 'error';

/** a name the model found, for the suggestions */
export type ModelName = { value: string; score: number };

/**
 * the opt-in name model: started by the user, run in a worker, its finds
 * offered as suggestions only. Switching it off ends the worker and deletes
 * the cached model, so nothing large stays behind.
 */
export class DeepModel {
	status = $state<DeepStatus>('off');
	/** share of the download done, 0 to 1; 0 while the size is unknown */
	progress = $state(0);
	error = $state('');
	names = $state<ModelName[]>([]);
	/** the model is in the browser's cache, so loading needs no download */
	cached = $state(false);

	#worker: Worker | null = null;
	#asked = 0;
	#timer: ReturnType<typeof setTimeout> | undefined;

	/** whether a load would come from the cache */
	async check(): Promise<void> {
		try {
			this.cached = Boolean(await (await caches.open(MODEL_CACHE)).match(MODEL_URL));
		} catch {
			this.cached = false;
		}
	}

	start(): void {
		if (this.#worker) return;
		this.status = 'loading';
		this.progress = 0;
		this.error = '';
		this.#worker = spawnModelWorker();
		this.#worker.onmessage = (event: MessageEvent<FromWorker>) => this.#receive(event.data);
		this.#worker.onerror = (event) => this.#fail(event.message || 'worker');
		this.#send({ type: 'load' });
	}

	/** ends the worker and deletes the cached model */
	async stop(): Promise<void> {
		this.#worker?.terminate();
		this.#worker = null;
		this.status = 'off';
		this.names = [];
		clearTimeout(this.#timer);
		try {
			await caches.delete(MODEL_CACHE);
		} catch {
			// without the Cache API there is nothing to delete
		}
		this.cached = false;
	}

	/** looks for names in `text` once typing pauses; only the latest text counts */
	scan(text: string): void {
		clearTimeout(this.#timer);
		if (this.status !== 'ready' || !text.trim()) {
			this.names = [];
			return;
		}
		this.#timer = setTimeout(() => this.#send({ type: 'find', id: ++this.#asked, text }), 500);
	}

	#send(message: ToWorker) {
		this.#worker?.postMessage(message);
	}

	#fail(message: string) {
		this.status = 'error';
		this.error = message;
		this.#worker?.terminate();
		this.#worker = null;
	}

	#receive(message: FromWorker) {
		if (message.type === 'progress') {
			this.progress = message.total ? message.loaded / message.total : 0;
		} else if (message.type === 'ready') {
			this.status = 'ready';
			this.cached = true;
		} else if (message.type === 'error') {
			this.#fail(message.message);
		} else if (message.id === this.#asked) {
			this.names = message.names;
		}
	}
}
