# Daily — Data · AI · Law · Yield

## Business project plan: a growing tool platform for DSB, KI‑Beauftragte and Auditoren, from empty folder to dai-ly.de

Plan written 2026‑10‑13. Decisions in §1 confirmed by the user in this session. Vision in §0 restated after the user's clarification.

**Status 2026‑10‑14:** every tool in §3.2–3.5 is built and live in the public preview; what was built, how it deviates from this plan and what is still open is in **§9**. The records framework behind the register and workflow tools is specified in [`2026-10-14-records-design.md`](2026-10-14-records-design.md).

---

## 0. Vision and context

**Daily is a professional assistant for people who do data‑protection and AI‑governance work every day**: Datenschutzbeauftragte (internal and external), Datenschutz‑Auditoren, KI‑Beauftragte / AI Officers, KI‑Auditoren, and compliance staff in Germany and the EU. It gives them, in one place:

1. a **daily reading desk** (news from EU and German authorities, courts and legislators, tagged by regulation),
2. a **daily notebook** tied to that news and to their own work items,
3. a **growing catalogue of working tools** – each one solving one concrete duty from the DSGVO or the KI‑VO (AI Act) – that the user adds to as the course and practice reveal needs.

The platform is built so that **adding a tool is a routine operation** (one folder, one manifest, one migration), not a redesign. The public tool catalogue shows what exists, what is in beta, and what is planned, which makes the platform's growth visible to users and to recruiters. The portfolio effect ("a solution‑oriented developer who understands this field") follows from the product being useful; it is not a separate goal.

**Correction of the Gemini plan.** Gemini positioned D.A.I.L.Y as Compliance‑as‑a‑Service for DevOps teams with four agentic tools and a Next.js/FastAPI/LangChain stack. This plan keeps what was right (Live Regulatory Feed, DSFA generator, AI model registry, course‑aligned roadmap) and changes:

| Gemini                                       | This plan                                                                                                                       | Why                                                                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Users: DevOps teams                          | Users: DSB, KI‑Beauftragte, Auditoren, Compliance                                                                               | The duties these roles have daily are well defined by law (Art. 39 DSGVO, Art. 26/27 KI‑VO); tooling them is concrete. Developer tooling becomes one category inside the catalogue. |
| Four big tools from day one                  | **Tool framework + ~20 small tools**, each mapped to one legal duty                                                             | Small tools ship weekly and survive course discoveries. Big tools are compositions of small ones.                                                                                   |
| Agents / LangChain / vector DB               | Deterministic engines (decision trees, checklists, deadline math) first; LLM only for summarising public news and drafting text | Legal work needs reproducible, citable results. An agent that "decides" risk class is a liability.                                                                                  |
| Next.js + Tailwind + shadcn + dark SaaS look | SvelteKit 2 + Svelte 5, hand‑written tokens, **"Kanzlei"** look                                                                 | User requirement; avoids the generated‑template look.                                                                                                                               |
| Auth unspecified; Postgres + Qdrant          | Keycloak 26; Postgres 17 only                                                                                                   | User requirement; FTS in Postgres is enough.                                                                                                                                        |

Daily is a fully new project at `Desktop/daily`. It shares no code, tokens, state or logic with any earlier project. Conventions: pnpm, runes‑only, `lib/` pure TS vs `state/*.svelte.ts`, `tokens/base/primitives` CSS split, `data-theme`, German UI + English code, no emoji icons.

---

## 1. Decisions confirmed with the user

| Topic           | Decision                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Name            | **Daily** (D = Data, AI, L = Law, Y = Yield). Wordmark: **D** blue, **AI** red, **L** khaki green, **Y** ink (Y colour assumed).                                                           |
| Domain          | **dai-ly.de** (free 2026‑10‑13, DENIC RDAP 404). `auth.dai-ly.de` for Keycloak, `www` redirects.                                                                                           |
| Look            | **Kanzlei**: warm paper, ink, Source Serif 4 headings, DM Sans UI, JetBrains Mono for article numbers/dates/deadlines, hairline rules. No cards, gradients, emoji, purple, icon libraries. |
| Frontend        | SvelteKit 3 (as built; planned 2), Svelte 5 runes, TypeScript strict, pnpm.                                                                                                                |
| Auth            | Keycloak 26 (self‑hosted), OIDC code + PKCE. As built: `openid-client` with server‑side sessions in Postgres (Auth.js had no SvelteKit 3 support).                                         |
| DB              | PostgreSQL 17 in Docker on the same VPS (databases `daily`, `keycloak`), Drizzle ORM. Supabase (Frankfurt) remains a documented fallback – only the connection string changes.             |
| i18n            | German default, English switchable (Paraglide 2, URL strategy).                                                                                                                            |
| Hosting         | Hetzner Cloud Falkenstein, Ubuntu 24.04, Docker Compose, Caddy TLS.                                                                                                                        |
| Registrar / DNS | INWX; DNS at Hetzner DNS Console.                                                                                                                                                          |

---

## 2. Research results (2026‑10‑13)

### 2.1 Domains

