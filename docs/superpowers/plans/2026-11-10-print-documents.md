# Printing: from "the web page on paper" to documents

Written 2026-11-10 against `main` at `f6ce4c0`. It records what every page prints today and plans
print output that reads as a professional document. It is meant to work without the conversation
it came from.

## 1. What was checked

15 page types were rendered in print mode at A4 width with five sample entries (VVT ×2,
Datenpanne, DSFA, SDM-Würfel) and one answered questionnaire. Because all questionnaires share one
page and all registers and workflows share another, these cover 29 of the 31 tools plus notes,
deadlines, reports and the law texts.

Not checked: the Guardrail-Test (not in the static build), the saved-run page and the organisation
line (both need the server), and Firefox and Safari.

## 2. What prints today

The global print stylesheet is 25 lines: black on white, link targets spelled out, 20 mm margins.
There is no document header, no page footer and no page number anywhere.

| Page                                                            | Print button | What lands on paper                                                                                                                                |
| --------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Questionnaire result (11 tools)                                 | yes          | Breadcrumb, the status badge ("Verfügbar"/"Beta"), category dot, citation chips, tinted rounded cards. 5 pages for one result. No date, no author. |
| Entry of a register or workflow (18)                            | yes          | The screen cards. Workflow stepper as circles. Every empty field as "—": a nearly empty VVT entry is 3 pages. No entry id, version or date.        |
| Whole register (11)                                             | yes          | Its own layout (`PrintRegister`), the best of the per-tool prints. But no overview table, every empty field listed, citation glued to the label.   |
| DSFA entry                                                      | yes          | Own layout since PR #16; about 7 pages; cards and coloured matrix.                                                                                 |
| SDM-Würfel entry                                                | yes          | Cube and views print, in cards; status only as colour, unreadable on a black-and-white printer.                                                    |
| Reports                                                         | yes          | Closest to a document: title, period, creation date. But disclosure triangles print, and a sentence about "the full installation".                 |
| Notes                                                           | yes          | The page intro ("… bleiben sie in diesem Browser") prints above the note.                                                                          |
| Deadlines                                                       | no           | Cards with "vor 3 Tagen", which is wrong the day after printing.                                                                                   |
| Law article                                                     | no           | Readable; breadcrumb prints.                                                                                                                       |
| Repo-Check, Pseudonymisierer, forms, tool start page, catalogue | partly       | The web page: buttons, toggles, empty inputs, "Prüfung beginnen →".                                                                                |

The shared causes: print reuses the screen components, tool chrome is not marked `no-print`, and
nothing supplies what a document needs (who, when, which version, page x of y, signature).

## 3. Found on the way: missing law text (fixed)

The printed Art. 33 DSGVO had paragraphs 1 and 5 empty. The stored law data had them empty too:
47 paragraphs without text, in DSGVO (11 DE, 8 EN) and KI-VO (10 DE, 18 EN), for example
Art. 33(1) and Art. 25(1) DSGVO in German. The importer lost text that stands directly beside a
corrigendum marker. Fixed together with this plan; `src/lib/normen/data.spec.ts` now fails on any
empty paragraph.

## 4. Target: one document frame, a few templates

### 4.1 Frame, used by every printout

- **Head:** Daily wordmark small, document type ("Prüfbericht", "Registerauszug", "Vorgangsblatt"),
  title.
- **Meta table:** organisation or client; tool and its version or catalogue version; law as of;
  created on; created by; entry id, entry version and state where they exist.
- **Foot on every page:** document title, organisation, print date, "Seite x von y", "Keine
  Rechtsberatung". Page numbers with `@page` margin boxes; browsers without them get the footer
  without numbers.
- **Optional:** confidentiality mark ("Vertraulich", "Intern"), signature block (place, date,
  name, role).

Built as `PrintDocument.svelte` plus print primitives in `print.css`: no backgrounds, shadows or
rounded cards; tables that repeat their head row; `break-inside: avoid` on rows and sections; no
heading as the last line of a page; citations as plain text; every state as words plus a symbol,
never colour alone; charts in hatch patterns that survive black-and-white.

### 4.2 Templates

| Template           | Used by                                   | Content                                                                                                                                              |
| ------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prüfbericht        | 11 questionnaires, saved runs             | Result; reasons as a table (no., finding, legal basis); duties as a checklist; answers as a compact table; sources; signature.                       |
| Vorgangsblatt      | every entry of the 18 registers/workflows | Result; fields per section as a table (field, value, legal basis); empty fields folded into one line; deadlines with dates; linked entries; history. |
| Registerauszug     | 11 registers                              | Overview table first (no., name, key columns, state, last change), then one Vorgangsblatt per entry.                                                 |
| Bericht            | reports                                   | Today's content in the frame, details expanded, no preview-only sentence.                                                                            |
| Fristenliste       | deadlines                                 | Table: due, deadline, entry, tool, legal basis. No relative dates.                                                                                   |
| Notiz, Norm        | notes, law articles                       | Content only, with source and date.                                                                                                                  |
| Erfassungsbogen    | every empty form                          | The form as a paper sheet with boxes to tick, for interviews with departments.                                                                       |
| Werkzeugsteckbrief | tool start pages                          | Name, purpose, legal bases, law as of. The catalogue prints as a list of these.                                                                      |

