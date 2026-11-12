import { gapDeadlines } from '../../records/checks.js';
import { dateAfterMonths, dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import { checklist, gapReasons, inScope, openNote, snapshot } from '../_shared/occasion.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { BLOCKS, definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** months after the rejection when the documents are deleted: two to claim, three to sue, a margin */
export const KEEP_MONTHS = 6;

/** the day from which rejected applicants' documents are to be deleted */
export function deletionDue(rejected: string | null): string | null {
	return rejected ? dateAfterMonths(rejected, KEEP_MONTHS) : null;
}

const rejectedOn = (record: RecordView) => {
	const value = record.data.absagen_am;
	return typeof value === 'string' && value ? value : null;
};

/** deletion of the rejected applications until closed, gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const due = deletionDue(rejectedOn(record));
	if (due && record.state !== 'abgeschlossen') {
		specs.push({
			kind: 'loeschung',
			label: L(
				'Unterlagen abgelehnter Bewerbender löschen',
				'Delete rejected applicants’ documents'
			),
			dueAt: dayAt(due),
			cite: { law: 'AGG', ref: '§ 15 Abs. 4' }
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/** the state of the procedure: gaps and a prohibited AI practice are reasons */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const citations: LegalBasis[] = [
		{ law: 'DSGVO', ref: 'Art. 5, 13, 17' },
		{ law: 'AGG', ref: '§ 15 Abs. 4' }
	];
	const notes: Localized[] = [];
	const state = checklist(data, BLOCKS);
	const reasons: Reason[] = gapReasons(state.gaps);
	const pending: Localized[] = [];

	if (inScope(data, ['ki'])) {
		citations.push({ law: 'KI-VO', ref: 'Anhang III Nr. 4, Art. 26' });
		const classification = snapshot(data, 'einstufung');
		if (!classification) pending.push(L('Risikoklassifizierung', 'risk classification'));
		else if (classification.outcome === 'verboten') {
			reasons.unshift({
				questionId: 'einstufung',
				text: L(
					'Die Risikoklassifizierung ergibt eine verbotene Praxis; das System darf nicht eingesetzt werden.',
					'The risk classification finds a prohibited practice; the system must not be used.'
				),
				cite: { law: 'KI-VO', ref: 'Art. 5' }
			});
		} else if (classification.outcome === 'hochrisiko') {
			notes.push(
				L(
					'Hochrisiko-KI: ab dem 2. Dezember 2027 gelten die Betreiberpflichten des Art. 26 (Werkzeug Betreiberpflichten).',
					'High-risk AI: the deployer duties of Art. 26 apply from 2 December 2027 (deployer duties tool).'
				)
			);
		}
	}

	const open = openNote(state.open);
	if (open) notes.push(open);
	if (pending.length > 0) {
		notes.push(
			L(
				`Noch durchzuführen: ${pending.map((p) => p.de).join(', ')}.`,
				`Still to run: ${pending.map((p) => p.en).join(', ')}.`
			)
		);
	}
	const due = deletionDue(rejectedOn(record));
	if (due) {
		notes.push(
			L(
				`Unterlagen abgelehnter Bewerbender ab dem ${due.split('-').reverse().join('.')} löschen, wenn bis dahin kein Anspruch geltend gemacht wurde.`,
				`Delete rejected applicants’ documents from ${due} unless a claim has been made by then.`
			)
		);
	}
	if (inScope(data, ['portal']) && isEmpty(data.avv)) {
		notes.push(
			L(
				'Die AVV-Prüfung für das Portal verknüpfen.',
				'Link the processing agreement check for the portal.'
			)
		);
	}

	const figures = L(
		`${state.done.length} von ${state.points.length} Punkten erledigt.`,
		`${state.done.length} of ${state.points.length} points done.`
	);

	if (reasons.length > 0) {
		return {
			verdict: 'positive',
			outcome: 'luecken',
			headline: L('Handlungsbedarf im Verfahren.', 'Action needed in the procedure.'),
			explanation: L(
				`Die folgenden Punkte sind nicht erfüllt. ${figures.de}`,
				`The points below are not met. ${figures.en}`
			),
			reasons,
			notes,
			citations
		};
	}
	if (state.open.length > 0 || pending.length > 0) {
		return {
			verdict: 'conditional',
			outcome: 'offen',
			headline: L('Verfahren läuft.', 'Procedure running.'),
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
		outcome: 'erledigt',
		headline: L('Alles erledigt.', 'All done.'),
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
