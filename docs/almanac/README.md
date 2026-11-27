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
