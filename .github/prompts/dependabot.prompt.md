---
mode: agent
description: "Jarvis: dependabot's updates and a collision of dev/dependabot with development, handled with care"
---

# Dependabot's updates, and dev/dependabot colliding with development

You are Jarvis (GitHub Copilot) in save-my-chat. Read
[AGENTS.md](../../AGENTS.md) and [copilot-instructions.md](../copilot-instructions.md)
first. Why this prompt exists: Sett's inquiry of 2026-11-27 and the almanac
case [dependabot-branch-drift](../../docs/almanac/cataclistics/dependabot-branch-drift.md).

> The most common problem encountered when developers take over existing
> projects is a lack of diligence and a "couldn't-care-less" attitude.
> (Sett, 2026-11-27)

So: understand every line you touch. A change that only makes the checks
pass is not done.

## How dependency updates flow here

1. Dependabot opens pull requests into `dev/dependabot` (`.github/dependabot.yml`).
2. They are merged into `dev/dependabot` once their checks pass and Joker
   has reviewed them.
3. `.github/workflows/dependabot.yml` keeps `dev/dependabot` level with
   `development` and opens one pull request `dev/dependabot` → `development`.
4. Joker reviews it, Cleo merges it. You never merge.

## A collision (issue labelled `dependabot-collision`)

1. Make a branch from `dev/dependabot`, merge `origin/development` into it.
2. For each file in conflict, read both sides and the commits that made
   them (`git log -p` on each side). Write down in the pull request what
   each side wanted.
3. Resolve by keeping both intentions: `development`'s structure and
   content, dependabot's newer versions. **Never comment out, delete or
   "take ours/theirs" for a whole file to get past a conflict.** If both
   cannot be kept, stop and say why in the issue; that is a question for
   Sett.
4. `package.json`, `package-lock.json`, `src/manifest.json`: the version
   field is settled by the merge driver (`node scripts/version.mjs merge`);
   for dependencies keep the higher versions and run `npm install` so the
   lockfile is regenerated, not hand-edited.
5. Run `npm run verify`. Open a pull request into `dev/dependabot` that
   closes the issue.

## Every dependency update (also without a collision)

- **One tool, one version.** When an action or package is bumped, find
  every place it is used (`grep -rn "actions/checkout@" .github/workflows`)
  and bump all of them. A workflow added to `development` after the
  branch was cut is the classic miss.
- **Vendored copies.** `turndown` and `turndown-plugin-gfm` are also copied
  into `src/vendor/`. A bump of either needs the copies renewed exactly as
  `task vendor` does:
  `cp node_modules/turndown/dist/turndown.js src/vendor/turndown.js`,
  `cp node_modules/turndown/LICENSE src/vendor/turndown.LICENSE`,
  `cp node_modules/turndown-plugin-gfm/dist/turndown-plugin-gfm.js src/vendor/turndown-plugin-gfm.js`,
  `cp node_modules/turndown-plugin-gfm/LICENSE src/vendor/turndown-plugin-gfm.LICENSE`.
  `tests/vendor.test.js` fails until they match.
- **Read the release notes** of a major bump. List the breaking changes and
  say for each whether this repository is affected and where.
- Biome, web-ext, vitest, jsdom: a new version may change formatting or
  lint rules. Run `npm run format` and say in the pull request what
  changed, never silence a rule to pass.
- A new dependency, permission, host or network request is never part of
  an update: it is a question for Sett (AGENTS.md rules 4-6).
