# A folder added to a commit swept the owner's new file into it

- **Met:** 2026-11-28, phase 7, committing the long chat's notes on `dev/Cleo`.
- **Topic:** [flow](../solutions/flow.md)

## What happened

Sett wrote a scrapnote into `docs/devlog/` while Cleo worked. Cleo committed
it as the owner's edit on `dev/Sarverott` (from a separate worktree), but
left the untracked copy in the working tree. Cleo's next commit staged
`git add docs/devlog`, and the owner's note went into Cleo's own commit
(2943e5e) too. Sett had meanwhile committed the same note on GitHub,
with a final newline: three copies, and two add/add conflicts at the
merges, each solved by keeping Sett's copy.

## What to do

- Stage files by name, not a folder, when the owner may be writing in it.
- `git status --short` before each commit: an untracked file not of this
  step stays out.
- The owner's file, once committed on `dev/Sarverott`, leaves the working
  tree of another branch, or is not staged there.
- An owner's edit seen on GitHub (`git fetch`, `git log dev/Sarverott..origin/dev/Sarverott`)
  before committing it locally saves the duplicate.
