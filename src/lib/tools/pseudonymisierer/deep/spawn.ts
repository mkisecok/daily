/** the model worker; in a plain module, so Vite bundles it and no rule mistakes the URL for state */
export const spawnModelWorker = () =>
	new Worker(new URL('./model.worker.ts', import.meta.url), { type: 'module' });
