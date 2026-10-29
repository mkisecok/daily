/**
 * applies the SQL migrations in `drizzle/` at deploy time, before the app
 * starts. drizzle-kit is a dev dependency, so production uses the runtime
 * migrator instead.
 *
 *   pnpm build:migrate && node build-worker/migrate.js
 *
 * Reads DATABASE_URL from the environment; `MIGRATIONS_DIR` overrides the
 * folder (default `./drizzle`, relative to the working directory).
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const client = postgres(url, { max: 1 });
try {
	await migrate(drizzle(client), {
		migrationsFolder: process.env.MIGRATIONS_DIR ?? './drizzle'
	});
	console.log('migrations applied');
} catch (error) {
	console.error('migration failed:', error);
	process.exitCode = 1;
} finally {
	await client.end();
}