Taken: daily.de (live "Daily® Bürosoftware" – also a trademark risk for "Daily" alone in class 9), daily.com, daily.legal, daily.law, daily.app, daily.tools, dailylaw.de, dailyhq.de, thedaily.de, mydaily.de, dailybrief.de, daily-hub.de.
Free: **dai-ly.de (chosen)**, daily-legal.de, getdaily.de, daily-compliance.de, daily-dsb.de, daily-audit.de, dailyyard.de, daily-yard.de, daily-ai-law.de, dailylegal.ai. daily.eu unchecked (no RDAP) → whois.eurid.eu manually.
Trademark: search DPMAregister + EUIPO eSearch for "Daily" in classes 9/42/45 before marketing; use the form "Daily — Data · AI · Law".

### 2.2 News sources

| Source                                                                                  | Feed                                                           | Status                                      |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------- |
| EDPB/EDSA                                                                               | `https://www.edpb.europa.eu/feed/news_en`                      | **Verified RSS**, items from 12–13 Oct 2026 |
| EuGH press                                                                              | `https://curia.europa.eu/site/rss.jsp?lang=de&secondLang=en`   | From CURIA RSS page, verify                 |
| EuGH judgments                                                                          | `https://curia.europa.eu/jcms/rssJur.jsp?jur=C&lang=de`        | Same                                        |
| EUR‑Lex OJ                                                                              | RSS per saved search ("Datenschutz", "Künstliche Intelligenz") | To build                                    |
| BfDI                                                                                    | No feed found (standard bund.de RSS path → 404)                | **HTML adapter** on the press table         |
| EU Commission / AI Office                                                               | `digital-strategy.../rss.xml` → 500                            | HTML adapter / newsroom                     |
| DSK                                                                                     | No feed                                                        | HTML adapter on Beschlüsse page             |
| Landesbehörden (LfDI BW, BayLDA, LDI NRW, HBDI, BlnBDI)                                 | Unknown                                                        | Check per site in Step 7, HTML fallback     |
| German legal press (heise Datenschutz, netzpolitik, Dr. Datenschutz, CR‑online, Delphi) | RSS mostly exists                                              | Secondary tier                              |

### 2.3 AI Act timeline (data for the tools)

Prohibitions + AI literacy 2 Feb 2025 · GPAI 2 Aug 2025 · **Digital Omnibus on AI, Reg. (EU) 2026/1744**, OJ 24 Jul 2026, in force 27 Jul 2026 (single source – verify in OJ) · Annex III high‑risk **2 Aug 2026 → 2 Dec 2027** · Annex I **→ 2 Aug 2028** · Art. 50 transparency stays 2 Aug 2026 (watermarking for existing systems → 2 Dec 2026) · new CSAM/NCII prohibition 2 Dec 2026.

### 2.4 Stack facts

`@auth/sveltekit` has a Keycloak provider (server‑side, `AUTH_SECRET`, `AUTH_TRUST_HOST`). Keycloak 26: `quay.io/keycloak/keycloak:26.x`, `start`, `KC_HOSTNAME`, `KC_HTTP_ENABLED`, `KC_PROXY_HEADERS=xforwarded`, `KC_BOOTSTRAP_ADMIN_*`; needs ~1 GB. SvelteKit Docker: `adapter-node`, multi‑stage, `node build`. Paraglide 2: Vite plugin, `strategy ['url','cookie','baseLocale']`. Hetzner prices rose April 2026, still cheapest EU operator; Vercel rejected (US operator). DENIC: registrar visible since Dec 2025, risk assessment on orders since 14 Apr 2026 – holder data must be accurate.

---

## 3. Product: the tool catalogue

Every tool answers one question a practitioner has, cites the legal basis, and produces an artefact (a decision, a register entry, a dated document). Tools are grouped by the role that needs them. **Status** drives the roadmap and is shown publicly on `/werkzeuge`: `stable`, `beta`, `planned`.

> Status 2026‑10‑14: all tools below are built — the ten first questionnaires `stable`, everything added later `beta` — and none is `planned`. Normen‑Navigator, Notizen and Berichte (§3.1) are not built yet. Details in §9.

### 3.1 Cross‑cutting (always on)

| Tool                            | What it does                                                                                                                                              | Basis                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Feed**                        | Daily news from the sources in §2.2, tagged by regulation/region/kind; bookmark; "Notiz anlegen"                                                          | –                                       |
| **Notizen**                     | One note per day + free notes, Markdown, FTS, links to feed items, tool runs and Fristen                                                                  | –                                       |
| **Fristen** (deadline calendar) | Every tool that creates a deadline writes here: DSAR 1 month (+2), breach 72 h, KI‑VO application dates, AVV review dates, training renewals. ICS export. | Art. 12(3), 33(1) DSGVO; Art. 113 KI‑VO |
| **Normen‑Navigator**            | Searchable DSGVO + KI‑VO + BDSG + TDDDG article text with cross‑links article ↔ Erwägungsgrund ↔ EDPB/DSK guideline ↔ EuGH case; every tool cites into it | EUR‑Lex consolidated texts              |
| **Mandanten** (organisations)   | External DSBs serve many clients: all tool data is scoped to an organisation; a user can belong to several; roles owner/member                            | Art. 37–39 DSGVO                        |
| **Berichte**                    | Any saved run exports as print‑ready HTML → PDF (and Markdown); a Jahresbericht/Tätigkeitsbericht assembles the year's runs                               | Art. 39(1)(b)                           |

### 3.2 Datenschutz (DSB / Auditor)

