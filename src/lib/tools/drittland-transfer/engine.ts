import { reasonFor } from '../checklist.js';
import type { Answers, Localized, QuestionnaireCatalog, QuestionnaireResult } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });

const ALWAYS = [
	L(
		'Zusätzlich nötig: eine Rechtsgrundlage nach Art. 6 und bei Dienstleistern ein Auftragsverarbeitungsvertrag nach Art. 28.',
		'Also required: a legal basis under Art. 6 and, for service providers, a processing agreement under Art. 28.'
	),
	L(
		'Die Übermittlung und ihre Grundlage in den Datenschutzhinweisen nennen (Art. 13 Abs. 1 lit. f) und im Verzeichnis der Verarbeitungstätigkeiten vermerken (Art. 30 Abs. 1 lit. e).',
		'Name the transfer and its basis in the privacy notice (Art. 13(1)(f)) and record it in the record of processing activities (Art. 30(1)(e)).'
	),
	L(
		'Weiterübermittlungen des Empfängers (Unterauftragsverarbeiter) brauchen ebenfalls eine Grundlage nach Kapitel V (Art. 44 S. 1).',
		'Onward transfers by the recipient (sub-processors) also need a Chapter V basis (Art. 44, first sentence).'
	)
];

/**
 * Chapter V in its legal order: no transfer → adequacy (incl. DPF) →
 * Art. 46 safeguards with TIA and supplementary measures → Art. 49
 * derogations as the narrow last resort.
 */
