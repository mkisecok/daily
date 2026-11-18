// ported from mkisecok/dataGuard (MIT)
import { validIban } from '../repo-check/scan.js';
import { FIRST_NAMES } from './names.js';
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
	'damen',
	'herren',
	'kolleginnen',
	'kollegen',
	'team',
	'zusammen',
	'alle',
	'leute',
	'mitarbeitende',
	'mitarbeiterinnen',
	'mitarbeiter',
	'kunden',
	'kundinnen',
	'eltern',
	'freunde',
	'frau',
	'herr',
	'grüße',
	'gruß',
	'ortsverband',
	'pfarrgemeinde'
]);

/** a single word that can stand for a person: capitalised, not a common word or title */
export function isNameWord(word: string): boolean {
	return /^\p{Lu}\p{Ll}{2,}(?:-\p{Lu}\p{Ll}+)*$/u.test(word) && !NAME_DENY.has(word.toLowerCase());
}

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
export const NAME_DICT = [...new Set(FIRST_NAMES)];

/**
 * no letter or digit before: `\b` only knows ASCII, so it splits "Müller"
 * after "Mü". Matched, not looked behind: Safari before 16.4 cannot parse a
 * lookbehind, so the value sits in a group named `v…` that ends the match.
 */
const START = '(?:^|[^\\p{L}\\p{N}])';
/** a capitalised word, hyphenated parts allowed: "Weber", "Müller-Lüdenscheidt" */
const PART = '\\p{Lu}\\p{Ll}{2,}(?:-\\p{Lu}\\p{Ll}+)*(?![\\p{L}\\p{N}])';
const NAMECORE = `${PART}(?:[ \\t]+${PART})?`;
/**
 * a known first name starts only after a non-hyphen, and may carry a
 * hyphenated second first name: "Marie-Luise", never "-Luise" alone
 */
const NAME_START = '(?:^|[^\\p{L}\\p{N}-])';
const FIRST_PART = '(?:-\\p{Lu}\\p{Ll}+)?';
const TITLES = 'Herr|Frau|Herrn|Dr\\.|Prof\\.|Rechtsanwalt|Rechtsanwältin|Mr\\.|Mrs\\.|Ms\\.';
const PLABELS =
	'Name|Vorname|Nachname|Kunde|Kundin|Patient|Patientin|Mitarbeiter|Mitarbeiterin|' +
	'Mandant|Mandantin|Kläger|Beklagte[r]?|Beschuldigte[r]?|Studierender|Mitglied|Person|Berater|' +
	'Beraterin|Prüfer|Prüferin|Arzt|Ärztin|Ansprechpartner|Sachbearbeiter|Ratsuchende Person|' +
	'Behandelnder Arzt|Direkte Führungskraft|Führungskraft';

/** an opening that addresses someone by name: "Hallo Katharina", "Sehr geehrte Frau Brandt" */
const GREETINGS =
	'Hallo|Hi|Hey|Moin|Servus|Liebe|Lieber|Liebes|Sehr geehrte|Sehr geehrter|Guten Tag|Dear|Hello';
/** a closing whose next line is the sender's name */
const SIGNOFFS =
	'Grüße|Grüßen|Gruß|Grüsse|Gruss|MfG|LG|VG|Regards|Best|Cheers|Thanks|Danke|Dankeschön|Herzlichst';

