import { allFields } from './validate.js';
import type { RecordData, RecordEvent, RecordTool, StoredRecord } from './types.js';

/** the name in every backup file, so a file from elsewhere is recognised */
export const BACKUP_FORMAT = 'daily-backup';
/** the newest file version this Daily reads */
export const BACKUP_VERSION = 1;

/** every entry of a workspace with its history, as one file */
export type Backup = {
	format: typeof BACKUP_FORMAT;
	version: number;
	createdAt: string;
	records: StoredRecord[];
	events: RecordEvent[];
};

/** what a store hands out for a backup and takes back on restore */
export type BackupContent = Pick<Backup, 'records' | 'events'>;

/** what a restore did: entries added, already there, or not readable here */
export type RestoreSummary = { added: number; present: number; unreadable: number };

export function makeBackup(content: BackupContent, now = new Date()): Backup {
	return {
		format: BACKUP_FORMAT,
		version: BACKUP_VERSION,
		createdAt: now.toISOString(),
		records: content.records,
		events: content.events
	};
}

/** the file name, such as `daily-muster-gmbh-2026-11-17.json` */
export function backupFileName(workspace: string | null | undefined, now = new Date()): string {
	const slug = (workspace ?? '')
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/ß/g, 'ss')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 40);
	return `daily-${slug ? `${slug}-` : ''}${now.toISOString().slice(0, 10)}.json`;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === 'object' && !Array.isArray(value);

/**
 * the backup in a file's parsed JSON, or why it cannot be read: not a
 * Daily backup at all, or made by a newer Daily than this one
 */
export function readBackup(value: unknown): Backup | { error: 'format' | 'version' } {
	if (!isObject(value) || value.format !== BACKUP_FORMAT) return { error: 'format' };
	if (typeof value.version !== 'number' || value.version > BACKUP_VERSION) {
		return { error: 'version' };
	}
	if (!Array.isArray(value.records) || !Array.isArray(value.events)) return { error: 'format' };
	return {
		format: BACKUP_FORMAT,
		version: value.version,
		createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
		records: value.records as StoredRecord[],
		events: value.events as RecordEvent[]
	};
}

const KINDS = new Set<RecordEvent['kind']>([
	'created',
	'updated',
	'transition',
	'assessment',
	'archived',
	'restored'
]);

const isDate = (value: unknown): value is string =>
	typeof value === 'string' && !Number.isNaN(Date.parse(value));

/** a record from a file that this Daily can store: a known tool, its state, a sound shape */
function readable(record: unknown, getTool: (slug: string) => RecordTool | undefined) {
	if (!isObject(record)) return false;
	const { id, toolSlug, title, data, state, version, createdAt, updatedAt, archivedAt } = record;
	if (typeof id !== 'string' || !id || typeof toolSlug !== 'string') return false;
	const tool = getTool(toolSlug);
	if (!tool || typeof title !== 'string' || !isObject(data)) return false;
	if (typeof version !== 'number' || !isDate(createdAt) || !isDate(updatedAt)) return false;
	if (archivedAt !== null && !isDate(archivedAt)) return false;
	const states = tool.definition.workflow?.states.map((s) => s.id);
	return states ? typeof state === 'string' && states.includes(state) : state === null;
}

export type RestorePlan = RestoreSummary & BackupContent;

/**
 * what restoring a backup writes. An entry already in the workspace stays
 * as it is; an entry whose id is used elsewhere (another workspace on the
 * server, or not an id this store can take) gets a new one, and the
 * references to it in the other entries follow. History comes along with
 * new ids of its own.
 */
export function planRestore(
	backup: Backup,
	{
		here,
		free,
		getTool,
		newId
	}: {
		/** the entry is in this workspace already */
		here: (id: string) => boolean;
		/** the id can be stored as it is */
		free: (id: string) => boolean;
		getTool: (slug: string) => RecordTool | undefined;
		newId: () => string;
	}
): RestorePlan {
	const ids = new Map<string, string>();
	const taken: StoredRecord[] = [];
	let present = 0;
	let unreadable = 0;
	for (const record of backup.records) {
		if (!readable(record, getTool)) {
			unreadable++;
		} else if (here(record.id)) {
			present++;
		} else {
			ids.set(record.id, free(record.id) ? record.id : newId());
			taken.push(record);
		}
	}

	const records = taken.map((record): StoredRecord => {
		const data: RecordData = { ...record.data };
		for (const field of allFields(getTool(record.toolSlug)!.definition)) {
			const value = data[field.id];
			if (field.type === 'reference' && typeof value === 'string' && ids.has(value)) {
				data[field.id] = ids.get(value)!;
			}
		}
		return {
			id: ids.get(record.id)!,
			toolSlug: record.toolSlug,
			definitionVersion: record.definitionVersion,
			state: record.state,
			title: record.title,
			data,
			version: record.version,
			createdAt: record.createdAt,
			updatedAt: record.updatedAt,
			archivedAt: record.archivedAt
		};
	});

	const events = backup.events
		.filter(
			(event) =>
				isObject(event) && ids.has(event.recordId) && KINDS.has(event.kind) && isDate(event.at)
		)
		.map((event): RecordEvent => ({
			id: newId(),
			recordId: ids.get(event.recordId)!,
			kind: event.kind,
			changes: isObject(event.changes) ? event.changes : {},
			fromState: event.fromState ?? null,
			toState: event.toState ?? null,
			at: event.at
		}));

	return { added: records.length, present, unreadable, records, events };
}
