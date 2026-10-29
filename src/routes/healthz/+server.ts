import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import type { RequestHandler } from './$types';

/** the static preview has no server; this route exists only in the Node build */
export const prerender = false;

/**
 * liveness for the container healthcheck and uptime monitoring: 200 when the
 * database answers, 503 otherwise. Says nothing else about the system.
 */
export const GET: RequestHandler = async () => {
	try {
		await db.execute(sql`select 1`);
		return new Response('ok', { headers: { 'cache-control': 'no-store' } });
	} catch {
		return new Response('unavailable', { status: 503, headers: { 'cache-control': 'no-store' } });
	}
};
