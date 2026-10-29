import { respond, storeFor } from '#lib/server/record-api.js';
import type { RequestHandler } from './$types';

/** `POST`: brings an archived record back */
export const POST: RequestHandler = async ({ params, locals }) => {
	const store = await storeFor(locals);
	return respond(await store.unarchive(params.id));
};
