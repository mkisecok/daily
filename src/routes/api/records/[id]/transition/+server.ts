import { error } from '@sveltejs/kit';
import { readBody, readVersion, respond, storeFor } from '#lib/server/record-api.js';
import type { RequestHandler } from './$types';

/** `POST` with `{ to, expectedVersion }` */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const body = await readBody(request);
	if (typeof body.to !== 'string') error(400, 'to missing');
	const store = await storeFor(locals);
	return respond(await store.transition(params.id, body.to, readVersion(body)));
};
