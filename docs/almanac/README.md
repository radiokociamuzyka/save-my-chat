# almanac

What was learnt the hard way, as in BOS and P_JOL_ROLL. A problem met and
solved gets its case here, so the next one is recognised faster.

| Where | What |
| --- | --- |
| `cataclistics/<case>.md` | one case per page: what happened, why, how it was solved, how to recognise it again; ready to become a GitHub issue or a Q&A discussion (phase 2) |
| `solutions/<topic>.md` | one page per topic, a line per case that belongs to it |

## Cases

- [gecko-id-format](cataclistics/gecko-id-format.md): a domain is not an add-on id
- [turndown-fences-and-pipes](cataclistics/turndown-fences-and-pipes.md): turndown closes fences early and splits table cells
- [lost-user-messages](cataclistics/lost-user-messages.md): AI Mode saved without the user's messages
- [version-hook-merges](cataclistics/version-hook-merges.md): the version hook bumped a merge, reformatted the manifest, staged more than the version
- [dependabot-branch-drift](cataclistics/dependabot-branch-drift.md): dependabot's branch left behind, half the workflows updated
- [copilot-reader-blind](cataclistics/copilot-reader-blind.md): the Copilot reader saw no messages on the live page
- [ai-mode-swapped-pairs](cataclistics/ai-mode-swapped-pairs.md): AI Mode saved every question after its answer, 1,0,3,2,5,4
- [feed-too-quickly](cataclistics/feed-too-quickly.md): the first feed run refused by GitHub, "submitted too quickly"
- [feed-edit-refused](cataclistics/feed-edit-refused.md): the workflow's token refused an edit of a feed note, and the run stopped
- [linter-userscripts-register](cataclistics/linter-userscripts-register.md): AMO's linter calls userScripts.register removed in MV3
- [webdriver-moz-extension](cataclistics/webdriver-moz-extension.md): WebDriver may not open the extension's own pages
- [vite-glob-before-imports](cataclistics/vite-glob-before-imports.md): a glob's imports run before the imports written above it
- [ignored-site-dir](cataclistics/ignored-site-dir.md): the public site's folder was ignored as MkDocs' output
- [shims-with-eval](cataclistics/shims-with-eval.md): a dependency's shims brought eval into the build
- [licenses-met](cataclistics/licenses-met.md): two licenses met, LGPL-3.0 inside the MPL-2.0 extension
- [commit-with-a-path](cataclistics/commit-with-a-path.md): a path given to git commit took only that path, the staged readers left out
- [snap-private-tmp-run](cataclistics/snap-private-tmp-run.md): `task run`'s profile did not exist for a snap's Firefox
- [npx-orphan-watch](cataclistics/npx-orphan-watch.md): a Vite watcher outlived `task run` and locked the next one
- [verify-beside-task-run](cataclistics/verify-beside-task-run.md): the checks could not build while `task run` was running
- [folder-add-swept-owners-file](cataclistics/folder-add-swept-owners-file.md): a folder added to a commit swept the owner's new file into it
