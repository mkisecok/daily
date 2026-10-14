import { dayAt } from '../../records/deadlines.js';
import type { DeadlineSpec, RecordEngine, RecordView } from '../../records/types.js';
import type { LegalBasis, Localized, QuestionnaireResult, Reason } from '../types.js';
import { CLAUSES, definition } from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

function deadlines(record: RecordView): DeadlineSpec[] {
	const date = record.data.wiedervorlage;
	if (typeof date !== 'string' || record.data.status === 'beendet') return [];
	return [
		{
			kind: 'wiedervorlage',
			label: L('Wiedervorlage Auftragsverarbeitungsvertrag', 'Processor contract review'),
			dueAt: dayAt(date),
			cite: { law: 'DSGVO', ref: 'Art. 28 Abs. 1' }
		}
	];
}

const reason = (id: string, text: Localized, cite?: LegalBasis): Reason => ({
	questionId: id,
	text,
	cite
});

/**
 * The checklist result: clauses answered "no" are defects, clauses not yet
 * answered keep the check open. Then the points around the contract:
 * guarantees, transfers, sub-processors, breach reporting.
 */
function assess(record: RecordView): QuestionnaireResult {
	const missing = CLAUSES.filter((c) => record.data[c.id] === false).map((c) =>
		reason(c.id, c.label, c.cite)
	);
	const open = CLAUSES.filter((c) => record.data[c.id] !== true && record.data[c.id] !== false);
	const notes: Localized[] = [];
	const citations: LegalBasis[] = [{ law: 'DSGVO', ref: 'Art. 28' }];

	if (record.data.genehmigung === 'allgemein' && record.data.einspruch !== true) {
		missing.push(
			reason(
				'einspruch',
				L(
					'Bei allgemeiner Genehmigung: Information über beabsichtigte Änderungen und Möglichkeit zum Einspruch',
					'With a general authorisation: information on intended changes and the opportunity to object'
				),
				{ law: 'DSGVO', ref: 'Art. 28 Abs. 2 Satz 2' }
			)
		);
	}
	if (record.data.meldung_pannen === false) {
		notes.push(
			L(
				'Der Vertrag sollte eine unverzügliche Meldung von Datenpannen regeln; ohne sie gefährdet jede Panne beim Auftragsverarbeiter die eigene 72-Stunden-Frist (Art. 33 Abs. 2).',
				'The contract should require breaches to be reported without undue delay; without it, every breach at the processor endangers your own 72-hour period (Art. 33(2)).'
			)
		);
	}
	if (record.data.garantien === 'keiner' || record.data.garantien === 'selbstauskunft') {
		notes.push(
			L(
				'Der Verantwortliche darf nur Auftragsverarbeiter einsetzen, die hinreichende Garantien bieten (Art. 28 Abs. 1). Eine bloße Selbstauskunft genügt bei sensiblen Verarbeitungen selten; Zertifikate oder Prüfberichte anfordern.',
				'Controllers may only use processors providing sufficient guarantees (Art. 28(1)). A mere self-assessment rarely suffices for sensitive processing; request certificates or audit reports.'
			)
		);
	}
	if (record.data.sitz === 'drittland') {
		notes.push(
			L(
				'Verarbeitung in Drittländern: Übermittlungsgrundlage nach Art. 44 ff. erforderlich; die Drittlandprüfung klärt sie.',
				'Processing in third countries: a transfer basis under Art. 44 et seq. is required; the third-country transfer check establishes it.'
			)
		);
		citations.push({ law: 'DSGVO', ref: 'Art. 44' });
	}
	if (record.data.besondere_kategorien === true) {
		notes.push(
			L(
				'Besondere Kategorien: Die Maßnahmen nach Art. 32 müssen dem höheren Risiko entsprechen; Nachweise genauer prüfen.',
				'Special categories: the Art. 32 measures must match the higher risk; examine the evidence more closely.'
			)
		);
	}
	if (record.data.vertragsart === 'scc') {
		notes.push(
			L(
				'Die Standardvertragsklauseln nach Art. 28 Abs. 7 (Durchführungsbeschluss (EU) 2021/915) erfüllen Art. 28 Abs. 3, wenn die Anhänge vollständig ausgefüllt sind.',
				'The standard contractual clauses under Art. 28(7) (Implementing Decision (EU) 2021/915) meet Art. 28(3) if the annexes are completed in full.'
			)
		);
	}

	if (missing.length > 0) {
		return {
			verdict: 'positive',
			outcome: 'maengel',
			headline: L(
				'Vertrag erfüllt Art. 28 nicht vollständig.',
				'Contract does not fully meet Art. 28.'
			),
			explanation: L(
				'Die folgenden Pflichtinhalte fehlen. Nachbesserung verlangen, bevor (weiter) Daten übermittelt werden; ohne wirksamen Vertrag fehlt der Verarbeitung durch den Dienstleister die Grundlage.',
				'The mandatory content below is missing. Request an amendment before (further) data is passed on; without a valid contract, processing by the service provider lacks a basis.'
			),
			reasons: missing,
			notes,
			citations
		};
	}
	if (open.length > 0) {
		return {
			verdict: 'conditional',
			outcome: 'offen',
			headline: L(
				`Prüfung offen: ${open.length} von ${CLAUSES.length} Punkten.`,
				`Check open: ${open.length} of ${CLAUSES.length} clauses.`
			),
			explanation: L(
				'Die Prüfliste ist noch nicht vollständig beantwortet.',
				'The checklist has not been answered in full yet.'
			),
			reasons: [],
			notes,
			citations
		};
	}
	return {
		verdict: 'negative',
		outcome: 'erfuellt',
		headline: L('Vertrag entspricht Art. 28 Abs. 3.', 'Contract meets Art. 28(3).'),
		explanation: L(
			'Alle Pflichtinhalte sind geregelt. Bei Änderungen der Leistung oder der Unterauftragsverarbeiter erneut prüfen.',
			'All mandatory content is covered. Check again when the service or the sub-processors change.'
		),
		reasons: [],
		notes,
		citations
	};
}

export const engine: RecordEngine = { deadlines, assess };
export { CLAUSES, definition };
