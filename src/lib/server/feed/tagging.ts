/**
 * keyword rules that map a headline (plus excerpt) to the regulations and
 * kinds Daily filters by. Deterministic and reviewable; no model involved.
 */
export const REGULATION_TAGS = [
	'dsgvo',
	'ki-vo',
	'bdsg',
	'tdddg',
	'data-act',
	'dsa',
	'nis2'
] as const;
export const KIND_TAGS = [
	'bussgeld',
	'rechtsprechung',
	'aufsicht',
	'gesetzgebung',
	'leitlinie'
] as const;

export type Tag = (typeof REGULATION_TAGS)[number] | (typeof KIND_TAGS)[number];

const RULES: { tag: Tag; pattern: RegExp }[] = [
	{
		tag: 'dsgvo',
		pattern:
			/\b(dsgvo|gdpr|datenschutz-?grundverordnung|general data protection|art\.?\s?\d+\s?dsgvo|datenschutz|data protection|privacy|personenbezogen|personal data|edpb|edsa|dpa|aufsichtsbehörde|supervisory authority)\b/i
	},
	{
		tag: 'ki-vo',
		pattern:
			/\b(ki-?vo|ki-?verordnung|ai act|aia\b|artificial intelligence act|künstliche intelligenz|artificial intelligence|\bki\b|\bai\b|hochrisiko|high-risk|gpai|omnibus)\b/i
	},
	{ tag: 'bdsg', pattern: /\bbdsg\b/i },
	{ tag: 'tdddg', pattern: /\b(tdddg|ttdsg|cookie|einwilligung|consent)\b/i },
	{ tag: 'data-act', pattern: /\bdata act\b|\bdatengesetz\b/i },
	{ tag: 'dsa', pattern: /\b(dsa|digital services act|digitale-dienste-gesetz|ddg)\b/i },
	{ tag: 'nis2', pattern: /\bnis-?2\b/i },
	{ tag: 'bussgeld', pattern: /\b(bußgeld|bussgeld|geldbuße|fine[sd]?|sanktion|penalt(y|ies))\b/i },
	{
		tag: 'rechtsprechung',
		pattern:
			/\b(urteil|beschluss des|eugh|cjeu|court|gericht|judgment|ruling|schlussanträge|opinion of advocate|rechtssache|case c-)\b/i
	},
	{
		tag: 'aufsicht',
		pattern:
			/\b(bfdi|lfdi|lda|landesbeauftragte|aufsicht|supervisory|datenschutzkonferenz|dsk|tätigkeitsbericht|prüfung|audit)\b/i
	},
	{
		tag: 'gesetzgebung',
		pattern:
			/\b(gesetz(entwurf)?|verordnung|regulation|richtlinie|directive|amtsblatt|official journal|parlament|parliament|kommission|commission|trilog|omnibus)\b/i
	},
	{
		tag: 'leitlinie',
		pattern:
			/\b(leitlinien?|guidelines?|guidance|orientierungshilfe|kurzpapier|stellungnahmen?|statements?|opinions?|faq|handreichung|empfehlung(en)?|recommendations?)\b/i
	}
];

export function tagText(title: string, excerpt?: string | null): Tag[] {
	const haystack = `${title}\n${excerpt ?? ''}`;
	const tags = RULES.filter((rule) => rule.pattern.test(haystack)).map((rule) => rule.tag);
	return [...new Set(tags)];
}

/** true when at least one regulation tag matched: the gate for filtered sources */
export function isRelevant(tags: Tag[]): boolean {
	return tags.some((tag) => (REGULATION_TAGS as readonly string[]).includes(tag));
}