const NAME_RE = new RegExp(
	`${START}(?:(?:${TITLES})[ \\t]{1,2}` +
		`|(?:${PLABELS})[ \\t]*:[ \\t]*(?:(?:Dr|Prof|Herr|Frau|Rechtsanwalt|Rechtsanwältin)\\.?[ \\t]+)?)(?<v>${NAMECORE})` +
		`|${NAME_START}(?<v2>(?:${NAME_DICT.join('|')})${FIRST_PART}[ \\t]+${NAMECORE})` +
		`|${START}(?:${GREETINGS})[ \\t]+(?:(?:Herr|Frau|Dr\\.|Prof\\.)[ \\t]+)*(?<v3>${NAMECORE})` +
		`|${START}(?:${SIGNOFFS})[,!.]?[ \\t]*\\r?\\n[ \\t]*(?<v4>${NAMECORE})[ \\t]*(?=\\r?\\n|$)`,
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

/**
 * Steuer-ID check digit, ISO 7064 MOD 11,10 over the first ten digits. A hint
 * like the IBAN checksum: a failing number is still replaced.
 */
export function validTaxId(value: string): boolean {
	const digits = value.replace(/\D/g, '');
	if (digits.length !== 11) return false;
	let product = 10;
	for (const digit of digits.slice(0, 10)) {
		let sum = (Number(digit) + product) % 10;
		if (sum === 0) sum = 10;
		product = (sum * 2) % 11;
	}
	const check = (11 - product) % 10;
	return check === Number(digits[10]);
}

/**
 * Krankenversichertennummer (§ 290 SGB V): the letter as 01–26 and the next
 * eight digits, weighted 1-2-1-2…, cross sums added, mod 10 is the ninth digit
 */
export function validKvnr(value: string): boolean {
	const match = /^([A-Z])(\d{9})$/.exec(value);
	if (!match) return false;
	const digits = String(match[1].charCodeAt(0) - 64).padStart(2, '0') + match[2].slice(0, 8);
	let sum = 0;
	[...digits].forEach((digit, i) => {
		const product = Number(digit) * (i % 2 === 0 ? 1 : 2);
		sum += product > 9 ? product - 9 : product;
	});
	return sum % 10 === Number(match[2][8]);
}

/** a Rentenversicherungsnummer carries the date of birth as DDMMYY after the area number */
function plausiblePension(value: string): boolean {
	const digits = value.replace(/\s/g, '');
	const day = Number(digits.slice(2, 4));
	const month = Number(digits.slice(4, 6));
	return day >= 1 && day <= 31 && month >= 1 && month <= 12;
}

const MONTHS =
	'Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember|' +
	'January|February|March|May|June|July|October|December';

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
		// the shape of older numbers, or a labelled German ID card or passport number such as C01X00T47
		re: /\b[A-Z]{1,2}\s?\d{6,9}\b|\b(?:Personalausweis(?:nummer|-Nr\.?)?|Ausweis(?:nummer|-Nr\.?)|Reisepass(?:nummer)?|Passnummer|Pass-Nr\.?|ID[- ]card(?:\s+number)?|Passport(?:\s+No\.?|\s+number)?)[:\s]{1,4}(?<v>[CFGHJKLMNPRTVWXYZ0-9]{9}\d?)\b/g
	},
	pension: {
		// area, date of birth DDMMYY, initial letter, serial and check digit: 65 170839 J 003
		re: /\b\d{2}[ ]?\d{6}[ ]?[A-Z][ ]?\d{3}\b/g,
		validate: plausiblePension
	},
	kvnr: {
		// a letter and nine digits is a common shape, so only a valid check digit counts
		re: /\b[A-Z]\d{9}\b/g,
		validate: validKvnr
	},
	plate: {
		// district, letters and number with the hyphen: M-AB 1234, S-XY 12E
		re: /(?:^|[^\p{L}\p{N}-])(?<v>[A-ZÄÖÜ]{1,3}-[A-Z]{1,2}[ ]?\d{1,4}[EH]?)(?![\p{L}\p{N}])/gu
	},
	postcode: {
		// a five-digit postcode with its town: 70173 Stuttgart, 60311 Frankfurt am Main
		re: /(?:^|[^\p{L}\p{N}])(?<v>(?:0[1-9]|[1-9]\d)\d{3}[ \t]+\p{Lu}\p{Ll}+(?:[ -](?:(?:am|an der|im|in der|ob der)[ ]\p{Lu}\p{Ll}+|\p{Lu}\p{Ll}+))?)/gu
	},
	anydate: {
		// any calendar date, written in digits or with the month's name
		re: new RegExp(
			`\\b(?:0?[1-9]|[12]\\d|3[01])\\.(?:0?[1-9]|1[0-2])\\.(?:19|20)\\d{2}\\b|\\b(?:0?[1-9]|[12]\\d|3[01])\\.?[ ](?:${MONTHS})[ ](?:19|20)\\d{2}\\b`,
			'gu'
		)
	},
	ip: {
		// IPv4, or IPv6 in full or with the :: shorthand; matched, not looked behind (see START)
		re: /\b(?:\d{1,3}\.){3}\d{1,3}\b|(?:^|[^\w:])(?<v>(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,6}:(?:[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4}){0,5})?)(?![\w:])/g,
		validate: (match) =>
			match.includes(':')
				? match.split(':').length >= 4
				: match.split('.').every((octet) => +octet >= 0 && +octet <= 255)
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
		// eleven digits, also grouped as 12 345 678 901; the check digit is a hint
		re: /\b[1-9]\d(?: ?\d{3}){3}\b/g,
		confirm: (match) => ({ length: match.length, confident: validTaxId(match) })
	},
	insurance: {
		re: /\b(?:Versicherten(?:-Nr\.?|nummer)|KV-Nr\.?|Insurance\s+(?:No\.?|Nr\.?|Number))[:\s]{1,4}(?<v>[A-Z0-9]{6,15}\b)/gi
	},
	health: {
		art9: true,
		// a labelled clinical value (label kept out) or a condition named on its own
		re: /\b(?:Diagnose|Medikation|Therapie(?:plan)?|Erkrankung|Befund|Symptome?|Behandlung|Operation|Krankheit|Allergie|Impfstatus|Blutgruppe|Blutzucker|Blutdruck|Cholesterin)[:\s]{1,4}(?<v>[^\n.;]{3,80})|\b(?:HIV|AIDS|Diabetes(?:\s+mellitus(?:\s+Typ\s+\d)?)?|Hypertonie|Migräne|Depression|depressive\s+Episode|Hypothyreose|Asthma|Krebs|Karzinom|Tumor|Schizophrenie|Epilepsie|Demenz|Alzheimer|Multiple\s+Sklerose|Parkinson)\b/gi
	},
	religion: {
		art9: true,
		re: /\b(?:Religionszugehörigkeit|Religion|Konfession|Kirchensteuer|Glaube|Weltanschauung|faith|religious\s+affiliation|denomination|philosophical\s+beliefs?)[:\s]{1,4}(?<v>[^\n.;]{2,60})|\b(?:evangelisch|katholisch|römisch-katholisch|muslimisch|islamisch|jüdisch|buddhistisch|hinduistisch|orthodox|protestantisch)\b/gi
	},
	political: {
		art9: true,
		re: /\b(?:Partei(?:mitglied(?:schaft)?)?|Politische\s+(?:Überzeugung|Ansicht|Zugehörigkeit)|Ortsverband|Kreisverband|political\s+(?:party|affiliation|view))[:\s]{1,4}(?<v>[^\n.;]{2,80})/gi
	},
	sexual: {
		art9: true,
		// the closing boundary keeps "trans" out of "Transport", "Transfer" and "transparent"
		re: /\b(?:sexuelle[rn]?\s+(?:Orientierung|Identität)|Geschlechtsidentität|sexual\s+(?:orientation|identity)|gender\s+identity|(?:homo|bi|pan)sexuell(?:e[mnrs]?)?|nicht-binär(?:e[mnrs]?)?|queer|lesbisch(?:e[mnrs]?)?|schwul(?:e[mnrs]?)?|trans(?:gender|sexuell(?:e[mnrs]?)?|ident(?:e[mnrs]?)?|frau|mann)?)(?![\p{L}\p{N}])[:\s]*[^\n]{0,60}/giu
	},
	ethnic: {
		art9: true,
		// a labelled origin; nationality is not ethnic origin and stays out
		re: /\b(?:ethnische\s+Herkunft|Herkunft|Abstammung|Ethnie|ethnic\s+origin|ethnicity|racial\s+origin)[:\s]{1,4}(?<v>[^\n.;]{2,60})|\b(?:Migrationshintergrund|Sinti|Roma)\b/gu
	},
	union: {
		art9: true,
		// a labelled membership, or a membership in a named union
		re: /\b(?:Gewerkschaft(?:smitglied(?:schaft)?|szugehörigkeit)?|trade\s+union(?:\s+membership)?)[:\s]{1,4}(?<v>[^\n.;]{2,60})|\bMitglied(?:\s+(?:der|bei|in\s+der|bei\s+der))?\s+(?<v2>ver\.di|IG\s+Metall|IG\s+BCE|IG\s+BAU|GEW|EVG|NGG|GdP|Marburger\s+Bund|dbb)\b/gu
	},
	genetic: {
		art9: true,
		// a labelled genetic finding, or a test named in the text
		re: /\b(?:genetische\s+Daten|Gentest|Genanalyse|DNA-Analyse|Erbanlage|genetic\s+(?:data|test))[:\s]{1,4}(?<v>[^\n.;]{2,80})|\b(?:BRCA[12](?:-Mutation)?|Gentest|Genanalyse|DNA-Probe|Vaterschaftstest)\b/gu
	},
	biometric: {
		art9: true,
		// biometric features named in the text, with a value after a colon where one follows
		re: /\b(?:Fingerabdr(?:uck|ücke)|Fingerabdruck-Template|Gesichtsbild|Gesichtserkennung|Gesichtsgeometrie|Iris-?Scan|Venenscan|Stimmprofil|biometrische[nrs]?\s+(?:Daten|Merkmal(?:e)?|Lichtbild)|fingerprints?|facial\s+(?:recognition|geometry)|iris\s+scan|voiceprint)\b(?:[:][ \t]*(?<v>[^\n.;]{2,80}))?/giu
	}
};

