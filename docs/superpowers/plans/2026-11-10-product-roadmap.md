# Daily product roadmap: what to fix, what to build next

Written 2026-11-10 against `main` at `902e5b7`. It records a market and law review, the state of the
31 tools, and an ordered plan. It is meant to work without the conversation it came from.

## 1. Where Daily stands

| Area             | State on main                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tools            | 31 built, 0 planned: 14 Datenschutz, 11 KI, 4 Audit, 2 Entwickler. 10 marked `stable`, 21 `beta`.                                                 |
| Law base         | DSGVO, KI-VO, BDSG, TDDDG imported from Cellar and gesetze-im-internet. KI-VO includes Regulation (EU) 2026/1744 (Digital Omnibus on AI).         |
| Around the tools | News desk, notes, deadlines, reports (Tätigkeitsbericht, KI-Governance, Audit), clients (Mandanten), Keycloak login, browser-only public preview. |
| Quality          | 430 unit tests, 39 preview E2E. A code review of main plus a fuzz run over 28 engines found 8 bugs; all fixed in PR #21.                          |
| Not live         | The production server dai-ly.de is unreachable; only the GitHub Pages preview is public.                                                          |

What the review did **not** do: a line-by-line legal check of every question and outcome in all 31
tools. The checks so far were for code defects and for the 2026 law changes below. See phase 0.

## 2. What changed in the law in 2026 and whether Daily has it

| Change                                                                                                        | In Daily?                                                                                     |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Regulation (EU) 2026/1744, in force 27 Jul 2026: Annex III high-risk from 2 Dec 2027, Annex I from 2 Aug 2028 | Yes: one `DATES` table, used by five tools.                                                   |
| Art. 4 KI-VO reworded: take measures to support AI literacy, no guaranteed level                              | Yes in the law text and the KI-Kompetenz intro.                                               |
| New Art. 5 prohibition (nudifier, CSAM generation), transition to 2 Dec 2026                                  | Yes in the Risikoklassifizierung catalogue.                                                   |
| Art. 50 applies since 2 Aug 2026; marking grace for existing generative systems to 2 Dec 2026                 | Dates yes. **Missing:** the final Code of Practice on marking and labelling and the EU icons. |
| KI-MIG in force 29 Jul 2026: Bundesnetzagentur is market surveillance authority and complaint point           | **Missing:** no tool names the authority, e.g. Vorfallmeldung for Art. 73 reports.            |
| EDPB Guidelines 02/2026 (anonymisation) and 03/2026 (web scraping for AI), drafts of 7 Jul 2026               | **Missing** in Anonymisierer, Interessenabwägung and KI-DSGVO-Schnittstelle.                  |
| GDPR part of the Digital Omnibus (e.g. reported 96 h breach deadline): still a proposal                       | Correctly not applied. Needs a watch item, see phase 0.                                       |

Every row was taken from secondary sources on 2026-11-10 and must be checked against the Official
Journal or the authority's own page before a tool cites it.

## 3. What the market offers and where Daily differs

German suites (heyData, Proliance 360, DataGuard, caralegal, 2B Advice, Kertos, Secjur) sell one
platform for DSGVO, NIS2, ISO 27001 and the AI Act, usually with consulting, from about 89 € a
month. AI-governance products (Credo AI, Modulos, Holistic AI, Vanta, OneTrust) centre on an AI
inventory, policy packs per framework (AI Act, ISO 42001, NIST AI RMF) and audit evidence.

| Common in the market                                 | Daily                                    |
| ---------------------------------------------------- | ---------------------------------------- |
| VVT, DSFA, TOM, AVV, breach, data subject requests   | Built                                    |
| AI inventory, risk class, FRIA, ISO 42001 gap        | Built                                    |
| Audit programme, catalogue, findings, report         | Built; few suites have this for auditors |
| Vendor register with sub-processors and review dates | Only a single AVV check                  |
| Document generators (privacy notice, policies)       | Only the KI-Nutzungsrichtlinie           |
| Training content with test and certificate           | Only a record of training held           |
| Website and cookie scanner                           | Missing                                  |
| NIS2, ISO 27001, whistleblowing                      | Missing; out of scope for now            |
| Import, export, API, evidence files                  | DSFA Excel export and print only         |

Daily's edge is not breadth. It is that every result is deterministic, cites its article, and
prints. Suites hide the reasoning; Daily shows it. The plan keeps that and does not chase NIS2 or
ISO 27001 modules.

## 4. Plan

Order: trust first, then daily use, then new tools. Each tool stays one folder with a manifest,
definition, engine and spec.

### Phase 0: make the existing tools trustworthy (before any new tool)

1. **Legal review per tool.** A practising DSB or lawyer reads each tool's questions, outcomes and
   citations. The owner is not a data protection officer, so this cannot be done from the code.
   Track it in a table `docs/legal-review.md`: tool, reviewer, date, findings.
2. **Rechtsstand on every tool.** Add `reviewedAt` and `lawAsOf` to `ToolManifest` and print them
   on the tool page and in every result. A tool leaves `beta` only with a recorded review.
3. **Close the 2026 gaps from section 2.** Bundesnetzagentur in Vorfallmeldung and KI-Register;
   Code of Practice and EU icons in Transparenzpflichten; EDPB 02/2026 and 03/2026 as references.
4. **Law watch.** Build the staleness warning from `2026-10-15-law-maintenance.md`: a scheduled
   check for new consolidated versions, plus a manual watch list (GDPR Omnibus, final EDPB
   guidelines, Commission guidelines on Art. 6 and Art. 50).
5. **Deploy.** Bring dai-ly.de up so the logged-in features can be tried at all, and run the
   server E2E suite in CI (today CI only builds the image).

