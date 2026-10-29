import { error, json } from '@sveltejs/kit';
import { buildAccountExport } from '#lib/server/account.js';
import { db } from '#lib/server/db/index.js';
import type { RequestHandler } from './$types';

export const prerender = false;

/** the user's data as a JSON download (Art. 15 and 20 GDPR); never cached */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Not signed in');
	const now = new Date();
	const data = await buildAccountExport(db, locals.user.id, now);
	return json(data, {
		headers: {
			'cache-control': 'no-store',
			'content-disposition': `attachment; filename="daily-export-${now.toISOString().slice(0, 10)}.json"`
		}
	});
};
