# Phase 1: the first readers for real

Append-only. The owner's words are kept word for word.

## 2026-11-26, the owner's answer to Q7 (issue #14, then ORDERS.md, word for word)

### Q7. The "minor changes" seen in the v0.0.1 demo

> that's right, and remember that each change by commit is in semver `vX.Y.Z` bump of the `Z`, each phase is combining all changes of dev branches in development, then creation of PR from development to master. each PR is lounching build distribution packed extension and release tagged as versionated and latest pointer. up next we will prepare also paralel docs publication on ReadTheDocs (excluded there all that will be on repository wiki), static page of project at `github-pages` branch and also wiki for developers and contributors with almanac and devlog been there generated and published in more than one language.
>
> - https://github.com/radiokociamuzyka/save-my-chat.wiki.git
> - https://github.com/radiokociamuzyka/save-my-chat/discussions/17
>
> this is the way of BOS development.

**Decision:** the "minor changes" are the flow itself. Every commit on a
`dev/*` branch bumps `Z` (pre-commit hook, `scripts/version.mjs`); a
phase ends with the dev branches gathered in `development` and a pull
request into `master`; a pull request builds the packed extension, and
its merge into `master` releases it as tag `vX.Y.Z`, marked the latest,
with a fixed download address for the latest. Read the Docs, the
`github-pages` site and the generated multilingual wiki are planned as
items of phase 2.

## 2026-11-26, the owner's inquiry (discussion #17, then INQUIRIES.md, word for word)

> ## feed with updates and latest changes
>
> (discussion #17, Announcements, https://github.com/radiokociamuzyka/save-my-chat/discussions/17)
>
> short descriptions and reference to:
> - changelog posts notices with links
> - proposals with link to issue and dedicated discussion around proposal
> - phases changes and updates of concepts
> - releases public introductions
> - other announcements
