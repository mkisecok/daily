import type { Answers, Localized } from '../../tools/types.js';
import type { ValidationErrors } from '../validate.js';
import type { Deadline, RecordEvent, StoredRecord } from '../types.js';

export type StoreError =
	| { ok: false; error: 'not-found' | 'unknown-tool' | 'not-workflow' | 'not-allowed' }
	| { ok: false; error: 'invalid'; errors: ValidationErrors }
	| { ok: false; error: 'missing'; missing: string[] }
	/** a transition's own check failed; `reason` says why */
	| { ok: false; error: 'blocked'; reason: Localized }
	/** someone saved in between; `current` is the stored record */
	| { ok: false; error: 'conflict'; current: StoredRecord };

export type ListOptions = { archived?: boolean };

export type StoreResult<T> = { ok: true; value: T } | StoreError;

export type RecordDetail = { record: StoredRecord; events: RecordEvent[]; deadlines: Deadline[] };

/**
 * persistence for register and workflow records. The full app talks to
 * Postgres through `/api/records`; the public preview keeps everything in
 * the browser. Both apply the same validation, transitions and deadlines.
 */
export interface RecordStore {
	/** records of one tool, newest change first; live ones, or only the archived ones */
	list(toolSlug: string, options?: ListOptions): Promise<StoredRecord[]>;
	get(id: string): Promise<RecordDetail | null>;
	create(toolSlug: string, input: Record<string, unknown>): Promise<StoreResult<StoredRecord>>;
	update(
		id: string,
		input: Record<string, unknown>,
		expectedVersion: number
	): Promise<StoreResult<StoredRecord>>;
	transition(id: string, to: string, expectedVersion: number): Promise<StoreResult<StoredRecord>>;
	/**
	 * evaluates questionnaire answers and stores the result in an assessment
	 * field, plus the values the record tool derives from it
	 */
	attachAssessment(
		id: string,
		field: string,
		answers: Answers,
		expectedVersion: number
	): Promise<StoreResult<StoredRecord>>;
	archive(id: string): Promise<StoreResult<StoredRecord>>;
	/** brings an archived record back; its deadlines open again */
	unarchive(id: string): Promise<StoreResult<StoredRecord>>;
	/** open deadlines across all record tools, earliest first */
	deadlines(): Promise<Deadline[]>;
}
