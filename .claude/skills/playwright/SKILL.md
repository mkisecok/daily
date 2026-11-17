---
name: playwright
description: Playwright MCP usage rules, screenshots, code sandbox, Chrome data. Auto-invoke when using Playwright MCP tools.
user-invocable: true
---

# Playwright MCP

- Save ad-hoc screenshots (browser_take_screenshot) to an absolute path outside the project, so they don't land as untracked files. This applies to screenshots YOU take for debugging/verification: NOT to automated test screenshots, which follow their own conventions (e.g. `tests/**/screenshots/`).
- Verify changes in the browser: open the affected URLs and take a screenshot, because a DOM snapshot can't show canvas, SVG, layout or visual state. If the screenshot can't confirm it (a blank WebGL canvas in headless), say so instead of claiming it's fixed.
- Script a Playwright check when you verify the same thing more than once or need a sequence of actions.
- `run_code` sandbox: use `page.waitForTimeout(ms)`, never `setTimeout`.
- NEVER delete Chrome user data dir (`mcp-chrome-*`). It has auth cookies.
- If Playwright can't launch because Chrome is already running, kill the existing Chrome process yourself: don't ask the user.
- **CSS/layout changes: ALWAYS take before/after screenshots.** Screenshot BEFORE making changes to establish a baseline, then screenshot AFTER to compare. This catches regressions instantly.
- **CSS/layout screenshots require CRITICAL EXAMINATION.** Before taking the screenshot, write the specific visual criteria that must be true (e.g. "rows must be offset", "gap must be uniform"). After taking the screenshot, check EACH criterion individually and state pass/fail for each. Do NOT glance at the screenshot and say "looks good." If any criterion fails, STOP: do not proceed. When in doubt, take MORE screenshots at different widths, do NOT ask the user to verify for you.
- **When a visual bug is reported, INVESTIGATE before guessing fixes.** Use `browser_evaluate` to measure actual element positions, sizes, and computed styles. Compare measured values against expected values. A 5-minute investigation with JS measurements beats hours of blind CSS tweaking. NEVER change formulas or constants without first understanding WHY the current values produce wrong results.
- **Use `browser_evaluate` to MEASURE, not just screenshot.** When debugging layout issues, use JS to read actual `getBoundingClientRect()` positions, `getComputedStyle()` values, `scrollHeight`, `clientWidth` etc. Comparing measured numbers reveals the root cause instantly: screenshots only show symptoms. This is the difference between 5 minutes of investigation and hours of blind guessing.
- **PIXEL DRIFT DETECTION**: When making CSS or HTML element changes, invoke `pixel-perfect`. It has the mandatory measurement workflow: measure BEFORE with `browser_evaluate`, apply change, measure AFTER, report a diff table. Screenshots supplement measurements: they are NOT the comparison. The numbers from `getBoundingClientRect()` and `getComputedStyle()` ARE the comparison. Never claim "looks the same" from eyeballing screenshots.
- Check the console after each navigation and interaction: a page that renders but throws console errors is not working.
