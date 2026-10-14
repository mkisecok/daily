import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { definition, RETENTION, type Unit } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

function deadlines(record: RecordView): DeadlineSpec[] {
	const date = record.data.naechster_loeschlauf;
	if (typeof date !== 'string') return [];
	return [
		{
			kind: 'loeschlauf',
			label: L('Löschlauf', 'Erasure run'),
			dueAt: dayAt(date),
			cite: { law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. e' }
		}
	];
}

const inMonths = (value: number, unit: Unit) => (unit === 'jahre' ? value * 12 : value);

/** "8 Jahren" / "8 years", in the dative the German sentences need. */
function describe(value: number, unit: Unit): Localized {
	const years = unit === 'jahre';
	return L(
		`${value} ${years ? (value === 1 ? 'Jahr' : 'Jahren') : value === 1 ? 'Monat' : 'Monaten'}`,
		`${value} ${years ? (value === 1 ? 'year' : 'years') : value === 1 ? 'month' : 'months'}`
	);
}

/**
 * The entered period against the statutory one: shorter is a defect (the
 * retention duty is breached), longer needs its own justification. Then
 * the erasure method and the next run.
 */
function assess(record: RecordView): QuestionnaireResult {
	const reasons: Reason[] = [];
	const notes: Localized[] = [];
	const citations: LegalBasis[] = [{ law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. e' }];
	const basis =
		typeof record.data.grundlage === 'string' ? RETENTION[record.data.grundlage] : undefined;
	const value = typeof record.data.frist_wert === 'number' ? record.data.frist_wert : null;
	const unit = (record.data.frist_einheit as Unit | null) ?? null;

	if (record.data.grundlage !== 'keine' && (value === null || unit === null)) {
		reasons.push({
			questionId: 'frist_wert',
			text: L('Frist und Einheit fehlen', 'Period and unit are missing'),
			cite: { law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. e' }
		});
	}
	if (!record.data.fristbeginn && record.data.grundlage !== 'keine') {
		reasons.push({
			questionId: 'fristbeginn',
			text: L('Beginn der Frist fehlt', 'Start of the period is missing')
		});
	}
	if (record.data.grundlage === 'keine' && !record.data.ereignis) {
		notes.push(
			L(
				'Ohne gesetzliche Frist: festhalten, woran der Wegfall des Zwecks erkennbar ist, damit die Löschung ausgelöst werden kann.',
				'Without a statutory period: record how the end of the purpose is recognised so that erasure can be triggered.'
			)
		);
	}

	const statutory = basis?.period;
	if (statutory && value !== null && unit !== null) {
		const [sValue, sUnit, sStart] = statutory;
		const entered = inMonths(value, unit);
		const required = inMonths(sValue, sUnit);
		const legal = describe(sValue, sUnit);
		if (entered < required && record.data.grundlage !== 'bewerbung') {
			reasons.push({
				questionId: 'frist_wert',
				text: L(
					`Kürzer als die gesetzliche Aufbewahrungsfrist von ${legal.de}`,
					`Shorter than the statutory retention period of ${legal.en}`
				)
			});
		} else if (entered > required) {
			notes.push(
				L(
					`Länger als die übliche Frist von ${legal.de}: Eine längere Speicherung braucht eine eigene Grundlage; den Grund im Eintrag festhalten.`,
					`Longer than the usual period of ${legal.en}: longer storage needs its own basis; record the reason in the entry.`
				)
			);
		}
		if (sStart === 'jahresende' && record.data.fristbeginn === 'jahresende' && unit === 'jahre') {
			notes.push(
				L(
					`Unterlagen eines Jahres sind frühestens zum 1. Januar des ${value + 1}. Folgejahres zu löschen, z. B. Unterlagen aus 2026 ab dem 1. Januar ${2027 + value}.`,
					`Documents may be erased once ${value} full calendar years have passed after the year of creation, e.g. documents from 2026 from 1 January ${2027 + value}.`
				)
			);
		}
	}

	if (record.data.loeschart === 'sperrung') {
		notes.push(
			L(
				'Einschränkung statt Löschung ist nur in den Fällen des § 35 BDSG zulässig, etwa wenn Aufbewahrungspflichten entgegenstehen oder eine Löschung bei nicht automatisierter Verarbeitung unverhältnismäßigen Aufwand erfordert.',
				'Restriction instead of erasure is only permitted in the cases of § 35 BDSG, e.g. where retention duties prevent erasure or erasure in non-automated processing would require disproportionate effort.'
			)
		);
		citations.push({ law: 'BDSG', ref: '§ 35' });
	}
	if (record.data.loeschart === 'manuell') {
		notes.push(
			L(
				'Manuelle Löschung: Turnus und verantwortliche Person festlegen und jeden Löschlauf protokollieren.',
				'Manual erasure: set the interval and the responsible person, and log each erasure run.'
			)
		);
	}
	if (record.data.status === 'umgesetzt' && !record.data.naechster_loeschlauf) {
		notes.push(
			L(
				'Den nächsten Löschlauf eintragen; er erscheint dann unter Fristen.',
				'Enter the next erasure run; it then appears under Deadlines.'
			)
		);
	}

	if (reasons.length > 0) {
		return {
			verdict: 'positive',
			outcome: 'maengel',
			headline: L(
				'Löschregel unvollständig oder unzulässig.',
				'Erasure rule incomplete or impermissible.'
			),
			explanation: L(
				'Ohne bestimmte Frist und Fristbeginn lässt sich die Speicherbegrenzung nicht nachweisen; eine zu kurze Frist verletzt gesetzliche Aufbewahrungspflichten.',
				'Without a definite period and start, storage limitation cannot be evidenced; a period that is too short breaches statutory retention duties.'
			),
			reasons,
			notes,
			citations
		};
	}
	return notes.length > 0
		? {
				verdict: 'conditional',
				outcome: 'hinweise',
				headline: L('Löschregel festgelegt, mit Hinweisen.', 'Erasure rule set, with points.'),
				explanation: L('Frist, Beginn und Regel liegen vor.', 'Period, start and rule are set.'),
				reasons: [],
				notes,
				citations
			}
		: {
				verdict: 'negative',
				outcome: 'festgelegt',
				headline: L('Löschregel festgelegt.', 'Erasure rule set.'),
				explanation: L(
					'Frist, Beginn und Regel liegen vor; die Löschläufe dokumentieren.',
					'Period, start and rule are set; document the erasure runs.'
				),
				reasons: [],
				notes,
				citations
			};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition, RETENTION };
