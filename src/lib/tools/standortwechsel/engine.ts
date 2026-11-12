import { checkStatus, gapDeadlines } from '../../records/checks.js';
import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { applies, assessRisks, BLOCKS, definition, ITEMS, type Item } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });
const ART32: LegalBasis = { law: 'DSGVO', ref: 'Art. 32' };
const MATRIX: LegalBasis = { law: 'DSK', ref: 'Kurzpapier Nr. 18' };

/** the day before a date, `YYYY-MM-DD` */
function dayBefore(date: string): string {
	const day = new Date(`${date}T00:00:00.000Z`);
	day.setUTCDate(day.getUTCDate() - 1);
	return day.toISOString().slice(0, 10);
}

const str = (record: RecordView, id: string) => {
	const value = record.data[id];
	return typeof value === 'string' && value ? value : null;
};

/** the moving date, a backup the day before while the server room is not secured, the walk-through */
function deadlines(record: RecordView): DeadlineSpec[] {
	const specs: DeadlineSpec[] = [];
	const moving = str(record, 'umzugstermin');
	if (moving && record.state === 'planung') {
		if (
			applies(record, { scope: ['serverraum'] }) &&
			checkStatus(record.data.s_sicherung) !== 'ja'
		) {
			specs.push({
				kind: 'datensicherung',
				label: L(
					'Datensicherung vor dem Abbau des Serverraums',
					'Backup before the server room is dismantled'
				),
				dueAt: dayAt(dayBefore(moving)),
				cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. c' }
			});
		}
		specs.push({
			kind: 'umzug',
			label: L('Umzugstermin', 'Moving date'),
			dueAt: dayAt(moving),
			cite: ART32
		});
	}
	// a gap with a due date, while the point still applies
	specs.push(
		...gapDeadlines(definition, record, (field) => {
			const item = ITEMS.find((i) => i.id === field.id);
			return !!item && applies(record, item);
		})
	);
	const walk = str(record, 'begehung_am');
	if (walk && record.state !== 'planung') {
		specs.push({
			kind: 'begehung',
			label: L('Begehung des neuen Standorts', 'Walk-through of the new site'),
			dueAt: dayAt(walk),
			cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. d' }
		});
	}
	return specs;
}

const blockOf = (item: Item) => BLOCKS.find((block) => block.items.some((i) => i.id === item.id))!;

/**
 * the state of the move: checklist points answered "no" and residual risks
 * still high need action; unanswered points and unrated risks keep it open.
 */
