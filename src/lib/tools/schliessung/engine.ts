import { gapDeadlines } from '../../records/checks.js';
import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import { checklist, gapReasons, openNote } from '../_shared/occasion.js';
import type { LegalBasis, Localized, QuestionnaireResult } from '../types.js';
import { BLOCKS, definition, kindOf } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const str = (record: RecordView, id: string) => {
	const value = record.data[id];
	return typeof value === 'string' && value ? value : null;
};

/** the closure while planned, the end of retention while data is kept, gaps with a due date */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const closure = str(record, 'schliessung_am');
	if (closure && record.state === 'planung') {
		specs.push({
			kind: 'schliessung',
			label: L(
				'Schließung: Bestand gesichtet, Löschung erledigt',
				'Closure: inventory taken, deletion done'
			),
			dueAt: dayAt(closure),
			cite: { law: 'DSGVO', ref: 'Art. 17 Abs. 1 lit. a' }
		});
	}
	const retention = str(record, 'aufbewahrung_bis');
	if (retention && record.state === 'aufbewahrung') {
		specs.push({
			kind: 'aufbewahrung',
			label: L('Aufbewahrung endet: endgültig löschen', 'Retention ends: delete for good'),
			dueAt: dayAt(retention),
			cite: { law: 'DSGVO', ref: 'Art. 17 Abs. 1 lit. a' }
		});
	}
	const applies = new Set(checklist(record.data, BLOCKS).points.map(({ item }) => item.id));
	specs.push(...gapDeadlines(definition, record, (field) => applies.has(field.id)));
	return specs;
}

/** the state of the closure: gaps are reasons; open points keep it open */
function assess(record: RecordView): QuestionnaireResult {
	const data = record.data;
	const kind = kindOf(data);
	const citations: LegalBasis[] = [{ law: 'DSGVO', ref: 'Art. 17, 30' }];
	const notes: Localized[] = [];

	if (!kind) {
		return {
			verdict: 'conditional',
			outcome: 'unvollstaendig',
			headline: L('Angabe fehlt, was schließt.', 'What closes is missing.'),
			explanation: L(
				'Erst angeben, ob ein Standort schließt oder das Unternehmen aufgegeben wird.',
				'First say whether a site closes or the business is wound up.'
			),
			reasons: [],
			notes,
			citations
		};
	}
	if (kind === 'aufgabe') citations.push({ law: 'GmbHG', ref: '§ 74 Abs. 2' });

	const state = checklist(data, BLOCKS);
	const reasons = gapReasons(state.gaps);
	const open = openNote(state.open);
	if (open) notes.push(open);
	if (kind === 'standort') {
		notes.push(
			L(
				'Werden Akten oder Geräte an einen anderen Standort gebracht, begleitet das Werkzeug Standortwechsel den Umzug.',
				'If files or devices go to another site, the office move tool covers the move.'
			)
		);
	}
	if (isEmpty(data.aufbewahrung_bis)) {
		notes.push(
			L(
				'Das Ende der längsten Aufbewahrungsfrist eintragen; Daily erinnert dann an die endgültige Löschung.',
				'Enter when the longest retention period ends; Daily then reminds you of final deletion.'
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
	if (state.open.length > 0) {
		return {
			verdict: 'conditional',
			outcome: 'offen',
			headline: L('Schließung läuft.', 'Closure in progress.'),
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
			`Alle Punkte sind erledigt. Was aufbewahrt wird, ist bis zum Ende der Frist zu sichern. ${figures.de}`,
			`Every point is done. What is kept must stay secure until its period ends. ${figures.en}`
		),
		reasons,
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
