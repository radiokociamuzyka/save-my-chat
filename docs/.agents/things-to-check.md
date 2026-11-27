# Things to check

Kept by Cleo. What waits for Sett's decision, and what was written and not
verified. A point leaves this page when it is settled. Dates say when the
point was added.

## Decisions for Sett

- **2026-11-26. Jarvis and Joker have branches** (`dev/Jarvis`,
  `dev/Joker`) but no line in `.github/AUTHORS` here; only Sett can add
  them (Q4 named the branches, not the members).

## Not verified

- **2026-11-26. `release.yml` has not run yet.** It runs on the first
  merge of `development` into `master`: tag, release with the zip,
  `master` back into `development`. Unsigned until the AMO secrets exist.

- **2026-11-26. AI Mode's classes are Sett's, not seen by Cleo.** Tests
  use hand-made pages with `.ilZyRc`, `.L4dlbc`, `.CKgc1d`. Sett's snippet
  itself missed some user messages, so at least one class is still
  unknown; the popup now warns when that happens. A saved AI Mode page
  (`tests/fixtures/google-ai-mode.html`) would settle it.
- **2026-11-26. The Copilot reader is still a guess** (`// NOTE: unverified`):
  no snippet of Sett's yet.
- **2026-11-26. Not run in a real Firefox by Cleo.** Sett ran v0.0.1; the
  turndown build (0.1.0) was checked by `web-ext lint` and jsdom only.
- **2026-11-26. No icons.** Firefox shows a default puzzle piece; AMO
  listing will want 48 and 96 px icons.
- **2026-11-26. `task devlog:state`** calls the BOS core from npm
  (`blacksmith-organization-system@next`), copied from P_JOL_ROLL; not run here.
- **2026-11-27. `dependabot.yml`'s first runs.** `follow` on the push of
  this batch to `development`; `land` after dependabot's next pull request
  is merged into `dev/dependabot`. `land` may warn until Q11's setting is on.
- **2026-11-27. The new id in Firefox.** `save-my-chat@radiokociamuzyka.pl`
  passed `web-ext lint`; not yet loaded as a temporary add-on by anyone.
- **2026-11-27. The planned chats' patterns** in `resources/data/chats.yaml`
  are from memory of those sites, `verified: false`; each is checked when
  its reader is written (phase 5).
- **2026-11-27. The Copilot reader on the live page.** Rebuilt from Sett's
  snippet; run only on hand-made pages in jsdom. To check: messages found
  in order, the turndown text has no leftover labels ("You said",
  avatars, names) that `innerText` hid or showed, the title is the chat's.
