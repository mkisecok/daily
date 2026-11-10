// ported from mkisecok/dataGuard (MIT)
import { validIban } from '../repo-check/scan.js';
import type { Rule, RuleKey, Tier, TokenType } from './types.js';

/**
 * detection rules. Recall beats precision: a checksum never rejects a hit,
 * because a mistyped but real IBAN would then reach the AI chat in the clear.
 */

/** capitalised words that look like names but are not */
const NAME_DENY = new Set([
	'deutsche',
	'bank',
	'sparkasse',
	'commerzbank',
	'ing',
	'dkb',
	'klinikum',
	'universität',
	'freie',
	'goethe',
	'amtsgericht',
	'landgericht',
	'verwaltungsgericht',
	'innere',
	'medizin',
	'techcorp',
	'datasystems',
	'digital',
	'solutions',
	'innovateco',
	'berliner',
	'hauptstraße',
	'kastanienweg',
	'rosenplatz',
	'lindenstraße',
	'gartenweg',
	'fichtenring',
	'bachgasse',
	'schillerstraße',
	'marktplatz',
	'die',
	'der',
	'das',
	'islamische',
	'evangelische',
	'jüdische',
	'römisch',
	'katholische',
	'zen',
	'kreisverband',
	'ortsverband',
	'pfarrgemeinde'
]);

function nameValidate(match: string): boolean {
	const words = match
		.trim()
		.replace(/^(?:Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Prof\.?|Herr|Frau)\s+/i, '')
		.split(/[\s-]+/);
	return !words.some((word) => NAME_DENY.has(word.toLowerCase()));
}

/**
 * first names that mark the next capitalised word as a surname. German
 * capitalises every noun, so names fire on context (a title, a label with a
 * colon, a known first name), never on shape alone; an unknown name in free
 * text has to be marked by hand.
 */
export const NAME_DICT = [
	'Max',
	'Lena',
	'Jonas',
	'Fatima',
	'Mehmet',
	'Sarah',
	'David',
	'Ayşe',
	'Tobias',
	'Mia',
	'Kemal',
	'Nina',
	'Felix',
	'Hana',
	'Lucas',
	'Selin',
	'Emma',
	'Noah',
	'Zeynep',
	'Julia',
	'Anna',
	'Laura',
	'Marie',
	'Sophie',
	'Sophia',
	'Hannah',
	'Lea',
	'Leon',
	'Paul',
	'Ben',
	'Luis',
	'Luca',
	'Finn',
	'Elias',
	'Jan',
	'Tim',
	'Tom',
	'Niklas',
	'Simon',
	'Moritz',
	'Philipp',
	'Alexander',
	'Daniel',
	'Michael',
	'Thomas',
	'Andreas',
	'Stefan',
	'Markus',
	'Martin',
	'Peter',
	'Klaus',
	'Wolfgang',
	'Sabine',
	'Petra',
	'Claudia',
	'Andrea',
	'Katharina',
	'Christina',
	'Melanie',
	'Nicole',
	'Johanna',
	'Charlotte',
	'Amelie',
	'Clara',
	'Greta',
	'Ida',
	'Frieda',
	'Maria',
	'Sofia',
	'Emre',
	'Yusuf',
	'Elif',
	'Deniz',
	'Cem',
	'Burak',
	'Ali',
	'Ayla',
	'Leyla',
	'Murat',
	'Hakan',
	'Ece',
	'Kerem',
	'Berkay',
	'Aylin',
	'Merve',
	'Can',
	'Ahmet',
	'Mustafa',
	'Hüseyin',
	'Zeyn',
	'John',
	'James',
	'Robert',
	'Mary',
	'Linda',
	'Anna-Lena',
	'Marc',
	'Marco',
	'Matteo',
	'Nico',
	'Vincent',
	'Oskar',
	'Emil',
	'Theo',
	'Mila',
	'Lina',
	'Ella',
	'Nele',
	'Pia',
	'Jana',
	'Katrin',
	'Ursula',
	'Helga',
	'Ingrid',
	'Renate',
	'Monika',
	'Brigitte',
	'Karl',
	'Hans',
	'Werner',
	'Günter',
	'Dieter',
	'Horst'
];

/**
 * no letter or digit before: `\b` only knows ASCII, so it splits "Müller"
 * after "Mü". Matched, not looked behind: Safari before 16.4 cannot parse a
 * lookbehind, so the value sits in a group named `v…` that ends the match.
 */