| Tool                                               | What it does                                                                                                                                                                   | Basis                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| **VVT** – Verzeichnis von Verarbeitungstätigkeiten | Structured register per Mandant (Zweck, Kategorien, Empfänger, Drittland, Löschfrist, TOMs), import/export CSV, print as the official register                                 | Art. 30                     |
| **DSFA‑Schwellwert**                               | Screening questionnaire (DSK Kurzpapier 5, EDPB WP248 nine criteria, DSK Muss‑Liste) → "DSFA erforderlich: ja/nein" with reasons                                               | Art. 35(3), (4)             |
| **DSFA**                                           | Full DPIA workflow: description → necessity → risk matrix (Eintrittswahrscheinlichkeit × Schwere) → measures → residual risk → Konsultation decision; PDF report               | Art. 35, 36                 |
| **Datenpanne**                                     | Breach intake form, automatic 72‑h clock from Kenntnisnahme, risk test (Meldepflicht an Behörde? Benachrichtigung Betroffener?), Art. 33(3) content checklist, breach register | Art. 33, 34                 |
| **Betroffenenanfrage** (DSAR)                      | Request tracker: type (Auskunft/Löschung/…), identity check, deadline, extension, response checklist per right, register                                                       | Art. 12, 15–22              |
| **AVV‑Prüfung**                                    | Checklist for processor contracts (Art. 28(3) a–h), processor register with review dates, sub‑processor list                                                                   | Art. 28                     |
| **Drittland‑Transfer**                             | Transfer mapping: country → mechanism (Angemessenheit / DPF / SCC + TIA / BCR); TIA questionnaire; DPF status as data                                                          | Art. 44–49                  |
| **TOM‑Katalog**                                    | Technical and organisational measures checklist (SDM Bausteine), per system; feeds VVT and DSFA                                                                                | Art. 32, SDM                |
| **Interessenabwägung** (LIA)                       | Three‑step test (purpose, necessity, balancing) producing a documented Art. 6(1)(f) assessment                                                                                 | Art. 6(1)(f), EDPB 1/2024   |
| **Löschkonzept**                                   | Retention schedule per data category with legal retention periods (HGB/AO), generates Löschregeln                                                                              | Art. 5(1)(e), 17; DIN 66398 |
| **Schulungsnachweis**                              | Training log per Mandant and employee, renewal reminders → Fristen                                                                                                             | Art. 39(1)(b)               |
| **Cookie/Einwilligung‑Check**                      | Website consent audit checklist (TDDDG §25, DSK OH Telemedien)                                                                                                                 | §25 TDDDG                   |

### 3.3 Künstliche Intelligenz (KI‑Beauftragter / AI Officer / KI‑Auditor)

| Tool                                        | What it does                                                                                                                                                                                       | Basis                                    |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **KI‑Register**                             | Inventory of AI systems per Mandant: purpose, provider/deployer role, model (GPAI?), data categories, risk class, owner, status; the hub the other KI tools write into                             | Art. 3, 26, 49                           |
| **Risikoklassifizierung**                   | Decision tree: Art. 5 prohibited → Art. 6 + Annex III high‑risk (with Art. 6(3) exceptions) → Art. 50 transparency → minimal; outputs class, obligations, **applicable date** (Omnibus), citations | Art. 5, 6, 50, Annex III, Reg. 2026/1744 |
| **Betreiberpflichten** (deployer checklist) | For each high‑risk system: Art. 26 duties (instructions, human oversight, input data, logs 6 months, worker information, DSFA link) with evidence fields                                           | Art. 26                                  |
| **Grundrechte‑Folgenabschätzung** (FRIA)    | Art. 27 assessment for public bodies / credit / insurance deployers; template aligned to the AI Office template once published                                                                     | Art. 27                                  |
| **KI‑Kompetenz** (AI literacy)              | Training plan + log per role, mapped to Art. 4; generates the training‑matrix evidence                                                                                                             | Art. 4                                   |
| **KI‑Nutzungsrichtlinie**                   | Generator for an internal AI usage policy (allowed tools, data classes, prohibited inputs, logging) – text drafted from answers, exported DOCX/PDF                                                 | Art. 4, 26; DSK OH KI                    |
| **Transparenzpflichten**                    | Art. 50 check: chatbot disclosure, deepfake/synthetic labelling, emotion recognition notice                                                                                                        | Art. 50                                  |
| **Technische Dokumentation** (provider)     | Annex IV checklist with evidence upload per section                                                                                                                                                | Art. 11, Annex IV                        |
| **Vorfallmeldung**                          | Serious‑incident log with Art. 73 deadlines (15 days / 10 days / 2 days), links to Datenpanne when personal data involved                                                                          | Art. 73                                  |
| **KI & DSGVO‑Schnittstelle**                | Guided check: automated decision (Art. 22), DSFA trigger for AI, training‑data legal basis, Hamburg DPA LLM paper points                                                                           | Art. 22, 35 DSGVO                        |
| **AIMS‑Gap** (ISO/IEC 42001)                | Gap analysis against 42001 Annex A controls, mapped to KI‑VO articles and ISO 27001 controls                                                                                                       | ISO/IEC 42001, 27001                     |

### 3.4 Audit (Auditor roles)

