import { describe, expect, it } from 'vitest';
import { testDefinition as def, getTestQuestionnaire, testTool } from './fixtures.js';
import {
	isError,
	planAssessment,
	planAssessmentFromAnswers,
	planCreate,
	planTransition,
	planUpdate,
	readAnswerValues
} from './operations.js';
import type { AssessmentSnapshot, StoredRecord } from './types.js';

function record(overrides: Partial<StoredRecord> = {}): StoredRecord {
	return {
		id: 'r1',
		toolSlug: def.slug,
		definitionVersion: 1,
		state: 'open',
		title: 'Eins',
		data: { name: 'Eins', kind: null, due: null },
		version: 3,
		createdAt: '2026-10-14T08:00:00.000Z',
		updatedAt: '2026-10-14T08:00:00.000Z',
		archivedAt: null,
		...overrides
	};
}

const snapshot: AssessmentSnapshot = {
	tool: 'demo',
	catalogVersion: 1,
	verdict: 'positive',
	outcome: 'ja',
	headline: { de: 'Erforderlich.', en: 'Required.' },
	at: '2026-10-20T08:00:00.000Z'
};

describe('planCreate', () => {
	it('validates, derives the title and starts in the initial state', () => {
		const planned = planCreate(def, { name: 'Neu', kind: 'a' });
		expect(isError(planned)).toBe(false);
		expect(planned).toMatchObject({ title: 'Neu', state: 'open' });
		expect(!isError(planned) && planned.changes.name).toEqual([undefined, 'Neu']);
	});

	it('reports invalid input', () => {
		expect(planCreate(def, { kind: 'a' })).toEqual({
			ok: false,
			error: 'invalid',
			errors: { name: 'required' }
		});
	});
});

describe('planUpdate', () => {
	it('records only the changed fields', () => {
		const planned = planUpdate(def, record(), { name: 'Eins', kind: 'b' }, 3);
		expect(!isError(planned) && planned.changes).toEqual({ kind: [null, 'b'] });
	});

	it('refuses a stale version and returns the stored record', () => {
		const current = record();
		expect(planUpdate(def, current, { name: 'X' }, 2)).toEqual({
			ok: false,
			error: 'conflict',
			current
		});
	});

	it('refuses archived records', () => {
		expect(
			planUpdate(def, record({ archivedAt: '2026-10-15T08:00:00.000Z' }), { name: 'X' }, 3)
		).toEqual({ ok: false, error: 'not-allowed' });
	});

	it('keeps a stored assessment the form does not send', () => {
		const current = record({ data: { name: 'Eins', check: snapshot } });
		const planned = planUpdate(def, current, { name: 'Zwei' }, 3);
		expect(!isError(planned) && planned.data.check).toEqual(snapshot);
		expect(!isError(planned) && 'check' in planned.changes).toBe(false);
	});
});

describe('planTransition', () => {
	it('moves to the next state without touching data', () => {
		const current = record({ data: { name: 'Eins', kind: 'a' } });
		expect(planTransition(def, current, 'review', 3)).toEqual({
			data: current.data,
			title: 'Eins',
			state: 'review',
			changes: {}
		});
	});

	it('refuses stale versions, archived records and missing fields', () => {
		expect(planTransition(def, record(), 'review', 1)).toMatchObject({ error: 'conflict' });
		expect(
			planTransition(def, record({ archivedAt: '2026-10-15T08:00:00.000Z' }), 'review', 3)
		).toEqual({ ok: false, error: 'not-allowed' });
		expect(planTransition(def, record(), 'review', 3)).toEqual({
			ok: false,
			error: 'missing',
			missing: ['kind']
		});
	});
});

describe('planAssessment', () => {
	it('stores the snapshot and derived values', () => {
		const planned = planAssessment(def, record(), 'check', snapshot, { kind: 'b' });
		expect(!isError(planned) && planned.data).toMatchObject({ check: snapshot, kind: 'b' });
		expect(!isError(planned) && Object.keys(planned.changes).sort()).toEqual(['check', 'kind']);
	});

	it('only writes assessment fields of live records', () => {
		expect(planAssessment(def, record(), 'name', snapshot)).toEqual({
			ok: false,
			error: 'not-allowed'
		});
		expect(
			planAssessment(def, record({ archivedAt: '2026-10-15T08:00:00.000Z' }), 'check', snapshot)
		).toEqual({ ok: false, error: 'not-allowed' });
	});

	it('validates derived values against the definition', () => {
		expect(planAssessment(def, record(), 'check', snapshot, { kind: 'c' })).toMatchObject({
			ok: false,
			error: 'invalid'
		});
	});
});

describe('planAssessmentFromAnswers', () => {
	const at = '2026-10-21T08:00:00.000Z';
	const plan = (input: unknown, version = 3, field = 'check') =>
		planAssessmentFromAnswers(testTool, record(), field, input, version, getTestQuestionnaire, at);

	it('evaluates the answers instead of trusting a verdict', () => {
		const planned = plan({ q1: 'yes', q2: 'na', verdict: 'negative' });
		expect(!isError(planned) && planned.data.check).toEqual({
			tool: 'demo',
			catalogVersion: 2,
			verdict: 'positive',
			outcome: 'ja',
			headline: { de: 'Erforderlich.', en: 'Required.' },
			at
		});
		expect(!isError(planned) && planned.data.kind).toBe('a');
		const negative = plan({ q1: 'no', q2: 'yes' });
		expect(!isError(negative) && negative.data.check).toMatchObject({ verdict: 'negative' });
		expect(!isError(negative) && negative.data.check).not.toHaveProperty('outcome');
	});

	it('refuses stale versions, other fields and incomplete or foreign answers', () => {
		expect(plan({ q1: 'yes', q2: 'na' }, 2)).toMatchObject({ error: 'conflict' });
		expect(plan({ q1: 'yes', q2: 'na' }, 3, 'name')).toEqual({ ok: false, error: 'not-allowed' });
		expect(plan({ q1: 'yes' })).toMatchObject({ error: 'invalid', errors: { check: 'invalid' } });
		expect(plan({ q1: 'na', q2: 'na' })).toMatchObject({ error: 'invalid' });
		expect(plan('yes')).toMatchObject({ error: 'invalid' });
	});

	it('needs a questionnaire it knows', () => {
		expect(
			planAssessmentFromAnswers(testTool, record(), 'check', {}, 3, () => undefined, at)
		).toEqual({ ok: false, error: 'unknown-tool' });
	});
});

describe('readAnswerValues', () => {
	const { catalog } = getTestQuestionnaire('demo')!;

	it('keeps the catalogue questions and drops other keys', () => {
		expect(readAnswerValues(catalog, { q1: 'unknown', q2: 'na', extra: 'yes' })).toEqual({
			q1: 'unknown',
			q2: 'na'
		});
	});

	it('rejects non-objects and options a question does not offer', () => {
		expect(readAnswerValues(catalog, null)).toBeNull();
		expect(readAnswerValues(catalog, ['yes'])).toBeNull();
		expect(readAnswerValues(catalog, { q1: 'na', q2: 'yes' })).toBeNull();
	});
});
