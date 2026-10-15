import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { definition, GOALS } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const measures = (record: RecordView, goal: string): string[] => {
	const list = record.data[`${goal}_massnahmen`];
	return Array.isArray(list) ? list : [];
};
const has = (record: RecordView, goal: string, measure: string) =>
	measures(record, goal).includes(measure);

function deadlines(record: RecordView): DeadlineSpec[] {
	const date = record.data.wiedervorlage;
	if (typeof date !== 'string') return [];
	return [
		{
			kind: 'wiedervorlage',
			label: L('Überprüfung der TOM', 'Review of the TOMs'),
			dueAt: dayAt(date),
			cite: { law: 'DSGVO', ref: 'Art. 32 Abs. 1 lit. d' }
		}
	];
}

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
	if (!record.data.geprueft_am) {
		reasons.push({
			questionId: 'geprueft_am',
			text: L(
				'Keine regelmäßige Überprüfung der Wirksamkeit dokumentiert',
				'No regular review of effectiveness documented'
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
	const high = record.data.schutzbedarf === 'hoch' || record.data.schutzbedarf === 'sehr_hoch';
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
export { definition, GOALS };