| Tool               | What it does                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **Auditprogramm**  | Define an audit (scope, criteria: DSGVO / KI‑VO / 27001 / 42001 / TISAX), schedule, auditee contacts              |
| **Prüfkatalog**    | Question sets per criterion, sampling, interview notes                                                            |
| **Feststellungen** | Findings log (Hauptabweichung / Nebenabweichung / Hinweis), evidence, corrective actions with deadlines → Fristen |
| **Auditbericht**   | Report generator from the above, PDF                                                                              |

### 3.5 Entwickler (bridge to the Gemini tools)

| Tool               | What it does                                                                                                                                                                                                         | Phase       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Repo‑Check**     | Gemini "C2C scanner" reduced to something honest: scan a repository for PII patterns, hard‑coded secrets, calls to external LLM APIs, missing consent parameters; produce a findings list for the DSB, not a CI gate | 3           |
| **Guardrail‑Test** | Gemini "Red‑Teamer": prompt‑set runner against a chatbot endpoint, reporting refusal/leak rates; evidence for Art. 9/15 KI‑VO risk management                                                                        | 4 (backlog) |

### 3.6 Phase allocation

| Phase                          | When                         | Tools                                                                                                                                                                                     |
| ------------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1 – Platform + first tools** | Oct–Nov 2026 (before course) | Feed, Notizen, Fristen, Mandanten, Berichte (HTML print), Normen‑Navigator (DSGVO + KI‑VO text), **KI‑Register, Risikoklassifizierung, DSFA‑Schwellwert, Datenpanne, Betroffenenanfrage** |
| **2 – DSB module months**      | Course months 1–3            | VVT, DSFA (full, PDF), AVV‑Prüfung, TOM‑Katalog, Drittland‑Transfer, Interessenabwägung, Löschkonzept, Schulungsnachweis, Cookie‑Check; Feed LLM summaries ("Für DSB / Für Entwickler")   |
| **3 – KI module months**       | Course months 2–4            | Betreiberpflichten, FRIA, KI‑Kompetenz, KI‑Nutzungsrichtlinie, Transparenzpflichten, Vorfallmeldung, KI & DSGVO, Technische Dokumentation                                                 |
| **4 – Auditor months**         | Course months 4–5            | Auditprogramm, Prüfkatalog, Feststellungen, Auditbericht, AIMS‑Gap, Repo‑Check                                                                                                            |
| **5 – Launch**                 | After graduation             | V1.0, demo video, Guardrail‑Test, optional paid tier for external DSBs                                                                                                                    |

Phase 1 proves the **framework** with five real tools of three different shapes (register, decision tree, deadline workflow), so every later tool is a repeat of a known pattern.

> As built, the order was different: the questionnaires first (10 tools, 13 Oct), then the records framework and all register/workflow tools in five slices, then AIMS‑Gap, Repo‑Check and Guardrail‑Test (14 Oct). Phases 2–5 are therefore complete for the tool catalogue; the platform parts of Phase 1 that are still open are listed in §9.4.

---

## 4. Architecture

```
Browser ──HTTPS──▶ Caddy (dai-ly.de, auth.dai-ly.de)
                     ├─▶ app      SvelteKit adapter-node :3000
                     └─▶ keycloak Keycloak 26 :8080
app ──▶ postgres(daily)     keycloak ──▶ postgres(keycloak)
worker (node-cron) ──▶ RSS/HTML sources ──▶ feed_items ; nightly Fristen reminders (email, Phase 2)
```

One repo, no separate API server (SvelteKit server routes + form actions), worker shares `src/lib/server`.

### 4.1 The tool framework (the core of the platform)

A tool is a folder `src/lib/tools/<slug>/` with:

```
tool.ts        manifest: { slug, category, status, version, legalBasis[], i18nKey, shape }
schema.ts      zod schema for answers/record + Drizzle table(s) if the tool stores records
engine.ts      pure functions: evaluate(input) → result   (unit‑tested, no I/O)
catalog.json   questions/criteria/citations as data (versioned; a run stores catalog_version)
Form.svelte    the tool's UI, built only from shared primitives (QuestionRow, Citation, Verdict, RecordTable)
report.ts      result → ReportModel (sections, tables, citations) → shared HTML/PDF renderer
```

`src/lib/tools/registry.ts` imports every manifest. From the registry the app derives: `/werkzeuge` catalogue (grouped by category, status badges), the routes `/werkzeuge/[slug]`, `/werkzeuge/[slug]/[runId]`, the Fristen integration (a tool declares `deadlines(result) → Deadline[]`), the Berichte integration and the search index.

**Three tool shapes** cover everything in §3:

- `questionnaire` – answers → verdict (Schwellwert, Risikoklassifizierung, LIA, checklists)
- `register` – CRUD records with print view (VVT, KI‑Register, AVV, Schulungen)
- `workflow` – a record with states and deadlines (Datenpanne, DSAR, Vorfall, Feststellung)

Adding a tool = new folder + manifest entry + migration (if register/workflow) + messages in `de.json/en.json`. A `pnpm new-tool <slug> --shape questionnaire` script scaffolds it.

