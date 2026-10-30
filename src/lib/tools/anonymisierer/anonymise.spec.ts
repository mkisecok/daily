import { describe, expect, it } from 'vitest';
import { buildRun, detect } from './detect.js';
import { kindOf } from './ingest/index.js';
import { restoreFrom } from './restore.js';
import { RULE_KEYS } from './rules.js';
import type { RuleKey, TokenType } from './types.js';

const ALL = new Set<RuleKey>(RULE_KEYS);
const NONE = new Map<string, TokenType>();
const UNMUTED = new Set<string>();

const values = (text: string, rules: ReadonlySet<RuleKey> = ALL) =>
	detect(text, rules, NONE, UNMUTED).map((span) => span.value);
const only = (key: RuleKey) => new Set<RuleKey>([key]);

describe('street and name patterns', () => {
	it('keeps umlauts in a street name', () => {
		expect(values('Sie wohnt in der Müllerstraße 5 in Köln.', only('address'))).toEqual([
			'Müllerstraße 5'
		]);
		expect(values('Lieferung an Bahnhofstr. 12a', only('address'))).toEqual(['Bahnhofstr. 12a']);
		expect(values('Büro: Berliner Allee 7', only('address'))).toEqual(['Berliner Allee 7']);
	});

	it('does not take an ordinary word for a street', () => {
		expect(values('Er landete auf Platz 3 und bring 2 Kopien mit.', only('address'))).toEqual([]);
	});

	it('keeps umlauts and hyphenated surnames in names', () => {
		expect(values('Termin mit Frau Müller-Lüdenscheidt am Montag', only('name'))).toEqual([
			'Müller-Lüdenscheidt'
		]);
		expect(values('Patient: Jörg Öztürk', only('name'))).toEqual(['Jörg Öztürk']);
		expect(values('Anna Schäfer-Groß kommt später.', only('name'))).toEqual(['Anna Schäfer-Groß']);
	});

	it('does not split a name in the middle of a word', () => {
		expect(values('Herr Müllerß', only('name'))).toEqual(['Müllerß']);
		expect(values('Dr. Zoë Aßmann', only('name'))).toEqual(['Zoë Aßmann']);
	});
});

describe('labelled values', () => {
	it('keeps the label out of the value', () => {
		const text =
			'geb. 03.04.1981, Versichertennummer: A123456789\n' +
			'Diagnose: Asthma bronchiale\nKonfession: evangelisch\nParteimitglied: Grüne';
		expect(
			values(text, new Set<RuleKey>(['date', 'insurance', 'health', 'religion', 'political']))
		).toEqual(['03.04.1981', 'A123456789', 'Asthma bronchiale', 'evangelisch', 'Grüne']);
	});

	it('finds a condition named without a label', () => {
		expect(values('Er leidet an Migräne.', only('health'))).toEqual(['Migräne']);
	});

	it('finds names after a title, a label and a first name, back to back', () => {
		expect(
			values('(Herr Weber, Frau Schmidt) Patientin: Dr. Lena Vogel; Anna Krüger', only('name'))
		).toEqual(['Weber', 'Schmidt', 'Lena Vogel', 'Anna Krüger']);
	});
});

describe('sexual orientation rule', () => {
	it('ignores words that only begin with "trans"', () => {
		const text =
			'Der Transport ist bezahlt, die Transfer-Gebühr fällt weg, alles bleibt transparent.';
		expect(values(text, only('sexual'))).toEqual([]);
	});

	it('still finds trans and transgender', () => {
		expect(values('Die Person ist trans.', only('sexual'))).toEqual(['trans.']);
		expect(values('Angabe: transgender', only('sexual'))).toEqual(['transgender']);
		expect(values('Er ist homosexuell', only('sexual'))).toEqual(['homosexuell']);
	});
});

describe('IBAN rule', () => {
	it('finds IBANs with letters after the check digits', () => {
		expect(values('Konto NL91 ABNA 0417 1643 00 bitte', only('iban'))).toEqual([
			'NL91 ABNA 0417 1643 00'
		]);
		expect(values('Konto GB29NWBK60161331926819.', only('iban'))).toEqual([
			'GB29NWBK60161331926819'
		]);
	});

	it('does not start inside a word', () => {
		expect(values('XDE89370400440532013000', only('iban'))).toEqual([]);
	});

	it('cuts a run-on word off when the checksum then passes', () => {
		const [span] = detect('DE89 3704 0044 0532 0130 00 BIC COBADEFF', only('iban'), NONE, UNMUTED);
		expect(span?.value).toBe('DE89 3704 0044 0532 0130 00');
		expect(span?.confident).toBe(true);
	});

	it('keeps an IBAN with a wrong checksum, marked as unconfirmed', () => {
		const spans = detect('IBAN: DE12 3456 7890 1234 5678 90', only('iban'), NONE, UNMUTED);
		expect(spans.map((span) => span.value)).toEqual(['DE12 3456 7890 1234 5678 90']);
		expect(spans[0]?.confident).toBe(false);
		const run = buildRun('IBAN: DE12 3456 7890 1234 5678 90', spans);
		expect(run.text).toBe('IBAN: «NUMBER_1»');
		expect(run.findings[0]?.confident).toBe(false);
	});
});

