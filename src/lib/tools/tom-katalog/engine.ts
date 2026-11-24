import { dateAfterMonths, dayAt, monthsPassed } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { definition, GOALS, ORGANISATION } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const measures = (record: RecordView, goal: string): string[] => {
	const list = record.data[`${goal}_massnahmen`];
	return Array.isArray(list) ? list : [];
};
const has = (record: RecordView, goal: string, measure: string) =>
	measures(record, goal).includes(measure);

/** the label of a measure, as the form names it */
function label(goal: string, measure: string): Localized {
	const section = [...GOALS, ORGANISATION].find((g) => g.id === goal);
	const field = section?.fields.find((f) => f.id === `${goal}_massnahmen`);
	const option =
		field?.type === 'multiselect' ? field.options.find((o) => o.value === measure) : undefined;
	return option?.label ?? L(measure, measure);
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** a review is due a year after the last one, unless a date is set */
const REVIEW_MONTHS = 12;

/** the date the next review is due: the one set, or a year after the last */
function reviewDue(record: RecordView): string | null {
	const set = text(record.data.wiedervorlage);
	if (set) return set;
	const last = text(record.data.geprueft_am);
	return last ? dateAfterMonths(last, REVIEW_MONTHS) : null;
}

/** whether the last review is more than a year old on `now` */
export function reviewOutdated(record: RecordView, now = new Date()): boolean {
	const last = text(record.data.geprueft_am);
	if (!last) return false;
	return monthsPassed(last, REVIEW_MONTHS, now);
}

function deadlines(record: RecordView): DeadlineSpec[] {
	const out: DeadlineSpec[] = [];
	const due = reviewDue(record);
	if (due) {
		out.push({
			kind: 'wiedervorlage',
			label: L('Überprüfung der TOM', 'Review of the TOMs'),
			dueAt: dayAt(due),
			cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. d' }
		});
	}
	const until = text(record.data.offen_bis);
	if (until && text(record.data.offene_massnahmen)) {
		out.push({
			kind: 'massnahme',
			label: L('Offene Maßnahmen umsetzen', 'Implement open measures'),
			dueAt: dayAt(until),
			cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1' }
		});
	}
	return out;
}

/** measures that keep a system working under load and after faults */
const RESILIENCE = ['redundanz', 'monitoring', 'kapazitaet', 'ueberlast'];

/** what a very high protection requirement calls for beyond a high one */
const VERY_HIGH: [string, string][] = [
	['datenminimierung', 'pseudonymisierung'],
	['verfuegbarkeit', 'notfall'],
	['transparenz', 'auswertung']
];

/**
 * gaps against Art. 32(1)(b)–(d) are defects; missing encryption or
 * pseudonymisation, protection-requirement mismatches and empty SDM goals
 * are points to consider.
 */
function assess(record: RecordView): QuestionnaireResult {
	const reasons: Reason[] = [];
	const notes: Localized[] = [];
	const citations: LegalBasis[] = [
		{ law: 'DSGVO', ref: 'Art. 32' },
		{ law: 'DSK', ref: 'Standard-Datenschutzmodell' }
	];

	const high = record.data.schutzbedarf === 'hoch' || record.data.schutzbedarf === 'sehr_hoch';

	for (const goal of GOALS.slice(0, 3)) {
		if (measures(record, goal.id).length === 0) {
			reasons.push({
				questionId: goal.id,
				text: L(
					`Keine Maßnahmen zur ${goal.title.de}`,
					`No measures for ${goal.title.en.toLowerCase()}`
				),
				cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. b' }
			});
		}
	}
	if (
		!has(record, 'verfuegbarkeit', 'backup') ||
		!has(record, 'verfuegbarkeit', 'wiederherstellung')
	) {
		reasons.push({
			questionId: 'wiederherstellung',
			text: L(
				'Rasche Wiederherstellung nach einem Zwischenfall nicht belegt (Datensicherung und getestete Wiederherstellung)',
				'Rapid restoration after an incident not evidenced (backups and tested restore)'
			),
			cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. c' }
		});
	}
	const resilient = RESILIENCE.some((measure) => has(record, 'verfuegbarkeit', measure));
	if (!resilient && high) {
		reasons.push({
			questionId: 'belastbarkeit',
			text: L(
				'Belastbarkeit der Systeme nicht belegt (Redundanz, Überwachung, Kapazitätsplanung oder Schutz vor Überlastung)',
				'Resilience of the systems not evidenced (redundancy, monitoring, capacity planning or overload protection)'
			),
			cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. b' }
		});
	}
	if (!record.data.geprueft_am) {
		reasons.push({
			questionId: 'geprueft_am',
			text: L(
				'Keine regelmäßige Überprüfung der Wirksamkeit dokumentiert',
				'No regular review of effectiveness documented'
			),
			cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. d' }
		});
	} else if (reviewOutdated(record)) {
		reasons.push({
			questionId: 'geprueft_am',
			text: L(
				'Die letzte Überprüfung der Wirksamkeit liegt mehr als zwölf Monate zurück',
				'The last review of effectiveness is more than twelve months old'
			),
			cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. d' }
		});
	}

	const encrypted =
		has(record, 'vertraulichkeit', 'transport') || has(record, 'vertraulichkeit', 'ruhe');
	if (!encrypted && !has(record, 'datenminimierung', 'pseudonymisierung')) {
		notes.push(
			L(
				'Weder Verschlüsselung noch Pseudonymisierung: Art. 32 Abs. 1 lit. a nennt beide ausdrücklich; die Abwägung dokumentieren, wenn sie fehlen.',
				'Neither encryption nor pseudonymisation: Art. 32(1)(a) names both expressly; document the reasoning if they are absent.'
			)
		);
	}
	if (!resilient && !high) {
		notes.push(
			L(
				'Keine Maßnahme zur Belastbarkeit: Art. 32 Abs. 1 lit. b verlangt, dass die Systeme auch unter Last und nach Störungen arbeiten; Überwachung mit Alarmierung ist meist das Mindeste.',
				'No measure for resilience: Art. 32(1)(b) requires systems to keep working under load and after faults; monitoring with alerts is usually the minimum.'
			)
		);
	}
	if (high && !has(record, 'vertraulichkeit', 'mfa')) {
		notes.push(
			L(
				'Hoher Schutzbedarf ohne Mehr-Faktor-Authentisierung: für den Zugang zu solchen Systemen dem Stand der Technik nach regelmäßig erforderlich.',
				'High protection requirement without multi-factor authentication: generally required by the state of the art for access to such systems.'
			)
		);
	}
	if (high && !has(record, 'vertraulichkeit', 'ruhe')) {
		notes.push(
			L(
				'Hoher Schutzbedarf ohne Verschlüsselung gespeicherter Daten: prüfen, ob Datenträger oder Datenbanken verschlüsselt werden müssen.',
				'High protection requirement without encryption at rest: check whether storage media or databases must be encrypted.'
			)
		);
	}
	if (record.data.schutzbedarf === 'sehr_hoch') {
		const missing = VERY_HIGH.filter(([goal, measure]) => !has(record, goal, measure)).map(
			([goal, measure]) => label(goal, measure)
		);
		if (missing.length > 0) {
			notes.push(
				L(
					`Sehr hoher Schutzbedarf: ${missing.map((l) => l.de).join(', ')} fehlt. Bei sehr hohem Schutzbedarf sind diese Maßnahmen in der Regel geboten.`,
					`Very high protection requirement: missing ${missing.map((l) => l.en.toLowerCase()).join(', ')}. A very high protection requirement usually calls for these measures.`
				)
			);
		}
	}
	if (!has(record, 'organisation', 'schulung')) {
		notes.push(
			L(
				'Keine Schulung der Beschäftigten belegt: nach Art. 32 Abs. 4 dürfen sie Daten nur auf Anweisung verarbeiten; die Schulung ist der übliche Nachweis.',
				'No staff training evidenced: under Art. 32(4) staff may process data only on instructions; training is the usual evidence.'
			)
		);
	}
	if (!has(record, 'organisation', 'datenpannen')) {
		notes.push(
			L(
				'Kein Prozess für Datenpannen: eine Verletzung ist binnen 72 Stunden der Aufsicht zu melden (Art. 33); ohne festgelegten Ablauf ist das kaum zu schaffen.',
				'No process for data breaches: a breach must be notified to the authority within 72 hours (Art. 33); without a set procedure that is hard to meet.'
			)
		);
	}
	const empty = GOALS.slice(3).filter((goal) => measures(record, goal.id).length === 0);
	if (empty.length > 0) {
		notes.push(
			L(
				`Ohne Maßnahmen: ${empty.map((g) => g.title.de).join(', ')}. Diese Gewährleistungsziele des SDM setzen Datenschutz durch Technikgestaltung um (Art. 25).`,
				`No measures for: ${empty.map((g) => g.title.en.toLowerCase()).join(', ')}. These SDM protection goals implement data protection by design (Art. 25).`
			)
		);
		citations.push({ law: 'DSGVO', ref: 'Art. 25' });
	}

	const open = text(record.data.offene_massnahmen);
	if (record.data.status === 'umgesetzt' && (reasons.length > 0 || open)) {
		notes.push(
			L(
				'Der Status lautet „Umgesetzt“, obwohl Lücken oder offene Maßnahmen bestehen; den Status anpassen.',
				'The status says “Implemented” although gaps or open measures remain; adjust the status.'
			)
		);
	}

	if (reasons.length > 0) {
		return {
			verdict: 'positive',
			outcome: 'luecken',
			headline: L('Lücken nach Art. 32.', 'Gaps under Art. 32.'),
			explanation: L(
				'Für die folgenden Anforderungen des Art. 32 Abs. 1 sind keine Maßnahmen belegt. Ob eine Maßnahme angemessen ist, richtet sich nach Stand der Technik, Kosten und dem Risiko für die Betroffenen.',
				'No measures are evidenced for the Art. 32(1) requirements below. Whether a measure is appropriate depends on the state of the art, costs and the risk to data subjects.'
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
				headline: L('Grundschutz belegt, mit Hinweisen.', 'Baseline evidenced, with points.'),
				explanation: L(
					'Vertraulichkeit, Integrität, Verfügbarkeit, Wiederherstellung und Überprüfung sind belegt.',
					'Confidentiality, integrity, availability, restoration and review are evidenced.'
				),
				reasons: [],
				notes,
				citations
			}
		: {
				verdict: 'negative',
				outcome: 'belegt',
				headline: L(
					'Maßnahmen zu allen Gewährleistungszielen belegt.',
					'Measures evidenced for all protection goals.'
				),
				explanation: L(
					'Die Maßnahmen bei Änderungen des Systems und mindestens bei jeder Überprüfung fortschreiben.',
					'Update the measures when the system changes and at least at every review.'
				),
				reasons: [],
				notes,
				citations
			};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition, GOALS, ORGANISATION };