**As built (2026‑10‑14).** Four shapes: `questionnaire` (`catalog.json` + pure `engine.ts` + `tool.ts`), `register` and `workflow` (`definition.ts` with fields, sections and states + pure `engine.ts` with `deadlines`, `assess`, `fromAssessment` + `tool.ts`), and `utility` for interactive tools with their own page (Repo‑Check, Guardrail‑Test). No per‑tool migrations and no Svelte per tool: register/workflow records share three generic tables and generic UI driven by the definition (records design doc). Content lives in TypeScript/JSON as `Localized` strings, not in message files. The `new-tool` script was not written; promotion from `planned.ts` to the registry is a few lines.

### 4.2 Project layout

```
daily/
  src/
    app.html  hooks.server.ts
    lib/
      paraglide/
      server/ db/(schema.ts index.ts) auth.ts feed/(sources.ts adapters/ tagging.ts) report/(render.ts pdf.ts) fristen.ts
      tools/ registry.ts  _shared/(QuestionRow.svelte Citation.svelte Verdict.svelte RecordTable.svelte Deadline.svelte)
             ki-register/ risikoklassifizierung/ dsfa-schwellwert/ datenpanne/ betroffenenanfrage/ …
      normen/ dsgvo.json ki-vo.json bdsg.json tdddg.json  index.ts (article lookup, cross‑refs)
      ui/ Wordmark Masthead DateLine Rule Tag LangSwitch ThemeSwitch Search
      state/ theme.svelte.ts ui.svelte.ts org.svelte.ts
    routes/[[lang]]/
      (public)/ +page (landing)  feed/  werkzeuge/ (catalogue)  normen/[law]/[article]  impressum/  datenschutz/
      (app)/    +layout.server.ts (auth guard)  notizen/  fristen/  mandanten/  berichte/  werkzeuge/[slug]/(…)/
      auth/[...authjs]/
    styles/ tokens.css base.css primitives.css print.css
  messages/ de.json en.json
  worker/  infra/  drizzle/  tests/  scripts/new-tool.ts
```

### 4.3 Data model

| Table                                                       | Key columns                                                                                                                                                                                   |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`                                                     | id = Keycloak sub, email, display_name, locale                                                                                                                                                |
| `organisations`                                             | id, name, kind (`eigene`/`mandant`), address, dsb_contact                                                                                                                                     |
| `memberships`                                               | user_id, org_id, role (`owner`/`member`)                                                                                                                                                      |
| `feed_sources`, `feed_items`, `feed_item_tags`, `bookmarks` | as before; items are global, bookmarks per user                                                                                                                                               |
| `notes`, `note_links`                                       | note scoped to user (+ optional org); links to feed_item / tool_run / deadline                                                                                                                |
| `tool_runs`                                                 | id, org_id, user_id, tool_slug, shape, catalog_version, input_json, result_json, status, created_at                                                                                           |
| `tool_records`                                              | id, org_id, tool_slug, record_json (zod‑validated), state, created_at, updated_at – generic storage for register/workflow tools; tools that need relational queries get their own table later |
| `deadlines`                                                 | id, org_id, source (tool_slug + run/record id), title, due_at, kind, done_at                                                                                                                  |
| `reports`                                                   | id, org_id, title, model_json, rendered_at, pdf_path                                                                                                                                          |
| `normen_articles`                                           | law, article, title, text_de, text_en, recitals[], refs[] (seeded from EUR‑Lex)                                                                                                               |

Full‑text: generated `tsvector` columns (`german`) on notes, tool_records.record_json → text, normen_articles.

**As built (migrations 0000–0003).** `users`, `organisations`, `memberships`, `sessions` (server‑side OIDC tokens), `tool_runs`, `feed_sources`, `feed_items`, `bookmarks`, and for register/workflow tools `records` (jsonb data, state, version for optimistic locking, soft delete via `archived_at`), `record_events` (append‑only history with field diffs) and `deadlines`. Not built: `notes`, `note_links`, `reports`, `normen_articles`, full‑text columns.

### 4.4 Design system ("Kanzlei")

Tokens:

```
--paper #F7F4EE  --sheet #FFFDF9  --rule #D9D2C5  --rule2 #EAE4D8
--ink #1C1B19  --ink2 #4A4741  --ink3 #8A857B
--navy #1F3A5F (D; links, primary)    --wax #A23B2A (AI; warnings, Bußgeld, overdue)
--khaki #6B6B3A (L; done, compliant)  + *-soft tints; dark theme = inverted paper/ink, same hues +10 % L
--sans "DM Sans"  --serif "Source Serif 4"  --mono "JetBrains Mono"  (self‑hosted woff2)
```

Rules: hairlines instead of boxes; serif for headings, dates, verdicts; mono for `Art. 35 Abs. 3`, case numbers, deadlines; 15 px/1.6 body, 68ch measure; inline SVG line icons only (bookmark, external, search, sun/moon, print). Verdicts are typeset like a court ruling header (small caps "ERGEBNIS", then one serif sentence). Status badges are text in small caps with a 1px rule, never pills.

Wordmark `Wordmark.svelte`: SVG text, Source Serif 4 600, `<tspan>` D navy · AI wax · L khaki · Y ink; tagline "Data · AI · Law" in small caps. Favicon: the D.

---

## 5. Step‑by‑step build guide

PowerShell‑safe; pnpm only. Each step ends in a checkable state.

### Step 0 – Prerequisites

Node 22 LTS, pnpm 10, Git, Docker Desktop (WSL2), VS Code + Svelte ext. Accounts: GitHub, Hetzner Cloud, INWX.

### Step 1 – Scaffold

```
cd C:\Users\mahmutkisecok\Desktop
pnpm dlx sv create daily    # minimal, TS; add prettier, eslint, vitest, playwright, drizzle(postgres, docker), paraglide(de,en)
cd daily; pnpm install; git init; git add -A; git commit -m "Scaffold SvelteKit project"
```

`.claude/launch.json`: `daily-dev` → `pnpm dev --port 5174`.
**Done:** `pnpm dev` on :5174, `pnpm check` clean.

### Step 2 – Tokens, shell, landing

Tokens/base/primitives/print per §4.4; self‑hosted fonts in `static/fonts`; `Wordmark`, `Masthead`, `DateLine`, `Rule`, `Tag`, `ThemeSwitch`, `LangSwitch`; theme as a cookie read on the server so there is no flash. Landing: masthead, one statement, three sections (Lesen · Notieren · Arbeiten) separated by rules, footer. **Done:** both themes, Lighthouse a11y ≥ 95, screenshot in `docs/design/`.

### Step 3 – i18n

Paraglide `baseLocale de`, `locales [de,en]`, URL strategy; all strings in `messages/`; `hooks.server.ts = sequence(paraglide, auth)`. **Done:** `/de`, `/en` switch keeps route.

### Step 4 – Database + organisations

`infra/compose.yml` with `postgres:17-alpine` (init script creates `keycloak` db); schema §4.3; migrations; FTS generated columns via raw SQL. `org.svelte.ts` holds the active organisation; every `(app)` load reads `orgId` from a cookie and checks membership. **Done:** migrations apply, Drizzle Studio shows tables.

### Step 5 – Keycloak (local)

Compose service `quay.io/keycloak/keycloak:26.x` `start-dev`, realm `daily`, client `daily-web` (confidential, PKCE, redirect `http://localhost:5174/auth/callback/keycloak`), roles `user/editor/admin`, registration + email verification on, default locale `de`. Export realm to `infra/keycloak/realm-daily.json`, import with `--import-realm`. **Done:** discovery document responds.

