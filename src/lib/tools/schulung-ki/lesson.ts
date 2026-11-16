import type { LegalBasis, Lesson, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });
const DSGVO = (ref: string): LegalBasis => ({ law: 'DSGVO', ref });
const KIVO = (ref: string): LegalBasis => ({ law: 'KI-VO', ref });

/**
 * "KI im Arbeitsalltag": for all staff who use AI tools, about 20 minutes.
 * One of the measures an organisation takes to support AI literacy under
 * Art. 4 KI-VO: what AI can and cannot do, which tools are approved, what
 * stays out of a prompt, checking results, decisions about people,
 * labelling, the workplace prohibition on emotion recognition, and where
 * mistakes are reported. The approved tools come from the organisation's
 * details ({ki}); a session fills the AI part of the Schulungsnachweis.
 */
export const lesson: Lesson = {
	version: 1,
	audience: L('Alle Beschäftigten, die KI nutzen', 'All staff who use AI'),
	minutes: 20,
	topic: 'ki',
	intro: L(
		'Eine Unterweisung für alle, die im Alltag mit KI arbeiten, etwa mit Chatbots, Schreib-, Übersetzungs- oder Bildwerkzeugen. Sie ist eine der Maßnahmen, mit denen die Organisation die KI-Kompetenz ihres Personals nach Art. 4 KI-VO unterstützt, und füllt im Schulungsnachweis den Teil zur KI-Kompetenz aus. Die freigegebenen Werkzeuge kommen aus den Angaben der Organisation.',
		'A briefing for everyone who works with AI in daily work, such as chatbots, writing, translation or image tools. It is one of the measures with which the organisation supports the AI literacy of its staff under Art. 4 AI Act, and it fills in the AI literacy part of the Schulungsnachweis. The approved tools come from the organisation details.'
	),
	sources: [
		KIVO('Art. 3 Nr. 56'),
		KIVO('Art. 4'),
		KIVO('Art. 5 Abs. 1 lit. f'),
		KIVO('Art. 50 Abs. 4'),
		DSGVO('Art. 22')
	],
	entry: {
		ki_befassung: 'anwendung',
		ki_inhalte: ['funktionsweise', 'risiken', 'daten', 'richtlinie', 'aufsicht', 'recht']
	},
	slides: [
		{
			title: L('Warum diese Schulung', 'Why this training'),
			points: [
				L(
					'KI schreibt, übersetzt, fasst zusammen und erzeugt Bilder, auch bei uns',
					'AI writes, translates, summarises and creates images, here too'
				),
				L(
					'Die Organisation muss die KI-Kompetenz aller unterstützen, die KI für sie nutzen',
					'The organisation must support the AI literacy of everyone who uses AI on its behalf'
				),
				L(
					'KI-Kompetenz heißt: KI sachkundig einsetzen und ihre Chancen und Risiken kennen',
					'AI literacy means using AI knowledgeably and knowing its opportunities and risks'
				),
				L(
					'Die Verantwortung für das Ergebnis bleibt bei Ihnen',
					'Responsibility for the result stays with you'
				)
			],
			cite: [KIVO('Art. 4'), KIVO('Art. 3 Nr. 56')]
		},
		{
			title: L('Was KI kann und was nicht', 'What AI can and cannot do'),
			points: [
				L(
					'Sie erzeugt Texte, die plausibel klingen, nicht Texte, die geprüft sind',
					'It produces text that sounds plausible, not text that has been checked'
				),
				L(
					'Sie kann Fakten, Zahlen, Quellen und Urteile erfinden',
					'It can invent facts, figures, sources and court rulings'
				),
				L(
					'Ihr Wissen kann veraltet oder einseitig sein',
					'Its knowledge can be outdated or one-sided'
				),
				L(
					'Sie kennt Ihren Fall nur aus dem, was Sie ihr geben',
					'It knows your case only from what you give it'
				)
			],
			example: L(
				'Ein Chatbot nennt ein Urteil mit Aktenzeichen, das es nicht gibt.',
				'A chatbot cites a ruling with a case number that does not exist.'
			),
			cite: [KIVO('Art. 3 Nr. 56')]
		},
		{
			title: L('Nur freigegebene Werkzeuge', 'Approved tools only'),
			points: [
				L('Freigegeben sind: {ki}', 'Approved are: {ki}'),
				L(
					'Keine privaten Konten oder kostenlosen Versionen für dienstliche Inhalte',
					'No private accounts or free versions for work content'
				),
				L(
					'Kostenlose Versionen nutzen Eingaben oft für eigene Zwecke und haben keinen Auftragsverarbeitungsvertrag',
					'Free versions often use inputs for their own purposes and come without a processing agreement'
				),
				L(
					'Ein neues Werkzeug? Erst freigeben lassen, dann nutzen',
					'A new tool? Get it approved first, then use it'
				)
			],
			notes: L(
				'Welche Werkzeuge freigegeben sind und wo die KI-Nutzungsrichtlinie steht, kommt aus den Angaben der Organisation.',
				'Which tools are approved and where the AI usage policy is kept comes from the organisation details.'
			),
			cite: [DSGVO('Art. 28 Abs. 1')]
		},
		{
			title: L('Was nicht in die KI gehört', 'What stays out of AI'),
			points: [
				L(
					'Personenbezogene Daten nur, wo das Werkzeug dafür freigegeben ist, und nur so viel wie nötig',
					'Personal data only where the tool is approved for it, and only as much as needed'
				),
				L(
					'Gesundheitsdaten und andere besondere Kategorien nie',
					'Health data and other special categories never'
				),
				L(
					'Keine Geschäftsgeheimnisse, Verträge oder interne Zahlen ohne Freigabe',
					'No trade secrets, contracts or internal figures without approval'
				),
				L('Nie Passwörter, Zugangsdaten oder Schlüssel', 'Never passwords, credentials or keys'),
				L(
					'Im Zweifel vorher Namen und Kennungen entfernen',
					'If in doubt, remove names and identifiers first'
				)
			],
			cite: [DSGVO('Art. 5 Abs. 1 lit. c'), DSGVO('Art. 9 Abs. 1')]
		},
		{
			title: L('Ergebnisse prüfen', 'Check the results'),
			points: [
				L(
					'Fakten, Zahlen, Namen und Quellen gegenprüfen, bevor Sie sie verwenden',
					'Check facts, figures, names and sources before you use them'
				),
				L(
					'Texte über Menschen besonders sorgfältig: falsche Angaben schaden ihnen',
					'Take special care with texts about people: wrong statements harm them'
				),
				L(
					'Keine KI-Texte ungeprüft in Verträge, Bescheide oder Antworten an Kunden',
					'No unchecked AI text in contracts, decisions or replies to customers'
				),
				L('Sie zeichnen, nicht die KI', 'You sign, not the AI')
			],
			cite: [DSGVO('Art. 5 Abs. 1 lit. d'), KIVO('Art. 4')]
		},
		{
			title: L('Entscheidungen über Menschen', 'Decisions about people'),
			points: [
				L(
					'KI darf Entscheidungen über Menschen vorbereiten, entscheiden muss ein Mensch',
					'AI may prepare decisions about people; a human must decide'
				),
				L(
					'Bewerbungen sichten, Leistung bewerten, Kredite prüfen: hier gelten strenge Regeln',
					'Screening applications, rating performance, checking credit: strict rules apply here'
				),
				L(
					'Solche Einsätze nur nach Freigabe und mit der Datenschutzbeauftragten',
					'Such uses only after approval and with the data protection officer'
				)
			],
			notes: L(
				'KI-Systeme für Einstellung, Beförderung oder Leistungsbewertung sind Hochrisiko-Systeme nach Anhang III Nr. 4 KI-VO. Ihre Betreiber brauchen menschliche Aufsicht mit der nötigen Kompetenz (Art. 26 Abs. 2).',
				'AI systems for recruitment, promotion or performance rating are high-risk systems under Annex III no. 4 AI Act. Their deployers need human oversight with the necessary competence (Art. 26(2)).'
			),
			cite: [DSGVO('Art. 22 Abs. 1'), KIVO('Art. 26 Abs. 2')]
		},
		{
			title: L('Kennzeichnen', 'Labelling'),
			points: [
				L(
					'Von KI erzeugte oder veränderte Bilder, Töne und Videos, die echt wirken, werden als künstlich gekennzeichnet',
					'AI-generated or altered images, audio and video that look real are labelled as artificial'
				),
				L(
					'Was nach außen geht, kennzeichnen Sie so, wie es die KI-Richtlinie vorsieht',
					'Label what goes outside as the AI policy says'
				),
				L(
					'Nie mit KI eine echte Person etwas sagen oder tun lassen, was sie nicht gesagt oder getan hat',
					'Never use AI to make a real person say or do what they did not say or do'
				)
			],
			cite: [KIVO('Art. 50 Abs. 4')]
		},
		{
			title: L('Am Arbeitsplatz verboten', 'Prohibited at the workplace'),
			points: [
				L(
					'KI, die aus Gesicht, Stimme oder Verhalten Gefühle von Beschäftigten ableitet',
					'AI that infers the emotions of staff from face, voice or behaviour'
				),
				L(
					'Ausnahme nur aus medizinischen Gründen oder Sicherheitsgründen',
					'Only exception: medical or safety reasons'
				),
				L(
					'Bemerken Sie so eine Funktion, etwa in Videokonferenzen: nicht nutzen und melden',
					'If you notice such a feature, e.g. in video calls: do not use it, report it'
				)
			],
			cite: [KIVO('Art. 5 Abs. 1 lit. f')]
		},
		{
			title: L('Wenn etwas schiefgeht', 'When something goes wrong'),
			points: [
				L(
					'Personenbezogene oder vertrauliche Daten versehentlich eingegeben: sofort melden: {meldeweg}',
					'Personal or confidential data entered by mistake: report at once: {meldeweg}'
				),
				L(
					'Falsche, diskriminierende oder gefährliche Ergebnisse melden an {dsb}',
					'Report wrong, discriminatory or dangerous results to {dsb}'
				),
				L(
					'Nichts löschen, bevor es gemeldet ist: der Verlauf hilft bei der Bewertung',
					'Delete nothing before it is reported: the history helps the assessment'
				)
			],
			cite: [DSGVO('Art. 33 Abs. 1'), KIVO('Art. 26 Abs. 5')]
		},
		{
			title: L('Das Wichtigste', 'The key points'),
			points: [
				L('Nur freigegebene Werkzeuge: {ki}', 'Approved tools only: {ki}'),
				L(
					'Keine Gesundheitsdaten, Geheimnisse oder Passwörter in die KI',
					'No health data, secrets or passwords into AI'
				),
				L(
					'Jedes Ergebnis prüfen; Sie bleiben verantwortlich',
					'Check every result; you stay responsible'
				),
				L('Über Menschen entscheidet ein Mensch', 'A human decides about people'),
				L('Pannen melden: {meldeweg}', 'Report breaches: {meldeweg}')
			],
			cite: [KIVO('Art. 4')]
		}
	],
	quiz: [
		{
			text: L(
				'Sie möchten eine Kundenbeschwerde mit Namen und Bestelldaten von einem kostenlosen Chatbot umformulieren lassen. Geht das?',
				'You want a free chatbot to rephrase a customer complaint with name and order details. Is that all right?'
			),
			options: [
				{
					text: L('Ja, solange ich das Ergebnis prüfe', 'Yes, as long as I check the result'),
					correct: false,
					why: L(
						'Die Prüfung hilft beim Ergebnis, nicht bei den Daten: sie sind dann schon beim Anbieter.',
						'Checking helps with the result, not with the data: it has already reached the provider.'
					)
				},
				{
					text: L(
						'Nein: nur ein freigegebenes Werkzeug, und Namen und Kennungen vorher entfernen',
						'No: only an approved tool, and remove names and identifiers first'
					),
					correct: true,
					why: L(
						'Kostenlose Versionen haben meist keinen Auftragsverarbeitungsvertrag und nutzen Eingaben für eigene Zwecke.',
						'Free versions usually have no processing agreement and use inputs for their own purposes.'
					)
				},
				{
					text: L(
						'Ja, wenn ich es privat am Abend mache',
						'Yes, if I do it privately in the evening'
					),
					correct: false,
					why: L(
						'Dienstliche Daten bleiben dienstlich, auch auf einem privaten Konto.',
						'Work data stays work data, also on a private account.'
					)
				}
			],
			cite: DSGVO('Art. 28 Abs. 1')
		},
		{
			text: L(
				'Die KI nennt für eine Antwort an einen Kunden ein Urteil mit Aktenzeichen. Was tun Sie?',
				'For a reply to a customer, the AI cites a ruling with a case number. What do you do?'
			),
			options: [
				{
					text: L('Übernehmen, das Aktenzeichen wirkt echt', 'Use it; the case number looks real'),
					correct: false,
					why: L(
						'KI erfindet auch Quellen, die echt aussehen.',
						'AI also invents sources that look real.'
					)
				},
				{
					text: L(
						'Das Urteil in einer verlässlichen Quelle nachprüfen',
						'Check the ruling in a reliable source'
					),
					correct: true,
					why: L(
						'Sie verantworten die Antwort; was nicht geprüft ist, geht nicht hinaus.',
						'You are responsible for the reply; what is not checked does not go out.'
					)
				},
				{
					text: L('Die KI fragen, ob das Urteil stimmt', 'Ask the AI whether the ruling is right'),
					correct: false,
					why: L(
						'Die KI bestätigt oft, was sie selbst erfunden hat.',
						'AI often confirms what it invented itself.'
					)
				}
			],
			cite: KIVO('Art. 4')
		},
		{
			text: L(
				'Ein KI-Werkzeug sortiert Bewerbungen und schlägt vor, wen Sie absagen. Wer entscheidet?',
				'An AI tool sorts applications and suggests whom to reject. Who decides?'
			),
			options: [
				{
					text: L(
						'Das Werkzeug, es ist schneller und neutral',
						'The tool; it is faster and neutral'
					),
					correct: false,
					why: L(
						'Auch KI kann verzerrt sein, und über Menschen darf sie nicht allein entscheiden.',
						'AI can be biased too, and it must not decide about people on its own.'
					)
				},
				{
					text: L('Ein Mensch, der die Vorschläge prüft', 'A human who checks the suggestions'),
					correct: true,
					why: L(
						'Entscheidungen mit erheblicher Wirkung auf Menschen trifft ein Mensch, der sie versteht und ändern kann.',
						'Decisions with a significant effect on people are made by a human who understands and can change them.'
					)
				}
			],
			cite: DSGVO('Art. 22 Abs. 1')
		},
		{
			text: L(
				'Ihr Videokonferenz-Tool bietet an, die Stimmung der Teilnehmenden aus ihren Gesichtern zu messen. Was gilt?',
				'Your video conferencing tool offers to measure participants’ mood from their faces. What applies?'
			),
			options: [
				{
					text: L('Erlaubt, wenn alle zustimmen', 'Allowed if everyone agrees'),
					correct: false,
					why: L(
						'Das Verbot am Arbeitsplatz gilt unabhängig von einer Zustimmung; Ausnahmen gibt es nur aus medizinischen oder Sicherheitsgründen.',
						'The workplace prohibition applies regardless of consent; the only exceptions are medical or safety reasons.'
					)
				},
				{
					text: L('Verboten: nicht nutzen und melden', 'Prohibited: do not use it, report it'),
					correct: true,
					why: L(
						'Emotionserkennung am Arbeitsplatz ist eine verbotene Praxis der KI-Verordnung.',
						'Emotion recognition at the workplace is a prohibited practice under the AI Act.'
					)
				},
				{
					text: L(
						'Erlaubt, wenn nur die Leitung die Ergebnisse sieht',
						'Allowed if only management sees the results'
					),
					correct: false,
					why: L(
						'Wer die Ergebnisse sieht, ändert nichts am Verbot.',
						'Who sees the results does not change the prohibition.'
					)
				}
			],
			cite: KIVO('Art. 5 Abs. 1 lit. f')
		}
	]
};
