# Keeping Daily's law current

Written 2026-10-15. This file records how Daily gets its law texts and where legal rules live in the
code. It also says what to check when the law changes, and plans a feature that warns when Daily
falls behind. It is meant to work without the conversation it came from.

## 1. State on 15 Oct 2026 (verified)

| Law   | Source                                                   | Version in Daily                                                                  | Check                                               | Result                                                               |
| ----- | -------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| DSGVO | Cellar, consolidated `02016R0679-20160504` + OJ recitals | The only consolidated version; corrigenda C1–C3 (DE) and C1 (EN) in the articles  | SPARQL: all `02016R0679-*` versions; all corrigenda | Up to date. Recitals were **not** corrected before; fixed (see §3.3) |
| KI-VO | Cellar, consolidated `02024R1689-20260727` + OJ recitals | Includes Regulation (EU) 2026/1744 (Digital Omnibus on AI), corrigenda C1–C2 (DE) | Same                                                | Up to date. Recital 177 (DE) was not corrected before; fixed         |
| BDSG  | gesetze-im-internet.de `bdsg_2018/xml.zip`               | Last amended by Art. 3 G v. 12.5.2026; amendment of 3.7.2026 already in the text  | `standangabe` in the XML                            | Text up to date. The version line omitted the 3.7.2026 change; fixed |
| TDDDG | gesetze-im-internet.de `ttdsg/xml.zip`                   | Last amended by Art. 3 G v. 10.3.2026                                             | Same                                                | Up to date                                                           |

The KI-VO corrigenda R(02) to R(04) exist only in other languages and do not affect Daily. The
2026/1744 dates (Art. 113 n. F.) match the `DATES` table in
`src/lib/tools/risikoklassifizierung/engine.ts`. Art. 4 (AI literacy) is still an obligation of
providers and deployers. The Omnibus added that it does not require a specific level.

## 2. Import pipeline

Run `pnpm normen:import`. It writes `src/lib/normen/data/{dsgvo,ki-vo,bdsg,tdddg}.json`. Commit
those files: the app reads them at build time and does not fetch law texts at runtime.

### EU acts (DSGVO, KI-VO)

1. SPARQL (`https://publications.europa.eu/webapi/rdf/sparql`) lists every consolidated version
   `0YYYYRNNNN-YYYYMMDD`. The importer takes the newest version dated today or earlier.
   - Future-dated versions are skipped with a warning, because they are amendments that do not
     apply yet.
2. Articles, annexes and chapter titles come from that consolidated version, in DE and EN:
   - Request `https://publications.europa.eu/resource/celex/<CELEX>`.
   - Send `Accept: application/xhtml+xml` and `Accept-Language: deu|eng`.
3. Recitals come from the original Official Journal act (`3YYYYRNNNN`), because consolidated
   texts have no recitals.
4. Corrigenda: SPARQL `resource_legal_corrects_resource_legal` lists them (CELEX
   `3YYYYRNNNNR(nn)`). The importer then:
   - Fetches each corrigendum per language. A 404 means it does not exist in that language.
   - Parses the recital corrections ("Anstatt / muss es heißen", "for / read").
   - Applies them in `src/lib/normen/corrigenda.ts`, which has tests.
5. The version line on every Navigator page is generated from the data: consolidated date,
   amending acts, and "Berichtigungen eingearbeitet".

### German statutes (BDSG, TDDDG)

The importer reads the XML zip. The version line joins the `standangabe` entries of type `Stand`
(the last amendment) and `Hinweis` (newer amendments already in the text).

### Pitfalls

- EUR-Lex itself blocks automated requests (bot check). Always use Cellar.
- Brackets in CELEX numbers must be encoded: `R%2802%29`. Unencoded brackets give "not found".
- Corrigenda sometimes quote the surrounding text inexactly. DSGVO recital 50 is quoted as
  "dabei sind die …", but the text reads "insbesondere die …".
  - `locate()` trims unchanged words until the passage is unique, and logs a warning.
  - If a passage is not found in either its old or its new form, the import stops. Read the
    corrigendum and fix the parser rather than skipping it.
- `cheerio` in XML mode is case-sensitive: `DL`, `DT`, `DD`, `LA`.
- Tools turn written `\u…` escapes into literal characters (see the dev-environment memory). Check
  `clean()` in the importer after editing it.
- There is no official English text of BDSG or TDDDG. English pages show the German text with a
  notice.
- Legal basis for reuse:
  - EU texts: Commission Decision 2011/833/EU.
  - German statutes: § 5 UrhG (official works are not protected by copyright).

## 3. Where legal rules live

