# dependabot's branch left behind

- **Met:** 2026-11-27, Sett merging dependabot's pull requests #19, #20,
  #21 into `dev/dependabot`.
- **Topic:** [flow](../solutions/flow.md)

## What happened

`dev/dependabot` was cut from `development` in phase 0 and never merged
up. Dependabot works on the branch it targets, so it saw only
`checks.yml`: it bumped `actions/checkout`, `setup-node` and
`upload-artifact` to v7 there, and `release.yml` and `devlog.yml`, added
to `development` later, stayed on v5. Each pull request was right on its
own; merged by hand, the branch looked fine and the repository was left
half updated. Git merged `development` in without a conflict, so nothing
said so.

There is a quieter one of the same kind: turndown and its GFM plugin are
npm dependencies *and* copies in `src/vendor/`. A dependabot bump of
`package.json` alone leaves the extension running the old copy.

## Solution

The branch merged up from `development` and the two workflows brought to
v7. `dependabot.yml` (workflow) merges `development` into
`dev/dependabot` after each push to `development`, and opens a pull
request `dev/dependabot` → `development` when something landed; a
collision becomes an issue with Jarvis's prompt
(`.github/prompts/dependabot.prompt.md`). A test fails when `src/vendor/`
differs from `node_modules/`, so a bump without `task vendor` cannot pass.

## Recognise it again

A dependency branch behind `development`; one tool at two versions in
different files; a library bumped in `package.json` while its vendored
copy stays.
