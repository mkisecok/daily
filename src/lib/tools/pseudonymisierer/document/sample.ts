import { makeDocx, p } from './fixture.js';

/**
 * a made-up letter over two pages to try the document mode on: a name, an
 * address, an IBAN and a passage about health. No value belongs to a real
 * person, the IBAN is the standard documentation example.
 */
export function sampleDocx(): Uint8Array {
	return makeDocx({
		body: [
			p('Krankenkasse Rheinland, Postfach 10 20 30, 50667 Köln'),
			p('Frau Lena Müller-Lüdenscheidt, Kastanienweg 17, 50667 Köln'),
			p('Köln, 14.10.2026'),
			p('Antrag auf Erstattung der Fahrkosten'),
			p('Sehr geehrte Frau Müller-Lüdenscheidt,'),
			p(
				'wir haben Ihren Antrag vom 2. Oktober erhalten. Die Fahrten zur Tagesklinik übernehmen wir ab dem 1. November.'
			),
			p(
				'Nach dem Bericht von Dr. Arslan werden Sie seit März wegen einer depressiven Episode behandelt; die Behandlung dauert voraussichtlich bis Ende Januar.'
			),
			'<w:p><w:r><w:br w:type="page"/></w:r></w:p>',
			p('Die Erstattung überweisen wir auf Ihr Konto IBAN DE89 3704 0044 0532 0130 00.'),
			p('Rückfragen beantworten wir unter lena.mueller@example.de oder +49 221 1234567.'),
			p('Mit freundlichen Grüßen'),
			p('Ihre Krankenkasse Rheinland')
		].join('')
	});
}
