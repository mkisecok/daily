import { error, json } from '@sveltejs/kit';
import { readBody, respond, storeFor } from '#lib/server/record-api.js';
import type { RequestHandler } from './$types';

/** `GET /api/records?tool=<slug>`: the active organisation's records of one tool */
export const GET: RequestHandler = async ({ url, locals }) => {
	const tool = url.searchParams.get('tool');
	if (!tool) error(400, 'tool missing');
	const store = await storeFor(locals);
	return json(await store.list(tool));
};

/** `POST /api/records` with `{ tool, data }` */
export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await readBody(request);
	if (typeof body.tool !== 'string') error(400, 'tool missing');
	const data = body.data;
	if (!data || typeof data !== 'object' || Array.isArray(data)) error(400, 'data missing');
	const store = await storeFor(locals);
	return respond(await store.create(body.tool, data as Record<string, unknown>), true);
};
