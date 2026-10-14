# Register and workflow tools for Daily

Plan written 2026-10-14. Decisions confirmed with the user: records are **stored in the browser**
in the public preview, and the first slice is **KI-Register (register) + Datenpanne (workflow)**
with a shared **Fristen** (deadline) page.

## Context

Daily has ten questionnaire tools: answers in, verdict out, optionally saved as a `tool_run`. The
remaining 17 planned tools (VVT, Datenpanne, Betroffenenanfrage, KI-Register, AVV, audit…) are
different: users keep **records over time**, edit them, move them through **states**, and must
meet **deadlines** (72 h breach clock, one-month DSAR). The tool types `register` and `workflow`
exist in `ToolShape` (`src/lib/tools/types.ts`) and in the DB enum, but nothing implements them.

Goal: one generic records framework that every register/workflow tool plugs into the same way
questionnaires do today (a folder with definition + pure engine + tests + manifest), working
identically in the full app (Postgres, per organisation, with history) and in the public
GitHub Pages preview (browser storage, nothing leaves the device). Prove it with KI-Register and
Datenpanne, then roll out the rest in later slices.

## Architecture

```
src/lib/records/                 shared, pure, runs in browser and on server
  types.ts        FieldDef, RecordToolDefinition, StateDef, TransitionDef, DeadlineSpec, StoredRecord, RecordEvent
  validate.ts     validateRecord(def, input) -> { data, errors }      (also coerces form strings)
  diff.ts         diffRecord(before, after) -> { fieldId: [old, new] } for history
  workflow.ts     allowedTransitions(def, record), applyTransition(def, record, to) -> errors | record
  deadlines.ts    computeDeadlines(def, record) (calls the tool's engine)
  ics.ts          toIcs(deadlines) -> text/calendar (RFC 5545)
  csv.ts          toCsv(def, records) (semicolon, UTF-8 BOM for German Excel)
  store/
    types.ts      RecordStore interface: list, get, create, update(expectedVersion), transition,
                  archive, history, deadlines, attachAssessment
    http.ts       HttpStore -> /api/records… (full app)
    browser.ts    BrowserStore -> localStorage key `daily.records.v1` (preview)
    index.ts      getStore(): PUBLIC_PREVIEW ? BrowserStore : HttpStore
  ui/             RecordTable, RecordForm, FieldInput, StateBar, RecordHistory,
                  DeadlineList, AssessmentPanel (reuses tools/_shared/Verdict), PrintRegister
src/lib/server/records.ts        Postgres repository: same operations, org-scoped, writes events,
                                 recomputes deadlines in one transaction; re-validates everything
src/routes/api/records/…         JSON endpoints, require session + active organisation
```

**Why one shared domain layer:** validation, transitions and deadline maths live in pure modules
used by both stores, so the preview behaves exactly like the full app and every rule has one test.
The server never trusts the client: `src/lib/server/records.ts` re-runs `validateRecord`,
`applyTransition` and `computeDeadlines`.

**Rendering:** the records pages are client-rendered (`export const ssr = false` in `+page.ts`)
because their data comes from the store. One URL scheme for both modes, so the preview can
prerender a single page per tool: list `/werkzeuge/[slug]/eintraege`, record `…/eintraege?eintrag=<id>`,
new `…/eintraege?neu=1`. A `+page.server.ts` redirects signed-out users to login in the full app
and does nothing in the preview (the existing `PUBLIC_PREVIEW` switch).

### Field types (`FieldDef`)

`text`, `textarea`, `select`, `multiselect`, `date`, `datetime`, `number` (with unit), `boolean`,
and `assessment` (a frozen snapshot `{ tool, catalogVersion, verdict, headline, at }` of a
questionnaire result). Each field: `id`, `label: Localized`, `help?`, `cite?: LegalBasis`,
`required?`, `listColumn?`. Sections group fields like questionnaire sections. `titleField` names
the field shown as the record title.

### Workflow additions

`states: { id, label, terminal? }[]`, `initialState`, `transitions: { from, to, label,
requires?: fieldId[] }[]`. Engines export pure `deadlines(record) -> DeadlineSpec[]` and optional
`assess(record) -> QuestionnaireResult` (rendered with the existing `Verdict` component). Registers
may also return deadlines (e.g. a review date).