/** detector → placeholder type */
export const RULE_TYPE: Record<RuleKey, TokenType> = {
	name: 'NAME',
	email: 'EMAIL',
	phone: 'PHONE',
	address: 'ADDRESS',
	date: 'DATE',
	anydate: 'DATE',
	postcode: 'ADDRESS',
	plate: 'NUMBER',
	pension: 'NUMBER',
	kvnr: 'NUMBER',
	iban: 'NUMBER',
	creditcard: 'NUMBER',
	taxid: 'NUMBER',
	passport: 'NUMBER',
	insurance: 'NUMBER',
	ip: 'NUMBER',
	health: 'HEALTH_DATA',
	religion: 'RELIGION',
	political: 'POLITICAL',
	sexual: 'SEXUAL_ORIENT',
	ethnic: 'ETHNIC_ORIGIN',
	union: 'TRADE_UNION',
	genetic: 'GENETIC_DATA',
	biometric: 'BIOMETRIC_DATA'
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
	'pension',
	'kvnr',
	'passport',
	'insurance',
	'ip',
	'email',
	'phone',
	'date',
	'anydate',
	'plate',
	'address',
	'postcode',
	'health',
	'religion',
	'political',
	'sexual',
	'ethnic',
	'union',
	'genetic',
	'biometric',
	'name'
];

