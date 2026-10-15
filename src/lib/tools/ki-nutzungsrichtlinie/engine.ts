import { reasonFor } from '../checklist.js';
import type {
	Answers,
	Localized,
	QuestionnaireCatalog,
	QuestionnaireResult,
	Reason
} from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });

type Clause = { title: Localized; sentences: Localized[] };

const OFFICE = L('[zuständige Stelle]', '[responsible function]');

/** placeholder for a decision left open, so the draft shows the gap */
function open(topic: Localized): Localized {
	return L(`[Offen: ${topic.de}]`, `[Open: ${topic.en}]`);
}

/** picks the sentence for a yes/no decision; "unclear" yields a placeholder */
function choose(answer: string | undefined, ifYes: Localized, ifNo: Localized, topic: Localized) {
	if (answer === 'yes') return ifYes;
	if (answer === 'no') return ifNo;
	return open(topic);
}

/**
 * generates a numbered draft policy from organisational choices. Choices
 * that conflict with the GDPR or the AI Act are returned as reasons; the
 * clauses themselves are the notes.
 */
export function evaluate(catalog: QuestionnaireCatalog, answers: Answers): QuestionnaireResult {
	const a = (id: string) => answers[id];
	const clauses: Clause[] = [];

	clauses.push({
		title: L('Geltungsbereich', 'Scope'),
		sentences: [
			L(
				'Diese Richtlinie gilt für alle Beschäftigten bei der dienstlichen Nutzung von KI-Systemen, insbesondere generativer KI wie Chatbots, Text-, Bild- und Codeassistenten.',
				'This policy applies to all staff using AI systems for work, in particular generative AI such as chatbots and text, image and code assistants.'
			)
		]
	});

	clauses.push({
		title: L('Zugelassene Werkzeuge', 'Approved tools'),
		sentences: [
			choose(
				a('p_allowlist'),
				L(
					`Genutzt werden dürfen nur die KI-Werkzeuge auf der Liste freigegebener Werkzeuge. Neue Werkzeuge gibt ${OFFICE.de} nach Prüfung von Datenschutz und Informationssicherheit frei.`,
					`Only the AI tools on the list of approved tools may be used. New tools are approved by the ${OFFICE.en} after a data protection and information security review.`
				),
				L(
					`Beschäftigte dürfen KI-Werkzeuge nutzen, die den Vorgaben dieser Richtlinie genügen; im Zweifel ist ${OFFICE.de} zu fragen.`,
					`Staff may use AI tools that meet the requirements of this policy; if in doubt, ask the ${OFFICE.en}.`
				),
				L('Positivliste freigegebener Werkzeuge', 'allowlist of approved tools')
			),
			choose(
				a('p_private'),
				L(
					'Private Konten dürfen nur für Aufgaben ohne personenbezogene oder vertrauliche Daten genutzt werden.',
					'Private accounts may only be used for tasks without personal or confidential data.'
				),
				L(
					'Private Konten und kostenlose Verbraucherversionen sind für dienstliche Zwecke nicht zulässig.',
					'Private accounts and free consumer versions are not permitted for work.'
				),
				L('Nutzung privater Konten', 'use of private accounts')
			)
		]
	});

	clauses.push({
		title: L('Daten', 'Data'),
		sentences: [
			choose(
				a('p_personal'),
				L(
					'Personenbezogene Daten dürfen nur in freigegebene Werkzeuge mit Auftragsverarbeitungsvertrag eingegeben werden, deren Anbieter Eingaben nicht für eigene Zwecke nutzt, und nur so weit wie nötig. Besondere Kategorien nach Art. 9 DSGVO werden nicht eingegeben.',
					'Personal data may only be entered into approved tools with a processing agreement whose provider does not use inputs for its own purposes, and only as far as necessary. Special categories under Art. 9 GDPR are never entered.'
				),
				L(
					'Personenbezogene Daten dürfen nicht eingegeben werden; Texte sind vorher zu anonymisieren.',
					'Personal data must not be entered; texts are anonymised beforehand.'
				),
				L('Eingabe personenbezogener Daten', 'entering personal data')
			),
			choose(
				a('p_confidential'),
				L(
					'Vertrauliche Informationen dürfen nur in Werkzeugen verarbeitet werden, die für diese Schutzstufe freigegeben sind. Zugangsdaten, Schlüssel und Passwörter werden nie eingegeben.',
					'Confidential information may only be processed in tools approved for that protection level. Credentials, keys and passwords are never entered.'
				),
				L(
					'Vertrauliche Informationen, Geschäftsgeheimnisse, Zugangsdaten und Schlüssel dürfen nicht eingegeben werden.',
					'Confidential information, trade secrets, credentials and keys must not be entered.'
				),
				L('Eingabe vertraulicher Informationen', 'entering confidential information')
			)
		]
	});

	const useSentences = [
		choose(
			a('p_review'),
			L(
				'KI-Ergebnisse sind vor ihrer Verwendung auf Richtigkeit, Vollständigkeit und Rechte Dritter zu prüfen; die Verantwortung bleibt bei der nutzenden Person.',
				'AI outputs are checked for accuracy, completeness and third-party rights before use; responsibility stays with the user.'
			),
			L(
				'Die Verantwortung für die Verwendung von KI-Ergebnissen bleibt bei der nutzenden Person.',
				'Responsibility for using AI outputs stays with the user.'
			),
			L('Prüfung der Ergebnisse', 'review of outputs')
		),
		choose(
			a('p_label'),
			L(
				'Nach außen gerichtete Inhalte, die ganz oder wesentlich von KI erzeugt wurden, werden gekennzeichnet; Deepfakes stets (Art. 50 Abs. 4 KI-VO).',
				'External content generated wholly or substantially by AI is labelled; deepfakes always (Art. 50(4) AI Act).'
			),
			L(
				'KI-erzeugte Inhalte werden gekennzeichnet, soweit Art. 50 KI-VO dies verlangt.',
				'AI-generated content is labelled where Art. 50 AI Act requires it.'
			),
			L('Kennzeichnung nach außen', 'external labelling')
		)
	];
	if (a('p_code') === 'yes') {
		useSentences.push(
			L(
				'Von KI erzeugter Programmcode wird wie fremder Code geprüft, insbesondere auf Sicherheit und Lizenzen. Quellcode mit Geheimnissen oder Zugangsdaten wird nicht eingegeben.',
				'AI-generated code is reviewed like third-party code, especially for security and licences. Source code containing secrets or credentials is not entered.'
			)
		);
	} else if (a('p_code') === 'no') {
		useSentences.push(
			L('KI wird nicht zur Programmierung eingesetzt.', 'AI is not used for programming.')
		);
	}
	useSentences.push(
		choose(
			a('p_people'),
			L(
				`KI darf Entscheidungen über Personen nur vorbereiten; die Entscheidung trifft ein Mensch. Jeder solche Einsatz bedarf vorab der Freigabe durch ${OFFICE.de} und den Datenschutzbeauftragten; für Hochrisiko-Systeme gelten Art. 26 KI-VO und Art. 22 DSGVO.`,
				`AI may only prepare decisions about persons; a human makes the decision. Every such use requires prior approval by the ${OFFICE.en} and the data protection officer; for high-risk systems Art. 26 AI Act and Art. 22 GDPR apply.`
			),
			L(
				'KI wird nicht für Entscheidungen über Beschäftigte, Bewerbende oder Kundinnen und Kunden eingesetzt.',
				'AI is not used for decisions about employees, applicants or customers.'
			),
			L('Entscheidungen über Personen', 'decisions about persons')
		)
	);
	clauses.push({ title: L('Nutzung', 'Use'), sentences: useSentences });

	const orgSentences = [
		choose(
			a('p_training'),
			L(
				'Vor der ersten Nutzung nehmen alle Nutzenden an einer Schulung zur KI-Kompetenz teil; die Teilnahme wird dokumentiert (Art. 4 KI-VO).',
				'Before first use, all users attend AI literacy training; attendance is documented (Art. 4 AI Act).'
			),
			L(
				'Die Organisation stellt die KI-Kompetenz der Nutzenden auf andere geeignete Weise sicher (Art. 4 KI-VO).',
				"The organisation ensures users' AI literacy by other suitable means (Art. 4 AI Act)."
			),
			L('Schulung', 'training')
		),
		choose(
			a('p_contact'),
			L(
				`Ansprechstelle für Freigaben, Fragen und Meldungen ist ${OFFICE.de}.`,
				`The point of contact for approvals, questions and reports is the ${OFFICE.en}.`
			),
			L(
				'Fragen zur Nutzung richten Beschäftigte an ihre Vorgesetzten.',
				'Staff direct questions about use to their managers.'
			),
			L('zuständige Stelle', 'responsible function')
		)
	];
	if (a('p_incidents') === 'yes') {
		orgSentences.push(
			L(
				`Fehlerhafte oder diskriminierende Ausgaben, versehentlich eingegebene personenbezogene oder vertrauliche Daten und Sicherheitsvorfälle sind unverzüglich ${OFFICE.de} und bei personenbezogenen Daten dem Datenschutzbeauftragten zu melden (Art. 33 DSGVO: 72 Stunden).`,
				`Faulty or discriminatory outputs, personal or confidential data entered by mistake and security incidents are reported without delay to the ${OFFICE.en} and, for personal data, to the data protection officer (Art. 33 GDPR: 72 hours).`
			)
		);
	} else if (a('p_incidents') === 'unknown') {
		orgSentences.push(open(L('Meldung von Vorfällen', 'incident reporting')));
	}
	if (a('p_council') === 'yes') {
		orgSentences.push(
			L(
				'KI-Systeme, die zur Leistungs- oder Verhaltenskontrolle geeignet sind, werden nur nach Mitbestimmung des Betriebsrats eingeführt oder geändert (§ 87 Abs. 1 Nr. 6 BetrVG); über die Planung von KI wird er rechtzeitig unterrichtet (§ 90 BetrVG).',
				'AI systems capable of monitoring performance or behaviour are only introduced or changed with the co-determination of the works council (§ 87(1) no. 6 BetrVG); it is informed in good time about plans to use AI (§ 90 BetrVG).'
			)
		);
	}
	clauses.push({ title: L('Organisation', 'Organisation'), sentences: orgSentences });

	clauses.push({
		title: L('Überprüfung', 'Review'),
		sentences: [
			L(
				'Die Richtlinie wird mindestens jährlich sowie bei neuen Werkzeugen oder Rechtsänderungen überprüft.',
				'The policy is reviewed at least annually and whenever new tools or legal changes arise.'
			)
		]
	});

	const notes = clauses.map((clause, index) => ({
		de: `§ ${index + 1} ${clause.title.de}. ${clause.sentences.map((s) => s.de).join(' ')}`,
		en: `§ ${index + 1} ${clause.title.en}. ${clause.sentences.map((s) => s.en).join(' ')}`
	}));

	// choices that sit badly with the law
	const warnings: Reason[] = [];
	if (a('p_private') === 'yes') warnings.push(reasonFor(catalog, 'p_private'));
	if (a('p_review') === 'no') warnings.push(reasonFor(catalog, 'p_review'));
	if (a('p_training') === 'no') warnings.push(reasonFor(catalog, 'p_training'));
	if (a('p_contact') === 'no') warnings.push(reasonFor(catalog, 'p_contact'));
	if (a('p_incidents') === 'no') warnings.push(reasonFor(catalog, 'p_incidents'));
	const undecided = Object.entries(answers)
		.filter(([, value]) => value === 'unknown')
		.map(([id]) => reasonFor(catalog, id));

	const base = {
		notes,
		notesTitle: L('Entwurf der Richtlinie', 'Draft policy'),
		citations: catalog.sources
	};
	const template = L(
		'Ersetzen Sie die Platzhalter in eckigen Klammern und stimmen Sie den Entwurf mit Datenschutz, Informationssicherheit und gegebenenfalls dem Betriebsrat ab.',
		'Replace the placeholders in square brackets and agree the draft with data protection, information security and, where applicable, the works council.'
	);

	if (warnings.length > 0 || undecided.length > 0) {
		return {
			verdict: 'conditional',
			headline: L('Entwurf mit Hinweisen.', 'Draft with warnings.'),
			explanation: L(
				(warnings.length
					? 'Einige Entscheidungen erhöhen das Risiko von Datenschutzverstößen oder widersprechen Pflichten wie der KI-Kompetenz nach Art. 4 KI-VO; sie sind unter Gründe aufgeführt. '
					: '') +
					(undecided.length
						? 'Offene Entscheidungen erscheinen im Entwurf als Platzhalter. '
						: '') +
					template.de,
				(warnings.length
					? 'Some choices raise the risk of data protection breaches or conflict with duties such as AI literacy under Art. 4 AI Act; they are listed under reasons. '
					: '') +
					(undecided.length ? 'Open decisions appear as placeholders in the draft. ' : '') +
					template.en
			),
			reasons: [...warnings, ...undecided],
			...base
		};
	}

	return {
		verdict: 'negative',
		headline: L('Entwurf der KI-Nutzungsrichtlinie.', 'Draft AI usage policy.'),
		explanation: template,
		reasons: [],
		...base
	};
}
