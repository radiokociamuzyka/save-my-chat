# TODO

What is being worked on now. The idea of every phase: [VISION.md](VISION.md);
versions: [ROADMAP.md](ROADMAP.md); questions: [BRAINSTORM.md](BRAINSTORM.md);
history: [../changelog/](../changelog/phase-0.md).

Every item is one commit on `dev/<name>` (`dev/Cleo`, or `dev/Sarverott`
for the owner's edits), ticking its box. An item waiting for an answer
names its `Q<n>`.

## Phase 0: the skeleton

- [x] Standard anatomy of a BOS project: README, LICENSE, AGENTS.md + CLAUDE.md, Taskfile, src/, docs/, tests/, .github/
- [x] Devlog in the standard look of BOS; the owner's words of 2026-11-26 word for word in `docs/changelog/phase-0.md`
- [x] Manifest V3 for Firefox: event page, gecko id, `data_collection_permissions: none`, Firefox 142+
- [x] The kit: unified format `save-my-chat/0`, DOM to Markdown, reader registration, `validate`
- [x] Markdown and JSON output, file names `save-my-chat/<reader>/<day>-<title>.<ext>`
- [x] Background: enabled readers registered with `scripting.registerContentScripts`, injected on demand into tabs opened earlier; save through the downloads API
- [x] Popup (which reader sees this tab, save as md / json) and options (readers on and off)
- [x] Draft readers for Google AI Mode and GitHub Copilot, marked unverified
- [x] Checks: Biome, `web-ext lint`, vitest with jsdom; `task verify` green
- [x] First commit on `master`, then `development`, `dev/Sarverott`, `dev/Cleo`, `dev/Jarvis`, `dev/Joker`, `dev/dependabot` (Q4)
- [x] The owner's answers and inquiries moved word for word into the changelog; the plan renumbered
- [x] License MPL-2.0 (Q1)
- [x] Gecko id `save-my-chat@radiokociamuzyka.pl` (Q2, corrected 2026-11-27)
- [x] Cleo in `.github/AUTHORS`; AGENTS.md: a commit per step, the branch set (Q4)
- [x] Husky hooks: commitlint on `commit-msg`, `task verify` on `pre-push`
- [x] Dependabot into `dev/dependabot`
- [x] `.github/workflows/checks.yml` seen green on GitHub
- [x] Version bumped by a hook per commit: `Z` of `vX.Y.Z` on every `dev/*` commit, a merge driver taking the higher version (Q7)
- [x] Release on `master`: a merged pull request from `development` tags `vX.Y.Z`, attaches the packed extension, marks it the latest; `master` merged back into `development` (Q7)
- ~~[ ] The phase closed: a pull request `development` → `master` (Q7)~~

## Phase 1: the first readers for real

- [x] Turndown (with its GFM plugin) converts messages instead of the hand-written converter, vendored unchanged into `src/vendor/`
- [x] Selectors as sets of candidates; the kit collects turns of every role in page order
- [x] Google AI Mode reader rebuilt from Sett's proof of work, the snippet kept in `src/readers/drafted-snippets/` (Q5)
- [x] The lost user messages in the almanac: case, cause, solution
- [x] Selector overrides from `storage.local`, so a changed class name is fixed without a release (set from the console for now)
- [ ] The options page edits the selector overrides of each reader
- [x] GitHub Copilot reader from Sett's snippet (`.message-container`, `user__` / `ai__`)
- ~~[ ] A saved, anonymised page of each as `tests/fixtures/`, and tests reading them~~ - for now we do not need other's people input, so if issues will come then we will make that anonymised raporting of page tests
- [ ] Each reader checked by hand in Firefox on a live conversation, the result in `docs/.agents/NOTES.md` - __there i have no access as i claim it your own sovereign domain! i can only read it__ but sounds that this was done when i raport you that copilot's reader does not work... just close that step or move out of phase 1 
- [x] The add-on id corrected to `save-my-chat@radiokociamuzyka.pl` (Sett's inquiry)
- [x] `dev/dependabot` caught up with `development`, every workflow on the same actions; the almanac case
- [x] The version hook: a merge neither bumps nor reformats a file; the almanac case
- [x] `src/vendor/` held to its npm packages by a test, so a dependency bump cannot leave the old copy
- [x] Workflow `dependabot.yml`: `dev/dependabot` follows `development`, lands by a pull request; a collision becomes an issue for Jarvis
- [x] Jarvis's instructions and dependabot prompt (`.github/copilot-instructions.md`, `.github/prompts/`); Joker's review guidelines in AGENTS.md
- [x] Jarvis and Joker in `.github/AUTHORS` (Q11)
- [x] `resources/data/chats.yaml`: the chat webapps, their domains and conversation addresses, held to `readers.js` by a test (PP2)
- [x] `readers.js` and host permissions written from `chats.yaml` (`task chats`), checked by a test (Q10)
- [x] `src/vendor/` out of git, every dependency gathered into it by `task build`, the batch: vendor, chats, pack (Q10)
- [x] The version hook stages the version alone

## Phase 2: GitHub integration

- [x] `task github:devlog`: a milestone per milestone of ROADMAP, an issue per phase (its items a task list), per `Q<n>` and per `PP<n>`; answered and decided ones closed with the owner's words
- [x] A project board for the devlog (organization project #1, private until Sett opens it)
- [ ] Announcements (discussion #17): short notes with links - changelog posts, proposals with their issue and a discussion of their own, changes of phases and concepts, releases introduced, other news
- [ ] Almanac cases as Q&A discussions, their solution the answer
- [ ] The wiki (`save-my-chat.wiki.git`) for developers and contributors: the almanac and the devlog generated into it, in more than one language
- [ ] Read the Docs: the documentation of the project, without what the wiki holds
- [ ] A static page of the project on the `github-pages` branch
- [x] Workflow `devlog.yml`: the devlog synced on each push of it to `development`
- [ ] Workflows: the gate of a pull request into `master`, the release

## Phase 3: prototypes

- [ ] Options page: copy a default reader into an editor, save as a prototype in `storage.local`
- [ ] `userScripts` permission asked from the options page (optional permission in Firefox)
- [ ] Prototypes registered with `userScripts.register` in the `USER_SCRIPT` world, messaging on (`configureWorld`), re-registered on update
- [ ] A prototype replaces its default for the same matches; turning it off brings the default back
- [ ] Export and import of prototypes as files

## Phase 4: the frontend

- [ ] Astro site for previewing the settings page and the manuals (Q6: the build step decided here)
- [ ] Vue components, Bulma styles for options and popup
- [ ] A viewer of saved conversations (Markdown and JSON of the unified format)
- [ ] Playwright tests driving the extension in Firefox
- [ ] The library (PP1): an index of saved chats in `storage.local`, search, re-export, a chat that grew since it was saved
- [ ] An explorer of the stored files on ZenFS (IndexedDB) with isomorphic-git, both dependencies gathered by `task build` (Q8)
- [ ] A "gist" button: a saved chat as a secret gist through Octokit, the user's token, `api.github.com` optional, declared in `data_collection_permissions.optional` (Q9)

## Phase 5: more webapps

- [ ] A reader for each `planned` chat of `resources/data/chats.yaml` (PP2), each with a fixture, its host an optional permission
- [ ] Each one's patterns checked on the live webapp, `verified: true`

## Phase 6: release

- [ ] Icons, store listing, privacy statement
- [ ] The id settled for good and the first signing (`AMO_JWT_*` secrets, Sett), listed on AMO
