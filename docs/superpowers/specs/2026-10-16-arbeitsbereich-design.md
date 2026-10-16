# Arbeitsbereich: the app-shell redesign

Written 2026-10-16. The user found the pages old-fashioned. From five directions they chose
"Arbeitsbereich" (an app shell with a sidebar), for the whole app. These stay as they are:

- the palette "Tinte und Oliv" and the colour roles (khaki acts, navy navigates, wax warns)
- the Bits UI controls
- the "Aktenschrank" sheet on phones

## 1. Look

- **Surfaces:** the canvas `#fcfbf8`, the sidebar `#f1eee6`, and raised surfaces `#fffdf9` with a
  soft shadow.
  - Dark: canvas `#141311`, sidebar `#1b1a17`, raised `#211f1c`.
- **Radius:** 8px for controls, 12px for cards, panels and dialogs, 6px for badges. No pills, except
  counters.
- **Elevation:**
  - `--shadow-raised` (1–2px contact plus a 4px blur) for the active sidebar item, cards and
    list containers
  - `--shadow-float` for popovers
  - `--shadow-modal` for dialogs
- **Type:**
  - DM Sans for the UI (14–15px). A ruling: no new font; DM Sans is close to the Inter Tight
    used in the preview.
  - Source Serif 4 for page titles (26–30px) and card titles.
  - JetBrains Mono for references, counters and keyboard hints.
- **Badges** (`.badge`), 6px radius, 12px text:
  - `neutral`
  - `navy` (info)
  - `wax` (overdue or urgent)
  - `khaki` (done or chosen)

## 2. App shell

- **Desktop (≥ 56rem):** a two-column grid, with a sidebar 15rem wide and the main column.
- **Sidebar**, `Sidebar.svelte`: sticky, full height, scrolls on its own.
  - The wordmark.
  - Navigation items with icons, in this order: Nachrichten (news), Werkzeuge (tool),
    Normen (scale), Notizen (notes), Fristen (clock), Berichte (file-text).
    - Fristen and Berichte only show when signed in, or in the preview.
    - The active item is a raised white row with a khaki icon.
  - **Fristen counter:** the number of open deadlines due within 7 days. It turns wax when one is
    overdue.
    - Loaded in the browser from the record store.
    - Hidden when there are no such deadlines, or the store is not available (signed out in the
      full app).
  - **"Konto" group:** Mandanten and the workspace chip (when signed in), then the user name and
    logout, or the login link.
  - **Bottom of the sidebar:**
    - the preview chip
    - language and theme
    - small links: Impressum, Datenschutz, "Keine Rechtsberatung"
- **Top bar**, `Topbar.svelte`, at the top of the main column and sticky:
  - On the left, a search button that looks like a field ("Suchen oder springen …" plus the
    shortcut `⌘K` or `Strg K`). It opens the command palette.
  - On the right, the workspace chip when signed in.
- **Phone (< 56rem):**
  - The top bar shows the wordmark, a search icon button and the menu button.
  - The menu opens the existing sheet, which now shows the same content as the sidebar (icons and
    counter).
  - The footer stays at the end of the page.
- **Preview bar:** the bar above the page goes away. Its message lives on `/vorschau` and in the
  preview chip's tooltip.

## 3. Command palette (`CommandPalette.svelte`, Bits UI Command inside the Daily Modal)

- **Opened by:** `⌘K` / `Ctrl+K` / `/` (when no field has focus), or by the search button.
- **Groups:**
  - **Bereiche:** the navigation items.
  - **Werkzeuge:** all 29 tools, by name and summary keywords.
  - **Aktionen:**
    - "Neue Notiz"
    - "Heutige Notiz"
    - "In den Normen suchen: ‹Anfrage›", which links to `/normen?q=…`
- **Keyboard and closing:** arrow keys and Enter, as in Bits Command. Esc closes. Choosing an
  entry navigates and closes.
- **Normen query:** `/normen` reads `q` and fills the search with it.

## 4. Shared page pieces

- **`PageHeader.svelte`:**
  - an optional eyebrow, or a breadcrumb such as "Werkzeuge / Datenpanne"
  - the serif title, an optional description, and status and citations
  - an actions snippet on the right; on phones it wraps below
- **Lists, through `RecordTable`:**
  - Records show as rows in a raised container with a 12px radius.
  - Each row has the title in 15px/600, and a second line with the state and the main columns
    in ink3.
  - The status badge sits on the right, and so does the next deadline when there is one.
  - Rows are at least 56px high; hovering tints them navy-soft.
  - The table semantics stay (a `<table>` styled as rows), so CSV export and screen readers are
    unchanged.
- **Cards:**
  - 12px radius, raised.
  - The catalogue keeps "Karteikarte" (the area spine and chapter number), with softer corners.
- **Dialogs and popovers:** 12px radius.

## 5. Pages

Every route adopts the shell, `PageHeader` and the new tokens:

- home, Nachrichten, the tool catalogue, the tool page, questionnaire and result, records (list,
  form, view)
- Fristen, Normen (overview, law, provision), Notizen, Berichte, Mandanten, Repo-Check,
  Guardrail-Test, Vorschau, Impressum, Datenschutz

Content and behaviour stay the same.

## 6. Testing

- Unit tests for the palette's tool keyword matching, a pure function in `src/lib/ui/command.ts`.
- E2E:
  - **Command palette:** `Ctrl+K`, type "Daten", Enter opens Datenpanne; `/` opens it; Esc closes
    it.
  - **Sidebar:** the active item, and the Fristen counter appearing after a deadline record is
    saved (preview).
  - **Phone:** the menu sheet shows the same items. There is no sideways scroll.
  - Existing flows are updated where selectors change (for example `.masthead .org` becomes
    `.org`).
- Phone audit and screenshots: light and dark, 1280 and 375, for the shell, catalogue, records
  list, form, Normen and the palette.
- A fresh final review.

## 7. Out of scope

- Searching record contents in the palette.
- A collapsible or icon-only sidebar.
- New fonts.
