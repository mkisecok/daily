import { describe, expect, it } from 'vitest';
import aimsGap from './aims-gap/catalog.json' with { type: 'json' };
import einwilligungCheck from './einwilligung-check/catalog.json' with { type: 'json' };
import technischeDokumentation from './technische-dokumentation/catalog.json' with { type: 'json' };

type Catalog = { sections: { questions: { id: string; help?: { de: string; en: string } }[] }[] };

const catalogs: [string, Catalog][] = [
	['einwilligung-check', einwilligungCheck],
	['technische-dokumentation', technischeDokumentation],
	['aims-gap', aimsGap]
];

describe('help texts', () => {
	it.each(catalogs)('%s: every question has help in both languages', (_, catalog) => {
		const missing = catalog.sections
			.flatMap((section) => section.questions)
			.filter((question) => !question.help?.de || !question.help.en)
			.map((question) => question.id);
		expect(missing).toEqual([]);
	});
});