### Database (migration `0003`, `src/lib/server/db/schema.ts`)

| Table           | Key columns                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `records`       | id, organisation_id, tool_slug, definition_version, state (null for registers), title, data jsonb, version int (optimistic locking), created_by, updated_by, created_at, updated_at, archived_at |
| `record_events` | id, record_id (cascade), user_id, kind (`created`/`updated`/`transition`/`assessment`/`archived`), changes jsonb, from_state, to_state, created_at                                               |
| `deadlines`     | id, organisation_id, record_id (cascade), tool_slug, kind, due_at, done_at, created_at                                                                                                           |

Deadlines are recomputed on every save: open ones for the record are replaced, terminal states
mark them done. Archive is a soft delete (accountability, Art. 5(2) DSGVO).

### API (`src/routes/api/records/`)

`GET ?tool=` list · `POST` create · `GET [id]` record + events + deadlines · `PUT [id]` update with
`expectedVersion` (409 on conflict) · `POST [id]/transition` · `POST [id]/assessment` ·
`DELETE [id]` archive · `GET /api/deadlines` open deadlines. All use `locals.user` and
`getActiveOrganisationId` (`src/lib/server/org.ts`); JSON only, so SvelteKit's form CSRF rules do
not apply and cross-origin calls are blocked by CORS preflight.

### Browser store (preview)

Same interface over `localStorage`, versioned key, history kept per record, try/catch around every
access (private mode). The list page shows "Nur in diesem Browser gespeichert" and a
"Lokale Daten löschen" button. Nothing is sent anywhere; the preview notice page explains it.

## Slice 1 tools

### KI-Register (`src/lib/tools/ki-register/`, register)

Fields: Name (title), Zweck, Anbieter, Modell, Rolle (Anbieter/Betreiber/beides), nutzt GPAI-Modell,
Abteilung/Verantwortlich, personenbezogene Daten (ja/nein), Datenkategorien, Risikoklasse
(verboten/hochriskant/Art. 50/minimal/ungeklärt), Einstufung (`assessment` from
`risikoklassifizierung`), Status (geplant/in Prüfung/aktiv/außer Betrieb), Wiedervorlage (date).
List columns: Name, Rolle, Risikoklasse, Status, Verantwortlich. Engine: review deadline from
Wiedervorlage; hint when Risikoklasse "hochriskant" and no Betreiberpflichten run is linked.

**Handoff from the questionnaire:** the record form links to
`/werkzeuge/risikoklassifizierung/pruefen?fuer=ki-register:<id>`; the result page then shows
"In KI-Register übernehmen", which calls `store.attachAssessment` and sets Risikoklasse from the
verdict. Works in both modes because it goes through the store.

### Datenpanne (`src/lib/tools/datenpanne/`, workflow)

Fields: Bezeichnung, Kenntnis am (datetime, starts the clock), entdeckt durch, Beschreibung, Art der
Verletzung (Vertraulichkeit/Integrität/Verfügbarkeit), Datenkategorien (incl. Art. 9, Zugangsdaten,
Finanzdaten), ungefähre Zahl Betroffener, Betroffenengruppen, wahrscheinliche Folgen, ergriffene
und geplante Maßnahmen, beim Auftragsverarbeiter aufgetreten, Daten wirksam verschlüsselt,
Risiko (kein / Risiko / hohes Risiko), Meldung an Aufsicht am, Aktenzeichen, Gründe für Verzögerung,
Betroffene benachrichtigt am / Ausnahme nach Art. 34 Abs. 3.

States: `erfasst → bewertet → gemeldet | nicht_meldepflichtig → abgeschlossen`. Transitions
require: bewertet ← Risiko; gemeldet ← Meldung am; abgeschlossen ← Maßnahmen.

Engine (pure, unit-tested):

- `deadlines`: Meldung an Aufsicht = Kenntnis + 72 h while Risiko ≠ "kein" and not reported
  (the clock runs from creation, conservative); Benachrichtigung Betroffener "unverzüglich"
  (internal target Kenntnis + 72 h) when hohes Risiko and no Art. 34(3) exception.
- `assess`: verdict with Art. 33(1)/(3), 33(5), 34(1), 34(3) logic; late reporting requires reasons;
  processor case notes the Art. 33(2) duty; notes list the Art. 33(3) contents and that the
  competent authority is the Landesbehörde of the seat (BfDI for federal/telecom).

