import { error } from '@sveltejs/kit';
import type { Answers } from '#lib/tools/types.js';
import { readBody, readVersion, respond, storeFor } from '#lib/server/record-api.js';
import type { RequestHandler } from './$types';

/**
 * `POST` with `{ field, answers, expectedVersion }`. The server evaluates
 * the answers with the questionnaire the field names; a verdict sent by
 * the client is never stored.
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const body = await readBody(request);
	if (typeof body.field !== 'string') error(400, 'field missing');
	const expectedVersion = readVersion(body);
	const store = await storeFor(locals);
	return respond(
		await store.attachAssessment(params.id, body.field, body.answers as Answers, expectedVersion)
	);
};
