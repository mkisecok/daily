import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { fieldById, isEmpty } from '../../records/validate.js';
import { DATES } from '../risikoklassifizierung/engine.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { definition, ELEMENTS, required } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** The first use as the latest date to finish, while not notified; the review date always. */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const first = record.data.erste_verwendung;
	if (typeof first === 'string' && required(record) && record.state !== 'mitgeteilt') {
		specs.push({
			kind: 'erste-verwendung',
			label: L(
				'Grundrechte-Folgenabschätzung vor erster Verwendung abschließen',
				'Complete the FRIA before first use'
			),
			dueAt: dayAt(first, '00:00'),
			cite: { law: 'KI-VO', ref: 'Art. 27 Abs. 1' }
		});
	}
	if (typeof record.data.ueberpruefung === 'string') {
		specs.push({
			kind: 'ueberpruefung',
			label: L('Überprüfung der Grundrechte-Folgenabschätzung', 'FRIA review'),
			dueAt: dayAt(record.data.ueberpruefung),
			cite: { law: 'KI-VO', ref: 'Art. 27 Abs. 2' }
		});
	}
	return specs;
}

function assess(record: RecordView): QuestionnaireResult {
	const citations: LegalBasis[] = [{ law: 'KI-VO', ref: 'Art. 27' }];
	const notes: Localized[] = [
		L(
			`Art. 27 gilt mit den Pflichten für Hochrisiko-Systeme nach Anhang III, nach der Omnibus-Verordnung ab dem ${DATES.annexIII.de}.`,
			`Art. 27 applies together with the obligations for Annex III high-risk systems, after the Omnibus Regulation from ${DATES.annexIII.en}.`
		)
	];

	if (!required(record)) {
		return {
			verdict: 'negative',
			outcome: 'nicht-erforderlich',
			headline: L('Keine Pflicht nach Art. 27.', 'No obligation under Art. 27.'),
			explanation: L(
				record.data.infrastruktur === true
					? 'Systeme im Bereich kritische Infrastruktur (Anhang III Nr. 2) sind ausgenommen.'
					: 'Nach den Angaben handelt es sich nicht um ein Hochrisiko-System nach Anhang III in der Hand eines der genannten Betreiber. Eine freiwillige Abschätzung kann dennoch sinnvoll sein.',
				record.data.infrastruktur === true
					? 'Systems in the critical infrastructure area (Annex III point 2) are excluded.'
					: 'According to the details this is not an Annex III high-risk system used by one of the deployers named. A voluntary assessment may still be useful.'
			),
			reasons: [],
			notes,
			citations
		};
	}

	const missing: Reason[] = ELEMENTS.filter((e) => isEmpty(record.data[e.id])).map((e) => ({
		questionId: e.id,
		text: fieldById(definition, e.id)?.label ?? L(e.id, e.id),
		cite: { law: 'KI-VO', ref: e.ref }
	}));
	if (isEmpty(record.data.grundrechte)) {
		notes.push(
			L(
				'Die berührten Grundrechte benennen; sie strukturieren die Risikobeschreibung nach lit. d.',
				'Name the fundamental rights concerned; they structure the risk description under (d).'
			)
		);
	}
	if (isEmpty(record.data.dsfa)) {
		notes.push(
			L(
				'Wurde für die Verarbeitung eine DSFA durchgeführt, ergänzt die Grundrechte-Folgenabschätzung diese (Art. 27 Abs. 4); auf sie verweisen.',
				'Where a DPIA was carried out for the processing, the FRIA complements it (Art. 27(4)); refer to it.'
			)
		);
		citations.push({ law: 'DSGVO', ref: 'Art. 35' });
	}
	notes.push(
		L(
			'Für die Mitteilung an die Marktüberwachungsbehörde stellt das Büro für Künstliche Intelligenz einen Fragebogen bereit (Art. 27 Abs. 3, 5).',
			'The AI Office provides a questionnaire template for notifying the market surveillance authority (Art. 27(3), (5)).'
		)
	);

	if (missing.length > 0) {
		return {
			verdict: 'positive',
			outcome: 'unvollstaendig',
			headline: L(
				'Grundrechte-Folgenabschätzung erforderlich und unvollständig.',
				'FRIA required and incomplete.'
			),
			explanation: L(
				'Vor der ersten Verwendung sind die folgenden Elemente des Art. 27 Abs. 1 zu bewerten.',
				'Before first use the following elements of Art. 27(1) must be assessed.'
			),
			reasons: missing,
			notes,
			citations
		};
	}
	return isEmpty(record.data.mitgeteilt_am)
		? {
				verdict: 'conditional',
				outcome: 'mitteilen',
				headline: L(
					'Bewertung vollständig: Ergebnis mitteilen.',
					'Assessment complete: notify the results.'
				),
				explanation: L(
					'Alle Elemente des Art. 27 Abs. 1 liegen vor. Das Ergebnis ist der Marktüberwachungsbehörde mitzuteilen (Art. 27 Abs. 3).',
					'All elements of Art. 27(1) are present. The results must be notified to the market surveillance authority (Art. 27(3)).'
				),
				reasons: [],
				notes,
				citations
			}
		: {
				verdict: 'negative',
				outcome: 'mitgeteilt',
				headline: L('Abgeschlossen und mitgeteilt.', 'Completed and notified.'),
				explanation: L(
					'Ändert sich eines der Elemente, ist die Abschätzung zu aktualisieren (Art. 27 Abs. 2).',
					'If any element changes, the assessment must be updated (Art. 27(2)).'
				),
				reasons: [],
				notes,
				citations
			};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition, ELEMENTS };
