# A path given to git commit took only that path

- **Met:** 2026-11-28, phase 5, committing RR8's reader fixes on `dev/Cleo`.
- **Topic:** [flow](../solutions/flow.md)

## What happened

The readers' files were staged with `git add`, and the commit command
ended with `-- src/core/kit.js`, meant to add the kit to what was
staged. `git commit -- <paths>` does something else: it commits **only**
those paths (`--only` is its default), as they are in the working tree,
and leaves everything staged out. Commit 3b4d6cf came out holding the
kit alone under a message describing the readers.

On `dev/*` a commit is never amended: each amend bumps the version again
(Q7). So the commit stays, and two commits followed it: the readers'
files with their tests, under a message saying they are 3b4d6cf's
missing half; then the gathering's, whose message says the kit's
load-and-wait lives in 3b4d6cf.

## What to do

- Stage with `git add`, then `git commit` with no paths. A path after
  `--` means "only these".
- `git show --stat HEAD` after each commit, before the next: a slip
  is cheapest to tell while it is the last one.
- A slip on `dev/*` is told, not hidden: the next commit's message
  names the one it completes.
