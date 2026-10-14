import type { LegalBasis, Localized } from '../types.js';

const L = (de: string, en: string): Localized => ({ de, en });

export type Category = 'geheimnis' | 'personenbezug' | 'ki' | 'tracking';

export type Rule = {
	id: string;
	category: Category;
	label: Localized;
	pattern: RegExp;
	/** Further check on a match, e.g. a checksum, to cut false positives. */
	valid?: (match: string) => boolean;
	/** Secrets are shown masked. */
	mask?: boolean;
	cite: LegalBasis;
};

export type SourceFile = { path: string; content: string };

export type Finding = {
	rule: Rule;
	path: string;
	line: number;
	excerpt: string;
};

/** IBAN checksum (ISO 13616, mod 97). */
export function validIban(raw: string): boolean {
	const iban = raw.replace(/\s/g, '').toUpperCase();
	if (iban.length < 15 || iban.length > 34) return false;
	const digits = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (c) =>
		String(c.charCodeAt(0) - 55)
	);
	let rest = 0;
	for (const d of digits) rest = (rest * 10 + Number(d)) % 97;
	return rest === 1;
}

/** Card number checksum (Luhn) for 13 to 19 digits. */
export function validCard(raw: string): boolean {
	const digits = raw.replace(/[ -]/g, '');
	if (!/^\d{13,19}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;
	let sum = 0;
	for (let i = 0; i < digits.length; i++) {
		let d = Number(digits[digits.length - 1 - i]);
		if (i % 2 === 1) {
			d *= 2;
			if (d > 9) d -= 9;
		}
		sum += d;
	}
	return sum % 10 === 0;
}

const PLACEHOLDER =
	/(changeme|example|your[-_]|xxx|<|\$\{|process\.env|import\.meta|dummy|placeholder|test)/i;
const EXAMPLE_MAIL = /@(example\.(com|org|net)|[\w-]+\.(test|invalid|local|localhost|example))$/i;

const ART32: LegalBasis = { law: 'DSGVO', ref: 'Art. 32 Abs. 1' };
const ART25: LegalBasis = { law: 'DSGVO', ref: 'Art. 25' };
const ART28: LegalBasis = { law: 'DSGVO', ref: 'Art. 28, 44' };
const TDDDG: LegalBasis = { law: 'TDDDG', ref: '§ 25' };

export const RULES: Rule[] = [
	{
		id: 'private-key',
		category: 'geheimnis',
		label: L('Privater Schlüssel', 'Private key'),
		pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g,
		mask: true,
		cite: ART32
	},
	{
		id: 'aws-key',
		category: 'geheimnis',
		label: L('AWS-Zugangsschlüssel', 'AWS access key'),
		pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
		mask: true,
		cite: ART32
	},
	{
		id: 'github-token',
		category: 'geheimnis',
		label: L('GitHub-Token', 'GitHub token'),
		pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g,
		mask: true,
		cite: ART32
	},
	{
		id: 'slack-token',
		category: 'geheimnis',
		label: L('Slack-Token', 'Slack token'),
		pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g,
		mask: true,
		cite: ART32
	},
	{
		id: 'stripe-key',
		category: 'geheimnis',
		label: L('Stripe-Schlüssel (live)', 'Stripe key (live)'),
		pattern: /\b[rs]k_live_[A-Za-z0-9]{16,}\b/g,
		mask: true,
		cite: ART32
	},
	{
		id: 'google-key',
		category: 'geheimnis',
		label: L('Google-API-Schlüssel', 'Google API key'),
		pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
		mask: true,
		cite: ART32
	},
	{
		id: 'anthropic-key',
		category: 'geheimnis',
		label: L('Anthropic-API-Schlüssel', 'Anthropic API key'),
		pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}/g,
		mask: true,
		cite: ART32
	},
	{
		id: 'openai-key',
		category: 'geheimnis',
		label: L('OpenAI-API-Schlüssel', 'OpenAI API key'),
		pattern: /\bsk-(?:proj-)?(?!ant-)[A-Za-z0-9_-]{32,}/g,
		mask: true,
		cite: ART32
	},
	{
		id: 'assigned-secret',
		category: 'geheimnis',
		label: L('Passwort oder Schlüssel im Code', 'Password or key in code'),
		pattern:
			/\b(?:api[_-]?key|secret|passw(?:or)?d|pwd|token|client[_-]?secret)["']?\s*[:=]\s*["']([^"'\s]{8,})["']/gi,
		valid: (match) => !PLACEHOLDER.test(match),
		mask: true,
		cite: ART32
	},
	{
		id: 'email',
		category: 'personenbezug',
		label: L('E-Mail-Adresse', 'Email address'),
		pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
		valid: (match) =>
			!EXAMPLE_MAIL.test(match) &&
			!/^(noreply|no-reply|info|kontakt|contact|support)@/i.test(match),
		cite: ART25
	},
	{
		id: 'iban',
		category: 'personenbezug',
		label: L('IBAN', 'IBAN'),
		pattern: /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){3,7}(?: ?[A-Z0-9]{1,4})?\b/g,
		valid: validIban,
		mask: true,
		cite: ART25
	},
	{
		id: 'card',
		category: 'personenbezug',
		label: L('Kartennummer', 'Card number'),
		pattern: /\b(?:\d[ -]?){12,18}\d\b/g,
		valid: validCard,
		mask: true,
		cite: ART25
	},
	{
		id: 'phone',
		category: 'personenbezug',
		label: L('Telefonnummer (DE)', 'Phone number (DE)'),
		pattern: /(?:\+49|\b0049)[ -]?\(?\d{2,5}\)?[ /-]?\d{3,8}(?:[ -]?\d{1,5})?\b/g,
		cite: ART25
	},
	{
		id: 'ai-endpoint',
		category: 'ki',
		label: L('Aufruf eines externen KI-Dienstes', 'Call to an external AI service'),
		pattern:
			/\b(?:api\.openai\.com|[\w-]+\.openai\.azure\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com|[\w-]*aiplatform\.googleapis\.com|api\.mistral\.ai|api\.cohere\.(?:ai|com)|api-inference\.huggingface\.co|api\.deepseek\.com|api\.groq\.com|api\.perplexity\.ai)\b/g,
		cite: ART28
	},
	{
		id: 'ai-sdk',
		category: 'ki',
		label: L('SDK eines KI-Dienstes', 'AI service SDK'),
		pattern:
			/(?:from\s+["'](?:openai|@anthropic-ai\/sdk|@google\/generative-ai|@google\/genai|@mistralai\/mistralai|cohere-ai|@langchain\/[\w-]+|langchain)["']|require\(["'](?:openai|@anthropic-ai\/sdk|@google\/generative-ai)["']\)|^\s*(?:import|from)\s+(?:openai|anthropic|google\.generativeai|mistralai|cohere|langchain)\b)/gm,
		cite: ART28
	},
	{
		id: 'tracker',
		category: 'tracking',
		label: L('Tracking- oder Analysedienst', 'Tracking or analytics service'),
		pattern:
			/\b(?:google-analytics\.com|googletagmanager\.com|connect\.facebook\.net|static\.hotjar\.com|[\w-]+\.clarity\.ms|snap\.licdn\.com|analytics\.tiktok\.com)\b/g,
		cite: TDDDG
	}
];

export const CATEGORY: Record<Category, { label: Localized; remedy: Localized }> = {
	geheimnis: {
		label: L('Geheimnisse', 'Secrets'),
		remedy: L(
			'Geheimnisse aus dem Code und der Versionsgeschichte entfernen, die betroffenen Schlüssel sofort sperren und neu erzeugen, künftig über Umgebungsvariablen oder einen Secret-Store laden (Art. 32 DSGVO).',
			'Remove secrets from the code and the version history, revoke and rotate the affected keys at once, and load them from environment variables or a secret store in future (Art. 32 GDPR).'
		)
	},
	personenbezug: {
		label: L('Personenbezogene Daten', 'Personal data'),
		remedy: L(
			'Echte personenbezogene Daten gehören nicht in Quellcode, Tests oder Beispieldaten; durch synthetische Werte ersetzen (Datenschutz durch Technikgestaltung, Art. 25 DSGVO).',
			'Real personal data does not belong in source code, tests or sample data; replace it with synthetic values (data protection by design, Art. 25 GDPR).'
		)
	},
	ki: {
		label: L('Externe KI-Dienste', 'External AI services'),
		remedy: L(
			'Klären, welche Daten an den Dienst gehen: Auftragsverarbeitungsvertrag (Art. 28), Drittlandgrundlage (Art. 44 ff.), Ausschluss der Nutzung zum Training und Eintrag im KI-Register.',
			'Clarify which data goes to the service: processing agreement (Art. 28), third-country basis (Art. 44 et seq.), exclusion of training use, and an entry in the AI register.'
		)
	},
	tracking: {
		label: L('Tracking', 'Tracking'),
		remedy: L(
			'Tracking und Analyse auf Endgeräten nur mit Einwilligung laden (§ 25 TDDDG); die Einwilligungsprüfung klärt die Anforderungen.',
			'Load tracking and analytics on devices only with consent (§ 25 TDDDG); the consent check clarifies the requirements.'
		)
	}
};

const IGNORED_DIRS =
	/(^|\/)(node_modules|\.git|dist|build|\.svelte-kit|vendor|coverage|\.next|target)\//;
const IGNORED_FILES =
	/(\.(png|jpe?g|gif|webp|ico|svg|pdf|zip|gz|woff2?|ttf|mp4|mp3|lock)|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/i;
export const MAX_BYTES = 1_000_000;

/** Whether a file is worth scanning: no dependencies, builds, binaries or lock files. */
export function scannable(path: string, size: number): boolean {
	const normalised = path.replace(/\\/g, '/');
	return size <= MAX_BYTES && !IGNORED_DIRS.test(normalised) && !IGNORED_FILES.test(normalised);
}

function maskValue(value: string): string {
	return value.length <= 6 ? '••••' : `${value.slice(0, 4)}…${'•'.repeat(4)}`;
}

/** Every rule on every line; secrets and financial numbers are masked in the excerpt. */
export function scan(files: SourceFile[]): Finding[] {
	const findings: Finding[] = [];
	for (const file of files) {
		const lines = file.content.split(/\r?\n/);
		lines.forEach((text, index) => {
			for (const rule of RULES) {
				rule.pattern.lastIndex = 0;
				for (const match of text.matchAll(rule.pattern)) {
					if (rule.valid && !rule.valid(match[0])) continue;
					const value = match[1] ?? match[0];
					const excerpt = rule.mask ? text.replace(value, maskValue(value)) : text;
					findings.push({
						rule,
						path: file.path,
						line: index + 1,
						excerpt: excerpt.trim().slice(0, 160)
					});
				}
			}
		});
	}
	return findings;
}

/** Counts per category, in the order of severity. */
export function summarise(findings: Finding[]): Record<Category, number> {
	const counts: Record<Category, number> = { geheimnis: 0, personenbezug: 0, ki: 0, tracking: 0 };
	for (const f of findings) counts[f.rule.category]++;
	return counts;
}
