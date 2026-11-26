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
- [x] Gecko id `@save-my-chat.radiokociamuzyka.pl` (Q2)
- [x] Cleo in `.github/AUTHORS`; AGENTS.md: a commit per step, the branch set (Q4)
- [x] Husky hooks: commitlint on `commit-msg`, `task verify` on `pre-push`
- [x] Dependabot into `dev/dependabot`
- [ ] `.github/workflows/checks.yml` seen green on GitHub

## Phase 1: the first readers for real

- [x] Turndown (with its GFM plugin) converts messages instead of the hand-written converter, vendored unchanged into `src/vendor/`
- [x] Selectors as sets of candidates; the kit collects turns of every role in page order
- [x] Google AI Mode reader rebuilt from Sett's proof of work, the snippet kept in `src/readers/drafted-snippets/` (Q5)
- [x] The lost user messages in the almanac: case, cause, solution
- [x] Selector overrides from `storage.local`, so a changed class name is fixed without a release (set from the console for now)
- [ ] The options page edits the selector overrides of each reader
- [ ] The "minor changes" of the v0.0.1 demo (Q7)
- [ ] GitHub Copilot reader from a snippet of Sett's or a saved page
- [ ] A saved, anonymised page of each as `tests/fixtures/`, and tests reading them
- [ ] Each reader checked by hand in Firefox on a live conversation, the result in `docs/.agents/NOTES.md`

## Phase 2: GitHub integration

- [ ] `task github:devlog`: a milestone per milestone of ROADMAP, an issue per phase (its items a task list), per `Q<n>` and per `PP<n>`; answered and decided ones closed with the owner's words
- [ ] A project board for the devlog
- [ ] Discussions: announcements of steps, phases and releases; almanac cases as Q&A
- [ ] Workflows: the devlog synced on each push to `development`, the gate of a pull request into `master`, the release

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
