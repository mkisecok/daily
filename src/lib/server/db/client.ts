import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

/**
 * Database client factory shared by the SvelteKit app (which reads the URL
 * from `$app/env/private`) and the worker (which reads `process.env`).
 */
export function createDb(url: string) {
	const client = postgres(url, { max: 5 });
	return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;
