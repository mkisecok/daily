import { describe, expect, it } from 'vitest';
import { engine } from './engine.js';

const view = (data: Record<string, unknown>, state = 'offen') => ({ state, data }) as never;

describe('Vorgang', () => {
	it('turns the next step into a deadline with its own words', () => {
		const out = engine.deadlines!(
			view({ naechster_schritt: 'Lageplan anfordern', faellig_am: '2026-11-20' })
		);
		expect(out).toHaveLength(1);
		expect(out[0].label.de).toBe('Lageplan anfordern');
	});

	it('has no deadline without a date or once done', () => {
		expect(engine.deadlines!(view({ naechster_schritt: 'x' }))).toEqual([]);
		expect(engine.deadlines!(view({ faellig_am: '2026-11-20' }, 'erledigt'))).toEqual([]);
		expect(engine.deadlines!(view({ faellig_am: '2026-11-20' }, 'wartet'))).toHaveLength(1);
	});
});
