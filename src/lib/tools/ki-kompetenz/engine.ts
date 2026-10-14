import { dateAfterMonths, dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { fieldById } from '../../records/validate.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const content = (record: RecordView): string[] =>
	Array.isArray(record.data.inhalte) ? record.data.inhalte : [];

/** The refresher: date done plus the interval, once the measure has taken place. */
function deadlines(record: RecordView): DeadlineSpec[] {
	const date = record.data.durchgefuehrt_am;
	const months = record.data.wiederholung_monate;
	if (
		record.data.status !== 'durchgefuehrt' ||
		typeof date !== 'string' ||
		typeof months !== 'number'
	) {
		return [];
	}
	return [
		{
			kind: 'auffrischung',
			label: L('Auffrischung KI-Kompetenz', 'AI literacy refresher'),
			dueAt: dayAt(dateAfterMonths(date, months)),
			cite: { law: 'KI-VO', ref: 'Art. 4' }
		}
	];
}

/** Content each kind of involvement needs at least. */
const REQUIRED: Record<string, { ids: string[]; cite: LegalBasis }> = {
	aufsicht: {
		ids: ['aufsicht', 'risiken', 'funktionsweise'],
		cite: { law: 'KI-VO', ref: 'Art. 26 Abs. 2' }
	},
	entwicklung: {
		ids: ['funktionsweise', 'risiken', 'recht'],
		cite: { law: 'KI-VO', ref: 'Art. 4' }
	},
	anwendung: { ids: ['risiken', 'daten', 'richtlinie'], cite: { law: 'KI-VO', ref: 'Art. 4' } },
	leitung: { ids: ['risiken', 'recht'], cite: { law: 'KI-VO', ref: 'Art. 4' } }
};

function label(id: string): Localized {
	const field = fieldById(definition, 'inhalte');
	const option =
		field?.type === 'multiselect' ? field.options.find((o) => o.value === id) : undefined;
	return option?.label ?? L(id, id);
}

/**
 * Content the role needs but the measure lacks; for human oversight of
 * high-risk systems that is a defect (Art. 26(2)), otherwise a point.
 */
function assess(record: RecordView): QuestionnaireResult {
	const role = typeof record.data.nutzung === 'string' ? record.data.nutzung : 'anwendung';
	const required = REQUIRED[role] ?? REQUIRED.anwendung;
	const lacking = required.ids.filter((id) => !content(record).includes(id));
	const reasons: Reason[] = [];
	const notes: Localized[] = [];
	const citations: LegalBasis[] = [{ law: 'KI-VO', ref: 'Art. 4' }];

	if (role === 'aufsicht') {
		citations.push({ law: 'KI-VO', ref: 'Art. 26 Abs. 2' });
		for (const id of lacking) {
			const text = label(id);
			reasons.push({
				questionId: id,
				text: L(`Inhalt fehlt: ${text.de}`, `Content missing: ${text.en}`),
				cite: required.cite
			});
		}
	} else if (lacking.length > 0) {
		notes.push(
			L(
				`Für diese Rolle naheliegend, aber nicht vorgesehen: ${lacking.map((id) => label(id).de).join(', ')}.`,
				`Relevant for this role but not planned: ${lacking.map((id) => label(id).en).join(', ')}.`
			)
		);
	}
	if (record.data.vorkenntnisse === 'keine' && record.data.form === 'anleitung') {
		notes.push(
			L(
				'Ohne Vorkenntnisse reicht eine schriftliche Anleitung selten; eine Schulung mit Praxisfällen vorsehen.',
				'Without prior knowledge written guidance rarely suffices; plan training with practical cases.'
			)
		);
	}
	if (
		record.data.status === 'durchgefuehrt' &&
		(!record.data.nachweis || record.data.nachweis === 'keiner')
	) {
		notes.push(
			L(
				'Die Maßnahme ist durchgeführt, aber nicht belegt; Teilnehmerliste oder Lernsystem-Abschluss festhalten.',
				'The measure has taken place but is not evidenced; keep an attendance list or learning system completion.'
			)
		);
	}
	if (
		record.data.status === 'durchgefuehrt' &&
		typeof record.data.wiederholung_monate !== 'number'
	) {
		notes.push(
			L(
				'Kein Auffrischungsintervall: KI-Systeme und ihre Risiken ändern sich schnell; 12 Monate sind ein üblicher Rhythmus.',
				'No refresher interval: AI systems and their risks change fast; 12 months is a common rhythm.'
			)
		);
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
				'Betreiber müssen die menschliche Aufsicht Personen übertragen, die über die nötige Kompetenz, Ausbildung und Befugnis verfügen (Art. 26 Abs. 2). Die folgenden Inhalte fehlen dafür.',
				'Deployers must assign human oversight to persons with the necessary competence, training and authority (Art. 26(2)). The content below is missing for that.'
			),
			reasons,
			notes,
			citations
		};
	}
	if (record.data.status !== 'durchgefuehrt') {
		return {
			verdict: 'conditional',
			outcome: 'geplant',
			headline: L('Maßnahme geplant.', 'Measure planned.'),
			explanation: L(
				'Nach der Durchführung Datum und Nachweis eintragen; die Auffrischung erscheint dann unter Fristen.',
				'After delivery enter the date and evidence; the refresher then appears under Deadlines.'
			),
			reasons: [],
			notes,
			citations
		};
	}
	return {
		verdict: notes.length > 0 ? 'conditional' : 'negative',
		outcome: 'durchgefuehrt',
		headline: L('KI-Kompetenz für diese Rolle belegt.', 'AI literacy for this role evidenced.'),
		explanation: L(
			'Die Maßnahme deckt die für die Rolle wesentlichen Inhalte ab.',
			'The measure covers the content essential for the role.'
		),
		reasons: [],
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
