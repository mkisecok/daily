import { gapDeadlines } from '../../records/checks.js';
import { dateAfterMonths, dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import { checklist, gapReasons, openNote } from '../_shared/occasion.js';
import type { LegalBasis, Localized, QuestionnaireResult } from '../types.js';
import { BLOCKS, definition, occasionOf } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const str = (record: RecordView, id: string) => {
	const value = record.data[id];
	return typeof value === 'string' && value ? value : null;
};

/** a calendar date plus whole days */
export function dateAfterDays(date: string, days: number): string {
	const day = new Date(`${date}T00:00:00.000Z`);
	day.setUTCDate(day.getUTCDate() + days);
	return day.toISOString().slice(0, 10);
}

/**
 * the remedy deadline after a decision was served: one month for an action
 * (§ 74 VwGO), two weeks for an objection to a fine notice (§ 67 OWiG). An
 * end on a weekend or holiday moves to the next working day; the date shown
 * is the earlier one, so it is never too late.
 */
export function remedyDeadline(
	occasion: string | null,
	served: string | null
): { due: string; cite: LegalBasis; label: Localized } | null {
	if (!served) return null;
	if (occasion === 'bescheid') {
		return {
			due: dateAfterMonths(served, 1),
			cite: { law: 'VwGO', ref: '§ 74 Abs. 1' },
			label: L('Klagefrist gegen den Bescheid', 'Deadline for an action against the decision')
		};
	}
	if (occasion === 'bussgeld') {
		return {
			due: dateAfterDays(served, 14),
			cite: { law: 'OWiG', ref: '§ 67 Abs. 1' },
			label: L('Einspruchsfrist gegen den Bußgeldbescheid', 'Deadline to object to the fine')
		};
	}
	return null;
}

/** the reply deadline while in progress, the remedy deadline until closed, gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const reply = str(record, 'frist');
	if (reply && record.state === 'offen') {
		specs.push({
			kind: 'antwort',
			label: L('Antwort an die Aufsichtsbehörde', 'Reply to the supervisory authority'),
			dueAt: dayAt(reply),
			cite: { law: 'DSGVO', ref: 'Art. 31' }
		});
	}
	const remedy = remedyDeadline(occasionOf(record.data), str(record, 'bescheid_am'));
	if (remedy && record.state !== 'abgeschlossen') {
		specs.push({
			kind: 'rechtsbehelf',
			label: remedy.label,
			dueAt: dayAt(remedy.due),
			cite: remedy.cite
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/** the state of the procedure: gaps are reasons; open points keep it open */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const occasion = occasionOf(data);
	const citations: LegalBasis[] = [
		{ law: 'DSGVO', ref: 'Art. 31, Art. 83 Abs. 2 lit. f' },
		{ law: 'BDSG', ref: '§ 40 Abs. 4' }
	];
	const notes: Localized[] = [];

	if (!occasion) {
		return {
			verdict: 'conditional',
			outcome: 'unvollstaendig',
			headline: L('Anlass fehlt.', 'Occasion missing.'),
			explanation: L(
				'Erst angeben, was die Behörde ausgelöst hat; danach zeigt die Checkliste, was gilt.',
				'First say what prompted the authority; then the checklist shows what is needed.'
			),
			reasons: [],
			notes,
			citations
		};
	}

	const state = checklist(data, BLOCKS);
	const reasons = gapReasons(state.gaps);
	const open = openNote(state.open);
	if (open) notes.push(open);

	const remedy = remedyDeadline(
		occasion,
		typeof data.bescheid_am === 'string' ? data.bescheid_am : null
	);
	if (remedy) {
		citations.push(remedy.cite);
		notes.push(
			L(
				`${remedy.label.de}: spätestens am ${remedy.due.split('-').reverse().join('.')}.`,
				`${remedy.label.en}: by ${remedy.due} at the latest.`
			)
		);
	} else if (occasion === 'bescheid' || occasion === 'bussgeld') {
		notes.push(
			L(
				'Das Zustelldatum eintragen, dann berechnet Daily die Rechtsbehelfsfrist.',
				'Enter the date of service and Daily works out the remedy deadline.'
			)
		);
	}
	if (occasion === 'beschwerde' && isEmpty(data.anfrage)) {
		notes.push(
			L(
				'Die zugrunde liegende Betroffenenanfrage verknüpfen.',
				'Link the underlying data subject request.'
			)
		);
	}
	if (occasion === 'panne' && isEmpty(data.panne_ref)) {
		notes.push(L('Die gemeldete Datenpanne verknüpfen.', 'Link the reported breach.'));
	}

	const figures = L(
		`${state.done.length} von ${state.points.length} Punkten erledigt.`,
		`${state.done.length} of ${state.points.length} points done.`
	);

	if (reasons.length > 0) {
		return {
			verdict: 'positive',
			outcome: 'luecken',
			headline: L('Noch nicht antwortbereit.', 'Not ready to reply.'),
			explanation: L(
				`Die folgenden Punkte sind nicht erfüllt. ${figures.de}`,
				`The points below are not met. ${figures.en}`
			),
			reasons,
			notes,
			citations
		};
	}
	if (state.open.length > 0) {
		return {
			verdict: 'conditional',
			outcome: 'offen',
			headline: L('In Bearbeitung.', 'In progress.'),
			explanation: L(
				`Keine Lücke bisher, aber nicht alles ist erledigt. ${figures.de}`,
				`No gap so far, but not everything is done. ${figures.en}`
			),
			reasons,
			notes,
			citations
		};
	}
	return {
		verdict: 'negative',
		outcome: 'bereit',
		headline: L('Bereit.', 'Ready.'),
		explanation: L(
			`Alle Punkte sind erledigt. ${figures.de}`,
			`Every point is done. ${figures.en}`
		),
		reasons,
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
