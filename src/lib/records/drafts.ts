/**
 * unsaved input of a form or questionnaire, kept in this tab's
 * sessionStorage: it survives a reload, a crash or leaving and coming back,
 * and is gone when the tab closes or the user logs out. Blocked storage
 * just means no drafts.
 */
export const DRAFT_PREFIX = 'daily.draft.v1:';

export type Draft<T> = {
	values: T;
	/** ISO timestamp of the last change */
	savedAt: string;
	/** the record version the draft was started from, for edits */
	version?: number;
};

type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

function session(): DraftStorage | null {
	try {
		return sessionStorage;
	} catch {
		return null;
	}
}

/** the draft key of a new record, an edited record or a questionnaire */
export const draftKey = {
	newRecord: (tool: string) => `record:${tool}:new`,
	/** a new entry started from a copy of another or from the tool's example */
	newFrom: (tool: string, source: string) => `record:${tool}:new:${source}`,
	record: (tool: string, id: string) => `record:${tool}:${id}`,
	check: (tool: string, target = '') => `check:${tool}${target ? `:${target}` : ''}`
};

export function loadDraft<T>(key: string, storage = session()): Draft<T> | null {
	try {
		const raw = storage?.getItem(DRAFT_PREFIX + key);
		if (!raw) return null;
		const draft: unknown = JSON.parse(raw);
		return draft && typeof draft === 'object' && 'values' in draft && 'savedAt' in draft
			? (draft as Draft<T>)
			: null;
	} catch {
		return null;
	}
}

export function saveDraft<T>(
	key: string,
	values: T,
	version?: number,
	storage = session(),
	now = new Date()
): void {
	const draft: Draft<T> = { values, savedAt: now.toISOString(), ...(version ? { version } : {}) };
	try {
		storage?.setItem(DRAFT_PREFIX + key, JSON.stringify(draft));
	} catch {
		// storage full or blocked: the draft lasts as long as the page
	}
}

export function clearDraft(key: string, storage = session()): void {
	try {
		storage?.removeItem(DRAFT_PREFIX + key);
	} catch {
		// nothing to clear
	}
}

/** every draft of this tab, e.g. on logout */
export function clearDrafts(storage = session()): void {
	try {
		if (!storage) return;
		const keys: string[] = [];
		for (let i = 0; i < storage.length; i++) {
			const key = storage.key(i);
			if (key?.startsWith(DRAFT_PREFIX)) keys.push(key);
		}
		for (const key of keys) storage.removeItem(key);
	} catch {
		// nothing to clear
	}
}
