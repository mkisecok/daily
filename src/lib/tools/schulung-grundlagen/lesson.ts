import type { LegalBasis, Lesson, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });
const ORP3: LegalBasis = { law: 'BSI', ref: 'ORP.3 Sensibilisierung und Schulung' };

/**
 * "Datenschutz-Grundlagen" for new colleagues, about 25 minutes: what
 * personal data is, the principles as they show in daily work, processing
 * only on instructions, the workplace, passwords, e-mail, phishing, and
 * where requests, breaches and questions go. The DSB contact and the
 * reporting channel come from the organisation's details.
 */
export const lesson: Lesson = {
	version: 1,
	audience: L('Neue Kolleginnen und Kollegen', 'New colleagues'),
	minutes: 25,
	topic: 'grundlagen',
	intro: L(
		'Die Unterweisung für den ersten Arbeitstag oder die ersten Wochen: was personenbezogene Daten sind, wie die Grundsätze der DSGVO im Alltag aussehen, warum Daten nur im Rahmen der eigenen Aufgaben verarbeitet werden, was am Arbeitsplatz, bei Passwörtern und E-Mails zählt, wie man Phishing erkennt, und wohin Anfragen, Pannen und Fragen gehen. Sie belegt, dass Beschäftigte zu Beginn unterwiesen wurden.',
		'The briefing for the first day or the first weeks: what personal data is, how the GDPR principles look in daily work, why data is processed only within one’s own tasks, what counts at the workplace, with passwords and e-mail, how to spot phishing, and where requests, breaches and questions go. It shows that staff were briefed at the start.'
	),
	sources: [
		DSGVO('Art. 4 Nr. 1'),
		DSGVO('Art. 5 Abs. 1'),
		DSGVO('Art. 9 Abs. 1'),
		DSGVO('Art. 29, Art. 32 Abs. 4'),
		DSGVO('Art. 39 Abs. 1 lit. a, b'),
		ORP3
	],
	slides: [
		{
			title: L('Warum Datenschutz uns alle betrifft', 'Why data protection concerns all of us'),
			points: [
				L(
					'Datenschutz schützt Menschen: Kundinnen, Bewerber, Kolleginnen, Patienten',
					'Data protection protects people: customers, applicants, colleagues, patients'
				),
				L(
					'Fast jede Arbeit berührt personenbezogene Daten, oft ohne dass man es merkt',
					'Almost every job touches personal data, often without noticing'
				),
				L(
					'Die meisten Fehler passieren im Alltag, nicht durch Hacker',
					'Most mistakes happen in daily work, not through hackers'
				),
				L(
					'Sie müssen kein Recht auswendig kennen, nur wissen, worauf Sie achten und wen Sie fragen',
					'You need not know the law by heart, only what to watch for and whom to ask'
				)
			],
			notes: L(
				'Ziel der Einheit ist nicht Paragrafenwissen, sondern sicheres Verhalten und der Weg zur Datenschutzbeauftragten.',
				'The aim is not legal knowledge but safe behaviour and knowing the way to the data protection officer.'
			),
			cite: [DSGVO('Art. 1 Abs. 2')]
		},
		{
			title: L('Was sind personenbezogene Daten?', 'What is personal data?'),
			points: [
				L(
					'Alle Angaben, die sich auf eine bestimmte oder bestimmbare Person beziehen',
					'Any information relating to an identified or identifiable person'
				),
				L(
					'Name, Anschrift, E-Mail-Adresse, Telefonnummer, Geburtsdatum',
					'Name, address, e-mail address, phone number, date of birth'
				),
				L(
					'Auch Kundennummer, Personalnummer, Kfz-Kennzeichen, IP-Adresse, Foto',
					'Also customer number, staff number, licence plate, IP address, photo'
				),
				L(
					'Bestimmbar reicht: wenn sich die Person mit anderen Angaben herausfinden lässt',
					'Identifiable is enough: if the person can be found out with other information'
				)
			],
			example: L(
				'„Kundennummer 4711 hat dreimal reklamiert“ ist personenbezogen, auch ohne Namen.',
				'"Customer 4711 complained three times" is personal data, even without a name.'
			),
			cite: [DSGVO('Art. 4 Nr. 1')]
		},
		{
			title: L('Besonders schützenswerte Daten', 'Data that needs special protection'),
			points: [
				L(
					'Gesundheit, auch Krankmeldungen und Diagnosen',
					'Health, including sick notes and diagnoses'
				),
				L(
					'Religion, Weltanschauung, politische Meinung, Gewerkschaftszugehörigkeit',
					'Religion, beliefs, political opinions, trade union membership'
				),
				L(
					'Herkunft, Sexualleben und sexuelle Orientierung',
					'Racial or ethnic origin, sex life and sexual orientation'
				),
				L(
					'Genetische und biometrische Daten, etwa ein Fingerabdruck',
					'Genetic and biometric data, such as a fingerprint'
				),
				L(
					'Für sie gelten strengere Regeln: nur wer sie für seine Aufgabe braucht, sieht sie',
					'Stricter rules apply: only those who need them for their task see them'
				)
			],
			cite: [DSGVO('Art. 9 Abs. 1')]
		},
		{
			title: L('Die Grundsätze im Arbeitsalltag', 'The principles in daily work'),
			points: [
				L('Nur für einen festgelegten Zweck', 'Only for a defined purpose'),
				L('Nur so viele Daten wie nötig', 'Only as much data as needed'),
				L('Richtig und aktuell halten', 'Keep it accurate and up to date'),
				L(
					'Löschen, wenn sie nicht mehr gebraucht werden und keine Aufbewahrungsfrist läuft',
					'Delete it when no longer needed and no retention period applies'
				),
				L('Vor Unbefugten schützen', 'Protect it from unauthorised persons')
			],
			example: L(
				'Für den Versand einer Bestellung braucht es die Anschrift, nicht das Geburtsdatum.',
				'Shipping an order needs the address, not the date of birth.'
			),
			cite: [DSGVO('Art. 5 Abs. 1')]
		},
		{
			title: L('Nur im Rahmen Ihrer Aufgaben', 'Only within your tasks'),
			points: [
				L(
					'Sie verarbeiten Daten nur, soweit es Ihre Aufgabe und die Weisungen der Organisation verlangen',
					'You process data only as your task and the organisation’s instructions require'
				),
				L(
					'Keine Abfragen aus Neugier, auch nicht zu Kolleginnen, Nachbarn oder Prominenten',
					'No look-ups out of curiosity, not about colleagues, neighbours or celebrities either'
				),
				L('Keine dienstlichen Daten für private Zwecke', 'No work data for private purposes'),
				L(
					'Zugriffsrechte, die Sie nicht brauchen, melden Sie',
					'Report access rights you do not need'
				)
			],
			notes: L(
				'Viele Organisationen lassen neue Beschäftigte eine Verpflichtung auf Vertraulichkeit unterschreiben. Sie belegt, dass sie auf diese Pflicht hingewiesen wurden.',
				'Many organisations have new staff sign a confidentiality undertaking. It shows they were made aware of this duty.'
			),
			cite: [DSGVO('Art. 29'), DSGVO('Art. 32 Abs. 4')]
		},
		{
			title: L('Am Arbeitsplatz', 'At the workplace'),
			points: [
				L(
					'Bildschirm sperren, sobald Sie den Platz verlassen',
					'Lock the screen as soon as you leave your desk'
				),
				L(
					'Unterlagen nicht offen liegen lassen, abends wegschließen',
					'Do not leave documents lying open; lock them away at night'
				),
				L('Ausdrucke sofort vom Drucker holen', 'Collect printouts from the printer at once'),
				L(
					'Akten und Datenträger nur in den vorgesehenen Behältern entsorgen',
					'Dispose of files and storage media only in the containers provided'
				),
				L(
					'Vertrauliches nicht in Bahn, Café oder am offenen Telefon besprechen',
					'Do not discuss confidential matters on the train, in a café or on an open phone'
				)
			],
			cite: [DSGVO('Art. 32 Abs. 1 lit. b')]
		},
		{
			title: L('Passwörter und Geräte', 'Passwords and devices'),
			points: [
				L(
					'Ein eigenes, langes Passwort je Zugang; nie weitergeben, auch nicht an die IT',
					'Your own long password per account; never share it, not even with IT'
				),
				L(
					'Den zweiten Faktor nutzen, wo er angeboten wird',
					'Use the second factor where it is offered'
				),
				L(
					'Nur freigegebene Software, Cloud-Dienste und Geräte verwenden',
					'Use only approved software, cloud services and devices'
				),
				L(
					'Ein verlorenes Handy oder Notebook sofort melden: {meldeweg}',
					'Report a lost phone or laptop at once: {meldeweg}'
				)
			],
			cite: [
				DSGVO('Art. 32 Abs. 1'),
				{ law: 'BSI', ref: 'ORP.4 Identitäts- und Berechtigungsmanagement' }
			]
		},
		{
			title: L('E-Mail und Weitergabe', 'E-mail and passing data on'),
			points: [
				L('Vor dem Senden den Empfänger prüfen', 'Check the recipient before sending'),
				L(
					'Rundmails an Externe immer mit „BCC“, nie mit offenem Verteiler',
					'Circulars to outsiders always via "BCC", never with an open list'
				),
				L(
					'Sensible Daten nur über die freigegebenen, verschlüsselten Wege',
					'Sensitive data only through the approved, encrypted channels'
				),
				L(
					'Keine dienstlichen Mails an private Adressen weiterleiten',
					'Do not forward work e-mails to private addresses'
				),
				L(
					'Am Telefon keine Auskunft, bevor klar ist, wer anruft',
					'No information on the phone before it is clear who is calling'
				)
			],
			cite: [DSGVO('Art. 5 Abs. 1 lit. f'), DSGVO('Art. 32 Abs. 1 lit. a')]
		},
		{
			title: L('Phishing erkennen', 'Spotting phishing'),
			points: [
				L(
					'Druck und Eile: „sofort“, „letzte Mahnung“, „Konto gesperrt“',
					'Pressure and urgency: "at once", "final reminder", "account locked"'
				),
				L(
					'Unerwartete Anhänge oder Links, auch von bekannten Absendern',
					'Unexpected attachments or links, even from known senders'
				),
				L(
					'Absenderadresse, die fast stimmt: ein Buchstabe anders, eine fremde Endung',
					'A sender address that is almost right: one letter off, a foreign ending'
				),
				L(
					'Bitte um Passwort, Code, Zahlung oder geänderte Kontoverbindung',
					'A request for a password, code, payment or changed bank details'
				)
			],
			example: L(
				'„Die Geschäftsführung braucht bis heute Mittag eine Überweisung, bitte diskret behandeln.“',
				'"Management needs a transfer by noon today, please treat this discreetly."'
			),
			cite: [ORP3]
		},
		{
			title: L('Phishing: was tun?', 'Phishing: what to do'),
			points: [
				L('Nicht klicken, nichts öffnen, nicht antworten', 'Do not click, open anything or reply'),
				L(
					'Im Zweifel über einen bekannten Weg nachfragen, nicht über die Daten in der Mail',
					'If in doubt, check through a known channel, not the details in the e-mail'
				),
				L(
					'Doch geklickt oder ein Passwort eingegeben: Passwort ändern und sofort melden: {meldeweg}',
					'Clicked after all or entered a password: change it and report at once: {meldeweg}'
				),
				L(
					'Eine Phishing-Mail nicht an Kolleginnen weiterleiten, um zu warnen; das verbreitet sie',
					'Do not forward a phishing e-mail to colleagues as a warning; that spreads it'
				)
			],
			notes: L(
				'Wurden Zugangsdaten preisgegeben, kann das bereits eine Datenpanne sein. Dann läuft die 72-Stunden-Frist.',
				'If credentials were given away, that may already be a breach. Then the 72-hour deadline runs.'
			),
			cite: [ORP3, DSGVO('Art. 33 Abs. 1')]
		},
		{
			title: L('Wenn jemand nach seinen Daten fragt', 'When someone asks about their data'),
			points: [
				L(
					'Jeder darf wissen, welche Daten wir über ihn haben, und Berichtigung oder Löschung verlangen',
					'Everyone may know what data we hold about them and ask for correction or erasure'
				),
				L(
					'Eine solche Anfrage kann in jedem Postfach ankommen, auch formlos oder am Telefon',
					'Such a request can arrive in any inbox, also informally or by phone'
				),
				L(
					'Die Frist von einem Monat läuft ab Eingang: sofort weitergeben an {dsb}',
					'The one-month deadline runs from receipt: pass it on at once to {dsb}'
				),
				L(
					'Nicht selbst Auskunft geben, solange nicht klar ist, wer fragt',
					'Do not give information yourself while it is unclear who is asking'
				)
			],
			cite: [DSGVO('Art. 12 Abs. 3'), DSGVO('Art. 15')]
		},
		{
			title: L('Wenn etwas schiefgeht', 'When something goes wrong'),
			points: [
				L(
					'E-Mail an den Falschen, Gerät verloren, Daten offen einsehbar: das ist eine Datenpanne',
					'E-mail to the wrong person, device lost, data openly visible: that is a breach'
				),
				L(
					'Schon den Verdacht sofort melden: {meldeweg}',
					'Report even a suspicion at once: {meldeweg}'
				),
				L(
					'Die Organisation hat 72 Stunden für die Meldung an die Aufsichtsbehörde',
					'The organisation has 72 hours to notify the supervisory authority'
				),
				L('Nichts vertuschen, nichts selbst aufräumen', 'Hide nothing, clean up nothing yourself')
			],
			notes: L(
				'Mehr dazu im Modul „Datenpannen erkennen und melden“.',
				'More in the module "Spotting and reporting data breaches".'
			),
			cite: [DSGVO('Art. 33 Abs. 1')]
		},
		{
			title: L('Ihre Ansprechperson', 'Your point of contact'),
			points: [
				L('Datenschutzbeauftragte: {dsb}', 'Data protection officer: {dsb}'),
				L(
					'Berät bei Fragen und Zweifeln, bevor etwas passiert',
					'Advises on questions and doubts before anything happens'
				),
				L('Was Sie anvertrauen, bleibt vertraulich', 'What you confide stays confidential'),
				L(
					'Lieber einmal zu früh fragen als einmal zu spät',
					'Better to ask once too early than once too late'
				)
			],
			cite: [DSGVO('Art. 38 Abs. 5'), DSGVO('Art. 39 Abs. 1 lit. a')]
		},
		{
			title: L('Das Wichtigste', 'The key points'),
			points: [
				L(
					'Personenbezogen ist fast alles, was auf einen Menschen zeigt',
					'Almost anything pointing to a person is personal data'
				),
				L(
					'Nur für Ihre Aufgabe, nur so viel wie nötig',
					'Only for your task, only as much as needed'
				),
				L(
					'Bildschirm sperren, Passwort für sich behalten, Phishing melden',
					'Lock the screen, keep your password to yourself, report phishing'
				),
				L(
					'Anfragen weitergeben an {dsb}, Pannen melden: {meldeweg}',
					'Pass requests on to {dsb}, report breaches: {meldeweg}'
				)
			],
			cite: [DSGVO('Art. 5 Abs. 1'), DSGVO('Art. 32 Abs. 4')]
		}
	],
	quiz: [
		{
			text: L('Welche Angabe ist personenbezogen?', 'Which information is personal data?'),
			options: [
				{
					text: L('Der Umsatz der Firma im letzten Jahr', 'The company’s turnover last year'),
					correct: false,
					why: L(
						'Er betrifft das Unternehmen, keinen einzelnen Menschen.',
						'It concerns the company, not an individual person.'
					)
				},
				{
					text: L(
						'Eine Kundennummer mit der Liste ihrer Bestellungen',
						'A customer number with its list of orders'
					),
					correct: true,
					why: L(
						'Über die Kundennummer lässt sich die Person bestimmen; das reicht.',
						'The customer number makes the person identifiable; that is enough.'
					)
				},
				{
					text: L('Die Temperatur im Serverraum', 'The temperature in the server room'),
					correct: false,
					why: L('Sie sagt nichts über einen Menschen.', 'It says nothing about a person.')
				}
			],
			cite: DSGVO('Art. 4 Nr. 1')
		},
		{
			text: L(
				'Sie wollen nur kurz in die Küche. Was tun Sie mit Ihrem Rechner?',
				'You are just popping into the kitchen. What do you do with your computer?'
			),
			options: [
				{
					text: L('Nichts, ich bin ja gleich zurück', 'Nothing, I will be back in a moment'),
					correct: false,
					why: L(
						'Auch eine Minute reicht, damit Unbefugte Daten sehen oder Mails senden.',
						'Even a minute is enough for others to see data or send e-mails.'
					)
				},
				{
					text: L('Den Bildschirm sperren', 'Lock the screen'),
					correct: true,
					why: L(
						'Das schützt die Daten vor fremden Blicken und vor Zugriffen in Ihrem Namen.',
						'It protects the data from prying eyes and from access in your name.'
					)
				},
				{
					text: L('Den Monitor ausschalten', 'Switch the monitor off'),
					correct: false,
					why: L(
						'Der Rechner bleibt angemeldet; jeder kann den Monitor wieder einschalten.',
						'The computer stays signed in; anyone can switch the monitor back on.'
					)
				}
			],
			cite: DSGVO('Art. 32 Abs. 1 lit. b')
		},
		{
			text: L(
				'Eine Mail verlangt, Ihr Passwort heute noch über einen Link zu bestätigen. Was tun Sie?',
				'An e-mail asks you to confirm your password via a link today. What do you do?'
			),
			options: [
				{
					text: L(
						'Den Link öffnen und prüfen, ob die Seite echt aussieht',
						'Open the link and check whether the page looks real'
					),
					correct: false,
					why: L(
						'Gefälschte Seiten sehen echt aus; schon der Klick kann schaden.',
						'Fake pages look real; even the click can do harm.'
					)
				},
				{
					text: L(
						'Die Mail an Kolleginnen weiterleiten, um sie zu warnen',
						'Forward the e-mail to colleagues to warn them'
					),
					correct: false,
					why: L(
						'So verbreitet sich die Mail, und jemand klickt doch.',
						'That spreads the e-mail, and someone clicks after all.'
					)
				},
				{
					text: L('Nicht klicken und die Mail melden', 'Do not click, and report the e-mail'),
					correct: true,
					why: L(
						'Druck und die Bitte um ein Passwort sind typische Zeichen für Phishing.',
						'Pressure and a request for a password are typical signs of phishing.'
					)
				}
			],
			cite: ORP3
		},
		{
			text: L(
				'Ein Kunde ruft an und will wissen, welche Daten wir über ihn speichern. Was tun Sie?',
				'A customer calls and wants to know what data we store about him. What do you do?'
			),
			options: [
				{
					text: L(
						'Ihm am Telefon vorlesen, was im System steht',
						'Read out what is in the system on the phone'
					),
					correct: false,
					why: L(
						'Am Telefon ist nicht sicher, wer anruft; die Daten könnten an Fremde gehen.',
						'On the phone it is not certain who is calling; the data could go to a stranger.'
					)
				},
				{
					text: L(
						'Die Anfrage mit Datum notieren und sofort an die zuständige Stelle weitergeben',
						'Note the request with its date and pass it on at once to whoever is responsible'
					),
					correct: true,
					why: L(
						'Die Frist von einem Monat läuft ab Eingang; die Antwort prüft und gibt die zuständige Stelle.',
						'The one-month deadline runs from receipt; the responsible function checks and answers.'
					)
				},
				{
					text: L('Auf eine schriftliche Anfrage warten', 'Wait for a written request'),
					correct: false,
					why: L(
						'Eine Anfrage braucht keine Form; auch ein Anruf setzt die Frist in Gang.',
						'A request needs no particular form; a call starts the deadline too.'
					)
				}
			],
			cite: DSGVO('Art. 12 Abs. 3')
		}
	]
};
