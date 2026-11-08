import { computeDeadlines } from '../deadlines.js';
import { getQuestionnaire as registryQuestionnaire } from '../../tools/registry.js';
import {
	checkReferences,
	isError,
	planAssessmentFromAnswers,
	planCreate,
	planTransition,
	planUpdate,
	type Planned,
	type Questionnaire
} from '../operations.js';
import type { RecordEvent, RecordTool, StoredRecord } from '../types.js';
import type { RecordStore, StoreError, StoreResult } from './types.js';

export const STORAGE_KEY = 'daily.records.v1';
/** where an unreadable store is kept, so the next save does not destroy it */
export const BACKUP_KEY = `${STORAGE_KEY}.unreadable`;
/** history kept per record; older events go first */
export const MAX_EVENTS_PER_RECORD = 200;
/** history kept per record when the browser's storage is full */
const EVENTS_WHEN_FULL = 20;

type Saved = { records: StoredRecord[]; events: RecordEvent[] };

type Options = {
	getTool: (slug: string) => RecordTool | undefined;
	getQuestionnaire?: (slug: string) => Questionnaire | undefined;
	now?: () => Date;
	newId?: () => string;
};

/**
 * records in `localStorage` for the public preview: nothing leaves the
 * device. Same rules as the server through the shared planning functions.
 * Reads tolerate missing or blocked storage; failed writes throw so the
 * page can say the entry was not saved.
 */
