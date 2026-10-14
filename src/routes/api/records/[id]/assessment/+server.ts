import { error } from '@sveltejs/kit';
import type { AssessmentSnapshot, RecordData } from '#lib/records/types.js';
import { readBody, respond, storeFor } from '#lib/server/record-api.js';
import type { RequestHandler } from './$types';

/**
 * `POST` with `{ field, snapshot, derived? }`. The snapshot and derived
 * values are validated against the tool definition like any other input.
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const body = await readBody(request);
	if (typeof body.field !== 'string') error(400, 'field missing');
	const derived = body.derived ?? {};
	if (typeof derived !== 'object' || Array.isArray(derived)) error(400, 'derived invalid');
	const store = await storeFor(locals);
	return respond(
		await store.attachAssessment(
			params.id,
			body.field,
			body.snapshot as AssessmentSnapshot,
			derived as RecordData
		)
	);
};
