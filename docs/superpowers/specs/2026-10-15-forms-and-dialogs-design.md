# Forms, dialogs and the darker palette

Written 2026-10-15. The user chose direction B ("Kanzlei modern"), palette 1 ("Tinte und Oliv")
and the colour roles below. The user also approved the design summary and asked to write the spec
and start. Tabler icons and confirming destructive actions by typing a word were proposed and
accepted together with the design.

## 1. Goal

Make Daily's forms, buttons, dropdowns, checkboxes and radios, dialogs, tooltips, cards and the
preview bar feel finished and elegant. They should combine a law office's formality with a modern
tool, without looking like a generic AI product: no purple, no gradients, no glow, no pills, no
emoji.

## 2. Colours

| Token            | Light                     | Dark      | Role                                                                   |
| ---------------- | ------------------------- | --------- | ---------------------------------------------------------------------- |
| `--navy`         | `#16294a`                 | `#8fb0dc` | Links, citations, focus ring, tooltips, preview bar (navigate, inform) |
| `--wax`          | `#8b2c1f`                 | `#e07a6a` | Overdue, destructive actions, required marker (warn, destroy)          |
| `--khaki`        | `#4f5126`                 | `#b9b97a` | Primary actions, chosen options, checked boxes, done (act, confirm)    |
| `--khaki-strong` | `#3f411e`                 | `#cfcf93` | Hover and pressed primary                                              |
| `--on-khaki`     | `#fffdf9`                 | `#141311` | Text on khaki                                                          |
| `--on-wax`       | `#fffdf9`                 | `#141311` | Text on wax                                                            |
| `--*-soft`       | 9–12% tint of each colour |           | Backgrounds of chosen tiles, badges, notices                           |

Contrast (light mode, on `#fffdf9`):

- Text on khaki is 8.2:1, wax 8.3:1, navy 14.3:1. All pass WCAG AAA.
- Dark mode values are above 6:1 on `#141311`.

The wordmark keeps D navy, AI wax, L khaki and Y ink.

Shape and depth:

- `--radius: 3px` for controls, cards and dialogs.
- `--shadow-float` for dropdown lists and tooltips, `--shadow-modal` for dialogs.
- Shadows are allowed only on floating layers. Page surfaces stay flat.
- The header comment of `tokens.css` is updated to match.

## 3. Global form styles: `src/styles/forms.css`

Imported after `primitives.css`. All rules are nested with `&`.

**Fields** (`input` other than checkbox, radio and file; `select`; `textarea`):

- Sheet background, 1px `--rule` border, `--radius`, padding `0.55rem 0.7rem`.
- Hover: `--ink3` border.
- Focus: `--navy` border plus a 3px `--navy-soft` ring. Invalid fields (`[aria-invalid='true']`)
  get a wax border.

**Textarea:**

- Grows with its content (`field-sizing: content`), minimum 4 lines. Browsers without it keep
  `resize: vertical`.

**Select:**

- Own chevron (Tabler `selector`) via `appearance: none` plus a background SVG.
- Where `appearance: base-select` is supported (`@supports`), the open list is styled too:
  - sheet background, `--shadow-float`
  - khaki check on the chosen option, navy-soft highlight on hover
- Other browsers show the native list, which stays accessible and suits phones.

**Checkbox:**

- `appearance: none`, 16px square, 1px `--ink3` border, `--radius` 2px.
- When checked: khaki fill with a white check mark (CSS mask from the Tabler `check` path).
- Focus shows the navy ring.

**Radio:**

- Same treatment as the checkbox, but round. Checked shows a 4px khaki ring on the sheet
  background.

**Choice tiles:** `.choices` with `label` children (record selects rendered as radios, and
questionnaire answers):

- Each option is a bordered row with the serif label.
- The chosen tile (`:has(input:checked)`) gets a khaki border and khaki-soft background.
- Tiles stack on narrow screens and sit in a row with wrapping on wide ones.

**Buttons:** `.button`, plus plain `button` inside `.toolbar`:

- Sentence case, DM Sans 500, 14px, padding `0.55rem 1.1rem`, `--radius`.
- Kinds:
  - **default primary:** khaki on `--on-khaki`
  - `.quiet` (secondary): sheet background, `--rule` border, ink text
  - `.danger`: wax on `--on-wax`
  - `.ghost`: no border, navy text
- Disabled buttons use 45% opacity and the `not-allowed` cursor.
- The mono caps style stays for the eyebrow labels only.

## 4. Components: `src/lib/ui/`

Each component gets an `@component` comment, Svelte 5 runes and nested CSS, and passes the
autofixer.

**`Icon.svelte`:**

