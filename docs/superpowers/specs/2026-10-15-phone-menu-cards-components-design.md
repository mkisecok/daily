# Phone menu, index cards and interactive components

Written 2026-10-15. The user chose:

- phone menu A "Aktenschrank"
- Bits UI with Daily's own styling, instead of HeroUI (React-only)

The user had no preference on the card design, so the recommended "Karteikarte" was taken. Every
page must work well on a phone.

## 1. Findings that drive this (audit at 320px and 375px, 18 pages)

- No page scrolls sideways.
- The preview bar takes about 120px on a phone, above the sticky masthead.
- The navigation line is cut off ("Fris…"), so later items are hard to find.
- Tap targets under 24px:
  - the masthead links, on every page
  - citation links in forms
  - the Normen table of contents, with about 220 small rows

## 2. Phone menu "Aktenschrank" (below 56rem)

- **Masthead:** wordmark, a small "Vorschau" chip (preview build only, links to `/vorschau`),
  and a menu button (`aria-expanded`, `aria-controls`, label "Menü").
- **Phone layout:** the inline nav, the language and theme switches and the account form are
  hidden. The preview bar above the masthead is hidden.
- **Desktop:** unchanged.
- **`MenuSheet.svelte`:** a native `<dialog>` opened with `showModal()`. It slides in from the
  right, at full height and `min(22rem, 100vw)` wide.
  - Nav items:
    - Numbered I–VI in mono, labels in serif 18px.
    - Each row is at least 48px high.
    - The current page gets a khaki 3px inset bar and `aria-current`.
  - Below the items:
    - Mandanten and the account (name, logout) when signed in, otherwise the login link
      (full app only).
    - A footer row with language and theme.
  - It closes on Esc, a backdrop click, the close button, and after navigation
    (`afterNavigate`).
  - Focus returns to the menu button.
- **Reduced motion:** no slide animation.

## 3. Index cards "Karteikarte"

- **Catalogue cards:**
  - Category spine: a 4px inset shadow on the left, so the 3px radius stays.
    - Datenschutz: navy
    - KI: wax
    - Audit: khaki
    - Other: ink3
  - Chapter number "I.7": the category numeral plus the position, in mono, coloured like the
    spine.
  - Status top right.
  - Serif title, summary.
  - Citations as small chips: rule border, 3px radius, mono 11px.
- **Shared style:** `.card.index` in `primitives.css` holds the spine and the chip styles. The
  subgrid alignment from before stays.

## 4. Components on Bits UI 2.19.3 (MIT), in `src/lib/ui/form/`

All components are styled with the Daily tokens: no Tailwind, nested CSS, khaki for chosen
items, navy for focus.

| Component           | Bits UI primitive      | Replaces                                        | Notes                                                                                                                                                             |
| ------------------- | ---------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Select.svelte`     | Select (single)        | `select` fields in records                      | Trigger looks like a field with a chevron. List: sheet background, `--shadow-float`, khaki check, navy-soft highlight. `id` on the trigger keeps `<label for>`    |
| `Combobox.svelte`   | Combobox               | reference fields (records of other tools)       | Type to filter; "Keine Treffer" when nothing matches                                                                                                              |
| `DatePicker.svelte` | DatePicker             | `date` and `datetime` fields, and the note date | Segments in the de/en locale, a calendar in a popover, weeks starting on Monday, 24h clock. The value stays the stored string (`YYYY-MM-DD` / `YYYY-MM-DDTHH:mm`) |
| `Chips.svelte`      | ToggleGroup (multiple) | `multiselect` fields                            | Chips with a check when chosen, wrapping                                                                                                                          |
| `Switch.svelte`     | Switch                 | the prompt-set checkboxes in Guardrail-Test     | Khaki when on                                                                                                                                                     |

Yes/no fields and questionnaire answers stay radio tiles: they need an "unanswered" state, which a
switch cannot show.

Pure conversion helpers live in `src/lib/ui/form/dates.ts`, with tests:
`toDateValue(text, granularity)` and `fromDateValue(value, granularity)`.

## 5. Other phone fixes

- **Normen table of contents:** rows at least 44px high on phones.
- **Citation links:** at least 24px high (padding).
- **Toolbars on phones:** wrap, with full-width buttons below 24rem.

## 6. Testing

- Unit tests for the date conversion: day, minute, empty, invalid, and DST dates stay as typed.
- E2E helpers in `src/routes/e2e-helpers.ts`, used by every flow:
  - `choose(page, label, option)`
  - `pickDate(page, label, value)`
  - `toggleChip(group, name)`
- New E2E:
  - The phone menu opens, lists the items, navigates and closes; it also closes on Esc.
  - The combobox filters.
  - The date picker calendar sets a date.
- The phone audit (no sideways scroll; tap targets in the menu ≥ 44px) and screenshots in light
  and dark, at 375px and 1280px.

## 7. Out of scope

- A date range picker for Berichte; it keeps its select.
- Swipe gestures.
