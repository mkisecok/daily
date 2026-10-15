# Forms and dialogs implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Daily the darker palette "Tinte und Oliv" and khaki primary buttons. Add global
form styles, plus Icon, Modal, ConfirmDialog, Tooltip and cards, and use them across the app.

**Architecture:**

- Visual rules live in global stylesheets: `tokens.css`, a new `forms.css`, and `primitives.css`.
  Components only add layout.
- Behaviour that needs state lives in small Svelte 5 components in `src/lib/ui/`. The one piece of
  logic worth unit-testing, the typed-word match, is a pure function in `src/lib/ui/confirm.ts`.

**Tech stack:** SvelteKit 3, Svelte 5 runes, plain CSS with `&` nesting, Playwright, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-15-forms-and-dialogs-design.md`

## Global constraints

- Colours, light mode:
  - navy `#16294a`
  - wax `#8b2c1f`
  - khaki `#4f5126`, strong `#3f411e`
  - text on khaki and on wax `#fffdf9`
- Colours, dark mode:
  - navy `#8fb0dc`
  - wax `#e07a6a`
  - khaki `#b9b97a`, strong `#cfcf93`
  - text on khaki and on wax `#141311`
- Colour roles:
  - khaki: primary actions, chosen options, checked boxes, done
  - navy: links, citations, focus ring, tooltips, preview bar
  - wax: overdue, destructive actions, required marker
- `--radius: 3px`. Shadows only on floating layers (`--shadow-float`, `--shadow-modal`).
- No purple, gradients, glow, pills or emoji. Buttons use sentence case, DM Sans 500, 14px.
- Svelte files:
  - start with `<!-- @component -->` when they live in `src/lib`
  - use runes
  - nest CSS with `&`, with no `:global`
  - never pass an async function to `onMount`
  - pass the autofixer
- Comments start in lower case. Single-sentence comments have no closing period.
- Small conventional commits, each ending with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review focus

1. **Typed confirmation with odd input** (`" Archivieren "`, `"ARCHIVIEREN"`, an empty word):
   case and surrounding spaces are ignored, and an empty word never confirms. Covered in Task 3
   (`confirm.spec.ts`).
2. **Esc or a backdrop click while a dialog is open:** the action must not run, and focus returns
   to the trigger. Covered in Task 5 (E2E).
3. **Keyboard-only users and tooltips:** the text appears on focus and closes on Esc. Covered in
   Task 4 (E2E).
4. **Dark mode:** khaki buttons keep dark text, and checkboxes stay visible. Covered by the
   screenshots in Task 7 and the contrast check in Task 1.
5. **Browsers without `appearance: base-select`, anchor positioning or `field-sizing`:** the native
   fallback stays usable. These features are only enabled inside `@supports` blocks (Tasks 2
   and 4).

---

### Task 1: Palette and tokens

**Files:** modify `src/styles/tokens.css`.

- [ ] Replace the light and dark values of `--navy`, `--wax` and `--khaki`, and their `-soft`
      tints, using the RGB values above at 0.09–0.12 alpha.
- [ ] Add these tokens:
  - `--khaki-strong`, `--on-khaki`, `--on-wax`
  - `--radius: 3px`
  - `--shadow-float: 0 6px 18px rgb(28 27 25 / 0.1)`
  - `--shadow-modal: 0 16px 40px rgb(28 27 25 / 0.2)`
  - darker shadow values in dark mode
- [ ] Rewrite the header comment: the three colour roles, and shadows on floating layers only.
- [ ] Contrast check with Python (WCAG formula). The text-on-colour pairs must be ≥ 7:1 in light
      mode and ≥ 6:1 in dark mode.
- [ ] `pnpm check`, then commit as `feat(ui): darker palette with khaki as the action colour`.

### Task 2: Global form styles and Icon

**Files:**

- Create `src/styles/forms.css` and `src/lib/ui/Icon.svelte`.
- Modify `src/routes/+layout.svelte` (import `forms.css` after `primitives.css`).
- Modify `src/styles/primitives.css`: `.toolbar` buttons become the new buttons; add `.card`.
- Modify `FieldInput.svelte`, `QuestionRow.svelte`, `PreviewNotice.svelte`.

**Interfaces produced:**

- `Icon` props: `{ name: IconName; size?: number; label?: string }`.
- `IconName` is a union of: archive, eye, check, x, selector, alert-triangle, info-circle,
  calendar, clock, download, printer, trash, edit, plus, search, external-link, scale, file-text,
  shield-lock, lock.
- CSS classes:
  - `.choices` (tiles)
  - `.button`, `.quiet`, `.danger`, `.ghost`
  - `.card`, `.card.accent`

**Steps:**

