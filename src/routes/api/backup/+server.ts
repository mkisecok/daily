import { error, json } from '@sveltejs/kit';
import { readBackup } from '#lib/records/backup.js';
import { readBody, storeFor } from '#lib/server/record-api.js';
import type { RequestHandler } from './$types';

/** `GET /api/backup`: every entry of the active organisation, with its history */
export const GET: RequestHandler = async ({ locals }) => {
	const store = await storeFor(locals);
	return json(await store.backup());
};

/**
 * `POST /api/backup` with a backup file: adds the entries not here yet and
 * says how many were added, already present or not readable
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const store = await storeFor(locals);
	const backup = readBackup(await readBody(request));
	if ('error' in backup) error(400, `backup ${backup.error}`);
	return json(await store.restore(backup));
};
