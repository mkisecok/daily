/**
 * Feed worker: polls the sources every 30 minutes and on start.
 *
 *   pnpm worker            (development, via tsx)
 *   node build-worker/index.js   (production bundle via pnpm build:worker)
 *
 * Reads DATABASE_URL from the environment. `--once` exits after one pass.
 */
import cron from 'node-cron';
import { createDb } from '#lib/server/db/client.js';
import { runIngest, syncSources } from '#lib/server/feed/ingest.js';

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}
const db = createDb(url);

function log(line: string) {
	console.log(`[${new Date().toISOString()}] ${line}`);
}

async function pass() {
	log('ingest start');
	await syncSources(db);
	const stats = await runIngest(db, log);
	const inserted = stats.reduce((sum, s) => sum + s.inserted, 0);
	const failed = stats.filter((s) => s.error).length;
	log(`ingest done: ${inserted} new items, ${failed} source(s) failed`);
}

await pass();

if (process.argv.includes('--once')) {
	process.exit(0);
}

cron.schedule('*/30 * * * *', () => {
	pass().catch((error) => log(`ingest crashed: ${error}`));
});
log('scheduled every 30 minutes');