| What                                   | Where                                                                                                                                                                                                     | Changes when                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Law texts                              | `src/lib/normen/data/*.json` (import)                                                                                                                                                                     | Any amendment or corrigendum → re-import                                       |
| Recital corrections                    | Applied by the importer (`corrigenda.ts`)                                                                                                                                                                 | New corrigendum (picked up automatically)                                      |
| KI-VO application dates                | `DATES` in `src/lib/tools/risikoklassifizierung/engine.ts` (also used by betreiberpflichten, technische-dokumentation, transparenzpflichten, grundrechte-folgenabschaetzung, vorfallmeldung, ki-register) | Art. 113 / Art. 111 amended (e.g. a further Omnibus or a "stop the clock" act) |
| Questionnaire logic                    | `src/lib/tools/<slug>/engine.ts` + `catalog.json` (questions, `sources`, `version`)                                                                                                                       | Article content, guidelines (EDPB, DSK, AI Office), case law                   |
| Register/workflow fields and deadlines | `src/lib/tools/<slug>/definition.ts` + `engine.ts`                                                                                                                                                        | Deadlines or mandatory contents change                                         |
| Deadline maths                         | `src/lib/records/deadlines.ts` (`addHours`, `monthsAfterDay`, German time)                                                                                                                                | Rarely; covered by the DST tests                                               |
| Citations → Navigator links            | `cites` in each `tool.ts`, `sources` in catalogs, `cite` in deadlines; `src/lib/normen/cite.ts`                                                                                                           | Article renumbering (e.g. inserted Art. 5 Abs. 1a KI-VO)                       |
| News feed sources and tagging          | `src/lib/server/feed/sources.ts`, keyword rules                                                                                                                                                           | Authorities move feeds; new authorities or topics                              |
| Legal pages                            | `src/routes/impressum`, `src/routes/datenschutz`                                                                                                                                                          | Hosting, processors, cookies, DDG changes                                      |

### Statutory deadlines in the tools

| Tool                            | Deadline (kind)                                             | Rule in code                                           | Legal basis                          |
| ------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------ |
| Datenpanne                      | `meldung-aufsicht`                                          | Awareness + 72h while risk ≠ none and not reported     | Art. 33(1) DSGVO                     |
| Datenpanne                      | `benachrichtigung`                                          | High risk, no Art. 34(3) exception → without delay     | Art. 34 DSGVO                        |
| Betroffenenanfrage              | `antwort`, `verlaengerung`                                  | Receipt + 1 month, extension to 3 months               | Art. 12(3) DSGVO                     |
| DSFA                            | `stellungnahme`, `ueberpruefung`                            | Consultation + 8 weeks; review date                    | Art. 36(2), Art. 35(11) DSGVO        |
| Vorfallmeldung                  | `anbieter`, `meldung`                                       | Provider: awareness + 24h; authority: 15 / 10 / 2 days | Art. 26(5), Art. 73 KI-VO            |
| Grundrechte-Folgenabschätzung   | `erste-verwendung`, `ueberpruefung`                         | Before first use; review                               | Art. 27(1), (2) KI-VO                |
| AVV, VVT, TOM, KI-Register      | `wiedervorlage`                                             | Review date at 09:00 German time                       | Art. 28, 30, 32 DSGVO; Art. 26 KI-VO |
| Löschkonzept                    | `loeschlauf`                                                | Deletion run per category                              | Art. 5(1)(e), 17 DSGVO               |
| Schulungsnachweis, KI-Kompetenz | `wiederholung`, `auffrischung`                              | Date + interval                                        | Art. 39(1)(b) DSGVO; Art. 4 KI-VO    |
| Auditprogramm, Feststellungen   | `audit`, `bericht`, `naechstes`, `massnahme`, `wirksamkeit` | Programme dates, report one month after the audit      | ISO 19011 practice (not law)         |

## 4. Known legal changes to watch (as of Oct 2026)

Re-check each item against the Official Journal when it happens. Do not rely on this list alone.

- **KI-VO, 2 Dec 2026:** the new prohibitions apply (Art. 5(1) first subparagraph points (ba) and
  (bb), Art. 5(1a), (1b)). Art. 50(2) labelling also applies then to systems that were already on
  the market.
  - Code: `DATES.prohibitedNcii` and `DATES.transparencyExisting`. Wording such as "ab dem" turns
    into "seit dem" after that date. Review the transparenzpflichten texts.
- **KI-VO, 2 Dec 2027 / 2 Aug 2028:** high-risk obligations under Annex III and Annex I.
  - Tools: betreiberpflichten, technische-dokumentation, FRIA and vorfallmeldung only say "from …"
    today.
  - Once the dates pass, re-word the tools and consider making the duties hard defects.
- **KI-VO implementing acts and guidelines:**
  - Art. 6 high-risk guidelines.
  - The Art. 27 FRIA template from the AI Office: the tool should align with it once published.
  - Harmonised standards (CEN-CENELEC JTC 21) and codes of practice for Art. 50.
  - These change questions and notes, not texts.
