import { dateAfterMonths, dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { fieldById } from '../../records/validate.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
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

/** the AI content each kind of involvement needs at least (Art. 4, Art. 26(2) AI Act) */
const AI_CONTENT: Record<string, string[]> = {
	aufsicht: ['aufsicht', 'risiken', 'funktionsweise'],
	entwicklung: ['funktionsweise', 'risiken', 'recht'],
	anwendung: ['risiken', 'daten', 'richtlinie'],
	leitung: ['risiken', 'recht']
};

const aiContent = (record: RecordView): string[] =>
	Array.isArray(record.data.ki_inhalte) ? record.data.ki_inhalte : [];

function aiLabel(id: string): Localized {
	const field = fieldById(definition, 'ki_inhalte');
	const option =
		field?.type === 'multiselect' ? field.options.find((o) => o.value === id) : undefined;
	return option?.label ?? L(id, id);
}

function assess(record: RecordView): QuestionnaireResult {
	const notes: Localized[] = [];
	const reasons: Reason[] = [];
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
		citations.push({ law: 'KI-VO', ref: 'Art. 4' });
		const role = typeof record.data.ki_befassung === 'string' ? record.data.ki_befassung : null;
		if (!role) {
			notes.push(
				L(
					'Für die KI-Inhalte die Art der Befassung angeben; davon hängt ab, was die Schulung abdecken muss (Art. 4 KI-VO).',
					'For the AI content, state the kind of involvement; it decides what the training must cover (Art. 4 AI Act).'
				)
			);
		} else {
			const required = AI_CONTENT[role] ?? AI_CONTENT.anwendung;
			const lacking = required.filter((id) => !aiContent(record).includes(id));
			if (role === 'aufsicht') {
				citations.push({ law: 'KI-VO', ref: 'Art. 26 Abs. 2' });
				for (const id of lacking) {
					const name = aiLabel(id);
					reasons.push({
						questionId: 'ki_inhalte',
						text: L(
							`KI-Inhalt für die Aufsicht fehlt: ${name.de}`,
							`AI content for oversight missing: ${name.en}`
						),
						cite: { law: 'KI-VO', ref: 'Art. 26 Abs. 2' }
					});
				}
			} else if (lacking.length > 0) {
				notes.push(
					L(
						`Für diese Befassung naheliegend, aber nicht behandelt: ${lacking.map((id) => aiLabel(id).de).join(', ')}.`,
						`Relevant for this involvement but not covered: ${lacking.map((id) => aiLabel(id).en).join(', ')}.`
					)
				);
			}
		}
	}

	if (reasons.length > 0) {
		return {
			verdict: 'positive',
			outcome: 'luecken',
			headline: L(
				'Kompetenz für die Aufsicht nicht belegt.',
				'Competence for oversight not evidenced.'
			),
			explanation: L(
				'Betreiber müssen die menschliche Aufsicht Personen übertragen, die über die nötige Kompetenz, Ausbildung und Befugnis verfügen (Art. 26 Abs. 2 KI-VO). Die folgenden Inhalte fehlen dafür.',
				'Deployers must assign human oversight to persons with the necessary competence, training and authority (Art. 26(2) AI Act). The content below is missing for that.'
			),
			reasons,
			notes,
			citations
		};
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
