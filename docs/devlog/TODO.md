# TODO

What is being worked on now. The idea of every phase: [VISION.md](VISION.md);
versions: [ROADMAP.md](ROADMAP.md); questions: [BRAINSTORM.md](BRAINSTORM.md);
history: [../changelog/](../changelog/phase-0.md).

Every item is one commit on `dev/<name>`, ticking its box. An item waiting
for an answer names its `Q<n>`.

## Phase 0: the skeleton

- [x] Standard anatomy of a BOS project: README, LICENSE (placeholder, Q1), AGENTS.md + CLAUDE.md, Taskfile, src/, docs/, tests/, .github/
- [x] Devlog in the standard look of BOS; the owner's words of 2026-11-26 word for word in `docs/changelog/phase-0.md`
- [x] Manifest V3 for Firefox: event page, gecko id (Q2), `data_collection_permissions: none`, Firefox 142+
- [x] The kit: unified format `save-my-chat/0`, DOM to Markdown, reader registration, `validate`
- [x] Markdown and JSON output, file names `save-my-chat/<reader>/<day>-<title>.<ext>`
- [x] Background: enabled readers registered with `scripting.registerContentScripts`, injected on demand into tabs opened earlier; save through the downloads API
- [x] Popup (which reader sees this tab, save as md / json) and options (readers on and off)
- [x] Draft readers for Google AI Mode and GitHub Copilot, marked unverified
- [x] Checks: Biome, `web-ext lint`, vitest with jsdom; `task verify` green
- [ ] Branches of the craft loop: first commit on `master`, then `development` and `dev/<name>` (waits for Sett: who commits, Q4)
- [ ] `.github/workflows/checks.yml` seen green on GitHub (after the first push)
- [ ] Commit messages checked: commitlint and husky hooks like P_JOL_ROLL

## Phase 1: the first readers for real

- [ ] Sett's existing scripts for Google AI Mode and GitHub Copilot brought into `src/readers/` (where are they? Q5)
- [ ] A saved, anonymised page of each as `tests/fixtures/`, and tests reading them
- [ ] Each reader checked by hand in Firefox on a live conversation (`task run`), the result in `docs/.agents/NOTES.md`
- [ ] Long answers: code blocks, tables, math, citations and images of each webapp come out right in Markdown
- [ ] Conversations longer than the screen: lazy-loaded history scrolled in or reported as cut

## Phase 2: prototypes

- [ ] Options page: copy a default reader into an editor, save as a prototype in `storage.local`
- [ ] `userScripts` permission asked from the options page (optional permission in Firefox)
- [ ] Prototypes registered with `userScripts.register` in the `USER_SCRIPT` world, messaging on (`configureWorld`), re-registered on update
- [ ] A prototype replaces its default for the same matches; turning it off brings the default back
- [ ] Export and import of prototypes as files
