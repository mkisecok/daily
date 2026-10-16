import { PUBLIC_PREVIEW } from '$app/env/public';
import { resolve } from '$app/paths';
import { getRecordTool } from '../../tools/registry.js';
import { createBrowserStore } from './browser.js';
import { createHttpStore } from './http.js';
import { notifying } from './notify.js';
import type { RecordStore } from './types.js';

/** storage that may be missing or blocked (private mode, disabled site data) */
function safeLocalStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
	try {
		return window.localStorage;
	} catch {
		const memory = new Map<string, string>();
		return {
			getItem: (key) => memory.get(key) ?? null,
			setItem: (key, value) => void memory.set(key, value),
			removeItem: (key) => void memory.delete(key)
		};
	}
}

let store: (RecordStore & { clear?: () => void }) | undefined;
const listeners = new Set<() => void>();

/** called after every write through the store; returns the unsubscribe */
export function onRecordsChanged(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

/**
 * the browser store in the public preview, the API everywhere else. Only
 * call this in the browser: the records pages render on the client.
 */
export function getStore(): RecordStore & { clear?: () => void } {
	store ??= notifying(
		PUBLIC_PREVIEW
			? createBrowserStore(safeLocalStorage(), { getTool: getRecordTool })
			: createHttpStore({
					records: resolve('/api/records'),
					record: (id) => resolve('/api/records/[id]', { id }),
					deadlines: resolve('/api/deadlines')
				}),
		() => listeners.forEach((listener) => listener())
	);
	return store;
}