- Props `{ name, size = 18, label? }`.
- About 20 Tabler outline paths (MIT): archive, eye, check, x, selector, alert-triangle,
  info-circle, calendar, clock, download, printer, trash, edit, plus, search, external-link,
  scale, file-text, shield-lock, lock.
- 1.5px stroke in `currentColor`. `aria-hidden` unless a label is given.
- The licence note sits in the file.

**`Modal.svelte`:**

- Props `{ open = $bindable(), title, onclose?, children, actions? }`.
- Uses the native `<dialog>` with `showModal()`, so the page behind is inert, focus moves into the
  dialog and Esc closes it.
- Backdrop is ink at 35%. Sheet with `--radius` and `--shadow-modal`, max 28rem wide.
- Title in serif. An action row at the bottom, right-aligned.
- Closes on backdrop click and on Esc, and returns focus to the trigger (the browser's default).

**`ConfirmDialog.svelte`** (built on Modal):

- Props `{ open, title, body, confirmLabel, tone: 'action' | 'danger', icon?, typeToConfirm?, onconfirm }`.
- With `typeToConfirm`, the confirm button stays disabled until the typed word matches,
  ignoring case and surrounding spaces.

**`Tooltip.svelte`:**

- Props `{ text, children }`. Wraps the trigger in a span and shows an ink bubble with sheet text
  (12px, max 18rem).
- Uses `popover="manual"`, opened on pointerenter and focusin, closed on pointerleave, focusout
  and Esc. `aria-describedby` points at the bubble.
- Positioned with CSS anchor positioning, above the trigger, flipping below. Browsers without it
  place the bubble below the trigger in the normal flow.
- Replaces the `title` attributes on Citation, ThemeSwitch, the organisation chip and the news
  source error marker.

**Cards (`.card` in `primitives.css`):**

- Sheet background, hairline border, `--radius`, padding `1rem 1.25rem`.
- `.card.accent` adds a 2px top rule in navy (khaki for done).
- Used on the tool catalogue, the record links, the report sections and the Fristen groups.

**Preview bar:** `PreviewNotice` gets the eye icon, a navy left rule and sentence-case text, and
the mono caps go.

## 5. Where it is applied

| Place                                                            | Change                                                                                                                                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FieldInput`                                                     | Uses the global field styles; local rules drop to layout only. Yes/no fields and multiselects render as choice tiles; select fields stay styled dropdowns (the DSFA risk grid and the E2E flows rely on them) |
| `QuestionRow`                                                    | Answers become choice tiles                                                                                                                                                                                   |
| Toolbars everywhere                                              | New buttons. The main action in each toolbar is primary; the others get `.quiet`                                                                                                                              |
| `eintraege` archive, "Lokale Daten löschen"                      | `ConfirmDialog`, danger, type `archivieren` / `löschen`                                                                                                                                                       |
| `StateBar` transitions                                           | `ConfirmDialog`, action tone: "Status ändern: erfasst → bewertet?"                                                                                                                                            |
| `notizen` delete (archive)                                       | `ConfirmDialog`, danger, typed word                                                                                                                                                                           |
| Notes editor, report form, Mandanten, Repo-Check, Guardrail-Test | Global field, checkbox and radio styles                                                                                                                                                                       |
| Citation, ThemeSwitch, organisation chip, news source error      | `Tooltip` instead of `title`                                                                                                                                                                                  |
| Werkzeuge, record links, Berichte, Fristen                       | `.card`                                                                                                                                                                                                       |

## 6. Accessibility

- Labels stay real `<label>` elements. Choice tiles remain native inputs, so arrow keys work in
  radio groups.
- Focus is always visible (navy ring). Dialogs trap focus natively.
- Tooltips are reachable by keyboard and close on Esc.
- No information is carried by colour alone: chosen tiles also show the filled radio, and overdue
  items keep their text label.

## 7. Testing

- Autofixer on every changed `.svelte` file; `pnpm check` and `pnpm lint`.
- Unit tests for the `ConfirmDialog` match rule: the comparison logic lives in a small `.ts` helper
  with a spec.
- E2E (server and preview) updated: archive, clear local data and transitions now go through the
  dialog.
- New E2E checks:
  - the dialog blocks until the word is typed
  - Esc cancels
  - tooltip text appears on focus
- Screenshots of the record form, questionnaire, dialog and tool catalogue, in light and dark, on
  desktop and phone. They go to the user for review; a computed-style diff makes no sense here
  because the change is deliberate.

## 8. Out of scope

- A custom JavaScript listbox or combobox. The styled native select is enough for now.
- Toasts. The status line stays as it is.
- Changing the masthead layout, which only gets the new link and focus colours.
