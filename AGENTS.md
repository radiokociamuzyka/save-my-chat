# save-my-chat — guide for agents

A Firefox extension that reads a conversation out of a chat webapp (Google
Search AI Mode, GitHub Copilot, and others like them) and saves it on the
local machine in one clear, unified format. Part of the `radiokociamuzyka`
scope (`forge/radiokociamuzyka/save-my-chat`). The workshop-level rules in
`~/__WORKSHOP/AGENTS.md` still apply.

Who you work with and how a session goes is written down in the portfolio
repository: `forge/sarverott/github-repos/Sarverott/AGENTS.md` and its
`docs/agents/`. The owner is **Sett** (Sett Sarverott); Claude Code is called
**Cleo**, Codex **Joker**, GitHub Copilot **Jarvis**.

## Rules

1. **Who may commit.** An agent commits once a confirmed member has written
   it into `.github/AUTHORS`; until then it leaves its edits uncommitted
   and says what it changed and why. Cleo (Claude Code) was confirmed by
   Sett on 2026-11-26 (Q4), Jarvis (GitHub Copilot) and Joker (Codex) on
   2026-11-27 (Q11). A confirmed AI signs every commit with its name
   and lineage, the same as its line in `AUTHORS`:
   `Co-Authored-By: Cleo (Claude Opus 5.5) <noreply@anthropic.com>`.
2. **Where edits go: the BOS craft loop.** `master` (canon) →
   `development` → `revision` → `testing` → `releasing` → `master` through a
   pull request (`.github/bos.json`). Each contributor has its own branch
   made from `development`: `dev/Sarverott`, `dev/Cleo`, `dev/Jarvis`
   (GitHub Copilot), `dev/Joker` (Codex), `dev/dependabot`. Never commit on
   `master`. A finished, checked step of `docs/devlog/TODO.md` is one
   conventional commit (`type(scope): subject`) that ticks its box, with a
   body that says why. A troubled step - something broke, the view changed,
   the idea had to be adjusted - is split into commits of its conclusions,
   with the almanac case and new `Q<n>` in their own commits (Q4). Never
   `--no-verify`. When a batch is done, `dev/<name>` is merged into
   `development` with `--no-ff`; members push `development` and their own
   `dev/<name>`, and Cleo opens and tends pull requests (Sett, 2026-11-26).
   **Versions (Q7):** every commit on a `dev/*` branch bumps `Z` of
   `vX.Y.Z` by the pre-commit hook (`scripts/version.mjs`); never edit a
   version by hand and never `--amend` on `dev/*` (each amend bumps again).
   A phase ends with the dev branches gathered in `development` and a pull
   request `development` → `master`; its merge releases (`release.yml`:
   tag, packed extension, the latest, and the version submitted to AMO's
   listed channel with its source, `scripts/release/amo.sh`). **Every stop
   of work** (each report to Sett) first opens, or updates, that pull
   request, so its merge releases a build Sett tests in the wild (Sett,
   2026-11-27). Merging into `master` is asked for first, unless Sett hands
   it over for a stretch of work (2026-11-27: until phase 4 is done, or
   until trouble needs Sett); since a merge releases to AMO, that merge is
   the ask for its upload. Uploads by hand and repository settings are
   always asked for first.
   **The owner's edits** found in the working tree go first, as they are,
   one commit per change on `dev/Sarverott`, with a message saying how the
   agent understood them; then that branch is merged into `development`.
3. **Tasks arrive as `// NOTE: ` comments** (in READMEs and Taskfiles too).
   Build what is concrete, keep the NOTE in place, add `ANSWER:` when the
   note asked a question, and report the notes left with the question that
   blocks them.
4. **Nothing leaves the machine.** The extension reads the page the user
   has open and writes files through the downloads API. No telemetry, no
   remote code, no network requests of its own
   (`data_collection_permissions: none`). A change that would send anything
   anywhere is a question for Sett first. The one exception (Q9): a saved
   chat made a gist by the user's own click, with the user's token, an
   optional host permission and the transfer declared in
   `data_collection_permissions.optional`.
5. **No remote or evaluated code.** AMO rejects it. Default readers ship as
   files of the extension; the user's own prototypes run only through the
   `userScripts` API (an optional permission the user grants), never through
   `eval`, `new Function` or `<script>` injected into the page.
6. **One build step, for the pages only (Q12).** Vite builds the
   extension's pages from `.vue` files (`vite.config.mjs` `PAGES`) into
   `dist/extension/`, not minified, and copies the rest of `src/` as it
   is: the background, the kit and the readers stay plain JavaScript that
   Firefox runs as written. Every version uploaded to AMO goes with its
   source archive (a release asset) and the README's "Building from
   source". Another build step, minifying, or bundling the content
   scripts is a question first.

## Questions and plans

`docs/devlog/README.md` says how a batch moves. In short:

