import { describe, expect, it } from 'vitest';
import { getLesson } from '../tools/registry.js';
import { detailsOf, fill, lessonSlots } from './slots.js';

describe('organisation details in lessons', () => {
	it('fills a detail where the organisation has one and marks it where not', () => {
		const details = detailsOf({
			meldeweg: '  datenpanne@beispiel.de\nTelefon 0711 123-99 ',
			dsb: ''
		});
		expect(details).toEqual({ meldeweg: 'datenpanne@beispiel.de, Telefon 0711 123-99' });
		expect(fill('Meldeweg: {meldeweg}', details, 'de')).toBe(
			'Meldeweg: datenpanne@beispiel.de, Telefon 0711 123-99'
		);
		expect(fill('Kontakt: {dsb}', details, 'de')).toBe('Kontakt: [Name, Telefon, E-Mail]');
		expect(fill('Contact: {dsb}', details, 'en')).toBe('Contact: [name, phone, e-mail]');
		expect(fill('{unbekannt} bleibt', details, 'de')).toBe('{unbekannt} bleibt');
	});

	it('knows which details a lesson needs', () => {
		expect(lessonSlots(getLesson('schulung-datenpanne')!)).toEqual([
			'meldeweg',
			'dsb',
			'ausserhalb'
		]);
	});
});
