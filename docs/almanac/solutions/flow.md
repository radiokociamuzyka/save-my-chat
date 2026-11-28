# flow

Branches, versions, merges and the automation of the BOS craft loop.

- [version-hook-merges](../cataclistics/version-hook-merges.md): a merge never bumps nor reformats a file; the hook stages the version alone
- [dependabot-branch-drift](../cataclistics/dependabot-branch-drift.md): `dev/dependabot` follows `development`, vendored copies follow their packages
- [feed-too-quickly](../cataclistics/feed-too-quickly.md): many writes to GitHub need a pace and a rerun that finds what exists
- [feed-edit-refused](../cataclistics/feed-edit-refused.md): a workflow's token may create in Discussions but not edit: nothing posted is edited, a change is a new comment or answer; one refusal must not stop a batch
- [ignored-site-dir](../cataclistics/ignored-site-dir.md): a tool's default output folder in `.gitignore` hid the site's sources: `git check-ignore -v`
- [commit-with-a-path](../cataclistics/commit-with-a-path.md): `git commit -- <path>` commits only that path; stage, then commit without paths; a slip on `dev/*` is completed by the next commit, its message naming it
