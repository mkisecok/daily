import type { RecordDetail, RecordStore, StoreResult } from './types.js';

export type HttpUrls = {
	records: string;
	record: (id: string) => string;
	deadlines: string;
};

/**
 * the full app's store: JSON calls to `/api/records`. Store errors come
 * back as JSON bodies with 4xx statuses and are returned as they are;
 * anything else (network, 401, 500) throws.
 */
export function createHttpStore(urls: HttpUrls, fetchFn: typeof fetch = fetch): RecordStore {
	async function call<T>(url: string, method: string, body?: unknown): Promise<StoreResult<T>> {
		const response = await fetchFn(url, {
			method,
			headers: { accept: 'application/json', 'content-type': 'application/json' },
			body: body === undefined ? undefined : JSON.stringify(body)
		});
		const payload: unknown = await response.json().catch(() => null);
		if (response.ok) return { ok: true, value: payload as T };
		if (payload && typeof payload === 'object' && (payload as { ok?: unknown }).ok === false) {
			return payload as StoreResult<T>;
		}
		throw new Error(`${method} ${url} failed with ${response.status}`);
	}

	async function read<T>(url: string): Promise<T> {
		const result = await call<T>(url, 'GET');
		if (!result.ok) throw new Error(`GET ${url} failed: ${result.error}`);
		return result.value;
	}

	return {
		list: (toolSlug, options) =>
			read(
				`${urls.records}?tool=${encodeURIComponent(toolSlug)}${options?.archived ? '&archiviert=1' : ''}`
			),

		async get(id) {
			const response = await fetchFn(urls.record(id), { headers: { accept: 'application/json' } });
			if (response.status === 404) return null;
			if (!response.ok) throw new Error(`GET ${urls.record(id)} failed with ${response.status}`);
			return (await response.json()) as RecordDetail;
		},

		create: (tool, data) => call(urls.records, 'POST', { tool, data }),
		update: (id, data, expectedVersion) => call(urls.record(id), 'PUT', { data, expectedVersion }),
		transition: (id, to, expectedVersion) =>
			call(`${urls.record(id)}/transition`, 'POST', { to, expectedVersion }),
		attachAssessment: (id, field, answers, expectedVersion) =>
			call(`${urls.record(id)}/assessment`, 'POST', { field, answers, expectedVersion }),
		archive: (id) => call(urls.record(id), 'DELETE'),
		unarchive: (id) => call(`${urls.record(id)}/unarchive`, 'POST'),
		deadlines: () => read(urls.deadlines)
	};
}