export function createBrowserStore(
	storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
	{
		getTool,
		getQuestionnaire = registryQuestionnaire,
		now = () => new Date(),
		newId = () => crypto.randomUUID()
	}: Options
): RecordStore & { clear(): void } {
	function read(): string | null {
		try {
			return storage.getItem(STORAGE_KEY);
		} catch {
			return null;
		}
	}

	function load(): Saved {
		const raw = read();
		if (!raw) return { records: [], events: [] };
		try {
			const saved = JSON.parse(raw) as Partial<Saved>;
			return {
				records: Array.isArray(saved.records) ? saved.records : [],
				events: Array.isArray(saved.events) ? saved.events : []
			};
		} catch {
			// keep the unreadable data aside before the next save replaces it
			try {
				if (storage.getItem(BACKUP_KEY) === null) storage.setItem(BACKUP_KEY, raw);
			} catch {
				// nothing more can be done without storage
			}
			return { records: [], events: [] };
		}
	}

	/** the newest `limit` events of each record, in their original order */
	function trimEvents(events: RecordEvent[], limit: number): RecordEvent[] {
		const kept = new Map<string, number>();
		const keep = new Set<RecordEvent>();
		for (let i = events.length - 1; i >= 0; i--) {
			const count = kept.get(events[i].recordId) ?? 0;
			if (count < limit) {
				keep.add(events[i]);
				kept.set(events[i].recordId, count + 1);
			}
		}
		return events.filter((event) => keep.has(event));
	}

	/**
	 * writes the store, keeping the history of each record bounded. When the
	 * storage is full, the history is cut back further before giving up, so
	 * the records themselves can still be saved.
	 */
	function save(saved: Saved) {
		const events = trimEvents(saved.events, MAX_EVENTS_PER_RECORD);
		try {
			storage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, events }));
		} catch (error) {
			const fewer = trimEvents(events, EVENTS_WHEN_FULL);
			if (fewer.length === events.length) throw error;
			storage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, events: fewer }));
		}
	}

	function event(
		recordId: string,
		kind: RecordEvent['kind'],
		planned: Pick<Planned, 'changes'> | null,
		fromState: string | null,
		toState: string | null
	): RecordEvent {
		return {
			id: newId(),
			recordId,
			kind,
			changes: planned?.changes ?? {},
			fromState,
			toState,
			at: now().toISOString()
		};
	}

	async function write(
		id: string,
		kind: RecordEvent['kind'],
		plan: (tool: RecordTool, current: StoredRecord) => Planned | StoreError
	): Promise<StoreResult<StoredRecord>> {
		const saved = load();
		const index = saved.records.findIndex((r) => r.id === id);
		if (index === -1) return { ok: false, error: 'not-found' };
		const current = saved.records[index];
		const tool = getTool(current.toolSlug);
		if (!tool) return { ok: false, error: 'unknown-tool' };
		const planned = plan(tool, current);
		if (isError(planned)) return planned;
		if (kind === 'updated' && Object.keys(planned.changes).length === 0) {
			return { ok: true, value: current };
		}
		const broken = checkReferences(tool.definition, planned.data, toolOf(saved));
		if (broken) return broken;
		const next: StoredRecord = {
			...current,
			data: planned.data,
			title: planned.title,
			state: planned.state,
			definitionVersion: tool.definition.version,
			version: current.version + 1,
			updatedAt: now().toISOString()
		};
		saved.records[index] = next;
		saved.events.push(event(id, kind, planned, current.state, planned.state));
		save(saved);
		return { ok: true, value: next };
	}

	function toolOf(saved: Saved) {
		return (id: string) => saved.records.find((r) => r.id === id)?.toolSlug;
	}

	function openDeadlines(records: StoredRecord[]) {
		return records.flatMap((record) => {
			const tool = getTool(record.toolSlug);
			return tool ? computeDeadlines(tool, record) : [];
		});
	}

	return {
		async list(toolSlug, options) {
			const archived = options?.archived ?? false;
			return load()
				.records.filter((r) => r.toolSlug === toolSlug && Boolean(r.archivedAt) === archived)
				.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
		},

		async get(id) {
			const saved = load();
			const record = saved.records.find((r) => r.id === id);
			if (!record) return null;
			return {
				record,
				events: saved.events.filter((e) => e.recordId === id),
				deadlines: openDeadlines([record])
			};
		},

		async create(toolSlug, input) {
			const tool = getTool(toolSlug);
			if (!tool) return { ok: false, error: 'unknown-tool' };
			const planned = planCreate(tool.definition, input);
			if (isError(planned)) return planned;
			const saved = load();
			const broken = checkReferences(tool.definition, planned.data, toolOf(saved));
			if (broken) return broken;
			const at = now().toISOString();
			const record: StoredRecord = {
				id: newId(),
				toolSlug,
				definitionVersion: tool.definition.version,
				state: planned.state,
				title: planned.title,
				data: planned.data,
				version: 1,
				createdAt: at,
				updatedAt: at,
				archivedAt: null
			};
			saved.records.push(record);
			saved.events.push(event(record.id, 'created', planned, null, planned.state));
			save(saved);
			return { ok: true, value: record };
		},

		update(id, input, expectedVersion) {
			return write(id, 'updated', (tool, current) =>
				planUpdate(tool.definition, current, input, expectedVersion)
			);
		},

		transition(id, to, expectedVersion) {
			return write(id, 'transition', (tool, current) =>
				planTransition(tool.definition, current, to, expectedVersion)
			);
		},

		attachAssessment(id, field, answers, expectedVersion) {
			return write(id, 'assessment', (tool, current) =>
				planAssessmentFromAnswers(
					tool,
					current,
					field,
					answers,
					expectedVersion,
					getQuestionnaire,
					now().toISOString()
				)
			);
		},

		async archive(id) {
			const saved = load();
			const index = saved.records.findIndex((r) => r.id === id);
			if (index === -1) return { ok: false, error: 'not-found' };
			const current = saved.records[index];
			if (current.archivedAt) return { ok: true, value: current };
			const at = now().toISOString();
			const next = { ...current, archivedAt: at, updatedAt: at, version: current.version + 1 };
			saved.records[index] = next;
			saved.events.push(event(id, 'archived', null, null, null));
			save(saved);
			return { ok: true, value: next };
		},

		async unarchive(id) {
			const saved = load();
			const index = saved.records.findIndex((r) => r.id === id);
			if (index === -1) return { ok: false, error: 'not-found' };
			const current = saved.records[index];
			if (!current.archivedAt) return { ok: true, value: current };
			const at = now().toISOString();
			const next = { ...current, archivedAt: null, updatedAt: at, version: current.version + 1 };
			saved.records[index] = next;
			saved.events.push(event(id, 'restored', null, null, null));
			save(saved);
			return { ok: true, value: next };
		},

		async deadlines() {
			return openDeadlines(load().records).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
		},

		clear() {
			try {
				storage.removeItem(STORAGE_KEY);
			} catch {
				// blocked storage holds nothing to clear
			}
		}
	};
}
