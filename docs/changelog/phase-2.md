# Phase 2: GitHub integration

Append-only. The owner's words are kept word for word.

## 2026-11-27, the owner on translating and the feed (the chat, word for word)

> for multilingual translating can used for example LibreTranslate api of hosted on server container or argos-translate locally. feed over there hits some sort of limit, check these logs, it sais something about too many requests. continue, that's all looks very nice there

**Decision:** the wiki is translated by LibreTranslate (a server, or a
container started by `task translate:server` and by `wiki.yml` in the
runner) or Argos Translate on the machine, chosen in
`resources/data/wiki.yaml`; English and Polish first. The feed hit
GitHub's secondary rate limit on creating content ("was submitted too
quickly") after 34 discussions; it now paces its writes and waits when
refused, and its next run adds the one missing almanac case.

## 2026-11-27, the owner after the network broke the session (the chat, word for word)

> there were some errors from side of my net provider i think. check last point where you endup and continue. after all notice that i removed cached precompiled python file. add to gitignore related with it excludings and commit that deletion later when you finish what was interrupted please

**Decision:** the interrupted wiki was finished from where it stopped
(`translate.mjs` and `wiki.yaml` were written, the build was not). The
removed `scripts/github/__pycache__/` was never tracked, on any branch,
so there is no deletion to commit; `.gitignore` gets Python's compiled
files in full, and `discussions.py` no longer writes them.

## 2026-11-27, the owner on Read the Docs (the chat, word for word)

> great! ready for next steps then. the project's documentation setups on readthedocs is almost ready, waiting for it's setup files. continue

**Decision:** `.readthedocs.yaml` and `mkdocs.yml` build the project's
documentation with MkDocs and Material: a user's manual (install, saving,
a reader that misses something, privacy) and the developer guides; the
devlog, changelog and almanac stay the wiki's. The feed's failure after
v0.2.13 (an edit of its own note refused) is fixed: announcements are
written once, and a refusal no longer stops the run.

## 2026-11-27, the owner after v0.2.21 went public (the chat, word for word)

> alright! all wents public, continue

**Decision:** seen live after the release of v0.2.21: Read the Docs builds
the manual at https://save-my-chat.readthedocs.io, the wiki is published
in English and Polish, and the feed's third run posted the two missing
release notes and the three missing almanac cases, with nothing refused.
The address goes into the README, the wiki's Home and `mkdocs.yml`; next
is the static page on `github-pages`.
