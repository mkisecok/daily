import type { LegalBasis, Lesson, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });
const EDPB: LegalBasis = { law: 'EDPB', ref: 'Leitlinien 01/2022' };

/**
 * "Anfragen Betroffener erkennen": for staff in contact with customers,
 * applicants or staff (front office, customer care, HR), about 15 minutes.
 * They learn to recognise a request about personal data in whatever form it
 * comes, that the month runs from receipt, to pass it on the same day, and
 * what not to do themselves. The handling itself is the Betroffenenanfrage
 * tool's; the contact comes from the organisation's details ({dsb}).
 */
export const lesson: Lesson = {
	version: 1,
	audience: L(
		'Empfang, Kundenservice, Personal und alle mit Kontakt nach außen',
		'Front office, customer care, HR and everyone in contact with outsiders'
	),
	minutes: 15,
	topic: 'betroffenenrechte',
	intro: L(
		'Eine kurze Unterweisung für alle, bei denen Anfragen ankommen: am Empfang, im Kundenservice, in der Personalabteilung. Sie lernen, eine Anfrage nach den Rechten der DSGVO zu erkennen, auch wenn sie nicht so heißt, und sie noch am selben Tag weiterzugeben, denn die Frist von einem Monat läuft ab Eingang. Die Bearbeitung selbst geschieht im Werkzeug Betroffenenanfrage.',
		'A short briefing for everyone who receives requests: at reception, in customer care, in HR. They learn to recognise a request under the GDPR rights, even when it is not called that, and to pass it on the same day, because the one-month deadline runs from receipt. The handling itself happens in the Betroffenenanfrage tool.'
	),
	sources: [DSGVO('Art. 12'), DSGVO('Art. 15 bis 21'), EDPB],
	slides: [
		{
			title: L('Worum es geht', 'What this is about'),
			points: [
				L(
					'Jeder Mensch hat Rechte an seinen Daten, auch gegenüber uns',
					'Everyone has rights over their data, towards us as well'
				),
				L(
					'Eine Anfrage kann bei jeder und jedem von uns ankommen',
					'A request can reach any one of us'
				),
				L(
					'Die Organisation muss in der Regel innerhalb eines Monats antworten',
					'The organisation must usually reply within one month'
				),
				L(
					'Ihre Aufgabe: die Anfrage erkennen und sofort weitergeben',
					'Your task: recognise the request and pass it on at once'
				)
			],
			cite: [DSGVO('Art. 12 Abs. 3')]
		},
		{
			title: L('Welche Rechte es gibt', 'Which rights there are'),
			points: [
				L(
					'Auskunft: welche Daten wir haben, wozu und an wen',
					'Access: what data we hold, why and to whom'
				),
				L(
					'Berichtigung falscher und Ergänzung unvollständiger Daten',
					'Rectification of wrong and completion of incomplete data'
				),
				L('Löschung und Einschränkung der Verarbeitung', 'Erasure and restriction of processing'),
				L('Herausgabe der Daten in einem gängigen Format', 'Receiving the data in a common format'),
				L('Widerspruch, etwa gegen Werbung', 'Objection, for example to marketing')
			],
			cite: [DSGVO('Art. 15 bis 18'), DSGVO('Art. 20, 21')]
		},
		{
			title: L('So erkennen Sie eine Anfrage', 'How to recognise a request'),
			points: [
				L(
					'Sie braucht keine Form und keine Fachbegriffe',
					'It needs no particular form and no legal terms'
				),
				L(
					'„Was haben Sie über mich gespeichert?“, „Löschen Sie meine Daten“, „Keine Werbung mehr“',
					'"What have you stored about me?", "Delete my data", "No more marketing"'
				),
				L(
					'Per E-Mail, Brief, Telefon, Chat, soziale Medien oder am Schalter',
					'By e-mail, letter, phone, chat, social media or at the counter'
				),
				L(
					'Auch über einen Anwalt, die Verbraucherzentrale oder die Aufsichtsbehörde',
					'Also through a lawyer, a consumer organisation or the supervisory authority'
				)
			],
			example: L(
				'Eine Kundin schreibt im Chat zur Lieferung: „Und ich will wissen, was Sie alles über mich haben.“',
				'A customer writes in the delivery chat: "And I want to know everything you have about me."'
			),
			cite: [DSGVO('Art. 12 Abs. 1, 2'), EDPB]
		},
		{
			title: L('Die Frist läuft ab Eingang', 'The deadline runs from receipt'),
			points: [
				L(
					'Ein Monat ab dem Tag, an dem die Anfrage irgendwo bei uns eingeht',
					'One month from the day the request arrives anywhere with us'
				),
				L(
					'Nicht erst, wenn die zuständige Stelle sie sieht',
					'Not only when the responsible function sees it'
				),
				L(
					'Verlängern geht nur bei schwierigen Fällen, mit Gründen, und muss im ersten Monat mitgeteilt werden',
					'An extension is only possible for complex cases, with reasons, and must be notified within the first month'
				),
				L(
					'Urlaub und Vertretung halten die Frist nicht an',
					'Holidays and absences do not stop the deadline'
				)
			],
			cite: [DSGVO('Art. 12 Abs. 3'), EDPB]
		},
		{
			title: L('Noch am selben Tag weitergeben', 'Pass it on the same day'),
			points: [
				L('Weitergeben an: {dsb}', 'Pass it on to: {dsb}'),
				L(
					'Mit dem Original, dem Tag des Eingangs und wie sie kam',
					'With the original, the day of receipt and how it came in'
				),
				L(
					'Am Telefon: Name, Rückrufnummer und Anliegen notieren',
					'On the phone: note name, call-back number and request'
				),
				L(
					'Dem Absender nur sagen, dass die Anfrage weitergegeben ist und er Antwort bekommt',
					'Tell the sender only that the request has been passed on and they will get a reply'
				)
			],
			cite: [DSGVO('Art. 12 Abs. 3')]
		},
		{
			title: L('Wer fragt da?', 'Who is asking?'),
			points: [
				L(
					'Keine Daten herausgeben, solange nicht feststeht, wer fragt',
					'Give out no data until it is clear who is asking'
				),
				L(
					'Am Telefon und per E-Mail kann sich jeder als jemand anderes ausgeben',
					'On the phone and by e-mail anyone can pretend to be someone else'
				),
				L(
					'Angehörige, Arbeitgeber oder Kollegen bekommen nur mit Vollmacht Auskunft',
					'Relatives, employers or colleagues get information only with authorisation'
				),
				L(
					'Die Identität prüft die zuständige Stelle, nicht Sie',
					'The responsible function checks the identity, not you'
				)
			],
			cite: [DSGVO('Art. 12 Abs. 6'), DSGVO('Art. 5 Abs. 1 lit. f')]
		},
		{
			title: L('Nicht selbst erledigen', 'Do not deal with it yourself'),
			points: [
				L(
					'Keine Daten auf eigene Faust zusammenstellen oder senden',
					'Do not compile or send data on your own'
				),
				L(
					'Nichts selbst löschen: oft gelten Aufbewahrungsfristen, und die Löschung muss belegt werden',
					'Delete nothing yourself: retention periods often apply, and erasure must be documented'
				),
				L(
					'Nichts versprechen, was die Antwort vorwegnimmt',
					'Promise nothing that anticipates the reply'
				),
				L(
					'Die Anfrage nicht als „unberechtigt“ abtun; das bewertet die zuständige Stelle',
					'Do not dismiss the request as "unjustified"; the responsible function assesses that'
				)
			],
			cite: [DSGVO('Art. 17 Abs. 3'), DSGVO('Art. 12 Abs. 5')]
		},
		{
			title: L('„Keine Werbung mehr“', '"No more marketing"'),
			points: [
				L(
					'Ein Widerspruch gegen Werbung muss immer beachtet werden, ohne Abwägung',
					'An objection to marketing must always be respected, without any balancing'
				),
				L(
					'Sofort weitergeben, damit Newsletter, Post und Anrufe aufhören',
					'Pass it on at once so newsletters, mail and calls stop'
				),
				L(
					'Die Adresse wird für Werbung gesperrt, nicht einfach gelöscht, damit sie nicht wieder hineinrutscht',
					'The address is blocked for marketing, not simply deleted, so it does not slip back in'
				)
			],
			notes: L(
				'Die Sperrliste ist der Nachweis, dass der Widerspruch beachtet wird. Wird die Adresse nur gelöscht, kann sie über einen neuen Import wieder auftauchen.',
				'The block list is the proof that the objection is respected. If the address is only deleted, it can reappear through a new import.'
			),
			cite: [DSGVO('Art. 21 Abs. 2, 3')]
		},
		{
			title: L('Schwierige Fälle', 'Difficult cases'),
			points: [
				L(
					'Verärgerte Anrufer, wiederholte Anfragen, Schreiben vom Anwalt: immer weitergeben',
					'Angry callers, repeated requests, letters from a lawyer: always pass them on'
				),
				L(
					'Anfragen im Streit, etwa nach einer Kündigung, sind trotzdem Anfragen',
					'Requests in a dispute, for example after a dismissal, are still requests'
				),
				L(
					'Post der Aufsichtsbehörde sofort an {dsb}',
					'Mail from the supervisory authority at once to {dsb}'
				)
			],
			cite: [DSGVO('Art. 12 Abs. 5'), EDPB]
		},
		{
			title: L('Das Wichtigste', 'The key points'),
			points: [
				L(
					'Jede Frage nach den eigenen Daten ist eine Anfrage, egal wie sie heißt',
					'Every question about one’s own data is a request, whatever it is called'
				),
				L('Die Frist läuft ab Eingang bei uns', 'The deadline runs from receipt with us'),
				L('Noch am selben Tag weitergeben an {dsb}', 'Pass it on the same day to {dsb}'),
				L(
					'Keine Daten an Unbekannte, nichts selbst löschen oder versenden',
					'No data to strangers, delete or send nothing yourself'
				)
			],
			cite: [DSGVO('Art. 12 Abs. 3')]
		}
	],
	quiz: [
		{
			text: L(
				'Ein Kunde schreibt auf der Facebook-Seite: „Löscht endlich alle meine Daten!“ Was ist das?',
				'A customer writes on the Facebook page: "Finally delete all my data!" What is that?'
			),
			options: [
				{
					text: L('Ein Kommentar, keine Anfrage', 'A comment, not a request'),
					correct: false,
					why: L(
						'Eine Anfrage braucht keine Form; auch ein Kommentar kann eine sein.',
						'A request needs no particular form; a comment can be one too.'
					)
				},
				{
					text: L(
						'Ein Löschantrag, der sofort weitergegeben wird',
						'An erasure request, passed on at once'
					),
					correct: true,
					why: L(
						'Er verlangt Löschung; die Frist läuft ab heute.',
						'He asks for erasure; the deadline runs from today.'
					)
				},
				{
					text: L(
						'Ein Fall, den ich selbst im System lösche',
						'A case I delete in the system myself'
					),
					correct: false,
					why: L(
						'Oft gelten Aufbewahrungsfristen, und die Löschung muss geprüft und belegt werden.',
						'Retention periods often apply, and erasure must be checked and documented.'
					)
				}
			],
			cite: DSGVO('Art. 17 Abs. 1')
		},
		{
			text: L(
				'Wann beginnt der Monat für die Antwort?',
				'When does the month for the reply start?'
			),
			options: [
				{
					text: L(
						'Wenn die zuständige Stelle die Anfrage bekommt',
						'When the responsible function receives the request'
					),
					correct: false,
					why: L(
						'Die Zeit bis zur Weitergabe zählt schon mit.',
						'The time until it is passed on already counts.'
					)
				},
				{
					text: L(
						'Am Tag, an dem sie irgendwo bei uns eingeht',
						'On the day it arrives anywhere with us'
					),
					correct: true,
					why: L(
						'Deshalb wird sie noch am selben Tag weitergegeben.',
						'That is why it is passed on the same day.'
					)
				},
				{
					text: L('Wenn die Anfrage schriftlich vorliegt', 'When the request is in writing'),
					correct: false,
					why: L(
						'Auch eine mündliche Anfrage setzt die Frist in Gang.',
						'An oral request starts the deadline too.'
					)
				}
			],
			cite: DSGVO('Art. 12 Abs. 3')
		},
		{
			text: L(
				'Ein Anrufer sagt, er sei der Ehemann einer Kundin, und will wissen, was sie bestellt hat. Was tun Sie?',
				'A caller says he is a customer’s husband and wants to know what she ordered. What do you do?'
			),
			options: [
				{
					text: L(
						'Auskunft geben, er kennt ja ihre Adresse',
						'Give the information; he knows her address after all'
					),
					correct: false,
					why: L(
						'Die Adresse beweist nichts; Daten gehen nur an die Person selbst oder mit Vollmacht.',
						'The address proves nothing; data goes only to the person or with authorisation.'
					)
				},
				{
					text: L(
						'Keine Auskunft, aber anbieten, dass die Kundin selbst anfragt',
						'No information, but offer that the customer asks herself'
					),
					correct: true,
					why: L(
						'So bekommt die Kundin ihre Daten, und kein Fremder.',
						'That way the customer gets her data, and no stranger does.'
					)
				}
			],
			cite: DSGVO('Art. 5 Abs. 1 lit. f')
		},
		{
			text: L(
				'Jemand schreibt: „Bitte keine Werbung mehr an mich.“ Was gilt?',
				'Someone writes: "Please no more marketing to me." What applies?'
			),
			options: [
				{
					text: L(
						'Erst prüfen, ob unser Interesse an Werbung überwiegt',
						'First check whether our interest in marketing prevails'
					),
					correct: false,
					why: L(
						'Bei Werbung gibt es keine Abwägung; der Widerspruch gilt.',
						'For marketing there is no balancing; the objection applies.'
					)
				},
				{
					text: L(
						'Sofort weitergeben, damit die Adresse für Werbung gesperrt wird',
						'Pass it on at once so the address is blocked for marketing'
					),
					correct: true,
					why: L(
						'Nach einem Widerspruch dürfen die Daten nicht mehr für Werbung genutzt werden.',
						'After an objection the data may no longer be used for marketing.'
					)
				}
			],
			cite: DSGVO('Art. 21 Abs. 3')
		}
	]
};
