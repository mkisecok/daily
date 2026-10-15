import { addHours } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import { DATES } from '../risikoklassifizierung/engine.js';
import type { LegalBasis, Localized, QuestionnaireResult } from '../types.js';
import { definition, reportable } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

const str = (record: RecordView, field: string) => {
	const value = record.data[field];
	return typeof value === 'string' && value !== '' ? value : null;
};

/**
 * the applicable maximum period in days: 2 for a widespread infringement or
 * a disruption of critical infrastructure (Art. 73(3)), 10 for a death
 * (Art. 73(4)), otherwise 15 (Art. 73(2)). The shortest applicable wins.
 */
export function reportingDays(record: RecordView): 2 | 10 | 15 {
	const kinds = Array.isArray(record.data.art) ? record.data.art : [];
	if (record.data.weitverbreitet === true || kinds.includes('infrastruktur')) return 2;
	if (record.data.todesfall === true) return 10;
	return 15;
}

const PARAGRAPH: Record<2 | 10 | 15, string> = {
	2: 'Art. 73 Abs. 3',
	10: 'Art. 73 Abs. 4',
	15: 'Art. 73 Abs. 2'
};

/**
 * the authority deadline runs from awareness while the incident may be
 * reportable and no report is entered; an unclear link counts. Deployers
 * also get an internal 24-hour target for informing the provider, which
 * Art. 26(5) wants "immediately".
 */
function deadlines(record: RecordView): DeadlineSpec[] {
	const aware = str(record, 'kenntnis');
	if (!aware || !reportable(record)) return [];
	const specs: DeadlineSpec[] = [];
	if (record.data.rolle === 'betreiber' && !str(record, 'anbieter_informiert_am')) {
		specs.push({
			kind: 'anbieter',
			label: L(
				'Anbieter unverzüglich informieren (interne Zielmarke)',
				'Inform the provider immediately (internal target)'
			),
			dueAt: addHours(aware, 24),
			cite: { law: 'KI-VO', ref: 'Art. 26 Abs. 5' }
		});
	}
	if (!str(record, 'gemeldet_am')) {
		const days = reportingDays(record);
		specs.push({
			kind: 'meldung',
			label: L(
				`Meldung an die Marktüberwachungsbehörde (spätestens ${days} Tage)`,
				`Report to the market surveillance authority (at most ${days} days)`
			),
			dueAt: addHours(aware, days * 24),
			cite: { law: 'KI-VO', ref: PARAGRAPH[days] }
		});
	}
	return specs;
}

function assess(record: RecordView): QuestionnaireResult {
	const notes: Localized[] = [];
	const citations: LegalBasis[] = [
		{ law: 'KI-VO', ref: 'Art. 73' },
		{ law: 'KI-VO', ref: 'Art. 3 Nr. 49' }
	];
	const deployer = record.data.rolle === 'betreiber';

	if (deployer) {
		notes.push(
			L(
				'Als Betreiber zuerst den Anbieter informieren, dann Einführer oder Händler und die Marktüberwachungsbehörde; ist der Anbieter nicht erreichbar, gilt Art. 73 für den Betreiber entsprechend (Art. 26 Abs. 5).',
				'As deployer, inform the provider first, then the importer or distributor and the market surveillance authority; if the provider cannot be reached, Art. 73 applies to the deployer mutatis mutandis (Art. 26(5)).'
			)
		);
		citations.push({ law: 'KI-VO', ref: 'Art. 26 Abs. 5' });
	} else {
		notes.push(
			L(
				'Als Anbieter unverzüglich untersuchen, das Risiko bewerten und Korrekturmaßnahmen ergreifen; das System vor Information der Behörde nicht so verändern, dass die Ursachenbewertung beeinträchtigt wird (Art. 73 Abs. 6).',
				'As provider, investigate without delay, assess the risk and take corrective action; do not alter the system in a way that could affect the evaluation of the causes before informing the authority (Art. 73(6)).'
			)
		);
	}
	if (record.data.datenpanne === true) {
		notes.push(
			L(
				'Zugleich eine Datenpanne: die 72-Stunden-Frist des Art. 33 DSGVO läuft unabhängig davon; im Werkzeug Datenpanne erfassen.',
				'Also a personal data breach: the 72-hour period of Art. 33 GDPR runs independently; record it in the personal data breach tool.'
			)
		);
		citations.push({ law: 'DSGVO', ref: 'Art. 33' });
	}
	notes.push(
		L(
			`Art. 73 gilt mit den Pflichten für Hochrisiko-Systeme, nach der Omnibus-Verordnung ab dem ${DATES.annexIII.de} (Anhang III) bzw. ${DATES.annexI.de} (Anhang I).`,
			`Art. 73 applies together with the high-risk obligations, after the Omnibus Regulation from ${DATES.annexIII.en} (Annex III) or ${DATES.annexI.en} (Annex I).`
		)
	);

	if (!reportable(record)) {
		return {
			verdict: 'negative',
			outcome: 'kein-meldefall',
			headline: L(
				'Kein meldepflichtiger Vorfall nach Art. 73.',
				'Not a reportable incident under Art. 73.'
			),
			explanation: L(
				'Es liegt keine Folge nach Art. 3 Nr. 49 vor oder ein Zusammenhang mit dem KI-System ist ausgeschlossen. Die Gründe dokumentieren.',
				'No consequence under Art. 3(49) occurred or a link to the AI system is ruled out. Document the reasons.'
			),
			reasons: [],
			notes,
			citations
		};
	}
	const days = reportingDays(record);
	if (record.data.erstmeldung !== true && !str(record, 'gemeldet_am')) {
		notes.unshift(
			L(
				'Eine unvollständige Erstmeldung ist zulässig, um die Frist zu wahren; die Angaben werden nachgereicht (Art. 73 Abs. 5).',
				'An incomplete initial report is permitted to meet the deadline; the details follow later (Art. 73(5)).'
			)
		);
	}
	return record.data.kausalitaet === 'ungeklaert' || !record.data.kausalitaet
		? {
				verdict: 'conditional',
				outcome: 'pruefen',
				headline: L(
					`Möglicher Meldefall: Frist ${days} Tage ab Kenntnis.`,
					`Possibly reportable: ${days} days from awareness.`
				),
				explanation: L(
					'Zu melden ist, sobald ein Zusammenhang mit dem KI-System festgestellt oder hinreichend wahrscheinlich ist; die Höchstfrist läuft aber bereits ab Kenntnis des Vorfalls.',
					'The report is due once a link to the AI system is established or reasonably likely; the maximum period, however, already runs from awareness of the incident.'
				),
				reasons: [],
				notes,
				citations
			}
		: {
				verdict: 'positive',
				outcome: 'meldepflichtig',
				headline: L(
					`Meldepflichtig: spätestens ${days} Tage ab Kenntnis.`,
					`Reportable: at most ${days} days from awareness.`
				),
				explanation: L(
					`Schwerwiegender Vorfall mit festgestelltem oder wahrscheinlichem Zusammenhang: unverzüglich melden, spätestens innerhalb von ${days} Tagen (${PARAGRAPH[days]} KI-VO).`,
					`Serious incident with an established or likely link: report immediately, at the latest within ${days} days (${PARAGRAPH[days]} AI Act).`
				),
				reasons: [],
				notes,
				citations
			};
}

export const engine: RecordEngine = { deadlines, assess };
export { definition };
