import type { RecordToolDefinition } from '../../records/types.js';
import type { Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });

/**
 * a memo of advice given: what was asked, what was recommended, to whom and
 * when, and what became of it. It lets the officer find an old answer in
 * minutes and shows later that the advice was given.
 */
export const definition: RecordToolDefinition = {
	slug: 'beratungsvermerk',
	version: 1,
	intro: L(
		'Ein Vermerk je Beratung: nach einem Telefonat, einer Besprechung oder einer E-Mail festhalten, was gefragt war und was empfohlen wurde. So lässt sich später in Minuten finden, was zu einer Frage geraten wurde, und nachweisen, dass beraten und gewarnt wurde. Die Entscheidung trifft der Verantwortliche; der Vermerk hält fest, ob er der Empfehlung gefolgt ist.',
		'One memo per piece of advice: after a call, a meeting or an email, record what was asked and what was recommended. Later it takes minutes to find what was advised on a question, and to show that advice and warnings were given. The controller decides; the memo records whether the recommendation was followed.'
	),
	sources: [{ law: 'DSGVO', ref: 'Art. 39 Abs. 1 lit. a, Art. 38 Abs. 1' }],
	titleField: 'betreff',
	sections: [
		{
			id: 'anlass',
			title: L('Anlass', 'Occasion'),
			columns: 2,
			fields: [
				{
					id: 'betreff',
					type: 'text',
					label: L('Betreff', 'Subject'),
					help: L(
						'Z. B. „Speicherdauer der Kameraaufnahmen“.',
						'E.g. "Retention of camera footage".'
					),
					required: true,
					listColumn: true
				},
				{
					id: 'datum',
					type: 'date',
					label: L('Datum', 'Date'),
					required: true,
					listColumn: true
				},
				{
					id: 'vorgang',
					type: 'reference',
					tool: 'vorgang',
					label: L('Vorgang', 'Matter'),
					listColumn: true
				},
				{
					id: 'angefragt_von',
					type: 'text',
					label: L('Angefragt von', 'Asked by'),
					listColumn: true
				},
				{
					id: 'weg',
					type: 'select',
					label: L('Weg', 'Channel'),
					options: [
						{ value: 'besprechung', label: L('Besprechung', 'Meeting') },
						{ value: 'telefon', label: L('Telefonat', 'Phone call') },
						{ value: 'video', label: L('Videokonferenz', 'Video call') },
						{ value: 'email', label: L('E-Mail', 'Email') },
						{ value: 'schriftlich', label: L('Schriftliche Stellungnahme', 'Written opinion') }
					]
				},
				{
					id: 'teilnehmende',
					type: 'text',
					label: L('Teilnehmende', 'Participants')
				}
			]
		},
		{
			id: 'beratung',
			title: L('Beratung', 'Advice'),
			fields: [
				{
					id: 'frage',
					type: 'textarea',
					label: L('Frage oder Sachverhalt', 'Question or facts'),
					required: true
				},
				{
					id: 'empfehlung',
					type: 'textarea',
					label: L('Empfehlung', 'Recommendation'),
					help: L(
						'Was wurde geraten, wovor gewarnt? Mit der Vorschrift, auf die es ankommt.',
						'What was advised, what was warned against? With the provision that matters.'
					),
					required: true
				},
				{
					id: 'empfehlung_an',
					type: 'text',
					label: L('Empfehlung ging an', 'Recommendation went to')
				}
			]
		},
		{
			id: 'folge',
			title: L('Was daraus wurde', 'What became of it'),
			columns: 2,
			fields: [
				{
					id: 'umsetzung',
					type: 'select',
					label: L('Umsetzung', 'Follow-up'),
					options: [
						{ value: 'offen', label: L('Offen', 'Open') },
						{ value: 'gefolgt', label: L('Gefolgt', 'Followed') },
						{ value: 'teilweise', label: L('Teilweise gefolgt', 'Partly followed') },
						{ value: 'nicht_gefolgt', label: L('Nicht gefolgt', 'Not followed') }
					],
					listColumn: true
				},
				{
					id: 'nachfragen_am',
					type: 'date',
					label: L('Nachfragen am', 'Ask again on'),
					help: L(
						'Solange die Umsetzung offen ist, erinnert Daily an diesem Tag.',
						'While the follow-up is open, Daily reminds you on this day.'
					)
				},
				{
					id: 'entscheidung',
					type: 'textarea',
					label: L('Entscheidung des Verantwortlichen', 'Decision of the controller'),
					help: L(
						'Wer hat wann entschieden, besonders wenn der Empfehlung nicht gefolgt wurde.',
						'Who decided and when, especially when the recommendation was not followed.'
					)
				}
			]
		}
	],
	example: {
		betreff: 'Speicherdauer der Kameraaufnahmen (Beispiel)',
		datum: '2026-11-10',
		angefragt_von: 'Logistik, Herr Beispiel',
		weg: 'telefon',
		frage:
			'Die Logistik möchte die Aufnahmen der Laderampen 30 Tage speichern, um Diebstähle auch später aufklären zu können.',
		empfehlung:
			'72 Stunden als Regel empfohlen, weil ein Diebstahl an der Rampe spätestens am nächsten Werktag auffällt; länger nur mit dokumentiertem Grund (Art. 5 Abs. 1 lit. e DSGVO, Orientierungshilfe der DSK zur Videoüberwachung). Vor 30 Tagen ausdrücklich gewarnt.',
		empfehlung_an: 'Leitung Logistik, Kopie an die Geschäftsführung',
		umsetzung: 'offen',
		nachfragen_am: '2026-11-24'
	}
};