### Step 6 – Auth

`@auth/sveltekit` + Keycloak provider, JWT session, refresh in `jwt` callback, `(app)` guard, user upsert on first login, logout via `end_session_endpoint`. **Done:** Playwright login/logout test green.

### Step 7 – Tool framework

`registry.ts`, manifest type, three shape base components in `tools/_shared`, generic routes `/werkzeuge`, `/werkzeuge/[slug]`, `/werkzeuge/[slug]/[id]`, `tool_runs`/`tool_records`/`deadlines` tables, `scripts/new-tool.ts`, report renderer (ReportModel → print HTML). Build with one dummy tool, then delete it. **Done:** `pnpm new-tool demo --shape questionnaire` yields a working page in under a minute.

### Step 8 – Normen‑Navigator

Seed `normen_articles` from EUR‑Lex consolidated DSGVO (02016R0679) and KI‑VO (02024R1689 incl. Omnibus) HTML via a one‑off import script (`scripts/import-eurlex.ts`), German + English; recital links; `/normen/dsgvo/art-35`. `Citation.svelte` links every tool citation here. **Done:** every article of both laws resolves; search finds "Folgenabschätzung".

### Step 9 – Phase‑1 tools (five)

Order: **Risikoklassifizierung** (questionnaire, decision tree with Omnibus dates as data) → **KI‑Register** (register; classification run attaches to a record) → **DSFA‑Schwellwert** (questionnaire, WP248 criteria + DSK Muss‑Liste) → **Datenpanne** (workflow: 72‑h clock, Meldepflicht test, register, writes a deadline) → **Betroffenenanfrage** (workflow: 1‑month deadline, per‑right checklist). Each: engine unit tests with fixtures, one Playwright run, print view checked. **Done:** five tools `stable` in the catalogue, the rest `planned` with their legal basis shown.

### Step 10 – Fristen + Berichte

`/fristen`: list by due date, overdue in wax, ICS export; `/berichte`: list of rendered reports, "Tätigkeitsbericht" composer that selects runs by date range. PDF: Chromium in the worker image (`puppeteer-core` + `chromium` apk) rendering the print HTML; fallback is "print to PDF" in the browser. **Done:** a Datenpanne run shows in Fristen; a report downloads as PDF.

### Step 11 – Feed

Worker (`node-cron` every 30 min), `rss-parser` + `cheerio` adapters, sources table from §2.2, dedupe by `url_hash`, keyword tagging, per‑source `last_error`, `User-Agent: DailyBot/0.1 (+https://dai-ly.de)`, robots.txt respected, store title/excerpt/link only. Feed page: day groups, filters via query string (works without JS), bookmark + "Notiz anlegen" + "Zu Mandant zuordnen". **Done:** EDPB, CURIA and at least two German sources deliver items.

### Step 12 – Notizen

Day note + free notes, textarea + `marked`/`DOMPurify` preview, FTS, links to feed/tool run/deadline, Markdown export. **Done:** create/search/link tested.

### Step 13 – Legal pages, quality gates, CI

Impressum (§ 5 DDG), Datenschutzerklärung (Hetzner AVV, Keycloak + Auth.js cookies, self‑hosted fonts, crawler, no analytics; Plausible self‑hosted later). `pnpm lint/check/test/test:e2e`, `svelte-autofixer` on all `.svelte`, GitHub Actions: lint → check → unit → build → e2e with Postgres service → push image to GHCR.

