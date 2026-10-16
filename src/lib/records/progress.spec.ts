import { describe, expect, it } from 'vitest';
import { definition } from '../tools/datenpanne/definition.js';
import { stateProgress } from './progress.js';
import type { RecordEvent } from './types.js';

let at = 0;
const move = (fromState: string, toState: string): RecordEvent => ({
	id: `e${++at}`,
	recordId: 'r1',
	kind: 'transition',
	changes: null,
	fromState,
	toState,
	at: new Date(Date.UTC(2026, 9, 16, 8, at)).toISOString()
});
const status = (state: string, events: RecordEvent[]) =>
	Object.fromEntries(stateProgress(definition, state, events).map((s) => [s.id, s.status]));

describe('workflow progress', () => {
	it('marks only states actually passed as done; a branch not taken is skipped', () => {
		expect(
			status('nicht_meldepflichtig', [
				move('erfasst', 'bewertet'),
				move('bewertet', 'nicht_meldepflichtig')
			])
		).toEqual({
			erfasst: 'done',
			bewertet: 'done',
			gemeldet: 'skipped',
			nicht_meldepflichtig: 'current',
			abgeschlossen: 'upcoming'
		});
	});

	it('shows both outcomes as upcoming before the decision', () => {
		expect(status('bewertet', [move('erfasst', 'bewertet')])).toMatchObject({
			erfasst: 'done',
			bewertet: 'current',
			gemeldet: 'upcoming',
			nicht_meldepflichtig: 'upcoming'
		});
	});

	it('forgets steps that were taken back', () => {
		expect(
			status('erfasst', [move('erfasst', 'bewertet'), move('bewertet', 'erfasst')])
		).toMatchObject({ erfasst: 'current', bewertet: 'upcoming' });
	});

	it('orders events by time and ignores everything but transitions', () => {
		// created in time order, handed over newest first as a history list is
		const events = [
			move('erfasst', 'bewertet'),
			{ ...move('x', 'y'), kind: 'updated' as const },
			move('bewertet', 'gemeldet')
		].reverse();
		expect(status('gemeldet', events)).toMatchObject({
			erfasst: 'done',
			bewertet: 'done',
			gemeldet: 'current',
			nicht_meldepflichtig: 'skipped'
		});
	});
});
