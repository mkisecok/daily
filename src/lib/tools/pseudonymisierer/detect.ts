// ported from mkisecok/dataGuard (MIT)
import { DETECT_ORDER, NAME_DICT, RULES, RULE_TYPE, TOKEN_TYPES, isNameWord } from './rules.js';
import type { Finding, Mapping, Place, RuleKey, RunResult, Span, TokenType } from './types.js';

/**
 * placeholder format «TYPE_N». Models rarely reword guillemets and they survive
 * Markdown; the restore matcher also accepts `[TYPE N]` and case changes.
 */
export function token(type: string, n: number): string {
	return `«${type}_${n}»`;
}

/** a mark's name as a type, or as an own label under `CUSTOM` */
function typed(label: string): { type: TokenType; label?: string } {
	return (TOKEN_TYPES as string[]).includes(label)
		? { type: label as TokenType }
		: { type: 'CUSTOM', label };
}

const WORD = /[\p{L}\p{N}]/u;

/**
 * every index at which `needle` occurs, non-overlapping and not inside a
 * longer word: a mark on "Jan" leaves "Januar" alone
 */
function allOccurrences(text: string, needle: string): number[] {
	const out: number[] = [];
	if (!needle) return out;
	const wordStart = WORD.test(needle[0]!);
	const wordEnd = WORD.test(needle[needle.length - 1]!);
	let i = text.indexOf(needle);
	while (i !== -1) {
		const before = text[i - 1];
		const after = text[i + needle.length];
		const inside =
			(wordStart && before !== undefined && WORD.test(before)) ||
			(wordEnd && after !== undefined && WORD.test(after));
		if (inside) {
			i = text.indexOf(needle, i + 1);
			continue;
		}
		out.push(i);
		i = text.indexOf(needle, i + needle.length);
	}
	return out;
}

/**
 * every piece of personal data in `text`, as character-offset spans. Pure: all
 * page state comes in as arguments. A manual mark is named by a type or an own
 * label and counts wherever its value occurs; a place counts where it is, and
 * wins over everything else.
 */
export function detect(
	text: string,
	activeRules: ReadonlySet<RuleKey>,
	manualMarks: ReadonlyMap<string, string>,
	mutedValues: ReadonlySet<string>,
	places: readonly Place[] = []
): Span[] {
	const raw: Omit<Span, 'id'>[] = [];

	for (const place of places) {
		raw.push({
			start: place.start,
			end: place.end,
			value: text.slice(place.start, place.end),
			...typed(place.label),
			prio: -2,
			manual: true,
			muted: false
		});
	}

	// the user has ruled on these, so no detector may override them
	for (const [value, label] of manualMarks) {
		for (const i of allOccurrences(text, value)) {
			raw.push({
				start: i,
				end: i + value.length,
				value,
				...typed(label),
				prio: -1,
				manual: true,
				muted: false
			});
		}
	}

	DETECT_ORDER.forEach((key, prio) => {
		if (!activeRules.has(key)) return;
		const rule = RULES[key];
		// a fresh RegExp per pass: the shared literals keep state in lastIndex
		const flags = rule.re.flags.includes('g') ? rule.re.flags : rule.re.flags + 'g';
		const re = new RegExp(rule.re.source, flags);

		let match: RegExpExecArray | null;
		while ((match = re.exec(text)) !== null) {
			if (match[0] === '') {
				re.lastIndex++;
				continue;
			}
			// a labelled rule matches its label too and keeps the value in a
			// `v…` group that ends the match
			const value = Object.values(match.groups ?? {}).find((group) => group) ?? match[0];
			if (rule.validate && !rule.validate(value)) continue;
			const check = rule.confirm?.(value);

			// a variable-length label separator lets a value start on a space;
			// trim both edges so a placeholder never eats its own padding
			let start = match.index + match[0].length - value.length;
			let end = start + (check?.length ?? value.length);
			while (start < end && /\s/.test(text[start]!)) start++;
			while (end > start && /\s/.test(text[end - 1]!)) end--;
			if (end <= start) continue;

			raw.push({
				start,
				end,
				value: text.slice(start, end),
				type: RULE_TYPE[key],
				ruleKey: key,
				prio,
				manual: false,
				muted: false,
				confident: check?.confident
			});
		}
	});

	const first = resolveOverlaps(raw, mutedValues);
	if (!activeRules.has('name')) return first;
	const parts = followUps(text, first, DETECT_ORDER.indexOf('name'));
	return parts.length > 0 ? resolveOverlaps([...raw, ...parts], mutedValues) : first;
}

const TITLE_WORDS = new Set(['herr', 'herrn', 'frau', 'dr.', 'prof.', 'mr.', 'mrs.', 'ms.']);

/**
 * a found full name gives its parts away when they stand alone later: after
 * "Katharina Brandt" the text goes on with "Frau Brandt sagte" or just
 * "Brandt". Each part gets a token of its own, so restoring "Brandt" never
 * writes back the full name.
 */