Tool-specific documents on top of the Vorgangsblatt, each in the order its recipient expects:

- VVT: the Art. 30 table as authorities ask for it.
- Datenpanne and Vorfallmeldung: in the order of Art. 33(3) DSGVO and Art. 73 KI-VO, ready to
  attach to a notification.
- DSFA: DSK Kurzpapier 5 structure with both matrices.
- SDM-Würfel: cube plus views a, b and c as tables.
- Auditbericht: scope, criteria, findings table, conclusion (ISO 19011).
- TOM-Katalog, Löschkonzept: one table per protection goal, one row per retention rule.
- KI-Nutzungsrichtlinie: a numbered policy with a sign-off line.
- Repo-Check and Guardrail-Test: result tables. Pseudonymisierer: prints only a notice, because its
  mapping holds the personal data it is meant to protect.

### 4.3 Print dialog

The print buttons open a small dialog instead of calling the browser at once: include empty
fields, answers, history, signature block; confidentiality mark; language. The choice is
remembered.

## 5. "Every tool passes": the test that enforces it

One Playwright test loops over **every tool in the registry**, so a new tool cannot ship without a
print layout. For each tool it seeds an entry or answers a questionnaire, switches to print and
asserts:

1. The frame is there: document type, tool name, creation date, footer.
2. Nothing interactive or web-only is visible: no button, input, navigation, breadcrumb, status
   badge or `no-print` element.
3. Nothing is wider than the A4 text area.
4. No state is shown by colour alone (each status cell has text).
5. The page count stays under a limit per template (e.g. a nearly empty entry: 1 page).
6. A PDF of one sample per template matches its stored reference.

Until a template exists the test lists the tool as failing; the list is the progress bar.
By hand before each release: Chrome, Firefox and Safari, one printout per template on paper in
black and white.

## 6. Order of work

| Step  | Content                                                                                                        | Covers          |
| ----- | -------------------------------------------------------------------------------------------------------------- | --------------- |
| 1     | Frame, print primitives, the all-tools test (red for every tool)                                               | foundation      |
| 2     | Prüfbericht                                                                                                    | 11 tools        |
| 3     | Vorgangsblatt and Registerauszug                                                                               | 18 tools        |
| 4     | Bericht, Fristenliste, Notiz, Norm; hide chrome on all other pages                                             | rest of the app |
| 5     | Tool-specific documents (VVT, Datenpanne, Vorfallmeldung, DSFA, SDM, Audit, TOM, Lösch, Richtlinie, utilities) | 31 of 31 green  |
| 6     | Print dialog, Erfassungsbogen, Werkzeugsteckbrief                                                              | options         |
| Later | PDF made on the server, identical in every browser                                                             | needs dai-ly.de |

Steps 1 to 4 make every tool print as a document; step 5 makes the important ones print as the
document their recipient expects.

State on 13 Nov 2026: step 1 is built.

- `PrintDocument.svelte` is the head of every printout: "Daily · Prüfbericht" or "Vorgangsblatt",
  title, and a meta table with organisation (when signed in), tool and version, Rechtsstand, legal
  review, entry id and state, and the date. It is on the questionnaire result and the entry page,
  so 47 of 50 tools print with it; on paper it replaces the web page header.
- `print.css` has the primitives: cards as plain paper, no buttons or inputs, headings that do not
  end a page, rows that do not split, and "Daily" plus "page / pages" in the bottom margin.
- The footer cannot carry the document title, organisation or print date: Chrome supports neither
  `string-set` nor running elements, so they stand in the meta table instead.
- `print.preview.e2e.ts` runs over every tool in the registry: the frame is there, no control or
  navigation is visible, nothing is wider than the A4 text area (a part on its own named page, like
  the landscape DSFA dashboard, is measured there). Pending: Repo-Check, Guardrail-Test and
  Pseudonymisierer.
- Step 2 is built too. On paper a questionnaire result (live, and a saved run on the server) is a
  Prüfbericht (`PrintReport.svelte`): the result in words with its level written out, reasons as a
  table (no., finding, legal basis), duties and notes as a checklist, answers as a table, sources
  with the Rechtsstand, and lines for place, date, name and signature. The screen result, its
  dashboard and the next steps are `no-print`. The saved run's meta table adds who made it. The
  test caps a Prüfbericht answered "no" throughout at 2 pages (the AIMS gap analysis at 4: 19 gaps
  with 20 remedies); the Risikoklassifizierung went from 8 pages to 2.
- Still the web look on paper, for step 3: an entry's result with its coloured scale, the workflow
  stepper, and the length of entries (up to 12 pages for a DSFA).
