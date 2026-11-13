import { gapDeadlines } from '../../records/checks.js';
import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import { checklist, gapReasons, inScope, openNote } from '../_shared/occasion.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { BLOCKS, definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const str = (record: RecordView, id: string) => {
	const value = record.data[id];
	return typeof value === 'string' && value ? value : null;
};

/** the audit day while preparing, the correction deadline once held, gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const day = str(record, 'termin');
	if (day && record.state === 'vorbereitung') {
		specs.push({
			kind: 'termin',
			label: L('Audit: Nachweise und Personen bereit', 'Audit: evidence and people ready'),
			dueAt: dayAt(day),
			cite: { law: 'DSGVO', ref: 'Art. 5 Abs. 2' }
		});
	}
	const corrections = str(record, 'korrektur_bis');
	if (corrections && record.state === 'durchgefuehrt') {
		specs.push({
			kind: 'korrektur',
			label: L('Korrekturen aus dem Audit nachweisen', 'Show corrections from the audit'),
			dueAt: dayAt(corrections),
			cite: { law: 'ISO 27001', ref: 'Kap. 10.2' }
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/** the state of the preparation: gaps and major nonconformities are reasons */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const citations: LegalBasis[] = [{ law: 'DSGVO', ref: 'Art. 5 Abs. 2, Art. 24 Abs. 1' }];
	if (inScope(data, ['iso27001', 'iso42001'])) {
		citations.push({ law: 'ISO 27001', ref: 'Kap. 9.2, 9.3, 10.2' });
	}
	if (inScope(data, ['kunde'])) citations.push({ law: 'DSGVO', ref: 'Art. 28 Abs. 3 lit. h' });
	const notes: Localized[] = [];
	const state = checklist(data, BLOCKS);
	const reasons: Reason[] = gapReasons(state.gaps);

	if (data.ergebnis === 'wesentlich') {
		reasons.unshift({
			questionId: 'ergebnis',
			text: L(
				'Wesentliche Abweichungen: Korrekturen und ihre Wirksamkeit fristgerecht nachweisen; bei einer Zertifizierung hängt das Zertifikat davon ab.',
				'Major nonconformities: show corrections and their effectiveness on time; for a certification, the certificate depends on it.'
			),
			cite: { law: 'ISO 27001', ref: 'Kap. 10.2' }
		});
	} else if (data.ergebnis === 'geringfuegig') {
		notes.push(
			L(
				'Geringfügige Abweichungen: Maßnahmen planen; die prüfende Stelle sieht sie spätestens beim nächsten Audit nach.',
				'Minor nonconformities: plan actions; the auditor checks them at the next audit at the latest.'
			)
		);
	}
	if (!isEmpty(data.ergebnis) && data.ergebnis !== 'ohne' && isEmpty(data.korrektur_bis)) {
		notes.push(
			L(
				'Die Frist für die Korrekturen eintragen; Daily erinnert dann daran.',
				'Enter the deadline for the corrections; Daily then reminds you.'
			)
		);
	}

	const open = openNote(state.open);
	if (open) notes.push(open);

	const figures = L(
		`${state.done.length} von ${state.points.length} Punkten erledigt.`,
		`${state.done.length} of ${state.points.length} points done.`
	);

	if (reasons.length > 0) {
		return {
			verdict: 'positive',
			outcome: 'luecken',
			headline: L('Handlungsbedarf vor dem Audit.', 'Action needed before the audit.'),
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