export function evaluate(catalog: QuestionnaireCatalog, answers: Answers): QuestionnaireResult {
	const citations = catalog.sources;
	const yes = (id: string) => answers[id] === 'yes';
	const no = (id: string) => answers[id] === 'no';
	const unclear = (ids: string[]) =>
		ids.filter((id) => answers[id] === 'unknown').map((id) => reasonFor(catalog, id));

	if (no('t_transfer')) {
		return {
			verdict: 'negative',
			headline: L('Keine Drittlandübermittlung.', 'No third-country transfer.'),
			explanation: L(
				'Die Daten verlassen den EWR nicht und sind von außerhalb nicht zugänglich. Kapitel V ist nicht berührt.',
				'The data does not leave the EEA and is not accessible from outside it. Chapter V is not engaged.'
			),
			reasons: [reasonFor(catalog, 't_transfer')],
			citations
		};
	}

	if (yes('t_adequacy') || yes('t_dpf')) {
		const id = yes('t_adequacy') ? 't_adequacy' : 't_dpf';
		return {
			verdict: 'negative',
			headline: L(
				'Übermittlung auf einen Angemessenheitsbeschluss gestützt.',
				'Transfer based on an adequacy decision.'
			),
			explanation: L(
				'Für das Empfängerland bzw. den zertifizierten US-Empfänger besteht ein Angemessenheitsbeschluss. Weitere Garantien oder ein Transfer Impact Assessment sind dann nicht erforderlich; prüfen Sie den Fortbestand des Beschlusses und bei US-Empfängern die aktive Zertifizierung regelmäßig.',
				'There is an adequacy decision for the destination country or the certified US recipient. No further safeguards or transfer impact assessment are needed; check periodically that the decision remains in force and, for US recipients, that the certification is active.'
			),
			reasons: [reasonFor(catalog, id)],
			notes: ALWAYS,
			citations
		};
	}

	const adequacyOpen = unclear(['t_transfer', 't_adequacy', 't_dpf']);
	const safeguard = yes('t_scc') || yes('t_bcr');

	if (safeguard) {
		const instrument = yes('t_scc') ? 't_scc' : 't_bcr';
		if (no('t_tia')) {
			return {
				verdict: 'positive',
				headline: L('Transfer Impact Assessment fehlt.', 'Transfer impact assessment missing.'),
				explanation: L(
					'Standardvertragsklauseln und BCR genügen nach Schrems II nur, wenn geprüft ist, dass Recht und Praxis des Ziellandes den Schutz nicht unterlaufen. Diese Bewertung fehlt.',
					'After Schrems II, standard contractual clauses and BCRs suffice only once it has been assessed that the law and practice of the destination country do not undermine the protection. That assessment is missing.'
				),
				reasons: [reasonFor(catalog, instrument), reasonFor(catalog, 't_tia')],
				notes: [
					L(
						'Transfer Impact Assessment nach den sechs Schritten der EDSA-Empfehlungen 01/2020 durchführen und dokumentieren.',
						'Carry out and document a transfer impact assessment following the six steps of EDPB Recommendations 01/2020.'
					),
					...ALWAYS
				],
				citations
			};
		}
		if (no('t_measures')) {
			return {
				verdict: 'positive',
				headline: L('Ergänzende Maßnahmen fehlen.', 'Supplementary measures missing.'),
				explanation: L(
					'Das Assessment hat Schutzlücken festgestellt, die nicht durch ergänzende Maßnahmen geschlossen sind. Ohne sie ist die Übermittlung auszusetzen (Klausel 14 und 16 der Standardvertragsklauseln).',
					'The assessment found gaps that are not closed by supplementary measures. Without them the transfer must be suspended (clauses 14 and 16 of the standard contractual clauses).'
				),
				reasons: [reasonFor(catalog, 't_measures')],
				notes: [
					L(
						'Technische Maßnahmen umsetzen, die den Zugriff im Zielland wirksam verhindern (z. B. Ende-zu-Ende-Verschlüsselung mit Schlüsseln nur im EWR), oder die Übermittlung beenden.',
						'Implement technical measures that effectively prevent access in the destination country (e.g. end-to-end encryption with keys held only in the EEA), or stop the transfer.'
					),
					...ALWAYS
				],
				citations
			};
		}
		const safeguardOpen = unclear(['t_tia', 't_measures']);
		if (safeguardOpen.length > 0 || adequacyOpen.length > 0) {
			return {
				verdict: 'conditional',
				headline: L('Offene Punkte.', 'Open points.'),
				explanation: L(
					'Geeignete Garantien sind vereinbart, aber die Bewertung des Ziellandes ist noch nicht vollständig geklärt.',
					'Appropriate safeguards are in place, but the assessment of the destination country is not yet fully settled.'
				),
				reasons: [...adequacyOpen, ...safeguardOpen],
				notes: ALWAYS,
				citations
			};
		}
		return {
			verdict: 'negative',
			headline: L(
				'Übermittlung auf geeignete Garantien gestützt.',
				'Transfer based on appropriate safeguards.'
			),
			explanation: L(
				'Garantien nach Art. 46 bzw. 47 sind vereinbart, das Zielland ist bewertet und etwaige Lücken sind durch ergänzende Maßnahmen geschlossen. Die Bewertung ist bei Änderungen im Zielland zu wiederholen.',
				'Safeguards under Art. 46 or 47 are in place, the destination country has been assessed and any gaps are closed by supplementary measures. Repeat the assessment when the situation in the destination country changes.'
			),
			reasons: [reasonFor(catalog, instrument)],
			notes: ALWAYS,
			citations
		};
	}

	if (yes('t_derogation')) {
		return {
			verdict: 'conditional',
			headline: L('Nur eine Ausnahme nach Art. 49 trägt.', 'Only an Art. 49 derogation applies.'),
			explanation: L(
				'Ausnahmen sind eng auszulegen und nur für gelegentliche, nicht wiederholte Übermittlungen gedacht. Für regelmäßige Übermittlungen sind Garantien nach Art. 46 nötig.',
				'Derogations are to be interpreted narrowly and are meant only for occasional, non-repetitive transfers. Regular transfers need safeguards under Art. 46.'
			),
			reasons: [reasonFor(catalog, 't_derogation')],
			notes: [
				L(
					'Die Voraussetzungen der Ausnahme dokumentieren; bei einer Einwilligung über die Risiken der Übermittlung ohne Angemessenheitsbeschluss und Garantien informieren.',
					'Document the conditions of the derogation; for consent, inform about the risks of a transfer without adequacy decision and safeguards.'
				),
				...ALWAYS
			],
			citations
		};
	}

	const lastOpen = unclear(['t_scc', 't_bcr', 't_derogation']);
	if (adequacyOpen.length > 0 || lastOpen.length > 0) {
		return {
			verdict: 'conditional',
			headline: L('Grundlage noch ungeklärt.', 'Basis not yet settled.'),
			explanation: L(
				'Eine tragfähige Grundlage nach Kapitel V ist nicht festgestellt; einzelne Punkte sind offen.',
				'No sound Chapter V basis has been established; some points are open.'
			),
			reasons: [...adequacyOpen, ...lastOpen],
			citations
		};
	}

	return {
		verdict: 'positive',
		headline: L('Keine Grundlage für die Übermittlung.', 'No basis for the transfer.'),
		explanation: L(
			'Weder ein Angemessenheitsbeschluss noch geeignete Garantien noch eine Ausnahme liegen vor. Die Übermittlung ist unzulässig, bis eine Grundlage geschaffen ist.',
			'There is neither an adequacy decision nor appropriate safeguards nor a derogation. The transfer is unlawful until a basis is in place.'
		),
		reasons: [reasonFor(catalog, 't_scc'), reasonFor(catalog, 't_bcr')],
		notes: [
			L(
				'Standardvertragsklauseln im passenden Modul abschließen und ein Transfer Impact Assessment durchführen, einen Anbieter im EWR wählen oder die Übermittlung beenden.',
				'Conclude standard contractual clauses in the appropriate module and carry out a transfer impact assessment, choose an EEA provider, or stop the transfer.'
			)
		],
		citations
	};
}