function followUps(text: string, spans: Span[], prio: number): Omit<Span, 'id'>[] {
	const out: Omit<Span, 'id'>[] = [];
	const seen = new Set<string>();
	for (const span of spans) {
		if (span.type !== 'NAME' || span.muted) continue;
		const words = span.value.split(/[ \t]+/).filter((word) => !TITLE_WORDS.has(word.toLowerCase()));
		if (words.length < 2) continue;
		for (const word of words) {
			if (seen.has(word) || !isNameWord(word)) continue;
			seen.add(word);
			for (const i of allOccurrences(text, word)) {
				out.push({
					start: i,
					end: i + word.length,
					value: word,
					type: 'NAME',
					ruleKey: 'name',
					prio,
					manual: false,
					muted: false
				});
			}
		}
	}
	return out;
}

/** a word that may be a name the rules did not catch, with how often it occurs */
export type Suggestion = { value: string; count: number; reason: 'first-name' | 'email' };

const FIRST = new Set(NAME_DICT);

/**
 * names the rules leave alone because nothing around them gives them away: a
 * first name on its own ("Katharina meldete sich"), or a name spelled out in
 * an e-mail address ("katharina.brandt@…" next to a "Brandt" in the text).
 * Offered for one click, never replaced on their own: a first name may also
 * be a product or a place.
 */
export function suggest(text: string, spans: Span[]): Suggestion[] {
	const covered = (start: number, end: number) =>
		spans.some((span) => start < span.end && span.start < end);
	const marked = new Set(spans.map((span) => span.value));
	const found = new Map<string, Suggestion>();
	const add = (value: string, reason: Suggestion['reason']) => {
		if (marked.has(value) || found.has(value)) return;
		const free = allOccurrences(text, value).filter((i) => !covered(i, i + value.length));
		if (free.length > 0) found.set(value, { value, count: free.length, reason });
	};

	for (const match of text.matchAll(/\p{Lu}[\p{Ll}-]{2,}/gu)) {
		if (FIRST.has(match[0])) add(match[0], 'first-name');
	}
	for (const span of spans) {
		if (span.type !== 'EMAIL') continue;
		const local = span.value.split('@')[0] ?? '';
		for (const part of local.split(/[._-]+/)) {
			if (part.length < 3 || /\d/.test(part)) continue;
			const word = part[0]!.toUpperCase() + part.slice(1).toLowerCase();
			if (isNameWord(word)) add(word, 'email');
		}
	}
	return [...found.values()].sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

/** drops overlapping detections: detector priority first, then leftmost, then longest */
function resolveOverlaps(list: Omit<Span, 'id'>[], mutedValues: ReadonlySet<string>): Span[] {
	list.sort((a, b) => a.prio - b.prio || a.start - b.start || b.end - b.start - (a.end - a.start));

	const kept: Omit<Span, 'id'>[] = [];
	for (const span of list) {
		const overlaps = kept.some((k) => span.start < k.end && k.start < span.end);
		if (!overlaps) kept.push(span);
	}

	kept.sort((a, b) => a.start - b.start);
	return kept.map((span, id) => ({ ...span, id, muted: mutedValues.has(span.value) }));
}

function findingFor(span: Span, replacement: string): Finding {
	return {
		original: span.value,
		replacement,
		type: span.type,
		ruleKey: span.ruleKey,
		label: span.label,
		manual: span.manual,
		muted: span.muted,
		confident: span.confident !== false,
		spanIds: []
	};
}

/**
 * the outgoing text and its mapping, in one left-to-right pass over the spans
 * rather than a global replace by value. The same value gets the same token
 * everywhere, so the model can tell two mentions are the same person.
 */
export function buildRun(text: string, spans: Span[]): RunResult {
	const live = spans.filter((span) => !span.muted);
	const mapping: Mapping = Object.create(null);
	const counters = new Map<string, number>();
	const byValue = new Map<string, Finding>();
	const findings: Finding[] = [];

	for (const span of live) {
		let finding = byValue.get(span.value);
		if (!finding) {
			const name = span.label ?? span.type;
			const n = (counters.get(name) ?? 0) + 1;
			counters.set(name, n);
			finding = findingFor(span, token(name, n));
			mapping[span.value] = { replacement: finding.replacement, type: span.type };
			byValue.set(span.value, finding);
			findings.push(finding);
		}
		if (span.confident === false) finding.confident = false;
		span.replacement = finding.replacement;
		finding.spanIds.push(span.id);
	}

	let out = '';
	let cursor = 0;
	for (const span of live) {
		out += text.slice(cursor, span.start) + span.replacement;
		cursor = span.end;
	}
	out += text.slice(cursor);

	// switched-off values keep a row so they can be switched on again
	const mutedByValue = new Map<string, Finding>();
	const muted: Finding[] = [];
	for (const span of spans) {
		if (!span.muted) continue;
		let finding = mutedByValue.get(span.value);
		if (!finding) {
			finding = findingFor(span, '');
			mutedByValue.set(span.value, finding);
			muted.push(finding);
		}
		finding.spanIds.push(span.id);
	}

	return { text: out, mapping, findings, muted };
}
