import { getStore } from '../records/store/index.js';
import type { StoredRecord } from '../records/types.js';
import { detailsOf, type Details } from './slots.js';
import { ORGANISATION } from './tool.js';

/**
 * the organisation's entry and the details it holds; nothing when there is
 * none yet or the store cannot be reached (signed out on the server). Only
 * call this in the browser.
 */
export async function loadDetails(): Promise<{ record: StoredRecord | null; details: Details }> {
	try {
		const [record] = await getStore().list(ORGANISATION);
		return { record: record ?? null, details: detailsOf(record?.data) };
	} catch {
		return { record: null, details: {} };
	}
}
