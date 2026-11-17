import { describe, expect, it } from 'vitest';
import { definition } from './definition.js';
import { noticeHead, noticeParts, noticeReady } from './notice.js';

const example = definition.example as Record<string, unknown>;
const rows = (data: Record<string, unknown>, org: string | null = 'Muster GmbH', details = {}) =>
	noticeParts(data as never, 'de', org, details).flatMap((part) => part.rows);
const answer = (data: Record<string, unknown>, label: string, details = {}) =>
	rows(data, 'Muster GmbH', details).find((row) => row.label === label);

describe('privacy notice from a VVT entry', () => {
	it('follows the letters of Art. 13(1) and (2)', () => {
		const [first, second] = noticeParts(example as never, 'de', 'Muster GmbH');
		expect(first.rows.map((row) => row.letter)).toEqual(['a', 'b', 'c', 'c', 'e', 'f']);
		expect(second.rows.map((row) => row.letter)).toEqual(['a', 'b', 'd', 'e', 'f']);
	});

	it('names the controller with its address and the DPO from the organisation details', () => {
		const details = { anschrift: 'Musterstraße 1, 70173 Stuttgart', dsb: 'Dr. Petra Schmidt' };
		expect(answer(example, 'Verantwortlicher und Kontakt', details)?.value).toBe(
			'Muster GmbH\nMusterstraße 1, 70173 Stuttgart'
		);
		expect(answer(example, 'Datenschutzbeauftragte: Kontakt', details)?.value).toBe(
			'Dr. Petra Schmidt'
		);
		// without them, lines to fill in
		expect(rows(example, null).find((row) => row.letter === 'b')?.fill).toBe(true);
	});

	it('leaves the lines the record cannot hold to fill in and invents nothing', () => {
		const last = rows(example).slice(-2);
		expect(last.map((row) => [row.value, row.fill])).toEqual([
			['', true],
			['', true]
		]);
		expect(answer({}, 'Speicherdauer')).toMatchObject({ value: '' });
		expect(answer({}, 'Speicherdauer')?.fill).toBeUndefined();
	});

	it('asks for the interests, offers the objection and the withdrawal where the bases call for it', () => {
		const interest = { rechtsgrundlagen: ['interesse'] };
		expect(answer(interest, 'Berechtigte Interessen, die verfolgt werden')?.fill).toBe(true);
		expect(answer(interest, 'Widerspruchsrecht')?.value).toContain('Art. 21 Abs. 1');
		expect(answer(interest, 'Widerruf der Einwilligung')).toBeUndefined();
		const consent = { rechtsgrundlagen: ['einwilligung'] };
		expect(answer(consent, 'Widerruf der Einwilligung')?.value).toContain('Art. 7 Abs. 3');
		expect(answer(consent, 'Widerspruchsrecht')).toBeUndefined();
	});

	it('cites each legal basis in full', () => {
		expect(answer(example, 'Rechtsgrundlagen')?.value).toBe(
			'Vertrag oder vorvertragliche Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO)\nRechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO)'
		);
		expect(answer({ rechtsgrundlagen: ['beschaeftigung'] }, 'Rechtsgrundlagen')?.value).toBe(
			'Beschäftigungsverhältnis (Art. 88 DSGVO, § 26 BDSG)'
		);
	});

	it('says when nothing goes to a third country', () => {
		expect(answer({ drittland: false }, 'Übermittlung in Drittländer und Garantien')?.value).toBe(
			'Eine Übermittlung in Drittländer ist nicht vorgesehen.'
		);
		expect(answer({}, 'Übermittlung in Drittländer und Garantien')?.value).toBe('');
	});

	it('is offered for a controller, not for a processor, and heads the notice with the processing', () => {
		expect(noticeReady({ rolle: 'verantwortlicher' })).toBe(true);
		expect(noticeReady({ rolle: 'auftragsverarbeiter' })).toBe(false);
		const head = noticeHead(
			{
				title: 'Bewerbungsverfahren',
				data: { betroffene: ['bewerber'] },
				updatedAt: '2026-11-17T08:00:00Z'
			} as never,
			'Muster GmbH',
			'de'
		);
		expect(head.map((row) => `${row.label}: ${row.value}`)).toEqual([
			'Verantwortlicher: Muster GmbH',
			'Verarbeitung: Bewerbungsverfahren',
			'Für: Bewerber',
			'Stand: 17.11.2026'
		]);
	});
});