| It is | It goes to |
| ----- | ---------- |
| the owner's words | `docs/devlog/INQUIRIES.md` / `ORDERS.md` (or the chat), then `docs/changelog/phase-<n>.md`, word for word |
| a plan | `docs/devlog/VISION.md`, `ROADMAP.md`, `TODO.md` |
| a question for the owner | `docs/devlog/BRAINSTORM.md` as `## Q<n>. <title>` with a *Lean:*; never settled in code before the answer |
| work only the owner can do (a setting, a live check, an account) | `docs/devlog/REQUESTS.md` as `## RR<n>. <title>` with *Why:* and *How:*; the report goes word for word to the changelog as `### RR<n>` |
| an idea for debate | `docs/devlog/PROPOSALS.md` as `PP<n>` |
| an agent's findings and what was not verified | `docs/.agents/` (`NOTES.md`, `things-to-check.md`); humans read it and do not write there |
| a problem met and solved | `docs/almanac/`: its case in `cataclistics/`, a line in its topic in `solutions/` |
| work for another repository | `~/__WORKSHOP/forge/NOTES-for-repositories.md`, never the other repository itself |

## Review guidelines

For Joker (Codex) reviewing a pull request, and for any agent asked to
review. Flag as P1 anything that breaks a rule above.

- **Diligence over passing.** A conflict resolved by commenting out,
  deleting or taking one side whole; a rule silenced; a test weakened: P1.
- **Dependency updates** (`dev/dependabot` → `development`): every use of
  a bumped tool is bumped (all workflows, not only the one dependabot saw);
  `src/vendor/` equals its npm packages (`tests/vendor.test.js`); breaking
  changes of a major bump are checked against how this code uses it; no
  new dependency, permission, host or network request rides along.
- **Known lint findings** (`scripts/lint.mjs` `KNOWN`): each one exact
  (code, file, message), with its reason and almanac case; an entry that
  excuses a real problem, or a rule turned off instead, is P1.
- **Versions** change only by the hook or the merge driver; a merge that
  bumps or reformats a JSON file is a bug (almanac: version-hook-merges).
- **The owner's words** stay word for word in `docs/changelog/`; nothing
  of `docs/.agents/` was written by a human; no non-public conversation in
  `tests/fixtures/`.
- Jarvis's prompts: `.github/copilot-instructions.md`,
  `.github/prompts/`.

## Layout

```
src/                     the extension's source: built into dist/extension/ (web-ext sourceDir), pages by Vite, the rest as it is
  manifest.json          Manifest V3, gecko id, data_collection_permissions
  core/                  shared by every context, classic scripts on globalThis.SaveMyChat
    kit.js               the unified format, DOM-to-markdown, reader registration
    bridge.js            loaded after a prototype in the USER_SCRIPT world: answers the background by runtime.sendMessage
    library.js           the library (PP1): an index of saved chats and their last copies in storage.local, background only
    markdown.js          conversation -> .md file
    readers.js           the list of default readers, written from resources/data/chats.yaml (task chats)
  readers/               one default reader per chat webapp, each calls SaveMyChat.reader({...})
    drafted-snippets/    Sett's snippets as written, the sources readers are fitted from; not packaged
  vendor/                not in git: every dependency of package.json copied unchanged at build (scripts/vendor.mjs, Q10)
  background/main.js     event page: registers enabled readers, answers "save" from the popup, downloads
  popup/                 the toolbar button (Vue, Q12): ToolbarPopup.vue, report.js; which reader sees this tab, save as md / json
  viewer/                a saved chat shown (ChatView.vue, MarkdownText.vue: marked's tokens made elements, no innerHTML,
                         images never loaded); conversation.js reads .md / .json back; shared with the public site (Q13)
  options/               the options (Vue, Q12): OptionsPage.vue, a tab each - LibraryPanel, ViewerPanel, ReadersPanel (on/off, SelectorEditor),
                         PrototypesPanel (PrototypeEditor; prototypes.js: their checks and file); the kit and readers loaded first (main.js)
resources/data/          declarations: chats.yaml, the chat webapps, their domains and conversation addresses (PP2)
tests/                   vitest + jsdom; fixtures/ are saved HTML of real chats, anonymised; firefox/: Selenium in a real Firefox (Q14)
docs/devlog/             the BOS devlog: VISION, ROADMAP, TODO, BRAINSTORM, PROPOSALS, ORDERS, INQUIRIES;
                         shown on GitHub as milestones, issues and a board (scripts/github/devlog.py) -
                         an issue changed by hand is overwritten: answer in ORDERS.md, ask in INQUIRIES.md
scripts/wiki/            build.mjs, translate.mjs: the wiki generated and translated (wiki.yaml)
scripts/github/          devlog.py, adapted from P_JOL_ROLL; discussions.py, the feed in Discussions (feed.yml)
site/                    the public site (Q13), Astro (astro.config.mjs) into dist/pages: the project page, the viewer,
                         the extension's popup and options with Firefox's APIs played by the page; tests/ by Playwright
vite.config.mjs          the build step (Q12): PAGES built by Vite (chunks/vue.js and assets/bulma.css shared), src/ copied, into dist/extension/
scripts/version.mjs      the one version: sync, bump, bump-commit (pre-commit hook), merge driver (.gitattributes)
scripts/release/         release.sh: what release.yml does on master, runnable by hand; amo.sh: a release to AMO, listed
docs/changelog/          what happened per phase, the owner's words word for word, append-only
docs/index.md, manual/   the user's manual, on Read the Docs with the guides (mkdocs.yml, .readthedocs.yaml)
docs/guides/             how to write a reader, the unified format
docs/almanac/            what was learnt the hard way: cataclistics/ (a case per page), solutions/ (a topic each)
docs/.agents/            agents' own domain
.github/                 AUTHORS, bos.json, community files, workflows; Jarvis: copilot-instructions.md, prompts/
```