const START = '(?:^|[^\\p{L}\\p{N}])';
/** a capitalised word, hyphenated parts allowed: "Weber", "Müller-Lüdenscheidt" */
const PART = '\\p{Lu}\\p{Ll}{2,}(?:-\\p{Lu}\\p{Ll}+)*(?![\\p{L}\\p{N}])';
const NAMECORE = `${PART}(?:[ \\t]+${PART})?`;
const TITLES = 'Herr|Frau|Herrn|Dr\\.|Prof\\.|Rechtsanwalt|Rechtsanwältin|Mr\\.|Mrs\\.|Ms\\.';
const PLABELS =
	'Name|Vorname|Nachname|Kunde|Kundin|Patient|Patientin|Mitarbeiter|Mitarbeiterin|' +
	'Mandant|Mandantin|Kläger|Beklagte[r]?|Beschuldigte[r]?|Studierender|Mitglied|Person|Berater|' +
	'Beraterin|Prüfer|Prüferin|Arzt|Ärztin|Ansprechpartner|Sachbearbeiter|Ratsuchende Person|' +
	'Behandelnder Arzt|Direkte Führungskraft|Führungskraft';

const NAME_RE = new RegExp(
	`${START}(?:(?:${TITLES})[ \\t]{1,2}` +
		`|(?:${PLABELS})[ \\t]*:[ \\t]*(?:(?:Dr|Prof|Herr|Frau|Rechtsanwalt|Rechtsanwältin)\\.?[ \\t]+)?)(?<v>${NAMECORE})` +
		`|${START}(?<v2>(?:${NAME_DICT.join('|')})[ \\t]+${NAMECORE})`,
	'gu'
);

/** street suffixes, glued on ("Müllerstraße") or as a word of their own ("Berliner Allee") */
const STREET =
	'(?:[Ss]tra(?:ß|ss)e|[Ss]tr\\.|[Gg]asse|[Aa]llee|[Ww]eg|[Pp]latz|[Rr]ing|[Dd]amm|[Cc]haussee|[Uu]fer)';
const ADDRESS_RE = new RegExp(
	`${START}(?<v>(?:\\p{L}[\\p{L}\\-]+|(?:\\p{Lu}[\\p{L}\\-]*\\.?[ \\t]+){1,2})${STREET}` +
		`[ \\t]*\\d+(?:[ \\t]?[a-zA-Z])?)(?![\\p{L}\\p{N}])`,
	'gu'
);

/**
 * the checksum is a hint, never a filter. A hit that fails it is first cut
 * back group by group, since the pattern can run into a following word such
 * as "BIC"; if no shorter form passes, the whole hit is kept as unconfirmed.
 */
function ibanConfirm(match: string): { length: number; confident: boolean } {
	for (let cut = match; cut.replace(/\s/g, '').length >= 15;) {
		if (validIban(cut)) return { length: cut.length, confident: true };
		const last = cut.search(/\s\S+$/);
		if (last === -1) break;
		cut = cut.slice(0, last);
	}
	return { length: match.length, confident: false };
}

