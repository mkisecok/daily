import type { ValidationErrors } from '../validate.js';
import type {
	AssessmentSnapshot,
	Deadline,
	RecordData,
	RecordEvent,
	StoredRecord
} from '../types.js';

export type StoreError =
	| { ok: false; error: 'not-found' | 'unknown-tool' | 'not-workflow' | 'not-allowed' }
	| { ok: false; error: 'invalid'; errors: ValidationErrors }
	| { ok: false; error: 'missing'; missing: string[] }
	/** Someone saved in between; `current` is the stored record. */
	| { ok: false; error: 'conflict'; current: StoredRecord };

export type StoreResult<T> = { ok: true; value: T } | StoreError;

export type RecordDetail = { record: StoredRecord; events: RecordEvent[]; deadlines: Deadline[] };

/**
 * Persistence for register and workflow records. The full app talks to
 * Postgres through `/api/records`; the public preview keeps everything in
 * the browser. Both apply the same validation, transitions and deadlines.
 */
export interface RecordStore {
	/** Records of one tool, newest change first; archived ones excluded. */
	list(toolSlug: string): Promise<StoredRecord[]>;
	get(id: string): Promise<RecordDetail | null>;
	create(toolSlug: string, input: Record<string, unknown>): Promise<StoreResult<StoredRecord>>;
	update(
		id: string,
		input: Record<string, unknown>,
		expectedVersion: number
	): Promise<StoreResult<StoredRecord>>;
	transition(id: string, to: string, expectedVersion: number): Promise<StoreResult<StoredRecord>>;
	/** Stores a questionnaire result in an assessment field, plus derived values. */
	attachAssessment(
		id: string,
		field: string,
		snapshot: AssessmentSnapshot,
		derived?: RecordData
	): Promise<StoreResult<StoredRecord>>;
	archive(id: string): Promise<StoreResult<StoredRecord>>;
	/** Open deadlines across all record tools, earliest first. */
	deadlines(): Promise<Deadline[]>;
}
