import type { LegalBasis, Lesson, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });

/**
 * "Datenpannen erkennen und melden": for all staff, about 20 minutes. Staff
 * learn what a breach is, that a suspicion is enough, and how it reaches the
 * data protection officer in time for the 72 hours of Art. 33 DSGVO. The
 * organisation's own reporting channel stays in square brackets until it is
 * filled in.
 */
export const lesson: Lesson = {
	version: 1,
	audience: L('Alle Beschäftigten', 'All staff'),
	minutes: 20,
	topic: 'pannen',
	intro: L(
		'Eine kurze Unterweisung für alle Beschäftigten: was eine Datenpanne ist, woran man sie im Alltag erkennt, warum schon ein Verdacht gemeldet wird, an wen und mit welchen Angaben, und was danach geschieht. Ziel ist, dass jede Panne die Datenschutzbeauftragte so früh erreicht, dass die Organisation die 72 Stunden des Art. 33 DSGVO halten kann.',
		'A short briefing for all staff: what a personal data breach is, how to spot one in daily work, why even a suspicion is reported, to whom and with which details, and what happens next. The aim is that every breach reaches the data protection officer early enough for the organisation to meet the 72 hours of Art. 33 GDPR.'
	),
	sources: [
		DSGVO('Art. 4 Nr. 12'),
		DSGVO('Art. 33'),
		DSGVO('Art. 34'),
		{ law: 'EDPB', ref: 'Leitlinien 9/2022' }
	],
	slides: [
		{
			title: L('Was ist eine Datenpanne?', 'What is a personal data breach?'),
			points: [
				L(
					'Eine Verletzung der Sicherheit, durch die personenbezogene Daten verloren gehen, vernichtet, verändert oder Unbefugten offengelegt werden',
					'A breach of security that leads to personal data being lost, destroyed, altered or disclosed to unauthorised persons'
				),
				L('Ob aus Versehen oder durch einen Angriff', 'Whether by accident or through an attack'),
				L(
					'Vertraulichkeit: Jemand sieht Daten, der sie nicht sehen darf',
					'Confidentiality: someone sees data they must not see'
				),
				L(
					'Integrität: Daten werden falsch oder verfälscht',
					'Integrity: data becomes wrong or falsified'
				),
				L(
					'Verfügbarkeit: Daten sind weg oder nicht erreichbar, wenn sie gebraucht werden',
					'Availability: data is gone or cannot be reached when needed'
				)
			],
			notes: L(
				'Die Definition steht in Art. 4 Nr. 12 DSGVO. Wichtig ist: Es braucht keinen Hacker. Die meisten Pannen sind Alltagsfehler.',
				'The definition is in Art. 4(12) GDPR. Point out that no hacker is needed: most breaches are everyday mistakes.'
			),
			cite: [DSGVO('Art. 4 Nr. 12'), { law: 'EDPB', ref: 'Leitlinien 9/2022' }]
		},
		{
			title: L('So sieht das im Alltag aus', 'What it looks like in daily work'),
			points: [
				L(
					'E-Mail mit Kunden- oder Personaldaten an den falschen Empfänger',
					'An e-mail with customer or staff data sent to the wrong recipient'
				),
				L(
					'Rundmail mit allen Adressen sichtbar im Feld „An“ oder „CC“ statt „BCC“',
					'A circular with all addresses visible in "To" or "CC" instead of "BCC"'
				),
				L(
					'Laptop, Handy oder USB-Stick verloren oder gestohlen',
					'Laptop, phone or USB stick lost or stolen'
				),
				L(
					'Dateien plötzlich verschlüsselt, eine Lösegeldforderung auf dem Bildschirm',
					'Files suddenly encrypted, a ransom note on the screen'
				),
				L(
					'Akten im Altpapier, im Zug liegen gelassen oder am Drucker vergessen',
					'Files in the waste paper, left on the train or forgotten at the printer'
				)
			],
			example: L(
				'Eine Kollegin leitet eine Bewerbung versehentlich an alle Bewerbenden der Stelle weiter.',
				'A colleague accidentally forwards an application to all applicants for the position.'
			),
			cite: [DSGVO('Art. 4 Nr. 12')]
		},
		{
			title: L('Schon ein Verdacht wird gemeldet', 'Even a suspicion is reported'),
			points: [
				L(
					'Sie müssen nicht selbst prüfen, ob es „wirklich“ eine Panne ist',
					'You do not have to work out whether it is "really" a breach'
				),
				L(
					'Auch kleine Fehler und Beinahe-Fälle melden',
					'Report small mistakes and near misses too'
				),
				L(
					'Auch wenn Ihnen selbst der Fehler passiert ist',
					'Even if you made the mistake yourself'
				),
				L(
					'Auch Pannen bei Dienstleistern: Sie müssen sie unverzüglich an uns melden',
					'Breaches at service providers too: they must report them to us without undue delay'
				)
			],
			notes: L(
				'Ob eine Meldung an die Aufsichtsbehörde nötig ist, entscheidet die Organisation nach einer Risikobewertung. Dafür braucht sie jeden Hinweis.',
				'Whether the authority must be notified is decided by the organisation after assessing the risk. It needs every hint for that.'
			),
			cite: [DSGVO('Art. 33 Abs. 2')]
		},
		{
			title: L('Die Uhr läuft: 72 Stunden', 'The clock is running: 72 hours'),
			points: [
				L(
					'Die Organisation muss eine Panne binnen 72 Stunden der Aufsichtsbehörde melden, außer sie führt voraussichtlich zu keinem Risiko',
					'The organisation must notify the supervisory authority of a breach within 72 hours, unless it is unlikely to result in a risk'
				),
				L(
					'Die Frist beginnt, sobald die Organisation von der Panne weiß, nicht erst, wenn die Datenschutzbeauftragte davon erfährt',
					'The deadline starts once the organisation knows of the breach, not only when the data protection officer hears of it'
				),
				L(
					'Die Frist läuft in Stunden, auch am Wochenende',
					'The deadline runs in hours, weekends included'
				),
				L(
					'Jede Stunde, die eine Meldung im Postfach liegt, fehlt für die Bewertung',
					'Every hour a report waits in an inbox is lost for the assessment'
				)
			],
			notes: L(
				'Nach den Leitlinien 9/2022 des EDPB weiß der Verantwortliche von der Panne, wenn er hinreichend sicher ist, dass ein Sicherheitsvorfall personenbezogene Daten betrifft. Beschäftigte sind Teil der Organisation; deshalb zählt jede Verzögerung bei der internen Meldung.',
				'Under EDPB Guidelines 9/2022 the controller becomes aware when it is reasonably certain that a security incident has compromised personal data. Staff are part of the organisation, so every delay in internal reporting counts.'
			),
			cite: [DSGVO('Art. 33 Abs. 1'), { law: 'EDPB', ref: 'Leitlinien 9/2022' }]
		},
		{
			title: L('Sofort melden: an wen', 'Report at once: to whom'),
			points: [
				L(
					'Meldeweg: [E-Mail, Telefon oder Formular]',
					'Reporting channel: [e-mail, phone or form]'
				),
				L(
					'Datenschutzbeauftragte: [Name, Telefon, E-Mail]',
					'Data protection officer: [name, phone, e-mail]'
				),
				L(
					'Außerhalb der Arbeitszeit: [Vertretung oder IT-Bereitschaft]',
					'Outside working hours: [deputy or IT on-call]'
				),
				L(
					'Lieber einmal zu viel melden als einmal zu wenig',
					'Better to report once too often than once too rarely'
				)
			],
			notes: L(
				'Die Stellen in eckigen Klammern trägt die Organisation vor der Schulung ein. Ohne festen Meldeweg geht die Frist im Postfach verloren.',
				'The organisation fills in the places in square brackets before the session. Without a fixed reporting channel the deadline is lost in an inbox.'
			),
			cite: [DSGVO('Art. 33 Abs. 1')]
		},
		{
			title: L('Was in die Meldung gehört', 'What goes into the report'),
			points: [
				L(
					'Was ist passiert, wann, und wann haben Sie es bemerkt?',
					'What happened, when, and when did you notice?'
				),
				L(
					'Welche Daten sind betroffen, und ungefähr wie viele Personen?',
					'Which data is affected, and roughly how many people?'
				),
				L('Was haben Sie schon unternommen?', 'What have you already done?'),
				L('Wie erreicht man Sie für Rückfragen?', 'How can you be reached for questions?'),
				L(
					'Unvollständig melden ist besser als spät melden; der Rest folgt',
					'Reporting incompletely is better than reporting late; the rest follows'
				)
			],
			notes: L(
				'Das sind die Angaben, die die Organisation später der Aufsichtsbehörde nennen muss. Was fehlt, darf sie nachreichen.',
				'These are the details the organisation must later give the authority. What is missing may be provided later.'
			),
			cite: [DSGVO('Art. 33 Abs. 3, 4')]
		},
		{
			title: L('Was Sie sofort tun können', 'What you can do at once'),
			points: [
				L(
					'Falsch versandte E-Mail: den Empfänger bitten, sie zu löschen und das zu bestätigen',
					'E-mail sent to the wrong person: ask the recipient to delete it and confirm'
				),
				L(
					'Verdacht auf Schadsoftware: Netzwerkverbindung trennen und die IT anrufen',
					'Suspected malware: disconnect from the network and call IT'
				),
				L(
					'Zugangsdaten preisgegeben: das Passwort sofort ändern und es melden',
					'Credentials given away: change the password at once and report it'
				),
				L(
					'Nichts löschen und nicht selbst aufräumen: Spuren werden für die Bewertung gebraucht',
					'Delete nothing and do not clean up yourself: traces are needed for the assessment'
				)
			],
			notes: L(
				'Die Organisation muss die Folgen einer Panne abmildern. Die ersten Minuten entscheiden oft, wie groß der Schaden wird.',
				'The organisation must mitigate the effects of a breach. The first minutes often decide how large the damage becomes.'
			),
			cite: [DSGVO('Art. 33 Abs. 3 lit. d'), { law: 'BSI', ref: 'IT-Notfallkarte' }]
		},
		{
			title: L('Was Sie nicht tun', 'What you do not do'),
			points: [
				L(
					'Nicht abwarten, ob es „schlimm genug“ ist',
					'Do not wait to see whether it is "bad enough"'
				),
				L('Nichts vertuschen und nichts verschweigen', 'Hide nothing and keep nothing quiet'),
				L(
					'Nicht selbst die Aufsichtsbehörde oder die Betroffenen informieren: das entscheidet die Organisation',
					'Do not inform the authority or the people affected yourself: the organisation decides that'
				),
				L(
					'Nicht mit Externen oder in sozialen Medien darüber sprechen',
					'Do not talk about it with outsiders or on social media'
				)
			],
			cite: [DSGVO('Art. 33 Abs. 1'), DSGVO('Art. 34 Abs. 1')]
		},
		{
			title: L('Was danach passiert', 'What happens next'),
			points: [
				L(
					'Die Datenschutzbeauftragte und die Verantwortlichen bewerten das Risiko für die Betroffenen',
					'The data protection officer and those responsible assess the risk to the people affected'
				),
				L(
					'Bei einem Risiko: Meldung an die Aufsichtsbehörde binnen 72 Stunden',
					'If there is a risk: notification to the supervisory authority within 72 hours'
				),
				L(
					'Bei hohem Risiko werden auch die Betroffenen benachrichtigt',
					'If the risk is high, the people affected are informed too'
				),
				L(
					'Jede Panne wird dokumentiert, auch wenn sie nicht gemeldet werden muss',
					'Every breach is documented, even if it need not be notified'
				),
				L(
					'Aus jeder Panne lernt die Organisation: Maßnahmen gegen eine Wiederholung',
					'The organisation learns from every breach: measures against it happening again'
				)
			],
			cite: [DSGVO('Art. 33 Abs. 1, 5'), DSGVO('Art. 34 Abs. 1')]
		},
		{
			title: L('Das Wichtigste', 'The key points'),
			points: [
				L(
					'Erkennen: Daten weg, verändert oder bei den Falschen',
					'Spot it: data gone, altered or with the wrong people'
				),
				L(
					'Sofort melden, schon beim Verdacht: [Meldeweg]',
					'Report at once, even on suspicion: [reporting channel]'
				),
				L('Nichts vertuschen, nichts selbst aufräumen', 'Hide nothing, clean up nothing yourself'),
				L(
					'Eine frühe Meldung begrenzt den Schaden für die Betroffenen',
					'An early report limits the harm to the people affected'
				)
			],
			cite: [DSGVO('Art. 33 Abs. 1')]
		}
	],
	quiz: [
		{
			text: L(
				'Eine E-Mail mit einer Kundenliste ging an den falschen Empfänger. Was tun Sie?',
				'An e-mail with a customer list went to the wrong recipient. What do you do?'
			),
			options: [
				{
					text: L(
						'Abwarten, ob sich der Empfänger meldet',
						'Wait and see whether the recipient gets in touch'
					),
					correct: false,
					why: L(
						'Abwarten kostet Zeit von den 72 Stunden, die der Organisation für die Bewertung bleiben.',
						'Waiting uses up the 72 hours the organisation has for its assessment.'
					)
				},
				{
					text: L(
						'Den Empfänger um Löschung bitten und die Panne sofort über den Meldeweg melden',
						'Ask the recipient to delete it and report the breach at once through the reporting channel'
					),
					correct: true,
					why: L(
						'Das begrenzt den Schaden und gibt der Organisation die Zeit, das Risiko zu bewerten.',
						'This limits the harm and gives the organisation time to assess the risk.'
					)
				},
				{
					text: L(
						'Selbst die Aufsichtsbehörde informieren',
						'Inform the supervisory authority yourself'
					),
					correct: false,
					why: L(
						'Ob und wie gemeldet wird, entscheidet die Organisation als Verantwortliche.',
						'Whether and how the authority is notified is for the organisation as controller to decide.'
					)
				}
			],
			cite: DSGVO('Art. 33 Abs. 1')
		},
		{
			text: L('Wann beginnen die 72 Stunden?', 'When do the 72 hours start?'),
			options: [
				{
					text: L(
						'Sobald die Organisation von der Panne weiß',
						'Once the organisation knows of the breach'
					),
					correct: true,
					why: L(
						'Beschäftigte gehören zur Organisation; deshalb zählt schon die Zeit bis zur internen Meldung.',
						'Staff are part of the organisation, so the time until the internal report already counts.'
					)
				},
				{
					text: L(
						'Erst wenn die Datenschutzbeauftragte davon erfährt',
						'Only when the data protection officer hears of it'
					),
					correct: false,
					why: L(
						'Die Frist wartet nicht auf die interne Meldung; jede Verzögerung geht von ihr ab.',
						'The deadline does not wait for the internal report; every delay comes off it.'
					)
				},
				{
					text: L('Am nächsten Werktag', 'On the next working day'),
					correct: false,
					why: L(
						'Die Frist läuft in Stunden, auch am Wochenende.',
						'The deadline runs in hours, weekends included.'
					)
				}
			],
			cite: DSGVO('Art. 33 Abs. 1')
		},
		{
			text: L(
				'Sie sind nicht sicher, ob wirklich eine Datenpanne vorliegt. Was tun Sie?',
				'You are not sure whether it really is a breach. What do you do?'
			),
			options: [
				{
					text: L('Erst selbst klären, dann melden', 'Find out yourself first, then report'),
					correct: false,
					why: L(
						'Die Bewertung ist Aufgabe der Organisation; bis dahin läuft die Frist.',
						'The assessment is the organisation’s task; the deadline runs in the meantime.'
					)
				},
				{
					text: L('Den Verdacht sofort melden', 'Report the suspicion at once'),
					correct: true,
					why: L(
						'Schon ein Verdacht wird gemeldet; ob es eine Panne ist, bewertet die Organisation.',
						'Even a suspicion is reported; the organisation assesses whether it is a breach.'
					)
				},
				{
					text: L('Nur große Fälle melden', 'Report only large cases'),
					correct: false,
					why: L(
						'Auch kleine Pannen werden dokumentiert, und ihr Risiko kann größer sein, als es aussieht.',
						'Small breaches are documented too, and their risk can be greater than it looks.'
					)
				}
			],
			cite: DSGVO('Art. 33 Abs. 5')
		},
		{
			text: L(
				'Wer entscheidet, ob die betroffenen Personen benachrichtigt werden?',
				'Who decides whether the people affected are informed?'
			),
			options: [
				{
					text: L('Wem die Panne passiert ist', 'Whoever the breach happened to'),
					correct: false,
					why: L(
						'Beschäftigte informieren Betroffene nicht auf eigene Faust.',
						'Staff do not inform the people affected on their own.'
					)
				},
				{
					text: L(
						'Die Organisation, nachdem sie das Risiko bewertet hat',
						'The organisation, after it has assessed the risk'
					),
					correct: true,
					why: L(
						'Bei voraussichtlich hohem Risiko muss die Organisation die Betroffenen unverzüglich benachrichtigen.',
						'If the risk is likely to be high, the organisation must inform the people affected without undue delay.'
					)
				},
				{
					text: L('Der Empfänger der Daten', 'The recipient of the data'),
					correct: false,
					why: L(
						'Die Pflicht liegt beim Verantwortlichen, nicht beim Empfänger.',
						'The duty lies with the controller, not with the recipient.'
					)
				}
			],
			cite: DSGVO('Art. 34 Abs. 1')
		}
	]
};
