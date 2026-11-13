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

/** the event while planned, deleting the guest list afterwards, gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const day = str(record, 'termin');
	if (day && record.state === 'planung') {
		specs.push({
			kind: 'termin',
			label: L(
				'Veranstaltung: Hinweise und Einwilligungen bereit',
				'Event: notices and consents ready'
			),
			dueAt: dayAt(day),
			cite: { law: 'DSGVO', ref: 'Art. 13' }
		});
	}
	const deletion = str(record, 'loeschung_am');
	if (deletion && record.state === 'durchgefuehrt') {
		specs.push({
			kind: 'loeschung',
			label: L('Gästeliste löschen', 'Delete the guest list'),
			dueAt: dayAt(deletion),
			cite: { law: 'DSGVO', ref: 'Art. 5 Abs. 1 lit. e' }
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/** the state of the event: gaps and a balancing test that fails are reasons */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const citations: LegalBasis[] = [{ law: 'DSGVO', ref: 'Art. 6, 13' }];
	const notes: Localized[] = [];
	const state = checklist(data, BLOCKS);
	const reasons: Reason[] = gapReasons(state.gaps);
	const pending: Localized[] = [];

	if (inScope(data, ['fotos'])) {
		citations.push({ law: 'KUG', ref: '§ 22, § 23' });
		const balance = snapshot(data, 'abwaegung');
		if (!balance || balance.verdict === 'conditional') {
			pending.push(
				L('Interessenabwägung für die Fotos', 'legitimate-interest assessment for the photos')
			);
		} else if (balance.verdict === 'positive') {
			reasons.unshift({
				questionId: 'abwaegung',
				text: L(
					`Interessenabwägung: ${balance.headline.de} Übersichtsbilder dann nur mit Einwilligung.`,
					`Legitimate-interest assessment: ${balance.headline.en} Overview shots then only with consent.`
				),
				cite: { law: 'DSGVO', ref: 'Art. 6 Abs. 1 lit. f' }
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
	if (isEmpty(data.loeschung_am)) {
		notes.push(
			L(
				'Ein Datum für das Löschen der Gästeliste eintragen; Daily erinnert dann daran.',
				'Enter a date for deleting the guest list; Daily then reminds you.'
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
			headline: L('Handlungsbedarf vor dem Termin.', 'Action needed before the day.'),
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
			headline: L('Vorbereitung läuft.', 'Preparation in progress.'),
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
