import { count } from '../checklist.js';
import type { Localized, QuestionnaireResult, Reason } from '../types.js';
import { CATEGORY, summarise, type Category, type Finding } from './scan.js';

const L = (de: string, en: string): Localized => ({ de, en });
const ORDER: Category[] = ['geheimnis', 'personenbezug', 'ki', 'tracking'];

/** the scan as a verdict: secrets first, then personal data, AI services and trackers */
export function toResult(findings: Finding[], files: number): QuestionnaireResult {
	const counts = summarise(findings);
	const present = ORDER.filter((c) => counts[c] > 0);
	const scanned = count(files, L('Datei', 'file'), L('Dateien', 'files'));
	const reasons: Reason[] = present.map((c) => ({
		questionId: c,
		text: L(`${CATEGORY[c].label.de}: ${counts[c]}`, `${CATEGORY[c].label.en}: ${counts[c]}`)
	}));
	const base = {
		reasons,
		notes: present.map((c) => CATEGORY[c].remedy),
		citations: [
			{ law: 'DSGVO' as const, ref: 'Art. 25' },
			{ law: 'DSGVO' as const, ref: 'Art. 32' }
		]
	};

	if (counts.geheimnis > 0) {
		return {
			...base,
			verdict: 'positive',
			outcome: 'geheimnisse',
			headline: L('Geheimnisse im Code gefunden.', 'Secrets found in the code.'),
			explanation: L(
				`${scanned.de} geprüft. Zugangsdaten im Code sind wie veröffentlicht zu behandeln: sofort sperren und ersetzen.`,
				`${scanned.en} checked. Credentials in code must be treated as published: revoke and replace them at once.`
			)
		};
	}
	if (present.length > 0) {
		return {
			...base,
			verdict: 'conditional',
			outcome: 'pruefen',
			headline: L('Befunde zur Prüfung durch den DSB.', 'Findings for the DPO to review.'),
			explanation: L(
				`${scanned.de} geprüft. Die Muster sind Hinweise, keine Gewissheit; jeden Befund im Zusammenhang bewerten.`,
				`${scanned.en} checked. The patterns are indications, not certainty; assess each finding in context.`
			)
		};
	}
	return {
		...base,
		verdict: 'negative',
		outcome: 'unauffaellig',
		headline: L('Keine Befunde.', 'No findings.'),
		explanation: L(
			`${scanned.de} geprüft, keine der Regeln hat angeschlagen. Das ersetzt keine Prüfung der Datenflüsse zur Laufzeit.`,
			`${scanned.en} checked; none of the rules matched. This does not replace a review of data flows at run time.`
		)
	};
}

/** findings as German-Excel CSV (semicolons, BOM); excerpts are already masked */
export function findingsCsv(findings: Finding[], locale: string): string {
	const pick = (l: Localized) => (locale === 'en' ? l.en : l.de);
	const cell = (v: string) => (/[;"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
	const header =
		locale === 'en'
			? ['Category', 'Rule', 'File', 'Line', 'Excerpt']
			: ['Kategorie', 'Regel', 'Datei', 'Zeile', 'Auszug'];
	const rows = findings.map((f) => [
		pick(CATEGORY[f.rule.category].label),
		pick(f.rule.label),
		f.path,
		String(f.line),
		f.excerpt
	]);
	return '\uFEFF' + [header, ...rows].map((r) => r.map(cell).join(';')).join('\r\n');
}
