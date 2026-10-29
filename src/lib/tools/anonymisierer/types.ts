// ported from mkisecok/dataGuard (MIT)

/**
 * sensitivity tier, drives colour and order in the findings list. `3` is
 * Art. 9 DSGVO (special categories) and the only tier in the alarm colour.
 */
export type Tier = 0 | 1 | 2 | 3;

/** one switchable detector */
export type RuleKey =
	| 'name'
	| 'email'
	| 'phone'
	| 'address'
	| 'date'
	| 'passport'
	| 'ip'
	| 'iban'
	| 'creditcard'
	| 'taxid'
	| 'insurance'
	| 'health'
	| 'religion'
	| 'political'
	| 'sexual';

/**
 * placeholder type written into the outgoing text. Several detectors share
 * `NUMBER` on purpose: the model gains nothing from knowing an identifier was an
 * IBAN, and fewer types mean fewer chances to mangle a token.
 */
export type TokenType =
	| 'NAME'
	| 'EMAIL'
	| 'PHONE'
	| 'ADDRESS'
	| 'DATE'
	| 'NUMBER'
	| 'HEALTH_DATA'
	| 'RELIGION'
	| 'POLITICAL'
	| 'SEXUAL_ORIENT'
	| 'CUSTOM';

export type Rule = {
	re: RegExp;
	/** Art. 9 DSGVO special category */
	art9?: boolean;
	/** rejects a hit that matches the shape but is not plausible */
	validate?: (match: string) => boolean;
	/**
	 * checks a hit without ever rejecting it, e.g. a checksum. May shorten the
	 * hit to the part that passes; `confident` is a hint for the reviewer only.
	 */
	confirm?: (match: string) => { length: number; confident: boolean };
};

/**
 * a detection addressed by character offset, not by value: replacing by value
 * would turn a detected `Jan` into a token inside `Januar` as well.
 */
export type Span = {
	/** index in the resolved, document-ordered list */
	id: number;
	start: number;
	end: number;
	value: string;
	type: TokenType;
	/** absent for manual marks */
	ruleKey?: RuleKey;
	/** detector precedence, lower wins an overlap; manual marks use -1 */
	prio: number;
	manual: boolean;
	/** switched off by the user, so it goes out in the clear */
	muted: boolean;
	/** result of the rule's `confirm`, e.g. a failed IBAN checksum */
	confident?: boolean;
	/** set by `buildRun`; absent while muted */
	replacement?: string;
};

/** one unique original value and the token that stands in for it */
export type Finding = {
	original: string;
	/** empty for muted findings */
	replacement: string;
	type: TokenType;
	ruleKey?: RuleKey;
	manual: boolean;
	muted: boolean;
	/** false when any of its spans failed the rule's check */
	confident: boolean;
	spanIds: number[];
};

/** original value → placeholder; stays in memory and never leaves the page */
export type Mapping = Record<string, { replacement: string; type: TokenType }>;

export type RunResult = {
	/** exactly what goes into the AI chat */
	text: string;
	mapping: Mapping;
	findings: Finding[];
	/** switched-off values, kept so they can be switched on again */
	muted: Finding[];
};

export type RestoreResult = {
	text: string;
	/** placeholders written back */
	count: number;
	/** placeholder-shaped strings the mapping does not know: invented or mangled */
	leftover: string[];
	/** size of the mapping */
	total: number;
};

/** text pulled out of an imported file */
export type ExtractResult = {
	text: string;
	/** PDFs only */
	pages?: number;
	/** no text layer, e.g. a scan; OCR is not offered offline */
	needsOcr?: boolean;
};
