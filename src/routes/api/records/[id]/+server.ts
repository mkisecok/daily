import { error, json } from '@sveltejs/kit';
import { readBody, readVersion, respond, storeFor } from '#lib/server/record-api.js';
import type { RequestHandler } from './$types';

/** The record with its history and open deadlines. */
export const GET: RequestHandler = async ({ params, locals }) => {
	const store = await storeFor(locals);
	const detail = await store.get(params.id);
	if (!detail) error(404, 'Not found');
	return json(detail);
};

/** `PUT` with `{ data, expectedVersion }`; 409 with the current record on conflict. */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const body = await readBody(request);
	const data = body.data;
	if (!data || typeof data !== 'object' || Array.isArray(data)) error(400, 'data missing');
	const store = await storeFor(locals);
	return respond(await store.update(params.id, data as Record<string, unknown>, readVersion(body)));
};

/** Archives the record; records are never deleted (Art. 5(2) DSGVO). */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const store = await storeFor(locals);
	return respond(await store.archive(params.id));
};