- **DSGVO:**
  - Digital Omnibus proposals on the GDPR (definition of personal data, Art. 9, Art. 33
    thresholds). If adopted, a new consolidated version appears. The 72h rule and the
    "risk ≠ none" threshold in `datenpanne/engine.ts` may change.
  - The GDPR procedural regulation (cross-border enforcement) is a separate act and does not
    amend the text.
- **BDSG:** coalition plans to centralise supervision or change § 26 (employee data; see EuGH
  C‑34/21, which already limits § 26 Abs. 1). Watch the `Hinweis` entries.
- **TDDDG:** consent management (§ 26 TDDDG, Einwilligungsverwaltungsverordnung). The
  einwilligung-check tool cites § 25.
- **Case law:** EuGH rulings change interpretation, not text.
  - Recent examples: C‑340/21 (non-material damage), C‑807/21 (fines against companies),
    C‑203/22 (explanation of automated decisions).
  - These belong in engine notes and citations, not in the import.

## 5. Routine (until the feature below exists)

Monthly, and whenever the news feed shows a new act:

1. `pnpm normen:import`, then `git diff --stat src/lib/normen/data`.
   - Only `retrieved` changed: nothing to do. Do not commit a date-only change.
   - Text changed: read the diff per provision and decide which tools are affected (see §3).
   - "future versions not imported" warning: an amendment is coming. Note its date in §4.
2. Search the code for the provisions that changed:
   `grep -rn "Art. 33" src/lib/tools`, plus the `cites` of the tools listed under that provision
   in the Navigator ("Zitiert in den Werkzeugen").
3. Change engine, catalog, definition and tests together. Raise the catalog `version` when
   questions or their meaning change: stored runs keep the version they were made with.
4. `pnpm check && pnpm lint && pnpm vitest run --project server`, preview E2E, then commit as
   `feat(normen): …` or `fix(<tool>): …`.

## 6. Feature plan: Rechtsstand-Monitor

Goal: Daily notices by itself when a law or a date in its rules is out of date, and tells the
maintainer which tools to review. Nothing changes automatically: legal content always gets a human
review.

### 6.1 `pnpm normen:check` (CI, read-only)

- Reuse the importer's discovery functions: newest consolidated version, corrigenda list,
  `standangabe`, gesetze-im-internet `builddate`. Compare them with the committed JSON.
  - Store the needed keys in the JSON: `consolidated`, `corrigenda[]`, `builddate`, `stand[]`.
- Report as JSON and text:
  - "DSGVO: new consolidated version 02016R0679-2027xxxx"
  - "BDSG: new Hinweis …"
  - "KI-VO: future version 2027-08-02 announced"
- Exit code 1 when the version in force changed; 0 with a notice when only a future version
  appeared.
- Tests: fixtures of SPARQL and XML responses, no network.

### 6.2 Scheduled GitHub Action

- `.github/workflows/rechtsstand.yml`: weekly cron, plus manual dispatch.
- Runs `normen:check`. On a change, it opens or updates one issue `Rechtsstand: <law>` with the
  report.
- Optional: a second job runs `normen:import` and opens a pull request with the data diff. The
  pull request is never merged automatically.

### 6.3 Impact list per change

- Diff old and new JSON per provision (`art-33`, `p-26`, …) and map each changed provision to:
  - tools via `citationIndex` (`src/lib/normen/usage.ts`)
  - record deadlines via their `cite`
- Put "Betroffene Werkzeuge" into the issue or pull request body, so the review starts at the
  right engine.

### 6.4 Date watch

- `DATES` gets an `asOf` check: a unit test fails when a date in `DATES` has passed and the tool
  texts still say "ab dem" or "from".
- An annual reminder issue reviews all `stable` tools. The tool manifests already carry status and
  version.

### 6.5 In the app

- A Navigator banner when the law data is older than 60 days or a newer version is known: "Neue
  Fassung vom … verfügbar, noch nicht eingepflegt."
- Each tool page shows `Rechtsstand: <date of the consolidated version>`.
- Each saved run keeps the catalog version and the law version it was made with. Reports can then
  show what an assessment was based on (Art. 5(2) accountability).

### 6.6 Later

- More sources:
  - EDPB guidelines (RSS)
  - DSK Kurzpapiere
  - EuGH cases (CURIA) linked to provisions
  - AI Office templates
- Recital → article mapping: there is no official mapping, so it would be built by hand. Low
  priority.

### Slices

1. Store version keys in the JSON + `normen:check` with tests.
2. Weekly workflow opening an issue.
3. Impact list from the provision diff.
4. Date watch test.
5. App banners and the law version on runs (migration: `tool_runs.law_version`).
