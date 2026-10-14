import { json } from '@sveltejs/kit';
import { storeFor } from '#lib/server/record-api.js';
import type { RequestHandler } from './$types';

/** Open deadlines of the active organisation, earliest first. */
export const GET: RequestHandler = async ({ locals }) => {
	const store = await storeFor(locals);
	return json(await store.deadlines());
};