- [ ] `forms.css` (all rules nested):
  - fields: sheet background, rule border, radius, ink3 border on hover, navy border plus 3px
    navy-soft ring on focus, wax border when `aria-invalid='true'`
  - textarea: `field-sizing: content` inside `@supports`, `min-height: 6lh`
  - select: `appearance: none`, chevron as a background SVG data URI (Tabler `selector` path,
    stroke `#8a857b`)
  - `@supports (appearance: base-select)` block: `select, ::picker(select)` with
    `appearance: base-select`; the picker gets sheet background, rule border, radius and
    `--shadow-float`; `option:checked` gets a khaki check via `::checkmark`; hover gets a
    navy-soft background
  - checkbox and radio: `appearance: none`, 16px, ink3 border; checked checkbox is khaki with a
    white check (mask of the check path); checked radio is a 4px khaki border on sheet
  - `.choices label`: tile with border, radius, padding `0.55rem 0.8rem`, serif 15px;
    `:has(:checked)` gets khaki border and khaki-soft background; `:has(:focus-visible)` gets the
    navy ring
- [ ] Buttons in `primitives.css`:
  - `.toolbar` keeps flex and gap but drops the mono caps
  - `button` and `.button` inside the toolbar, and a standalone `.button`, are khaki on
    `--on-khaki`, with `--khaki-strong` on hover
  - `.quiet`: sheet background, rule border, ink text; hover ink3 border
  - `.danger`: wax on `--on-wax`
  - `.ghost`: transparent background, navy text
  - disabled: 0.45 opacity
- [ ] `.card` and `.card.accent` in `primitives.css`.
- [ ] `Icon.svelte`: an SVG 24×24 viewBox, `fill="none"`, `stroke="currentColor"`,
      `stroke-width="1.5"`, round caps and joins. Paths come from a `const PATHS:
      Record<IconName, string[]>` copied from Tabler 3.x (MIT; the licence header comment
      names the source).
- [ ] `FieldInput`: delete the local field, input and choice styles (keep grid, label, help,
      error and cite layout). The boolean and multiselect `.choices` become tiles through the
      global CSS.
- [ ] `QuestionRow`: wrap the answers in `.choices` and remove the duplicate local styles.
- [ ] `PreviewNotice`: `Icon name="eye"`, sentence-case text, navy 3px left rule, sheet
      background.
- [ ] Mark the main action of each toolbar as primary and the rest `.quiet`; destructive ones
      `.danger`.
- [ ] Autofixer on changed Svelte files; `pnpm check`, `pnpm lint`; existing E2E stays green.
- [ ] Commits:
  - `feat(ui): global form controls and buttons`
  - `feat(ui): outline icons`
  - `refactor(records): fields use the global form styles`
  - `refactor(tools): questionnaire answers as choice tiles`
  - `feat(ui): preview bar with icon`

### Task 3: Typed-word match helper

**Files:** create `src/lib/ui/confirm.ts` and `src/lib/ui/confirm.spec.ts`.

**Interface produced:**
`export function confirmMatches(typed: string, word: string | undefined): boolean`

- [ ] Write the failing spec:

```ts
import { describe, expect, it } from 'vitest';
import { confirmMatches } from './confirm.js';

describe('typed confirmation', () => {
	it('confirms without a word and ignores case and outer spaces', () => {
		expect(confirmMatches('', undefined)).toBe(true);
		expect(confirmMatches(' Archivieren ', 'archivieren')).toBe(true);
		expect(confirmMatches('ARCHIVIEREN', 'archivieren')).toBe(true);
	});

	it('rejects other or empty input', () => {
		expect(confirmMatches('archiv', 'archivieren')).toBe(false);
		expect(confirmMatches('', 'archivieren')).toBe(false);
		expect(confirmMatches('   ', 'löschen')).toBe(false);
	});
});
```

- [ ] Run `pnpm exec vitest run --project server src/lib/ui/confirm.spec.ts` and expect it to fail
      (module missing).
- [ ] Implement:

```ts
/** whether the typed text confirms; no word means nothing to type */
export function confirmMatches(typed: string, word: string | undefined): boolean {
	if (word === undefined) return true;
	const wanted = word.trim().toLocaleLowerCase('de');
	return wanted !== '' && typed.trim().toLocaleLowerCase('de') === wanted;
}
```

- [ ] Run it again and expect a pass. Commit as `feat(ui): typed confirmation rule`.

### Task 4: Modal, ConfirmDialog and Tooltip

**Files:** create `src/lib/ui/Modal.svelte`, `src/lib/ui/ConfirmDialog.svelte` and
`src/lib/ui/Tooltip.svelte`.

**Interfaces produced:**

- `Modal` props:
  `{ open: boolean ($bindable); title: string; onclose?: () => void; children: Snippet; actions?: Snippet }`
- `ConfirmDialog` props:
  `{ open: boolean ($bindable); title: string; body: string; confirmLabel: string; tone?: 'action' | 'danger'; icon?: IconName; typeToConfirm?: string; onconfirm: () => void }`
- `Tooltip` props: `{ text: string; children: Snippet }`

**Steps:**

- [ ] **Modal:**
  - `<dialog bind:this={dialog}>`. A `$effect` syncs `open` to `showModal()` and `close()`.
    This is DOM sync, not state: the effect calls methods and sets no state.
  - `onclose` sets `open = false` and calls the prop.
  - A backdrop click (target is the dialog itself) closes it.
  - Styling: `::backdrop` ink at 35%; sheet; radius; `--shadow-modal`;
    `width: min(28rem, calc(100vw - 2rem))`; serif title; actions right-aligned in a `.toolbar`.
