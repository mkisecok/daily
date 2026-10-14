import { describe, expect, it } from 'vitest';
import { testTool } from '../records/fixtures.js';
import type { Deadline, StoredRecord } from '../records/types.js';
import { composeReport, KIND_CATEGORIES } from './compose.js';

const record = (
	id: string,
	state: string,
	createdAt: string,
	updatedAt = createdAt
): StoredRecord => ({
	id,
	toolSlug: 'test-register',
	definitionVersion: 1,
	state,
	title: `Eintrag ${id}`,
	data: { name: `Eintrag ${id}` },
	version: 1,
	createdAt,
	updatedAt,
	archivedAt: null
});

const tool = {
	...testTool,
	engine: {
		...testTool.engine,
		assess: (r: { state: string | null }) => ({
			verdict: r.state === 'done' ? ('negative' as const) : ('positive' as const),
			headline:
				r.state === 'done' ? { de: 'Erledigt.', en: 'Done.' } : { de: 'Offen.', en: 'Open.' },
			explanation: { de: '', en: '' },
			reasons: [],
			citations: []
		})
	}
};

const deadline = (dueAt: string): Deadline => ({
	kind: 'due',
	label: { de: 'Fällig', en: 'Due' },
	dueAt,
	recordId: 'a',
	toolSlug: 'test-register',
	recordTitle: 'Eintrag a'
});

describe('report composition', () => {
	const report = composeReport({
		tools: [tool],
		questionnaires: [{ slug: 'dsfa-schwellwert', name: { de: 'DSFA', en: 'DPIA' } }],
		records: {
			'test-register': [
				record('a', 'open', '2026-03-01T10:00:00.000Z'),
				record('b', 'done', '2025-11-01T10:00:00.000Z', '2026-05-01T10:00:00.000Z'),
				record('c', 'done', '2025-06-01T10:00:00.000Z')
			]
		},
		deadlines: [
			deadline('2026-10-01T08:00:00.000Z'),
			deadline('2026-11-01T08:00:00.000Z'),
			deadline('2027-06-01T08:00:00.000Z')
		],
		runs: [
			{
				toolSlug: 'dsfa-schwellwert',
				createdAt: '2026-02-01T10:00:00.000Z',
				verdict: 'positive',
				headline: { de: 'DSFA erforderlich.', en: 'DPIA required.' }
			},
			{
				toolSlug: 'dsfa-schwellwert',
				createdAt: '2026-04-01T10:00:00.000Z',
				verdict: 'positive',
				headline: { de: 'DSFA erforderlich.', en: 'DPIA required.' }
			},
			{
				toolSlug: 'dsfa-schwellwert',
				createdAt: '2025-04-01T10:00:00.000Z',
				verdict: 'negative',
				headline: { de: 'Keine DSFA.', en: 'No DPIA.' }
			}
		],
		period: { from: '2026-01-01', to: '2026-12-31' },
		locale: 'de',
		now: new Date('2026-10-14T10:00:00.000Z')
	});

	it('counts records, new and changed ones in the period', () => {
		expect(report.sections).toHaveLength(1);
		expect(report.sections[0]).toMatchObject({ total: 3, created: 1, updated: 1 });
		expect(report.sections[0].items.map((i) => i.id)).toEqual(['b', 'a']);
	});

	it('groups records by state and by the tool’s own assessment', () => {
		expect(report.sections[0].states).toEqual([
			{ label: 'Offen', count: 1, terminal: false },
			{ label: 'Erledigt', count: 2, terminal: true }
		]);
		expect(report.sections[0].outcomes.map((o) => [o.headline.de, o.count])).toEqual([
			['Offen.', 1],
			['Erledigt.', 2]
		]);
	});

	it('splits deadlines into overdue and the next 90 days', () => {
		expect(report.deadlines.overdue.map((d) => d.dueAt)).toEqual(['2026-10-01T08:00:00.000Z']);
		expect(report.deadlines.upcoming.map((d) => d.dueAt)).toEqual(['2026-11-01T08:00:00.000Z']);
	});

	it('counts questionnaire runs in the period by result', () => {
		expect(report.runs).toEqual([
			{
				slug: 'dsfa-schwellwert',
				name: { de: 'DSFA', en: 'DPIA' },
				count: 2,
				outcomes: [
					{
						headline: { de: 'DSFA erforderlich.', en: 'DPIA required.' },
						verdict: 'positive',
						count: 2
					}
				]
			}
		]);
	});

	it('maps report kinds to categories', () => {
		expect(KIND_CATEGORIES.datenschutz).toEqual(['datenschutz']);
		expect(KIND_CATEGORIES.gesamt).toHaveLength(4);
	});
});