### Step 14 – Containerise

Multi‑stage `Dockerfile` (node:22‑alpine, pnpm, `adapter-node`, worker bundle via esbuild, prod prune, non‑root), `infra/compose.prod.yml` (caddy, app, worker, keycloak `start --optimized`, postgres; only Caddy publishes 80/443), `Caddyfile` (dai-ly.de → app, www → redirect, auth → keycloak, `/admin/*` IP‑restricted). **Done:** stack runs locally with `tls internal`.

### Step 15 – Server

Hetzner project "daily", **CX33** (Keycloak + Chromium want RAM), Ubuntu 24.04, Falkenstein, SSH key only, Hetzner firewall 22/80/443; ufw, fail2ban, unattended‑upgrades, `deploy` user; Docker Engine; `/opt/daily/.env` (600) with `AUTH_SECRET`, DB passwords, Keycloak secrets; nightly `pg_dump` → Hetzner Storage Box (restore tested); `infra/deploy.sh` (pull, up, migrate).

### Step 16 – Domain and DNS

INWX: register **dai-ly.de** (auto‑renew; accurate holder data – DENIC risk assessment), optionally daily-legal.de as redirect. DNS at Hetzner DNS Console: `A/AAAA @`, `www`, `auth`; `CAA 0 issue "letsencrypt.org"`; SMTP for Keycloak mails via a German provider later (`MX/SPF/DMARC` then). DNSSEC once stable. Propagation check, `docker compose up -d`, Caddy fetches certificates. Keycloak client redirect → `https://dai-ly.de/auth/callback/keycloak`, `start` mode. **Done:** SSL Labs A+, login on the live domain.

### Step 17 – Go‑live checklist

Impressum/Datenschutz linked everywhere · robots/sitemap · OG image · uptime monitor (Uptime Kuma self‑hosted or UptimeRobot) · logs via `docker logs` + logrotate · backup restore proven · Keycloak admin IP‑restricted · worker logs checked daily for a week · public catalogue shows 5 stable + planned tools · LinkedIn post.

---

## 6. Roadmap

| When            | Work                 | Result                                               |
| --------------- | -------------------- | ---------------------------------------------------- |
| Oct 2026 wk 1–2 | Steps 0–7            | Shell, i18n, DB, login, tool framework               |
| Oct wk 3–4      | Steps 8–12           | Normen, five tools, Fristen, Berichte, Feed, Notizen |
| Nov wk 1        | Steps 13–17          | **Live at dai-ly.de** before the course starts       |
| Course m1–3     | Phase 2 tools (§3.6) | DSB toolset complete, LLM feed summaries             |
| Course m2–4     | Phase 3 tools        | KI toolset complete                                  |
| Course m4–5     | Phase 4 tools        | Audit toolset, AIMS‑Gap, Repo‑Check                  |
| After           | Phase 5              | V1.0, demo, Guardrail‑Test, optional paid tier       |

> Status 2026‑10‑14: the tool work of all phases is done (§9.2). Still open from Steps 8, 10, 12 and 14–17: Normen‑Navigator, Berichte/PDF, Notizen, containerising, server, domain and go‑live (§9.4).

---

## 7. Verification

1. `pnpm check && pnpm lint && pnpm test` green locally and in CI; engines have fixture tests incl. every branch of the Risikoklassifizierung tree.
2. Playwright: login → create Mandant → run Risikoklassifizierung → record appears in KI‑Register → Datenpanne run creates a Frist → report PDF downloads → note links to a feed item.
3. Worker: EDPB item appears within 30 min of publication.
4. Browser preview: landing/feed/tool pages in light + dark, `/de` + `/en`, 375 px width, print preview of a verdict page.
5. Production: SSL Labs A+, `www` → 301, Keycloak discovery on `auth.`, backup file dated today in the Storage Box.

## 8. Risks and open items

| Item                                     | Action                                                                                                                |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| "Daily" trademark DE/EU                  | DPMA + EUIPO search (classes 9/42/45) before marketing                                                                |
| daily.eu                                 | Check manually; register if free                                                                                      |
| Dead/absent RSS (BfDI, Commission, DSK)  | HTML adapters; `active=false` after repeated failures                                                                 |
| Legal content accuracy (catalogs, dates) | Every catalog item carries `source`; monthly review from the feed; disclaimer "keine Rechtsberatung" on every verdict |
| Omnibus dates single‑sourced             | Verify in OJ L 2026/1744 before Step 9                                                                                |
| Keycloak + Chromium RAM                  | CX33; `JAVA_OPTS_KC_HEAP=-XX:MaxRAMPercentage=50`                                                                     |
| Google Fonts GDPR                        | Self‑host                                                                                                             |
| LLM summaries (Phase 2)                  | Public news text only; disclosed in Datenschutzerklärung                                                              |
| Wordmark Y colour                        | Assumed ink; one‑line change                                                                                          |
| Legal content of the new tools           | Needs review by the user before anyone relies on it; open points listed in §9.5                                       |

---

## 9. Built so far (status 2026‑10‑14)

