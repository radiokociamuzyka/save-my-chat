# Things to check

Kept by Cleo. What waits for Sett's decision, and what was written and not
verified. A point leaves this page when it is settled. Dates say when the
point was added.

## Decisions for Sett

- **2026-11-26.** Q1-Q6 in `docs/devlog/BRAINSTORM.md`: license, add-on
  id, listed or not, who commits, where the existing scripts are, build step.

## Not verified

- **2026-11-26. Both readers are guesses.** `google-ai-mode.js` and
  `github-copilot.js` were written without the live pages; their tests use
  hand-made pages with `data-smc-*` hooks, so they prove the logic, not the
  selectors. To be replaced by Sett's scripts (Q5) or checked on saved pages.
- **2026-11-26. Not run in a real Firefox yet.** `web-ext lint` passes and
  the logic is tested in jsdom; the popup → background → tab → download
  path has not been clicked through with `task run`.
- **2026-11-26. No icons.** Firefox shows a default puzzle piece; AMO
  listing will want 48 and 96 px icons.
- **2026-11-26. `task devlog:state`** calls the BOS core from npm
  (`blacksmith-organization-system@next`), copied from P_JOL_ROLL; not run here.
