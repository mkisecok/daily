import { error, json } from '@sveltejs/kit';
import type { StoreResult } from '../records/store/types.js';
import { getRecordTool } from '../tools/registry.js';
import { db } from './db/index.js';
import { getActiveOrganisationId } from './org.js';
import { createRecordRepository } from './records.js';

const repository = createRecordRepository(db, getRecordTool);

/** The record store of the signed-in user's active organisation. */
export async function storeFor(locals: App.Locals) {
	if (!locals.user) error(401, 'Not signed in');
	const organisationId = await getActiveOrganisationId(locals.user.id);
	if (!organisationId) error(403, 'No organisation');
	return repository.forOrganisation(organisationId, locals.user.id);
}

/** The JSON object body of a request, or 400. */
export async function readBody(request: Request): Promise<Record<string, unknown>> {
	const body: unknown = await request.json().catch(() => undefined);
	if (!body || typeof body !== 'object' || Array.isArray(body))
		error(400, 'Expected a JSON object');
	return body as Record<string, unknown>;
}

export function readVersion(body: Record<string, unknown>): number {
	const version = body.expectedVersion;
	if (typeof version !== 'number' || !Number.isInteger(version))
		error(400, 'expectedVersion missing');
	return version;
}

const STATUS = {
	'not-found': 404,
	'unknown-tool': 404,
	'not-workflow': 409,
	'not-allowed': 409,
	conflict: 409,
	invalid: 422,
	missing: 422
} as const;

/** The stored record, or the store error as JSON with a matching status. */
export function respond<T>(result: StoreResult<T>, created = false): Response {
	if (result.ok) return json(result.value, { status: created ? 201 : 200 });
	return json(result, { status: STATUS[result.error] });
}
