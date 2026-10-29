// ported from mkisecok/dataGuard (MIT)
import { DETECT_ORDER, RULES, RULE_TYPE } from './rules.js';
import type { Finding, Mapping, RuleKey, RunResult, Span, TokenType } from './types.js';

/**
 * placeholder format «TYPE_N». Models rarely reword guillemets and they survive
 * Markdown; the restore matcher also accepts `[TYPE N]` and case changes.
 */
export function token(type: TokenType, n: number): string {
	return `«${type}_${n}»`;
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
 * page state comes in as arguments.
 */
export function detect(
	text: string,
	activeRules: ReadonlySet<RuleKey>,
	manualMarks: ReadonlyMap<string, TokenType>,
	mutedValues: ReadonlySet<string>
): Span[] {
	const raw: Omit<Span, 'id'>[] = [];

	// the user has ruled on these, so no detector may override them
	for (const [value, type] of manualMarks) {
		for (const i of allOccurrences(text, value)) {
			raw.push({
				start: i,
				end: i + value.length,
				value,
				type,
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
			if (rule.validate && !rule.validate(match[0])) continue;
			const check = rule.confirm?.(match[0]);

			// a variable-length lookbehind lets a hit start on the separator space;
			// trim both edges so a placeholder never eats its own padding
			let start = match.index;
			let end = match.index + (check?.length ?? match[0].length);
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

	return resolveOverlaps(raw, mutedValues);
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
	const counters: Partial<Record<TokenType, number>> = {};
	const byValue = new Map<string, Finding>();
	const findings: Finding[] = [];

	for (const span of live) {
		let finding = byValue.get(span.value);
		if (!finding) {
			const n = (counters[span.type] ?? 0) + 1;
			counters[span.type] = n;
			finding = findingFor(span, token(span.type, n));
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