Done when: every tool shows its Rechtsstand, the review table has no open finding of severity
"wrong result", and CI runs lint, unit and E2E tests.

### Phase 1: make it usable every day

| Feature                          | Why                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| Export and import of all entries | Preview data lives in one browser. JSON backup and restore, CSV/Excel per register. |
| Start page "Heute"               | Deadlines due, open findings, new news for the user's laws, last tools: one screen. |
| Links between entries            | VVT → DSFA → TOM → AVV → Löschkonzept as one chain, with "missing link" hints.      |
| Sample data                      | One click fills a demo organisation so a visitor sees results in the preview.       |
| Evidence attachments (server)    | Auditors and DSBs need the document behind an entry.                                |

### Phase 2: new tools, Datenschutz

| Tool                          | Legal basis                                                           | Kind                           |
| ----------------------------- | --------------------------------------------------------------------- | ------------------------------ |
| Datenschutzhinweise-Generator | Art. 13, 14 DSGVO, filled from the VVT                                | Generator                      |
| Dienstleister-Register        | Art. 28, 30 DSGVO; sub-processors, review dates, links to AVV-Prüfung | Register                       |
| DSB-Benennungspflicht         | Art. 37 DSGVO, § 38 BDSG                                              | Questionnaire                  |
| Gemeinsame Verantwortlichkeit | Art. 26 DSGVO; controller, joint, processor                           | Questionnaire                  |
| Automatisierte Entscheidung   | Art. 22 DSGVO, CJEU C-634/21 (SCHUFA)                                 | Questionnaire                  |
| Bußgeldrahmen-Rechner         | Art. 83 DSGVO, EDPB Guidelines 04/2022                                | Calculator                     |
| Website- und Cookie-Check     | § 25 TDDDG, Art. 6, 7 DSGVO                                           | Checklist first, scanner later |
| Videoüberwachung              | § 4 BDSG, Art. 6 DSGVO, DSK guidance                                  | Questionnaire                  |

### Phase 3: new tools, KI

| Tool                          | Legal basis                                                             | Kind                              |
| ----------------------------- | ----------------------------------------------------------------------- | --------------------------------- |
| Kennzeichnungs-Assistent      | Art. 50 KI-VO, Code of Practice, EU icons                               | Questionnaire with label output   |
| GPAI-Pflichten                | Art. 53 to 55 KI-VO, GPAI Code of Practice                              | Checklist                         |
| Anbieterpflichten Hochrisiko  | Art. 16, 17 (QMS), 43 (conformity), 49 (registration), 72 (post-market) | Checklist                         |
| KI-Lieferantenprüfung         | Art. 25, 26 KI-VO, Art. 28 DSGVO                                        | Questionnaire per vendor          |
| Aufsichts- und Protokollplan  | Art. 14, 26 Abs. 2, 5, 6 KI-VO                                          | Record per system                 |
| Schatten-KI-Erhebung          | Art. 4, 26 KI-VO                                                        | Survey that feeds the KI-Register |
| NIST AI RMF and ISO 42001 SoA | ISO/IEC 42001 Annex A                                                   | Extends AIMS-Gap                  |

Build the Kennzeichnungs-Assistent first: Art. 50 applies now, the high-risk duties only from
December 2027.

### Phase 4: auditors

Sampling helper (ISO 19011), follow-up of corrective actions with deadlines, an ISO/IEC 27701
catalogue for the Prüfkatalog, and an audit pack that exports programme, findings and report as
one file.

### Later, only on demand

NIS2, ISO 27001, whistleblowing (HinSchG), Data Act, e-learning with tests, a public API. Each is
a product of its own; competitors already sell them.

## 5. Risks

- **Liability.** Tools give legal results. Keep "keine Rechtsberatung" visible and never mark a
  tool `stable` without a named review.
- **Staleness.** 2026 changed the AI Act twice and the GDPR may follow. Phase 0 item 4 is what
  keeps Daily from citing repealed dates.
- **Scope.** 31 tools already exceed what one person can keep reviewed. New tools in phases 2 and
  3 should not start before phase 0 is done.

## 6. Sources (retrieved 2026-11-10)

- Digital Omnibus on AI: <https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ%3AL_202601744>,
  <https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/>,
  <https://usercentrics.com/knowledge-hub/eu-ai-act-high-risk-delay-article-50-transparency-consent/>
- Art. 4: <https://lawandtechnology.eu/en/ai-literacy-digital-omnibus-article-4-ai-act/>
- Art. 50 Code of Practice: <https://www.twobirds.com/en/insights/2026/taking-the-eu-ai-act-to-practice-the-final-transparency-code-of-practice>,
  <https://digital-strategy.ec.europa.eu/en/faqs/signing-code-practice-transparency-ai-generated-content>
- KI-MIG: <https://www.bundesnetzagentur.de/SharedDocs/Pressemitteilungen/DE/2026/20260729_KI_VO.html>
- GDPR Omnibus status: <https://acompli.ie/news/digital-omnibus-gdpr-cookies-status-september-2026/>,
  <https://trueprivacy.io/blog/gdpr-digital-omnibus-council-mandate>
- EDPB 2026: <https://www.edpb.europa.eu/news/edpb-sheds-light-on-anonymisation-and-web-scraping-for-generative-ai-and-adopts-final-version_en>,
  <https://www.edpb.europa.eu/system/files/documents/2026-02/edpb_work-programme_2026-2027_en.pdf>
- Market: <https://omr.com/de/reviews/category/datenschutz-management>,
  <https://www.kovrr.com/blog-post/top-ai-governance-platforms-2026-comparison-guide>,
  <https://modulos.ai/modulos-vs-vanta>