export const RULES: Record<RuleKey, Rule> = {
	name: {
		re: NAME_RE,
		validate: nameValidate
	},
	email: {
		re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
	},
	phone: {
		re: /\+?[\d \-()]{9,20}/g,
		// the pattern is loose on purpose, so gate on the digit count
		validate: (match) => {
			const digits = match.replace(/\D/g, '').length;
			return digits >= 7 && digits <= 15;
		}
	},
	address: {
		re: ADDRESS_RE
	},
	date: {
		// the label stays out of the token, so the model keeps the context
		re: /\b(?:born|DOB|geb\.?|Geburtsdatum|birthdate|birth date|date of birth)[:\s]{1,4}(?<v>\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/gi
	},
	passport: {
		re: /\b[A-Z]{1,2}\s?\d{6,9}\b/g
	},
	ip: {
		re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
		validate: (match) => match.split('.').every((octet) => +octet >= 0 && +octet <= 255)
	},
	iban: {
		// letters after the check digits too: NL91 ABNA 0417 1643 00, GB29 NWBK 6016 …
		re: /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{2,4}){3,8}\b/g,
		confirm: ibanConfirm
	},
	creditcard: {
		re: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g
	},
	taxid: {
		re: /\b\d{11}\b/g,
		validate: (match) => /^[1-9]/.test(match)
	},
	insurance: {
		re: /\b(?:Versicherten(?:-Nr\.?|nummer)|KV-Nr\.?|Insurance\s+(?:No\.?|Nr\.?|Number))[:\s]{1,4}(?<v>[A-Z0-9]{6,15}\b)/gi
	},
	health: {
		art9: true,
		// a labelled clinical value (label kept out) or a condition named on its own
		re: /\b(?:Diagnose|Medikation|Therapie(?:plan)?|Erkrankung|Befund|Symptome?|Behandlung|Operation|Krankheit|Allergie|Impfstatus|Blutgruppe|Blutzucker|Blutdruck|Cholesterin)[:\s]{1,4}(?<v>[^\n]{3,80})|\b(?:HIV|AIDS|Diabetes(?:\s+mellitus(?:\s+Typ\s+\d)?)?|Hypertonie|Migräne|Depression|depressive\s+Episode|Hypothyreose|Asthma|Krebs|Karzinom|Tumor|Schizophrenie|Epilepsie|Demenz|Alzheimer|Multiple\s+Sklerose|Parkinson)\b/gi
	},
	religion: {
		art9: true,
		re: /\b(?:Religionszugehörigkeit|Religion|Konfession|Kirchensteuer|Glaube|faith|religious\s+affiliation|denomination)[:\s]{1,4}(?<v>[^\n]{2,60})|\b(?:evangelisch|katholisch|römisch-katholisch|muslimisch|islamisch|jüdisch|buddhistisch|hinduistisch|orthodox|protestantisch)\b/gi
	},
	political: {
		art9: true,
		re: /\b(?:Partei(?:mitglied(?:schaft)?)?|Politische\s+(?:Überzeugung|Ansicht|Zugehörigkeit)|Ortsverband|Kreisverband|political\s+(?:party|affiliation|view))[:\s]{1,4}(?<v>[^\n]{2,80})/gi
	},
	sexual: {
		art9: true,
		// the closing boundary keeps "trans" out of "Transport", "Transfer" and "transparent"
		re: /\b(?:sexuelle[rn]?\s+(?:Orientierung|Identität)|Geschlechtsidentität|sexual\s+(?:orientation|identity)|gender\s+identity|(?:homo|bi|pan)sexuell(?:e[mnrs]?)?|nicht-binär(?:e[mnrs]?)?|queer|lesbisch(?:e[mnrs]?)?|schwul(?:e[mnrs]?)?|trans(?:gender|sexuell(?:e[mnrs]?)?|ident(?:e[mnrs]?)?|frau|mann)?)(?![\p{L}\p{N}])[:\s]*[^\n]{0,60}/giu
	}
};

/** detector → placeholder type */
export const RULE_TYPE: Record<RuleKey, TokenType> = {
	name: 'NAME',
	email: 'EMAIL',
	phone: 'PHONE',
	address: 'ADDRESS',
	date: 'DATE',
	iban: 'NUMBER',
	creditcard: 'NUMBER',
	taxid: 'NUMBER',
	passport: 'NUMBER',
	insurance: 'NUMBER',
	ip: 'NUMBER',
	health: 'HEALTH_DATA',
	religion: 'RELIGION',
	political: 'POLITICAL',
	sexual: 'SEXUAL_ORIENT'
};

/**
 * detector precedence: the index is the priority that settles overlaps.
 * Structured identifiers first, free-text names last, since they are the
 * loosest pattern and would swallow parts of an address or a labelled field.
 */
export const DETECT_ORDER: RuleKey[] = [
	'iban',
	'creditcard',
	'taxid',
	'passport',
	'insurance',
	'ip',
	'email',
	'phone',
	'date',
	'address',
	'health',
	'religion',
	'political',
	'sexual',
	'name'
];

/** rule groups as shown on the page */
export const RULE_GROUPS = [
	{
		id: 'standard',
		art9: false,
		keys: ['name', 'email', 'phone', 'address', 'date', 'passport', 'ip'] satisfies RuleKey[]
	},
	{
		id: 'financial',
		art9: false,
		keys: ['iban', 'creditcard', 'taxid', 'insurance'] satisfies RuleKey[]
	},
	{
		id: 'art9',
		art9: true,
		keys: ['health', 'religion', 'political', 'sexual'] satisfies RuleKey[]
	}
] as const;

export const RULE_KEYS = Object.keys(RULES) as RuleKey[];

/** every placeholder type, in the order offered when marking by hand */
export const TOKEN_TYPES: TokenType[] = [
	'NAME',
	'EMAIL',
	'PHONE',
	'ADDRESS',
	'DATE',
	'NUMBER',
	'HEALTH_DATA',
	'RELIGION',
	'POLITICAL',
	'SEXUAL_ORIENT',
	'CUSTOM'
];

export const TOKEN_TIER: Record<TokenType, Tier> = {
	NAME: 1,
	EMAIL: 1,
	PHONE: 1,
	ADDRESS: 1,
	DATE: 1,
	NUMBER: 2,
	HEALTH_DATA: 3,
	RELIGION: 3,
	POLITICAL: 3,
	SEXUAL_ORIENT: 3,
	CUSTOM: 0
};

/** Art. 9 first, so the most sensitive findings are seen without scrolling */
export const TIER_ORDER: Tier[] = [3, 1, 2, 0];