function assess(record: RecordView): QuestionnaireResult {
	const citations: LegalBasis[] = [
		ART32,
		{ law: 'BSI', ref: 'IT-Grundschutz-Kompendium, Edition 2023' },
		MATRIX
	];
	const notes: Localized[] = [];

	if (isEmpty(record.data.umfang)) {
		return {
			verdict: 'conditional',
			outcome: 'unvollstaendig',
			headline: L('Umfang des Umzugs fehlt.', 'Scope of the move missing.'),
			explanation: L(
				'Erst angeben, was umzieht: Arbeitsplätze, Akten, Serverraum, Netzwerk. Danach zeigt die Checkliste, was gilt, und die Risikoanalyse, welche Risiken zu bewerten sind.',
				'First say what moves: workstations, files, server room, network. Then the checklist shows what applies and the risk analysis which risks to rate.'
			),
			reasons: [],
			notes,
			citations
		};
	}

	const items = ITEMS.filter((item) => applies(record, item));
	const gaps = items.filter((item) => checkStatus(record.data[item.id]) === 'nein');
	const open = items.filter((item) => checkStatus(record.data[item.id]) === null);
	const risks = assessRisks(record);
	const high = risks.filter((risk) => risk.after === 'hoch');
	const unrated = risks.filter((risk) => !risk.before);
	const unbacked = risks.filter(
		(risk) =>
			risk.before &&
			risk.after &&
			risk.after !== risk.before &&
			risk.before !== 'gering' &&
			!risk.measures
	);

	const reasons: Reason[] = [
		...high.map((risk) => ({
			questionId: risk.id,
			text: L(`Hohes Restrisiko: ${risk.title.de}`, `High residual risk: ${risk.title.en}`),
			cite: MATRIX
		})),
		...gaps.map((item) => ({
			questionId: item.id,
			text: L(
				`${blockOf(item).title.de}: ${item.label.de}`,
				`${blockOf(item).title.en}: ${item.label.en}`
			),
			cite: item.cite
		}))
	];

	if (open.length > 0) {
		const byBlock = BLOCKS.map((block) => ({
			block,
			n: open.filter((item) => blockOf(item).id === block.id).length
		})).filter((entry) => entry.n > 0);
		notes.push(
			L(
				`Noch offen: ${byBlock.map((e) => `${e.block.title.de} ${e.n}`).join(', ')}.`,
				`Still open: ${byBlock.map((e) => `${e.block.title.en} ${e.n}`).join(', ')}.`
			)
		);
	}
	if (unrated.length > 0) {
		notes.push(
			L(
				`Noch nicht bewertet: ${unrated.map((risk) => risk.title.de).join('; ')}.`,
				`Not yet rated: ${unrated.map((risk) => risk.title.en).join('; ')}.`
			)
		);
	}
	for (const risk of unbacked) {
		notes.push(
			L(
				`${risk.title.de}: nach Maßnahmen niedriger bewertet, aber keine Maßnahme genannt.`,
				`${risk.title.en}: rated lower after measures, but no measure is named.`
			)
		);
	}
	if (record.data.bundesland_wechsel === true) {
		notes.push(
			L(
				'Mit dem Sitz wechselt die Zuständigkeit der Aufsicht über nicht-öffentliche Stellen (§ 40 Abs. 2 BDSG). Der neuen Behörde die Kontaktdaten des Datenschutzbeauftragten mitteilen (Art. 37 Abs. 7 DSGVO).',
				'With the seat, the authority competent for private bodies changes (§ 40(2) BDSG). Give the new authority the data protection officer’s contact details (Art. 37(7) GDPR).'
			)
		);
		citations.push({ law: 'BDSG', ref: '§ 40 Abs. 2' });
	}
	if (record.state === 'umzug') {
		notes.push(
			L(
				'Geht beim Umzug etwas verloren oder wird gestohlen, sofort im Werkzeug Datenpanne erfassen: Ab Kenntnis laufen 72 Stunden (Art. 33 DSGVO).',
				'If anything is lost or stolen during the move, record it in the personal data breach tool at once: 72 hours run from awareness (Art. 33 GDPR).'
			)
		);
		citations.push({ law: 'DSGVO', ref: 'Art. 33' });
	}
	if (isEmpty(record.data.tom)) {
		notes.push(
			L(
				'Den Eintrag im TOM-Katalog für den neuen Standort verknüpfen.',
				'Link the TOM catalogue entry for the new site.'
			)
		);
	}

	const done = items.length - gaps.length - open.length;
	const figures = L(
		`${done} von ${items.length} Punkten erledigt, ${risks.length - unrated.length} von ${risks.length} Risiken bewertet.`,
		`${done} of ${items.length} points done, ${risks.length - unrated.length} of ${risks.length} risks rated.`
	);

	if (reasons.length > 0) {
		return {
			verdict: 'positive',
			outcome: high.length > 0 ? 'risiko_hoch' : 'luecken',
			headline:
				high.length > 0
					? L('Hohes Restrisiko beim Standortwechsel.', 'High residual risk in the move.')
					: L('Lücken beim Standortwechsel.', 'Gaps in the move.'),
			explanation: L(
				`Die folgenden Punkte sind nicht erfüllt oder ein Risiko bleibt auch nach Maßnahmen hoch. ${figures.de}`,
				`The points below are not met, or a risk stays high after measures. ${figures.en}`
			),
			reasons,
			notes,
			citations
		};
	}
	if (open.length > 0 || unrated.length > 0) {
		return {
			verdict: 'conditional',
			outcome: 'offen',
			headline: L('Standortwechsel noch nicht vollständig geprüft.', 'Move not yet fully checked.'),
			explanation: L(
				`Keine Lücke bisher, aber nicht alles ist beantwortet oder bewertet. ${figures.de}`,
				`No gap so far, but not everything is answered or rated. ${figures.en}`
			),
			reasons,
			notes,
			citations
		};
	}
	return {
		verdict: 'negative',
		outcome: 'erledigt',
		headline: L(
			'Standortwechsel datenschutzgerecht vorbereitet.',
			'Move prepared in line with data protection.'
		),
		explanation: L(
			`Alle Punkte sind erledigt, kein Restrisiko ist hoch. Nach dem Einzug bei der Begehung prüfen, ob die Maßnahmen greifen. ${figures.de}`,
			`Every point is done and no residual risk is high. After moving in, check at the walk-through that the measures work. ${figures.en}`
		),
		reasons,
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