/** rule groups as shown on the page */
export const RULE_GROUPS = [
	{
		id: 'standard',
		art9: false,
		keys: [
			'name',
			'email',
			'phone',
			'address',
			'postcode',
			'date',
			'anydate',
			'passport',
			'plate',
			'ip'
		] satisfies RuleKey[]
	},
	{
		id: 'financial',
		art9: false,
		keys: ['iban', 'creditcard', 'taxid', 'insurance', 'kvnr', 'pension'] satisfies RuleKey[]
	},
	{
		id: 'art9',
		art9: true,
		keys: [
			'health',
			'religion',
			'political',
			'sexual',
			'ethnic',
			'union',
			'genetic',
			'biometric'
		] satisfies RuleKey[]
	}
] as const;

export const RULE_KEYS = Object.keys(RULES) as RuleKey[];

/**
 * rules a standard run leaves off: every date in a text would take the dates
 * out of contracts and deadlines that the AI needs to answer. The strict level
 * switches them on.
 */
export const DEFAULT_OFF: ReadonlySet<RuleKey> = new Set(['anydate']);

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
	'ETHNIC_ORIGIN',
	'TRADE_UNION',
	'GENETIC_DATA',
	'BIOMETRIC_DATA',
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
	ETHNIC_ORIGIN: 3,
	TRADE_UNION: 3,
	GENETIC_DATA: 3,
	BIOMETRIC_DATA: 3,
	CUSTOM: 0
};

/** Art. 9 first, so the most sensitive findings are seen without scrolling */
export const TIER_ORDER: Tier[] = [3, 1, 2, 0];
