import type { Law, Localized } from '../tools/types.js';
import type { Lang, LawId, Provision, ProvisionKind } from './types.js';

export type LawMeta = {
	id: LawId;
	/** the abbreviation used in citations across Daily */
	law: Law;
	name: Localized;
	/** whether an official English text exists in the data */
	english: boolean;
};

export const LAWS: LawMeta[] = [
	{
		id: 'dsgvo',
		law: 'DSGVO',
		name: L(
			'Datenschutz-Grundverordnung (EU) 2016/679',
			'General Data Protection Regulation (EU) 2016/679'
		),
		english: true
	},
	{
		id: 'ki-vo',
		law: 'KI-VO',
		name: L('KI-Verordnung (EU) 2024/1689', 'Artificial Intelligence Act (EU) 2024/1689'),
		english: true
	},
	{
		id: 'bdsg',
		law: 'BDSG',
		name: L('Bundesdatenschutzgesetz', 'Federal Data Protection Act'),
		english: false
	},
	{
		id: 'tdddg',
		law: 'TDDDG',
		name: L(
			'Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz',
			'Telecommunications Digital Services Data Protection Act'
		),
		english: false
	}
];

function L(de: string, en: string): Localized {
	return { de, en };
}

export function lawById(id: string): LawMeta | undefined {
	return LAWS.find((l) => l.id === id);
}

export function lawByCitation(law: Law): LawMeta | undefined {
	return LAWS.find((l) => l.law === law);
}

const PREFIX: Record<ProvisionKind, Record<Lang, string>> = {
	artikel: { de: 'Art.', en: 'Art.' },
	paragraph: { de: '§', en: 'Section' },
	erwaegungsgrund: { de: 'ErwG', en: 'Recital' },
	anhang: { de: 'Anhang', en: 'Annex' }
};

/** "Art. 5", "§ 26", "ErwG 12", "Anhang III" / "Recital 12", "Annex III" */
export function provisionLabel(provision: Pick<Provision, 'kind' | 'number'>, lang: Lang): string {
	return `${PREFIX[provision.kind][lang]} ${provision.number}`;
}

export const KIND_ORDER: ProvisionKind[] = ['artikel', 'paragraph', 'anhang', 'erwaegungsgrund'];
