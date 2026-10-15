# Daily — Data · AI · Law

A daily workplace for data protection officers, AI officers and auditors working under the
GDPR (DSGVO) and the EU AI Act (KI-VO). German first, English included.

**Public preview:** https://mkisecok.github.io/daily/ (static build, rebuilt four times a day
with fresh news; sign-in, notes and saved assessments are switched off there, and register
entries stay in your browser).

- **Nachrichten** – news from the EDPB, CJEU, BfDI, DSK, state authorities and the legal press,
  tagged by regulation and kind. Title, excerpt and link only; the text stays with the source.
- **Werkzeuge** – tools that turn one legal duty into a documented, citable result. Available:
  - DPIA screening (Art. 35 DSGVO, WP 248, DSK must-list)
  - Legitimate interests assessment (Art. 6(1)(f) DSGVO, EDPB Guidelines 1/2024)
  - Cookie and consent check (§ 25 TDDDG, Art. 7 DSGVO, Planet49)
  - Third-country transfer check (Art. 44–49 DSGVO, Schrems II, EDPB Recommendations 01/2020)
  - AI Act risk classification (Art. 5, Annex I/III, Art. 6(3), Art. 50, dates after Omnibus
    Regulation (EU) 2026/1744)
  - AI Act transparency obligations (Art. 50)
  - Deployer obligations for high-risk AI (Art. 26, 4, 27, 86)
  - Technical documentation completeness (Art. 11, Annex IV)
  - AI and GDPR interface check (Art. 5, 6, 22, 35 DSGVO, EDPB Opinion 28/2024)
  - AI usage policy generator (Art. 4 KI-VO, DSGVO, BetrVG)
  - AIMS gap analysis (ISO/IEC 42001 clauses and Annex A, mapped to AI Act articles)

  Registers and workflows keep records over time, with history, deadlines, CSV export and a
  print version (beta):
  - Record of processing activities (Art. 30 DSGVO) – completeness per letter, takes the DPIA
    decision over from the DPIA screening
  - Data protection impact assessment (Art. 35, 36 DSGVO) – risk matrix before and after
    measures, prior consultation with the deadline for the authority's opinion
  - Data subject requests (Art. 12, 15–22 DSGVO) – one-month period with extension, checklist
    per right
  - Processor contract check (Art. 28 DSGVO) – checklist for Art. 28(3) (a)–(h), sub-processors,
    review dates
  - TOM catalogue (Art. 32 DSGVO) – measures per system along the SDM protection goals
  - Retention schedule (Art. 5(1)(e), 17 DSGVO, HGB, AO) – statutory periods, erasure runs as
    deadlines
  - Training log (Art. 39(1)(b) DSGVO) – refresher deadlines
  - AI system register (Art. 3, 6, 26 KI-VO) – takes the risk class over from the risk
    classification
  - Personal data breach (Art. 33, 34 DSGVO) – 72-hour clock from awareness, risk assessment,
    status from recording to closure
  - AI literacy (Art. 4, 26(2) KI-VO) – content per role, refresher deadlines
  - Serious incident reports (Art. 73 KI-VO) – 15, 10 or 2 days from awareness
  - Fundamental rights impact assessment (Art. 27 KI-VO) – applicability, elements (a)–(f),
    notification of the authority

  Audit: audit programme, audit checklist with question sets, findings with corrective actions,
  and an audit report that composes the audit with its checklists and findings for print.
  Records can refer to each other; a record shows the entries that point to it.

  Developer tools run in the browser: a repository check for secrets, personal data, AI service
  calls and trackers, and a guardrail test with refusal, leak and over-refusal rates.

- **Fristen** – open deadlines from all registers in one list, with a calendar file (`.ics`).
- **Mandanten** – external officers add client organisations and switch between them; every
  assessment, register entry and deadline belongs to the active one.

- **Normen** – DSGVO, KI-VO (consolidated, with the Omnibus amendments), BDSG and TDDDG with
  linked cross-references, recitals, annexes and search; every citation in Daily opens its
  provision. Texts are imported from the EU Publications Office and gesetze-im-internet.de
  (`pnpm normen:import`).
- **Notizen** – a notebook with today's note, Markdown, linked citations and search; notes can be
  started from news items, records and provisions.
- **Berichte** – period reports (overall, data protection, AI, audit) from registers, deadlines
  and saved assessments, printed as PDF from the browser.

Not legal advice.

## Stack

SvelteKit 3 · Svelte 5 · TypeScript · Paraglide (de/en) · Drizzle + PostgreSQL 17 ·
Keycloak 26 via `openid-client` · node-cron feed worker · Vitest · Playwright.

## Local development

Requires Node 22+, pnpm and Docker.

```sh
pnpm install
cp .env.example .env
docker compose up -d        # Postgres on 5433, Keycloak on 8080 with the "daily" realm, Adminer on 8081
pnpm db:migrate
pnpm worker:once            # fetch the news sources once
pnpm dev                    # http://localhost:5174
```

The imported realm contains a local test user; see `infra/keycloak/realm-daily.json`.
Those credentials only exist on your machine.

To browse the database, open Adminer at http://localhost:8081 (only reachable from this machine).
Sign in with system "PostgreSQL", server `postgres`, and the user, password and database from
`compose.yaml`. Users and logins are managed in the Keycloak admin console at
http://localhost:8080/admin/.

## Checks

```sh
pnpm check                  # svelte-check
pnpm lint                   # prettier + eslint
pnpm vitest run --project server
pnpm test:db                # repository against the compose Postgres
pnpm test:e2e               # needs the compose stack running
pnpm test:e2e:preview       # static preview under /daily, records in the browser
```

## Static preview

`pnpm build:static` builds a public preview without server, database or sign-in: every page is
prerendered, news is fetched from the sources at build time and filtered in the browser, and
the tools run in the browser without saving. Register entries are kept in the browser's
`localStorage` and never leave the device. Settings live in `.env.static`; set
`PUBLIC_BASE_PATH` (for example `/daily`) when the site is served from a sub-path.

```sh
PUBLIC_BASE_PATH=/daily pnpm build:static
PUBLIC_BASE_PATH=/daily pnpm preview:static   # http://localhost:4175/daily/
```

## Documentation

The product plan and design decisions are in
[`docs/superpowers/specs/2026-10-13-daily-design.md`](docs/superpowers/specs/2026-10-13-daily-design.md),
the records framework for registers and workflows in
[`docs/superpowers/specs/2026-10-14-records-design.md`](docs/superpowers/specs/2026-10-14-records-design.md).
