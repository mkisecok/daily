import { gapDeadlines } from '../../records/checks.js';
import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import { checklist, gapReasons, inScope, openNote, snapshot } from '../_shared/occasion.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { BLOCKS, definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const str = (record: RecordView, id: string) => {
	const value = record.data[id];
	return typeof value === 'string' && value ? value : null;
};

/** the notice date and the contract end until closed, gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const open = record.state !== 'abgeschlossen';
	const notice = str(record, 'kuendigung_bis');
	if (notice && record.state === 'geplant') {
		specs.push({
			kind: 'kuendigung',
			label: L('Kündigung beim bisherigen Dienstleister', 'Notice to the previous provider'),
			dueAt: dayAt(notice),
			cite: { law: 'DSGVO', ref: 'Art. 28 Abs. 3 lit. g' }
		});
	}
	const end = str(record, 'vertragsende');
	if (end && open) {
		specs.push({
			kind: 'vertragsende',
			label: L(
				'Vertragsende: Daten zurück, Löschung bestätigen lassen',
				'Contract ends: data back, deletion confirmed'
			),
			dueAt: dayAt(end),
			cite: { law: 'DSGVO', ref: 'Art. 28 Abs. 3 lit. g' }
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/** the state of the change: gaps and a transfer without a basis are reasons */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const citations: LegalBasis[] = [{ law: 'DSGVO', ref: 'Art. 28 Abs. 3 lit. g' }];
	const notes: Localized[] = [];
	const state = checklist(data, BLOCKS);
	const reasons: Reason[] = gapReasons(state.gaps);
	const pending: Localized[] = [];

	if (inScope(data, ['cloud'])) citations.push({ law: 'Data Act', ref: 'Art. 25, 29' });
	if (inScope(data, ['drittland'])) {
		const transfer = snapshot(data, 'transfer_check');
		if (!transfer) pending.push(L('Drittlandprüfung', 'third-country check'));
		else if (transfer.verdict === 'positive') {
			reasons.push({
				questionId: 'transfer_check',
				text: L(
					`Drittlandprüfung: ${transfer.headline.de}`,
					`Third-country check: ${transfer.headline.en}`
				),
				cite: { law: 'DSGVO', ref: 'Art. 44' }
			});
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
	if (inScope(data, ['neu']) && isEmpty(data.avv_neu)) {
		notes.push(
			L(
				'Die AVV-Prüfung für den neuen Dienstleister verknüpfen.',
				'Link the processing agreement check for the new provider.'
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
			headline: L('Noch nicht abschließbar.', 'Not ready to close.'),
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
			headline: L('Wechsel läuft.', 'Change in progress.'),
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
		outcome: 'abschliessbar',
		headline: L('Abschließbar.', 'Ready to close.'),
		explanation: L(
			`Alle Punkte sind erledigt und die Löschung ist bestätigt. ${figures.de}`,
			`Every point is done and the deletion is confirmed. ${figures.en}`
		),
		reasons,
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