### Fristen (`/fristen`)

Open deadlines across all record tools, sorted by due time, overdue in wax red, due within 24 h
highlighted, link to the record, `.ics` download (`toIcs`, generated in the browser). Masthead gets
a "Fristen" nav item (signed-in users in the full app, always in the preview).

## Build order (small commits, each with tests)

1. `records/types.ts`, `validate.ts`, `diff.ts` + unit tests
2. `workflow.ts`, `deadlines.ts`, `ics.ts`, `csv.ts` + unit tests
3. Schema + migration 0003 (`records`, `record_events`, `deadlines`)
4. `src/lib/server/records.ts` repository + integration test against the compose Postgres
5. `/api/records` endpoints
6. Store interface, `HttpStore`, `BrowserStore` (+ unit tests with a fake `localStorage`)
7. UI components (`FieldInput`, `RecordForm`, `RecordTable`, `StateBar`, `RecordHistory`,
   `DeadlineList`, `PrintRegister`) — run `svelte-autofixer` on each
8. Routes `/werkzeuge/[slug]/eintraege` (+ guard) and tool page switch: register/workflow tools
   show "Öffnen" instead of "Prüfung beginnen"
9. Registry: `getRecordTool(slug)`; extend `promote.mjs` pattern for record tools
10. KI-Register definition + engine + tests + manifest
11. Datenpanne definition + engine + tests + manifest
12. Assessment handoff (`?fuer=`) on the questionnaire result page
13. `/fristen` page + nav item + messages (de/en)
14. Preview: browser-storage notice, clear button, `vorschau` page text
15. E2E (server mode): create/edit KI-Register record, history, CSV; Datenpanne create →
    Frist in 72 h on /fristen → transitions; handoff from risk classification
16. E2E (preview): `playwright.preview.config.ts` against `build:static` + `preview:static`
    under `/daily`: create a record, reload, it persists; add as a CI step before deploy
17. README + push; check the deploy

## Later slices (same pattern, no framework changes expected)

- **Slice 2:** Mandanten page (create client organisation, switch active organisation via cookie),
  VVT (Art. 30, official print layout, references TOM/AVV), Betroffenenanfrage (Art. 12, one month,
  +2 months extension, per-right checklist).
- **Slice 3:** AVV-Prüfung (Art. 28(3) checklist + review date), TOM-Katalog, Löschkonzept,
  Schulungsnachweis and KI-Kompetenz (renewal deadlines).
- **Slice 4:** Vorfallmeldung (Art. 73: 15 days / 10 days death / 2 days widespread), DSFA
  (links a DSFA-Schwellwert run), Grundrechte-Folgenabschätzung (Art. 27).
- **Slice 5:** Auditprogramm, Feststellungen (corrective actions with deadlines), Auditbericht
  (print composed from programme + findings).
- Not planned here: AIMS-Gap (ISO texts are copyrighted), Prüfkatalog, Repo-Check, Guardrail-Test.

## Reuse

- `Localized`, `LegalBasis`, `ToolManifest`, `QuestionnaireResult` — `src/lib/tools/types.ts`
- `Verdict`, `Citation`, `ToolHeader`, `StatusBadge` — `src/lib/tools/_shared/`
- `text()`, `cite()` — `src/lib/tools/i18n.ts`; `localized()` — `src/lib/i18n/links.ts`
- `formatLongDate`, `formatTime`, `dayKey` (Europe/Berlin) — `src/lib/i18n/date.ts`
- `getActiveOrganisationId` — `src/lib/server/org.ts`; `db` — `src/lib/server/db/index.ts`
- `PUBLIC_PREVIEW` — `src/env.ts`; print styles — `src/styles/print.css`

## Verification

- `pnpm check`, `pnpm lint`, `pnpm vitest run --project server` (new suites: validate, diff,
  workflow, deadlines, ics, csv, browser store, ki-register and datenpanne engines; 72 h maths
  across DST change on 25 Oct 2026)
- `pnpm test:e2e` with the compose stack (server-mode flows above)
- Preview e2e against the static build under `/daily`; manual check in the browser pane:
  create, edit, transition, reload, CSV, print, `.ics` opens in a calendar
- After push: Pages workflow green; live preview stores a record in the browser and keeps it
  after reload; no console errors