## The reader contract

A reader is one file in `src/readers/<id>.js`, listed in `src/core/readers.js`:

```js
SaveMyChat.reader({
	id: "github-copilot",
	name: "GitHub Copilot",
	service: "github.com/copilot",
	detect: (doc, url) => boolean, // is there a conversation on this page
	read: (doc, url) => ({ title, turns: [{ role, text }] }), // text is markdown
});
```

`SaveMyChat.turn(role, element)` turns an element into a turn with markdown
text; `SaveMyChat.conversation(...)` (called by the kit, not the reader)
stamps the format, source and time. The format is described in
`docs/guides/format.md`; change it only with a version bump there.

## Commands

| Command | What it does |
| --- | --- |
| `task install` | `npm ci` |
| `task run` | Firefox with the built extension loaded; Vite rebuilds and web-ext reloads on every change (`scripts/run.mjs`) |
| `task extension` | the extension built into `dist/extension/` (Q12): the Vue pages by Vite, the rest of `src/` as it is |
| `task check` | Biome, changes nothing |
| `task format` | Biome with safe fixes |
| `task lint:ext` | `web-ext lint` (AMO's validator), warnings as errors, but the false positives named one by one in `scripts/lint.mjs` |
| `task test` | vitest |
| `task test:firefox` | the built extension in a real Firefox (Q14): Selenium, geckodriver, a temporary add-on (`tests/firefox/`); screenshots into `dist/shots/`; `FIREFOX_BIN`, `GECKODRIVER` when not found |
| `task verify` | check, lint:ext, test — run before a step is reported done |
| `task build` | the batch (Q10, Q12): dependencies into `src/vendor/`, `readers.js` and host permissions from `chats.yaml`, the extension built, the `.zip` into `dist/` |
| `task devlog:scrapnote` | a new scrapnote in `docs/devlog/` |
| `task version` (`-- bump minor`) | the version of `package.json` written into every copy, or raised by hand (the hook does it per commit) |
| `task vendor` | every dependency of `package.json` copied unchanged into the gitignored `src/vendor/` (its files named in `package.json` `vendor`) |
| `task chats` (`-- --check`) | `src/core/readers.js` and the manifest's host permissions written from `resources/data/chats.yaml` |
| `task github:devlog` (`-- --dry`) | the devlog on GitHub: milestones, an issue per phase, `Q<n>`, `PP<n>`, the board; `devlog.yml` does it on each push of the devlog to `development`, but the board |
| `task github:discussions` (`-- --dry`) | the devlog's news in Discussions (#17): changelog posts, phases, proposals, releases in Announcements, a discussion per `PP<n>` in Ideas, almanac cases in Q&A with their solution as the answer; `feed.yml` runs it after each release |
| `task wiki` (`-- --translator none`) | the wiki into `dist/wiki/` from `docs/` in the languages of `resources/data/wiki.yaml`; new texts translated by LibreTranslate (`task translate:server`, or `LIBRETRANSLATE_URL`) or Argos, kept in `resources/data/translations/`; `wiki.yml` pushes it after each release |
| `task docs` (`-- serve -a 0.0.0.0:8000`) | the Read the Docs site (`mkdocs.yml`, `.readthedocs.yaml`): the manual and the guides, strictly; the devlog, changelog and almanac are the wiki's |
| `task pages` (`pages:dev`) | the public site (Q13) built by Astro from `site/` into `dist/pages/`; `pages.yml` commits it on the `github-pages` branch after each release |
| `task test:site` | the site built and tested by Playwright in Chromium and Firefox (`site/tests/`) |

## Conventions

- Tabs for indentation (Biome), except `package.json`. Double quotes.
- Short file names. Selectors of a webapp stay inside its reader.
- A reader that has not been checked against the live webapp says so at its
  top (`// NOTE: unverified`) and in `docs/.agents/things-to-check.md`.
- Test fixtures are real pages saved and stripped of personal content; never
  commit a conversation that is not meant to be public.
