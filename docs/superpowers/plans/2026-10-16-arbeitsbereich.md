# Arbeitsbereich implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (Task 5 may fan out
> to parallel agents per page area). Steps use `- [ ]`.

**Goal:** Turn Daily into an app shell with a sidebar, a top bar with a ⌘K command palette,
modern tokens (radius, elevation, badges) and restyled pages. Content and behaviour stay the same.

**Architecture:**

- `src/lib/ui/nav.ts` builds the navigation model once. The sidebar (desktop) and the menu sheet
  (phone) both render it.
- `+layout.svelte` becomes a grid: Sidebar beside a column of Topbar and main.
- The palette is a Bits UI Command inside the Daily Modal, filled from the nav model, the tool
  registry and a few actions. The ranking logic is a pure function in `command.ts`.

**Tech stack:** SvelteKit 3, Svelte 5, bits-ui 2.19.3, Playwright, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-16-arbeitsbereich-design.md`

## Global constraints

- Palette and roles are unchanged: khaki `#4f5126` acts, navy `#16294a` navigates, wax `#8b2c1f`
  warns.
- Radius: 8px for controls, 12px for cards, panels and dialogs, 6px for badges.
- Shadows: `--shadow-raised`, `--shadow-float` and `--shadow-modal` only.
- Fonts: DM Sans, Source Serif 4 and JetBrains Mono only. No new font packages.
- Svelte conventions:
  - `@component` comment
  - runes
  - nested CSS
  - no `:global`
  - no async `onMount`
  - no `$effect` that sets state
  - autofixer clean
- Comments start lower case; single-sentence comments have no closing period.
- Small conventional commits with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- After the shell lands, every route renders inside it. No page may scroll sideways at 320px.

## Review focus

1. **Palette shortcut while typing:** `/` or `Ctrl+K` pressed in a text field must not steal
   typing. `/` only opens the palette when no editable element has focus. Covered by E2E: type "/"
   in a note title.
2. **Sidebar counter with no store:** it stays hidden when signed out in the full app, and nothing
   throws. Covered by the server E2E on the home page while signed out.
3. **Keyboard users:** a skip link goes to main. The sidebar is a `nav` landmark, and focus order
   runs sidebar → top bar → main. Covered by E2E: Tab from the page start reaches "Zum Inhalt".
4. **Print:** sidebar and top bar are hidden in print; reports and records print as before.
   Checked through print media emulation in E2E.
5. **Static preview base path:** every link in the sidebar and the palette resolves under
   `/daily`. Covered by the preview E2E.

### Task 1: Tokens, badges and radii

- [ ] `tokens.css`:
  - `--canvas`, `--sidebar`, `--raised` (light and dark)
  - `--radius: 8px`, `--radius-card: 12px`, `--radius-badge: 6px`
  - `--shadow-raised`
  - body background becomes `--canvas`
- [ ] `primitives.css`:
  - `.card` uses `--radius-card` and `--shadow-raised`, with a softer border
  - `.badge` variants (neutral, navy, wax, khaki)
- [ ] `controls.css`, `forms.css`, Modal and popover: use the new radii.
- [ ] Commit: `feat(ui): Arbeitsbereich tokens, radii and badges`.

### Task 2: App shell

- [ ] `src/lib/ui/nav.ts`: `navItems({ user, preview, route })` →
      `{ id, path, label, icon, current }[]`.
- [ ] `Sidebar.svelte`, `Topbar.svelte`, `DeadlineCount.svelte`:
  - the counter loads in the browser from `getStore().deadlines()` behind `browser`
  - it is hidden on errors or when signed out (full app)
- [ ] `MenuSheet` renders the nav model with icons and the counter.
- [ ] `+layout.svelte`:
  - the grid
  - a skip link
  - `Masthead`, `PreviewNotice` and the old Footer replaced (delete unused files)
  - print hides the shell
- [ ] E2E selector updates and new sidebar/skip-link tests. Commits per component plus
      `refactor(ui): layout as an app shell`.

### Task 3: Command palette

- [ ] TDD `src/lib/ui/command.ts`: `rank(entries, query)` matches case- and accent-insensitive on
      label and keywords. Label prefix matches come before contains matches, and those before
      keyword matches. An empty query keeps the original order.
- [ ] `CommandPalette.svelte`: Bits Command, opened by the shortcuts (with the editable-element
      guard) and by the top bar button.
- [ ] `/normen` reads `q` and fills the search.
- [ ] E2E (preview): `Ctrl+K` → "Daten" → Enter → Datenpanne; `/` opens it; `/` typed in a
      field does not open it; Esc closes it.
- [ ] Commits: `feat(ui): command palette ranking`, `feat(ui): command palette`,
      `feat(normen): search from the address`.

### Task 4: PageHeader and record rows

- [ ] `PageHeader.svelte` (eyebrow or breadcrumb, title, description, actions snippet).
- [ ] `RecordTable` as row cards (the table semantics stay).
- [ ] Commits: `feat(ui): page header`, `feat(records): list as rows`.

### Task 5: Pages

Parallel agents, by area:

- **A:** home, Nachrichten, Vorschau, Impressum, Datenschutz
- **B:** catalogue, tool page, questionnaire, result, Repo-Check, Guardrail
- **C:** records list, form and view, Fristen, Mandanten
- **D:** Normen (all three), Notizen, Berichte

Each agent:

- uses `PageHeader`, badges and cards
- runs the autofixer, `check` and `lint`
- takes a screenshot of every page in its area at 375px and 1280px, light and dark

Commit per area.

### Task 6: Verify and ship

- [ ] unit, db, server E2E, preview E2E; phone audit; screenshots.
- [ ] Fresh final review (Opus), fix pass, design spec §9, memory, push, Pages green.
