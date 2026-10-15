import { dateAfterMonths, dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import type { LegalBasis, Localized, QuestionnaireResult } from '../types.js';
import { definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const topics = (record: RecordView): string[] =>
	Array.isArray(record.data.themen) ? record.data.themen : [];

/** the repetition: the training date plus the interval, at 9:00 German time */
function deadlines(record: RecordView): DeadlineSpec[] {
	const date = record.data.datum;
	const months = record.data.wiederholung_monate;
	if (typeof date !== 'string' || typeof months !== 'number') return [];
	return [
		{
			kind: 'wiederholung',
			label: L('Wiederholungsschulung Datenschutz', 'Data protection refresher training'),
			dueAt: dayAt(dateAfterMonths(date, months)),
			cite: { law: 'DSGVO', ref: 'Art. 39 Abs. 1 lit. b' }
		}
	];
}

function assess(record: RecordView): QuestionnaireResult {
	const notes: Localized[] = [];
	const citations: LegalBasis[] = [
		{ law: 'DSGVO', ref: 'Art. 39 Abs. 1 lit. b' },
		{ law: 'DSGVO', ref: 'Art. 5 Abs. 2' }
	];
	const noEvidence = !record.data.nachweis || record.data.nachweis === 'keiner';

	if (typeof record.data.wiederholung_monate !== 'number') {
		notes.push(
			L(
				'Kein Wiederholungsintervall: Wissen veraltet und Personal wechselt; üblich sind 12 bis 24 Monate.',
				'No repetition interval: knowledge ages and staff change; 12 to 24 months is usual.'
			)
		);
	}
	if (!topics(record).includes('pannen')) {
		notes.push(
			L(
				'Das Erkennen und interne Melden von Datenpannen ist nicht Thema; die 72-Stunden-Frist hängt davon ab, dass Beschäftigte Vorfälle sofort melden.',
				'Recognising and reporting breaches internally is not covered; the 72-hour period depends on staff reporting incidents at once.'
			)
		);
	}
	if (record.data.vertraulichkeit !== true) {
		notes.push(
			L(
				'Die Verpflichtung auf Vertraulichkeit mit der Schulung verbinden und dokumentieren (Art. 32 Abs. 4).',
				'Combine the confidentiality undertaking with the training and document it (Art. 32(4)).'
			)
		);
		citations.push({ law: 'DSGVO', ref: 'Art. 32 Abs. 4' });
	}
	if (topics(record).includes('ki')) {
		notes.push(
			L(
				'KI-Inhalte zusätzlich im Werkzeug KI-Kompetenz je Rolle erfassen (Art. 4 KI-VO).',
				'Also record AI content per role in the AI literacy tool (Art. 4 AI Act).'
			)
		);
	}

	if (noEvidence) {
		return {
			verdict: 'positive',
			outcome: 'ohne-nachweis',
			headline: L('Schulung ohne Nachweis.', 'Training without evidence.'),
			explanation: L(
				'Ohne Teilnehmerliste, Lernsystem-Abschluss oder Test lässt sich die Schulung im Rahmen der Rechenschaftspflicht nicht belegen (Art. 5 Abs. 2).',
				'Without an attendance list, learning system completion or test the training cannot be evidenced for accountability (Art. 5(2)).'
			),
			reasons: [],
			notes,
			citations
		};
	}
	return {
		verdict: notes.length > 0 ? 'conditional' : 'negative',
		outcome: 'dokumentiert',
		headline: L('Schulung dokumentiert.', 'Training documented.'),
		explanation: L(
			'Durchführung und Teilnahme sind belegt.',
			'Delivery and attendance are evidenced.'
		),
		reasons: [],
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
