# The version hook touched merges

- **Met:** 2026-11-27, merging `development` into `dev/dependabot` and
  into `dev/Cleo` after v0.1.3.
- **Topic:** [flow](../solutions/flow.md)

## What happened

Two things, both from `scripts/version.mjs` (Q7):

1. A merge whose message commitlint refused stopped, and was finished
   with `git commit`. That runs `pre-commit`, which a merge going straight
   through does not, so the merge bumped `Z` (0.1.8 to 0.1.9).
2. The merge driver of `.gitattributes` took the higher version of
   `package.json`, `package-lock.json` and `src/manifest.json`, and wrote
   each back through `JSON.stringify(value, null, 2)`. The manifest, kept
   in tabs with its short arrays on one line, came out in spaces and
   spread over lines; `biome check` failed on the branch.

## Solution

`bump-commit` does nothing while `MERGE_HEAD` exists. The driver replaces
only the text of `"version"` (and of the root package of the lockfile)
and checks the result parses back to it; the file's formatting is never
touched. A test holds both. The 0.1.9 already in history stays: versions
are not rewritten.

## Recognise it again

A merge commit that changes a version by itself; a merge that reformats
a JSON file nobody edited. A tool that edits a file in a merge should
change the least text it can.
