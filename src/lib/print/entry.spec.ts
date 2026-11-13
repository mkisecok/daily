import { describe, expect, it } from 'vitest';
import { definition } from '../tools/hinweisgebersystem/definition.js';
import type { StoredRecord } from '../records/types.js';
import { printSections } from './entry.js';

const record = (data: StoredRecord['data']): StoredRecord =>
	({
		id: 'r1',
		title: 'Meldestelle',
		state: 'aufbau',
		version: 1,
		data,
		createdAt: '2026-11-13T09:00:00.000Z',
		updatedAt: '2026-11-13T09:00:00.000Z'
	}) as StoredRecord;

describe('entry on paper', () => {
	it('lists filled fields with their legal basis and folds empty ones', () => {
		const sections = printSections(
			definition,
			record({ bezeichnung: 'Meldestelle', v_eingang: 'nein', v_eingang_notiz: 'zu spät' }),
			'de'
		);
		const office = sections.find((s) => s.id === 'meldestelle')!;
		expect(office.rows.map((r) => r.label)).toEqual(['Bezeichnung']);
		expect(office.empty).toContain('Beschäftigte');
		const handling = sections.find((s) => s.id === 'verfahren')!;
		expect(handling.open).toContain(
			'Rückmeldung über Folgemaßnahmen binnen drei Monaten nach der Bestätigung'
		);
		expect(handling.empty).toEqual([]);
		expect(handling.rows[0]).toMatchObject({
			value: 'Nein · zu spät',
			basis: '§ 17 Abs. 1 Nr. 1 HinSchG'
		});
	});

	it('leaves out what the scope hides', () => {
		const ids = printSections(definition, record({ bezeichnung: 'M' }), 'de').map((s) => s.id);
		expect(ids).not.toContain('dritte');
		expect(ids).toContain('verfahren');
	});
});