describe('restore', () => {
	const mapping = { 'Max Weber': { replacement: '«NAME_1»', type: 'NAME' as const } };

	it('does not report bracketed references in the reply as leftover tokens', () => {
		const result = restoreFrom('Siehe [Seite 3] und [Abschnitt 2]: «NAME_1» zahlt.', mapping);
		expect(result.text).toBe('Siehe [Seite 3] und [Abschnitt 2]: Max Weber zahlt.');
		expect(result.leftover).toEqual([]);
	});

	it('reports invented and mangled tokens', () => {
		const result = restoreFrom('«NAME_2» und [EMAIL 4] und «FOO_1»', mapping);
		expect(result.leftover).toEqual(['«NAME_2»', '[EMAIL 4]', '«FOO_1»']);
	});

	it('accepts reformatted tokens', () => {
		const result = restoreFrom('[name 1], «Name_1», [[NAME_1]]', mapping);
		expect(result.text).toBe('Max Weber, Max Weber, Max Weber');
		expect(result.count).toBe(3);
	});

	it('does not let NAME_1 take the front of NAME_10', () => {
		const many = Object.fromEntries(
			Array.from({ length: 10 }, (_, i) => [
				`Person ${i + 1}`,
				{ replacement: `«NAME_${i + 1}»`, type: 'NAME' as const }
			])
		);
		expect(restoreFrom('«NAME_10» und «NAME_1»', many).text).toBe('Person 10 und Person 1');
	});
});

describe('detect → buildRun → restore', () => {
	const text = [
		'Patient: Max Mustermann, geb. 12.03.1985',
		'E-Mail: max.mustermann@example.de, Tel. +49 151 23456789',
		'Anschrift: Hauptstraße 12, IBAN DE89 3704 0044 0532 0130 00',
		'Diagnose: Diabetes mellitus Typ 2',
		'Max Mustermann bittet um Rückruf an max.mustermann@example.de.'
	].join('\n');

	it('round-trips every value', () => {
		const run = buildRun(text, detect(text, ALL, NONE, UNMUTED));
		for (const original of Object.keys(run.mapping)) expect(run.text).not.toContain(original);
		expect(restoreFrom(run.text, run.mapping)).toEqual({
			text,
			count: 9,
			leftover: [],
			total: 7
		});
	});

	it('gives a repeated value the same token', () => {
		const run = buildRun(text, detect(text, ALL, NONE, UNMUTED));
		expect(run.mapping['Max Mustermann']?.replacement).toBe('«NAME_1»');
		expect(run.text.match(/«NAME_1»/g)).toHaveLength(2);
		expect(run.text.match(/«EMAIL_1»/g)).toHaveLength(2);
		expect(run.findings.find((f) => f.original === 'Max Mustermann')?.spanIds).toHaveLength(2);
	});

	it('replaces by offset, so "Jan" leaves "Januar" alone', () => {
		const marks = new Map<string, TokenType>([['Jan', 'NAME']]);
		const input = 'Jan kommt im Januar.';
		const spans = detect(input, new Set(), marks, UNMUTED);
		expect(spans).toHaveLength(1);
		expect(buildRun(input, spans).text).toBe('«NAME_1» kommt im Januar.');
	});

	it('sends a switched-off value in the clear and keeps its row', () => {
		const muted = new Set(['Max Mustermann']);
		const run = buildRun(text, detect(text, ALL, NONE, muted));
		expect(run.text).toContain('Max Mustermann');
		expect(run.mapping['Max Mustermann']).toBeUndefined();
		expect(run.muted.map((f) => f.original)).toEqual(['Max Mustermann']);
	});
});

describe('overlap priority', () => {
	it('lets an IBAN win over a passport number inside it', () => {
		const spans = detect('DE89 3704 0044 0532 0130 00', ALL, NONE, UNMUTED);
		expect(spans.map((span) => span.ruleKey)).toEqual(['iban']);
	});

	it('lets a manual mark win over every detector', () => {
		const marks = new Map<string, TokenType>([['max.mustermann@example.de', 'CUSTOM']]);
		const spans = detect('max.mustermann@example.de', ALL, marks, UNMUTED);
		expect(spans).toHaveLength(1);
		expect(spans[0]).toMatchObject({ manual: true, type: 'CUSTOM' });
	});

	it('changes a category by marking the value by hand', () => {
		const marks = new Map<string, TokenType>([['Diabetes', 'CUSTOM']]);
		const run = buildRun('Diabetes', detect('Diabetes', ALL, marks, UNMUTED));
		expect(run.text).toBe('«CUSTOM_1»');
	});

	it('keeps the leftmost of two overlapping hits of one rule', () => {
		const spans = detect('Herr Max Weber', only('name'), NONE, UNMUTED);
		expect(spans.map((span) => span.value)).toEqual(['Max Weber']);
	});
});

describe('file kinds', () => {
	it('reads by extension first, then MIME', () => {
		expect(kindOf({ name: 'akte.PDF', type: '' })).toBe('pdf');
		expect(kindOf({ name: 'brief.docx', type: 'application/octet-stream' })).toBe('docx');
		expect(kindOf({ name: 'liste.csv', type: '' })).toBe('text');
		expect(kindOf({ name: 'notiz', type: 'text/plain' })).toBe('text');
		expect(kindOf({ name: 'scan.png', type: 'image/png' })).toBeNull();
		expect(kindOf({ name: 'alt.doc', type: '' })).toBeNull();
	});
});
