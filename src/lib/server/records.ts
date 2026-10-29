import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import { computeDeadlines } from '../records/deadlines.js';
import {
	checkReferences,
	isError,
	planAssessmentFromAnswers,
	referencedIds,
	planCreate,
	planTransition,
	planUpdate,
	type Planned,
	type Questionnaire
} from '../records/operations.js';
import type { RecordStore, StoreError, StoreResult } from '../records/store/types.js';
import type {
	FieldChanges,
	RecordData,
	RecordEvent,
	RecordTool,
	StoredRecord
} from '../records/types.js';
import { isTerminal } from '../records/workflow.js';
import type { Database } from './db/client.js';
import { deadlines, recordEvents, records, users, type RecordRow } from './db/schema.js';

type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];
type EventKind = RecordEvent['kind'];

function toStored(row: RecordRow): StoredRecord {
	return {
		id: row.id,
		toolSlug: row.toolSlug,
		definitionVersion: row.definitionVersion,
		state: row.state,
		title: row.title,
		data: row.data as RecordData,
		version: row.version,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		archivedAt: row.archivedAt?.toISOString() ?? null
	};
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * records in Postgres, scoped to one organisation and acting as one user.
 * Everything coming from the client is validated again with the shared
 * domain rules; deadlines are recomputed in the same transaction as the
 * write, and every write appends a history event.
 */
export function createRecordRepository(
	db: Database,
	getTool: (slug: string) => RecordTool | undefined,
	getQuestionnaire: (slug: string) => Questionnaire | undefined
) {
	return {
		forOrganisation(organisationId: string, userId: string | null): RecordStore {
			async function lock(tx: Tx, id: string) {
				if (!UUID.test(id)) return undefined;
				const [row] = await tx
					.select()
					.from(records)
					.where(and(eq(records.id, id), eq(records.organisationId, organisationId)))
					.for('update');
				return row;
			}

			async function syncDeadlines(tx: Tx, tool: RecordTool, record: StoredRecord) {
				const open = and(eq(deadlines.recordId, record.id), isNull(deadlines.doneAt));
				if (record.archivedAt || isTerminal(tool.definition, record.state)) {
					// closed by the archive or a terminal state: keep them, marked done
					await tx.update(deadlines).set({ doneAt: new Date() }).where(open);
					return;
				}
				const due = computeDeadlines(tool, record);
				await tx.delete(deadlines).where(open);
				if (due.length > 0) {
					await tx.insert(deadlines).values(
						due.map((d) => ({
							organisationId,
							recordId: record.id,
							toolSlug: record.toolSlug,
							kind: d.kind,
							dueAt: new Date(d.dueAt)
						}))
					);
				}
			}

			async function event(
				tx: Tx,
				recordId: string,
				kind: EventKind,
				changes: FieldChanges,
				fromState: string | null = null,
				toState: string | null = null
			) {
				await tx
					.insert(recordEvents)
					.values({ recordId, userId, kind, changes, fromState, toState });
			}

			/**
			 * the tool of each referenced record in this organisation, so a
			 * reference cannot point to a missing record or another tenant's
			 */
			async function referenceCheck(tx: Tx, tool: RecordTool, data: RecordData) {
				const ids = referencedIds(tool.definition, data).filter((id) => UUID.test(id));
				const found =
					ids.length === 0
						? []
						: await tx
								.select({ id: records.id, toolSlug: records.toolSlug })
								.from(records)
								.where(and(inArray(records.id, ids), eq(records.organisationId, organisationId)));
				const tools = new Map(found.map((row) => [row.id, row.toolSlug]));
				return checkReferences(tool.definition, data, (id) => tools.get(id));
			}

			/** runs a planned change on a locked record and bumps its version */
			async function write(
				id: string,
				kind: EventKind,
				plan: (tool: RecordTool, current: StoredRecord) => Planned | StoreError
			): Promise<StoreResult<StoredRecord>> {
				return db.transaction(async (tx) => {
					const row = await lock(tx, id);
					if (!row) return { ok: false, error: 'not-found' } as const;
					const tool = getTool(row.toolSlug);
					if (!tool) return { ok: false, error: 'unknown-tool' } as const;
					const current = toStored(row);
					const planned = plan(tool, current);
					if (isError(planned)) return planned;
					if (kind === 'updated' && Object.keys(planned.changes).length === 0) {
						return { ok: true, value: current } as const;
					}
					const broken = await referenceCheck(tx, tool, planned.data);
					if (broken) return broken;
					const [updated] = await tx
						.update(records)
						.set({
							data: planned.data,
							title: planned.title,
							state: planned.state,
							definitionVersion: tool.definition.version,
							version: row.version + 1,
							updatedBy: userId,
							updatedAt: new Date()
						})
						.where(eq(records.id, id))
						.returning();
					const stored = toStored(updated);
					await event(tx, id, kind, planned.changes, current.state, planned.state);
					await syncDeadlines(tx, tool, stored);
					return { ok: true, value: stored } as const;
				});
			}

			return {
				async list(toolSlug) {
					const rows = await db
						.select()
						.from(records)
						.where(
							and(
								eq(records.organisationId, organisationId),
								eq(records.toolSlug, toolSlug),
								isNull(records.archivedAt)
							)
						)
						.orderBy(desc(records.updatedAt));
					return rows.map(toStored);
				},

				async get(id) {
					if (!UUID.test(id)) return null;
					const [row] = await db
						.select()
						.from(records)
						.where(and(eq(records.id, id), eq(records.organisationId, organisationId)));
					if (!row) return null;
					const record = toStored(row);
					const events = await db
						.select({ event: recordEvents, author: users.displayName })
						.from(recordEvents)
						.leftJoin(users, eq(users.id, recordEvents.userId))
						.where(eq(recordEvents.recordId, id))
						.orderBy(asc(recordEvents.createdAt));
					const tool = getTool(record.toolSlug);
					return {
						record,
						events: events.map(({ event, author }) => ({
							id: event.id,
							recordId: event.recordId,
							kind: event.kind,
							changes: event.changes as FieldChanges,
							fromState: event.fromState,
							toState: event.toState,
							at: event.createdAt.toISOString(),
							author
						})),
						deadlines: tool ? computeDeadlines(tool, record) : []
					};
				},

				async create(toolSlug, input) {
					const tool = getTool(toolSlug);
					if (!tool) return { ok: false, error: 'unknown-tool' };
					const planned = planCreate(tool.definition, input);
					if (isError(planned)) return planned;
					return db.transaction(async (tx) => {
						const broken = await referenceCheck(tx, tool, planned.data);
						if (broken) return broken;
						const [row] = await tx
							.insert(records)
							.values({
								organisationId,
								toolSlug,
								definitionVersion: tool.definition.version,
								state: planned.state,
								title: planned.title,
								data: planned.data,
								createdBy: userId,
								updatedBy: userId
							})
							.returning();
						const stored = toStored(row);
						await event(tx, row.id, 'created', planned.changes, null, planned.state);
						await syncDeadlines(tx, tool, stored);
						return { ok: true, value: stored } as const;
					});
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
							new Date().toISOString()
						)
					);
				},

				async archive(id) {
					return db.transaction(async (tx) => {
						const row = await lock(tx, id);
						if (!row) return { ok: false, error: 'not-found' } as const;
						const tool = getTool(row.toolSlug);
						if (!tool) return { ok: false, error: 'unknown-tool' } as const;
						if (row.archivedAt) return { ok: true, value: toStored(row) } as const;
						const [updated] = await tx
							.update(records)
							.set({
								archivedAt: new Date(),
								version: row.version + 1,
								updatedBy: userId,
								updatedAt: new Date()
							})
							.where(eq(records.id, id))
							.returning();
						const stored = toStored(updated);
						await event(tx, id, 'archived', {});
						await syncDeadlines(tx, tool, stored);
						return { ok: true, value: stored } as const;
					});
				},

				async deadlines() {
					const ids = await db
						.selectDistinct({ id: deadlines.recordId })
						.from(deadlines)
						.where(and(eq(deadlines.organisationId, organisationId), isNull(deadlines.doneAt)));
					if (ids.length === 0) return [];
					const rows = await db
						.select()
						.from(records)
						.where(
							and(
								inArray(
									records.id,
									ids.map((r) => r.id)
								),
								isNull(records.archivedAt)
							)
						);
					return rows
						.flatMap((row) => {
							const tool = getTool(row.toolSlug);
							return tool ? computeDeadlines(tool, toStored(row)) : [];
						})
						.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
				}
			};
		}
	};
}

export type RecordRepository = ReturnType<typeof createRecordRepository>;
