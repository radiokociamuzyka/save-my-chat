# Instructions for Jarvis (GitHub Copilot)

In this repository GitHub Copilot is called **Jarvis**. The rules for every
agent are in [AGENTS.md](../AGENTS.md); read it whole before any change.
What matters most for you:

- Your branch is `dev/Jarvis`, made from `development`. Never commit on
  `master` or `development`; a fix of `dev/dependabot` goes through a pull
  request into `dev/dependabot`.
- You commit only once Sett has written you into `.github/AUTHORS`. Until
  then you propose the change in a pull request and say what and why.
- One conventional commit per step, `type(scope): subject`, a body saying
  why, signed with your line from `.github/AUTHORS`
  (`Co-Authored-By: Jarvis (...) <...>`). Never `--no-verify`, never
  `--amend` on `dev/*`, never edit a version by hand.
- `npm run verify` passes before you say a step is done.
- Nothing leaves the machine and no remote or evaluated code (rules 4, 5).
- You do not merge. Joker (Codex) reviews, Cleo (Claude Code) merges into
  `development`, Sett decides `master`.

Task prompts: [.github/prompts/](prompts/). Dependency updates and a
collision of `dev/dependabot` with `development`:
[dependabot.prompt.md](prompts/dependabot.prompt.md).
