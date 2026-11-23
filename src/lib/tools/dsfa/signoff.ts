import type { RecordView } from '../../records/types.js';
import { isEmpty } from '../../records/validate.js';
import type { LegalBasis, Localized } from '../types.js';
import {
	assessRisks,
	complianceBlocks,
	complianceOpen,
	measuresPending,
	unbackedReductions
} from './definition.js';

const L = (de: string, en: string): Localized => ({ de, en });

/** `offen` still blocks sign-off, `entfaellt` does not apply because no measure is named */
export type CheckStatus = 'erfuellt' | 'offen' | 'entfaellt';

export type SignOffCheck = {
	id: 'rechtsgrundlagen' | 'einhaltung' | 'senkung' | 'restrisiko' | 'umsetzung';
	label: Localized;
	status: CheckStatus;
	/** what is still open, e.g. the risks lowered without a measure */
	detail: Localized | null;
	cite: LegalBasis;
};

const KP5 = (ref: string): LegalBasis => ({ law: 'DSK', ref: `Kurzpapier Nr. 5, ${ref}` });

/**
 * what DSK Kurzpapier Nr. 5 asks before the processing may start: the legal
 * bases, the principles and rights assessed (EDPB template 2026, 2.3; open
 * ones only with conditions), measures behind every lowered risk, the
 * residual risks with the decision on them, and the measures in place and
 * tested
 */
export function signOffChecks(record: RecordView): SignOffCheck[] {
	const unbacked = unbackedReductions(record);
	const { unset, pending } = complianceOpen(record);
	const open = [...unset, ...pending];
	const named = assessRisks(record).some((risk) => !isEmpty(record.data[`${risk.id}_massnahmen`]));
	return [
		{
			id: 'rechtsgrundlagen',
			label: L('Rechtsgrundlagen festgehalten', 'Legal bases recorded'),
			status: isEmpty(record.data.rechtsgrundlagen) ? 'offen' : 'erfuellt',
			detail: null,
			cite: KP5('Schritt 6')
		},
		{
			id: 'einhaltung',
			label: L(
				'Grundsätze und Betroffenenrechte umgesetzt oder Auflagen',
				'Principles and data subject rights in place, or conditions'
			),
			status: complianceBlocks(record) ? 'offen' : 'erfuellt',
			detail:
				open.length > 0
					? L(open.map((item) => item.de).join(', '), open.map((item) => item.en).join(', '))
					: null,
			cite: { law: 'EDPB', ref: 'DSFA-Vorlage 2026, 2.3' }
		},
		{
			id: 'senkung',
			label: L('Jede Senkung durch Maßnahmen belegt', 'Every reduction backed by measures'),
			status: unbacked.length > 0 ? 'offen' : 'erfuellt',
			detail:
				unbacked.length > 0
					? L(
							unbacked.map((risk) => risk.title.de).join(', '),
							unbacked.map((risk) => risk.title.en).join(', ')
						)
					: null,
			cite: KP5('Schritt 9')
		},
		{
			id: 'restrisiko',
			label: L('Restrisiken und Umgang dokumentiert', 'Residual risks and their handling recorded'),
			status: isEmpty(record.data.restrisiko) ? 'offen' : 'erfuellt',
			detail: null,
			cite: KP5('Schritt 10')
		},
		{
			id: 'umsetzung',
			label: L('Maßnahmen umgesetzt und getestet', 'Measures implemented and tested'),
			status: !named ? 'entfaellt' : measuresPending(record) ? 'offen' : 'erfuellt',
			detail: null,
			cite: KP5('Schritte 11 und 12')
		}
	];
}
