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
- **2026-11-27. The popup's report and the options' selector editor in a
  real Firefox.** Both tested in jsdom only; the clipboard write and the
  options page loading reader files as scripts are Firefox's to confirm.
- **2026-11-27. The static page's first push.** `pages.yml` after the
  next release creates the branch `github-pages` (tried here only against
  a local remote, twice: the second run said "the page is current"). It
  is served once Pages are set to deploy that branch from its root; the
  address should then be https://radiokociamuzyka.github.io/save-my-chat/,
  and it goes into the README and the repository's homepage field (also a
  setting).
- **2026-11-27. Prototypes in a real Firefox (RR2).** Built from MDN's
  userScripts pages (Firefox MV3) and tested with the APIs stubbed. Not
  known here: whether `runtime.onUserScriptMessage` gives `sender.tab`
  (not required now), whether `{ file }` sources load the vendored
  turndown in the `USER_SCRIPT` world, whether the permission request
  works from the options tab, and whether the event dispatched from the
  isolated world reaches the user script's listener with its string
  detail.
- **2026-11-27. The hotfix release without pushing master.** When a
  version reaches `master` already tagged, `release.sh` now tags a bump
  commit on top of `master` and the back job merges that tag into
  `development`. Not run yet (versions have always been new); `bash -n`
  only. The pages, wiki and feed workflows check out `master`, so after
  such a hotfix they show the version before the bump until the next
  release.
- **2026-11-27. The release to AMO (`amo.sh`).** The `amo` job of
  `release.yml` sends the released zip, unpacked, to `web-ext sign
  --channel listed` with the source archive and notes, not waiting for the
  review. Checked here: the download of the assets, the unpacking, the
  notes' JSON, the skip without secrets. Not run against AMO until the
  first release after it (v0.4.15's own merge comes before it, uploaded
  by hand or not at all). Not known: whether AMO takes `release_notes` as
  a translated field this way, and how it treats a new version sent while
  the one before still waits for review.
- **2026-11-27. The Vue popup in Firefox (RR5).** Built by Vite, mounted in
  jsdom and screenshot in Chromium with the APIs stubbed. Not seen: Firefox
  under the extension's CSP (no inline script was emitted, the module
  preload polyfill is off), Bulma's dark scheme in Firefox's popup panel,
  the clipboard write.
- **2026-11-27. The gist, against GitHub (Q9).** Tested with Octokit
  stubbed and the permission refused; never sent to GitHub for real (no
  token here). Not known: whether Firefox shows the optional data
  collection (`websiteContent`, `personalCommunications`) in the same
  prompt as `api.github.com`, and how the gist's files look on GitHub.
- **2026-11-27. The files explorer (Q8).** Run in a real Firefox
  (Selenium): IndexedDB, a commit, a file's history, Read. Not seen: a
  library of many chats (each sync reads every copy), or after an update
  of the extension (the repository should stay, its IndexedDB being the
  extension's).
- **2026-11-27. ZenFS's license.** Looked into in phase 5 (almanac:
  licenses-met): the combination is allowed. What was missing, the
  notice of LGPL 4(a) and the GPL text of 4(b), the build now writes
  (`THIRD-PARTY.md`, `licenses/GPL-3.0.txt`). Not checked: how AMO's
  reviewers read an LGPL library in a listed add-on; none has said a
  word on it so far.
- **2026-11-27. Gathering, never run on a live webapp.** Tested with
  Firefox's APIs stubbed and on the site's demo only. Not known yet:
  whether GitHub Copilot's sidebar holds plain links to
  `/copilot/c/<id>` (the generic finding of a list needs them), whether
  AI Mode lists its past chats at all, whether a webapp draws a chat in
  a tab that was never shown (a background tab may be throttled: the
  30 seconds may not do), and how a webapp takes a few dozen chats
  opened one after another. A sidebar loading more on scroll lists only
  what it has shown.
- **2026-11-27. The readers of ChatGPT, Claude and Gemini, unverified.**
  Written from those webapps' known structure (ChatGPT's
  `data-message-author-role`, Claude's `data-testid="user-message"` and
  `.font-claude-response`, Gemini's `user-query .query-text` and
  `model-response message-content`), tested on made-up pages only.
  Gemini's title comes from the sidebar's selected chat, a guess. Each
  says `NOTE: unverified`, `verified: false` in chats.yaml. RR7 asks.
