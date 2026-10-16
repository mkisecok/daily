import { browser } from '$app/env';
import { getStore, onRecordsChanged } from '#lib/records/store/index.js';
import { dueSoon } from './deadline-count.js';

/** one count for the sidebar and the phone menu, so the store is read once per change */
export const deadlineCount = $state({ count: 0, overdue: false });

let enabled = false;
let subscribed = false;

async function load() {
	if (!enabled) {
		deadlineCount.count = 0;
		deadlineCount.overdue = false;
		return;
	}
	try {
		Object.assign(deadlineCount, dueSoon(await getStore().deadlines(), new Date()));
	} catch {
		// no store (signed out in the full app): show nothing
		deadlineCount.count = 0;
		deadlineCount.overdue = false;
	}
}

/**
 * reloads the count; the layout calls it after every navigation. Writes
 * through the store reload it too, so saving or clearing data updates the
 * sidebar without a navigation.
 */
export function refreshDeadlineCount(withRecords: boolean) {
	enabled = withRecords;
	if (!browser) return;
	if (!subscribed) {
		onRecordsChanged(() => void load());
		subscribed = true;
	}
	void load();
}
