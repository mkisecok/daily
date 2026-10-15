# Phone menu, cards and components implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Daily works and feels finished on a phone. It gets a hamburger sheet menu, index cards,
and accessible Bits UI components for dropdowns, date pickers, chips and switches.

**Architecture:** Bits UI primitives are wrapped once in `src/lib/ui/form/*.svelte` and styled with
Daily tokens. Pages and `FieldInput` use the wrappers. Date conversion is pure and tested in
`dates.ts`. The phone menu is a native `<dialog>` sheet.

**Tech stack:** SvelteKit 3, Svelte 5, bits-ui 2.19.3, @internationalized/date 3.12.4, Playwright,
Vitest.

**Spec:** `docs/superpowers/specs/2026-10-15-phone-menu-cards-components-design.md`

## Global constraints

- Versions pinned exactly: `bits-ui@2.19.3` and `@internationalized/date@3.12.4`.
- Styling:
  - Daily tokens only; no Tailwind.
  - Khaki marks chosen items, navy marks focus, wax marks danger.
  - 3px radius; shadows only on floating layers.
- Svelte files:
  - `@component` comment at the top
  - runes
  - nested CSS
  - no `:global`
  - no async `onMount`
  - no `$effect` that sets state
  - autofixer clean
- Comments start lower case; single-sentence comments have no closing period.
- Stored values keep their formats:
  - date: `YYYY-MM-DD`
  - datetime: `YYYY-MM-DDTHH:mm` (German time, as today)
  - select: a string
  - multiselect: `string[]`
- Small conventional commits ending with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review focus

1. **Clearing a date or select:** the field must store `''` / `null` exactly as today, so
   validation of required fields still works. Covered by `dates.spec.ts`; E2E saves without a date.
2. **Labels:** `getByLabel` and screen readers must still find every field through `<label for>`.
   Checked in E2E through the helpers, which use labels.
3. **Phone menu with keyboard:**
   - Tab stays in the sheet.
   - Esc closes it and focus returns to the button.
   - E2E checks the button has focus after Esc.
4. **Datetime around the DST change (25 Oct 2026):** the stored string must equal what was picked,
   with no timezone conversion in the component. Covered in `dates.spec.ts`.
5. **Static preview:** the components must not break prerendering, so no browser-only APIs at
   module level. Covered by the preview E2E.

### Task 1: Dependencies and date conversion

- [ ] Commit `package.json` and `pnpm-lock.yaml` (already installed, pinned).
- [ ] TDD `src/lib/ui/form/dates.ts`:
  - `toDateValue(text: string, granularity: 'day' | 'minute'): CalendarDate | CalendarDateTime | undefined`
  - `fromDateValue(value: DateValue | undefined, granularity): string`
  - Cases:
    - `'2026-10-25T02:30'` round-trips unchanged
    - `''` gives `undefined`, and `undefined` gives `''`
    - `'garbage'` gives `undefined`
    - a day value round-trips
- [ ] Commits: `build: add bits-ui and @internationalized/date` and
      `feat(ui): date conversion for the date picker`.

### Task 2: Form components and FieldInput

- [ ] `Select`, `Combobox`, `DatePicker`, `Chips` and `Switch` in `src/lib/ui/form/`. Props:
  - `Select`: `{ id, value: string ($bindable), items: {value,label}[], placeholder, describedBy?, invalid?, required? }`
  - `Combobox`: the same, plus `empty` text
  - `DatePicker`: `{ id, value: string ($bindable), granularity, describedBy?, invalid?, required? }`;
    locale from `getLocale()`; `weekStartsOn={1}`; `hourCycle={24}`
  - `Chips`: `{ value: string[] ($bindable), items, label, describedBy? }`
  - `Switch`: `{ id, checked ($bindable), label }`
- [ ] `FieldInput` uses them for select, reference, date, datetime and multiselect.
- [ ] `notizen` date field → DatePicker; guardrail prompt sets → Switch.
- [ ] E2E helpers in `src/routes/e2e-helpers.ts`, replacing every `selectOption`, date `fill`
      and multiselect `check` in the E2E files:

```ts
export async function choose(page: Page, label: string | RegExp, option: string) {
	await page.getByLabel(label, { exact: typeof label === 'string' }).click();
	await page.getByRole('option', { name: option, exact: true }).click();
}
export async function pickDate(page: Page, label: string, value: string) {
	const [date, time] = value.split('T');
	const [y, m, d] = date.split('-');
	const field = page.getByRole('group', { name: label });
	await field.getByRole('spinbutton').first().click();
	await page.keyboard.type(`${d}${m}${y}${time ? time.replace(':', '') : ''}`);
}
```

- [ ] Run the autofixer on each file; `pnpm check`; full E2E (server and preview).
- [ ] Commits:
  - one per component (`feat(ui): …`)
  - `refactor(records): fields use the Daily components`
  - `test(e2e): helpers for the new components`

### Task 3: Phone menu

- [ ] `src/lib/ui/MenuSheet.svelte` and the Masthead changes from spec §2.
- [ ] `PreviewNotice` hidden below 56rem; Vorschau chip in the masthead.
- [ ] E2E (phone viewport 375):
  - the menu button opens the dialog with 6 items
  - clicking "Normen" navigates and the dialog closes
  - Esc returns focus to the button
- [ ] Commit: `feat(ui): phone menu as a sheet`.

### Task 4: Index cards

- [ ] `.card.index` with the spine via `data-area`, chapter numbers and citation chips in the
      catalogue.
- [ ] Commit: `feat(ui): index cards in the catalogue`.

### Task 5: Phone fixes

- [ ] Normen table of contents rows ≥ 44px below 40rem; citation link padding; toolbar buttons
      full width below 24rem.
- [ ] Commit: `fix(ui): larger tap targets on phones`.

### Task 6: Verify and ship

- [ ] unit, db, server E2E, preview E2E; phone audit at 320 and 375; screenshots.
- [ ] Fresh final review (Opus), fix pass for Critical and Important findings, design spec §9 and
      memory, push, Pages green.