Repository https://github.com/mkisecok/daily (public), live static preview https://mkisecok.github.io/daily/ (GitHub Pages, rebuilt on every push and four times a day for fresh news). History is kept as small single‑purpose conventional commits.

### 9.1 Platform

| Part                                                                                                                                                                                                                                                     | State                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Shell, Kanzlei design, wordmark, light/dark, de/en (Paraglide, `/` and `/en`)                                                                                                                                                                            | Built                   |
| Keycloak login (openid-client, PKCE, Postgres sessions, refresh, logout)                                                                                                                                                                                 | Built                   |
| Organisations and **Mandanten** page: own organisation on first login, clients added, active organisation per browser cookie (checked against memberships in `hooks.server.ts`, `locals.organisation`), workspace shown in the masthead                  | Built                   |
| **Nachrichten** (feed): RSS/HTML adapters with retry, keyword tagging, filters, bookmarks; worker with node-cron                                                                                                                                         | Built                   |
| **Fristen**: open deadlines of all register/workflow tools, overdue/due‑soon marks, `.ics` export                                                                                                                                                        | Built                   |
| **Werkzeuge** catalogue and questionnaire runner (`/werkzeuge/[slug]/pruefen`, in‑browser), saved runs per organisation                                                                                                                                  | Built                   |
| Records framework for register/workflow tools (records design doc): generic form/list/history/print, CSV, workflow states with checks, deadlines, assessment handoff from questionnaires, references between records with backlinks and composed reports | Built                   |
| Static preview mode (`PUBLIC_PREVIEW`): prerendered, no DB/auth, records in `localStorage`, notice and "delete local data"                                                                                                                               | Built                   |
| CI (`pages.yml`): check, lint, unit tests, preview E2E, static build, deploy                                                                                                                                                                             | Built                   |
| Normen‑Navigator, Notizen, Berichte/Jahresbericht/PDF                                                                                                                                                                                                    | **Placeholders** (§9.4) |

### 9.2 Tools (29, none planned)

| Category    | Questionnaire                                                                                                                            | Register                                                       | Workflow                                      | Utility                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------- | -------------------------- |
| Datenschutz | DSFA‑Schwellwert, Interessenabwägung, Einwilligungs‑Check, Drittland‑Transfer                                                            | VVT, AVV‑Prüfung, TOM‑Katalog, Löschkonzept, Schulungsnachweis | DSFA, Datenpanne, Betroffenenanfrage          | –                          |
| KI          | Risikoklassifizierung, Transparenzpflichten, Betreiberpflichten, KI und DSGVO, Technische Dokumentation, KI‑Nutzungsrichtlinie, AIMS‑Gap | KI‑Register, KI‑Kompetenz                                      | Vorfallmeldung, Grundrechte‑Folgenabschätzung | –                          |
| Audit       | –                                                                                                                                        | Prüfkatalog, Auditbericht                                      | Auditprogramm, Feststellungen                 | –                          |
| Entwickler  | –                                                                                                                                        | –                                                              | –                                             | Repo‑Check, Guardrail‑Test |

The ten first questionnaires are `stable`; all others `beta`. Cross‑tool links: Risikoklassifizierung → KI‑Register (risk class), DSFA‑Schwellwert → VVT and DSFA, Drittland‑Transfer → VVT (assessment fields); Prüfkatalog, Feststellungen and Auditbericht refer to an Auditprogramm entry, and the report composes the audit with its checklists and findings.

Deviations from §3: Repo‑Check scans files or pasted code in the browser (nothing uploaded) instead of a repository connection; Guardrail‑Test works with pasted answers or an OpenAI‑compatible endpoint called from the browser; AIMS‑Gap and the ISO question sets are written in Daily's own words and cite clause numbers only (no standard text).

### 9.3 Quality

Unit tests for every engine and the records framework (266), database tests against the compose Postgres (`pnpm test:db`, 11), server‑mode Playwright E2E with Keycloak (25: auth, feed, i18n, questionnaires, every slice of record tools, Mandanten isolation, audit chain, utilities) and a preview E2E under `/daily` that runs in CI before every deploy.

### 9.4 Open

- Normen‑Navigator (article texts, cross‑references), Notizen (notes tied to news and records), Berichte (PDF, Jahresbericht); today reports are the browser print view.
- Steps 14–17: Docker image, Hetzner server, Caddy, dai-ly.de DNS, backups, go‑live; the full app has so far only run locally.
- Feed LLM summaries (Phase 2), e‑mail reminders for Fristen, deleting organisations (left out on purpose), inviting members to an organisation.
- DPMA/EUIPO trademark search, daily.eu check (§8).

### 9.5 Legal content to review

Every tool cites its basis, but the content has not been reviewed by a lawyer. Points flagged during the build: Omnibus dates (Reg. (EU) 2026/1744) used across the KI tools; scope of Art. 4 KI‑VO after the Omnibus; 8‑year retention for accounting vouchers (BEG IV, since 2025) and 6 months for rejected applications (practice, not statute) in Löschkonzept; § 26 BDSG after EuGH C‑34/21 in VVT; whether the Art. 12(3) period pauses while identity proof is awaited (Daily counts from receipt); the simplified DSK‑style risk thresholds in DSFA; Art. 73 periods counted as 24‑hour days from the minute of awareness; the 90 % refusal and 25 % over‑refusal thresholds in Guardrail‑Test.