- [ ] **ConfirmDialog:**
  - uses Modal and a local `typed` state
  - the confirm button is disabled unless `confirmMatches(typed, typeToConfirm)`
  - `tone` danger uses `.danger`, otherwise primary
  - the input label is the message "Zur Bestätigung „{word}" eingeben"
  - `typed` resets to `''` when the dialog opens: done in the open handler, not in an effect
- [ ] **Tooltip:**
  - `<span class="anchor">` with `aria-describedby`
  - the bubble is `<span popover="manual" role="tooltip">`
  - show and hide via `showPopover()` / `hidePopover()` on pointerenter, pointerleave, focusin,
    focusout and Esc keydown
  - inside `@supports (anchor-name: --a)`: unique anchor name via `$props.id()`, `position-anchor`,
    `position-area: top`, `position-try-fallbacks: flip-block`
  - otherwise: the bubble shows below the trigger
- [ ] Messages (de/en) in `messages/*.json`: `confirm_type` ("Zur Bestätigung „{word}" eingeben" /
      "Type “{word}” to confirm") and `dialog_cancel` ("Abbrechen" / "Cancel"). Run
      `pnpm i18n:compile`.
- [ ] Autofixer on all three; `pnpm check`.
- [ ] Commit as `feat(ui): modal, confirmation dialog and tooltip`.

### Task 5: Use the dialogs

**Files:**

- `src/routes/werkzeuge/[slug]/eintraege/+page.svelte` (archive, delete local data)
- `src/routes/notizen/+page.svelte` (archive a note)
- `src/lib/records/ui/StateBar.svelte` (transitions)
- E2E: `records.e2e.ts`, `notizen.e2e.ts`, `records.preview.e2e.ts`, `mandanten.e2e.ts`,
  `audit.e2e.ts`; grep for `records_archive_confirm` and the transition button names

**Steps:**

- [ ] Replace the inline `confirmArchive` / `confirmClear` blocks with `ConfirmDialog`:
  - archiving: tone danger, icon archive, `typeToConfirm` "archivieren" (en "archive")
  - deleting local data: tone danger, icon trash, word "löschen" (en "delete")
- [ ] StateBar: the button opens `ConfirmDialog` (tone action, icon check). The body is
      "{from} → {to}". `ontransition` runs on confirm.
- [ ] Update the E2E flows. After clicking the transition or archive button:

```ts
const dialog = page.getByRole('dialog');
await dialog.getByLabel(/Zur Bestätigung/).fill('archivieren'); // only for typed ones
await dialog.getByRole('button', { name: 'Archivieren' }).click();
```

- [ ] New E2E in `records.e2e.ts`:
  - the archive button in the dialog is disabled until the word is typed
  - Esc closes the dialog and the record stays
  - tooltip: focus a citation link and expect `getByRole('tooltip')` to be visible
- [ ] Run `pnpm exec playwright test` and the preview E2E.
- [ ] Commits:
  - `feat(records): confirm archive and data deletion in a dialog`
  - `feat(records): confirm workflow transitions`
  - `feat(notizen): confirm archiving a note`
  - `test(e2e): dialogs and tooltips`

### Task 6: Tooltips and cards in place

**Files:**

- `src/lib/tools/_shared/Citation.svelte`, `src/lib/ui/ThemeSwitch.svelte`,
  `src/lib/ui/Masthead.svelte`, `src/routes/nachrichten/+page.svelte`
- `src/routes/werkzeuge/+page.svelte`, `src/lib/records/ui/RecordLinks.svelte`,
  `src/routes/berichte/+page.svelte`, `src/routes/fristen/+page.svelte`

**Steps:**

- [ ] Replace each `title=` with `<Tooltip text=…>`. Keep `aria-label`s that name icon-only
      buttons.
- [ ] Apply `.card` to the tool entries, link groups, report tool sections and deadline groups.
      Remove the now-duplicate local borders and padding.
- [ ] Autofixer, `pnpm check`, `pnpm lint`, E2E.
- [ ] Commits: `feat(ui): tooltips instead of title attributes` and `feat(ui): cards for tools,
      links, reports and deadlines`.

### Task 7: Verify, document, ship

- [ ] Run all of these:
  - `pnpm vitest run`
  - `pnpm test:db`
  - `pnpm exec playwright test`
  - `PUBLIC_BASE_PATH=/daily pnpm test:e2e:preview`
- [ ] Screenshots in the browser pane:
  - pages: record form (Datenpanne), questionnaire (DSFA-Schwellwert), confirm dialog, tool
    catalogue
  - light and dark, at 1280px and 375px
  - check: no horizontal scroll, focus rings visible, khaki buttons keep dark text in dark mode
- [ ] Design spec §9: one row for "Forms and dialogs".
- [ ] Memory: update the palette and roles in `daily-platform.md`.
- [ ] Push and watch the Pages run until it is green.
