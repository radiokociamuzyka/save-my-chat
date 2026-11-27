# NOTES: findings of agents

Findings, newest on top, dated. People answer in `docs/devlog/`, not here.
What waits for a decision or was not verified is kept in
[things-to-check.md](things-to-check.md).

## 2026-11-26 · Cleo · Q7: the flow of versions and releases

- Sett's answer came as a comment on issue #14 and discussion #17 opened
  the feed; Cleo copied both into ORDERS.md / INQUIRIES.md and committed
  them on `dev/Sarverott`, as Sett asked. An answer on GitHub has to be
  carried into the markdown by hand: `devlog.py` writes issues, it does
  not read their comments.
- `scripts/version.mjs` (from P_JOL_ROLL's `version.ts`): the hook bumped
  0.1.0 → 0.1.1 on the commit that brought it. `git commit --amend` on a
  `dev/*` branch runs pre-commit again and bumps once more, so no amends
  there (written into AGENTS.md).
- `release.yml` is written and its build step checked here
  (`save-my-chat-0.1.2.zip`, manifest at 0.1.2); the tag, the release and
  the merge back run only on GitHub, on the first merge into `master`.
- A release is unsigned until Sett adds `AMO_JWT_ISSUER` and
  `AMO_JWT_SECRET` as repository secrets.

## 2026-11-26 · Cleo · phase 2 begun: the devlog on GitHub

- `task github:devlog` ran once from this machine: milestones M0-M6, issues
  #1-#7 (phases), #8-#13 (Q1-Q6, closed with Sett's words), #14 (Q7),
  #15-#16 (PP1, PP2), and the board https://github.com/orgs/radiokociamuzyka/projects/1
  (made by gh, so private to the organization until Sett opens it). A second
  run changed nothing.
- `checks.yml` passed on GitHub for `dev/Cleo`, `development` and the bots'
  branches.
- The board needs a person's token (scope `project`); `devlog.yml` runs
  with `--no-board`, as in P_JOL_ROLL.

## 2026-11-26 · Cleo · phase 1: turndown, selector sets, AI Mode for real

- Sett's test of v0.0.1: AI Mode saved without user messages. The guessed
  reader is gone; the new one is fitted from Sett's devtools snippet
  (`src/readers/drafted-snippets/`). Case: `docs/almanac/cataclistics/lost-user-messages.md`.
- Turndown replaced the hand-written converter. The old tests showed two
  places where it loses data: fences around code holding ``` and pipes in
  table cells. Two rules override them. Case: `turndown-fences-and-pipes.md`.
- Turndown's list items read `-   x` (three spaces): valid CommonMark,
  kept as it is.
- commitlint's parser takes a body line starting with `word:` for a
  footer and warns "footer must have leading blank line"; the message is
  stored intact. Avoid starting a body line with `word:`.
- Q2's domain is not a valid gecko id; `@` in front makes it one.
  Case: `gecko-id-format.md`.
- Not seen: the live AI Mode page. The class names are Sett's, the tests
  are hand-made pages using them. A saved AI Mode page as a fixture would
  let the tests follow Google's real markup.

## 2026-11-26 · Cleo · phase 0: the skeleton

- Read before building: the workshop's AGENTS.md, the BOS skillset's
  `bos-workshop` and `bos-project` skills and glossary, P_JOL_ROLL's
  AGENTS.md, devlog and its own `src/firefox-ext/` (MV3, gecko id
  `p-jol-roll@sarverott.github.io`), apokaliptium.online's AGENTS.md, the
  portfolio's agent docs, and Mozilla's MV3 / web-ext / AMO pages.
  `https://sarverott.github.io/P-jol-roll/` renders by JavaScript and gave
  no text to a fetch; its repository was read instead.
- Firefox facts the design leans on (Mozilla docs, 2026-11-26): no
  `background.service_worker` in Firefox, `background.scripts` run as an
  event page; `data_collection_permissions` required for new AMO add-ons
  since 2025-11-03; `userScripts` is MV3-only and an *optional* permission
  in Firefox; `scripting.registerContentScripts` needs `scripting` and host
  permissions; AMO asks for source code only when the shipped code is
  bundled, minified or transpiled.
- `web-ext lint` warned that `data_collection_permissions` needs Firefox for
  Android 142, so `strict_min_version` is 142.0, not the 140.0 of MDN's example.
- The slug of file names lost `ł` (NFKD does not split it); a test caught
  it, a small table of such letters fixed it.
- Content scripts registered at install do not reach tabs already open;
  the background injects the kit and readers into such a tab on demand.
- Toolchain here: Node 24.21, npm 11.19, Task 3.54, Firefox installed.
  Pinned: Biome 2.6.9, web-ext 10.8.0, vitest 5.1.2, jsdom 31.0.1.

## 2026-11-27, PP1, PP2, signing, dependabot, the id

- PR #18 was merged by Sett at 18:27; `release.yml` ran green: tag
  `v0.1.3`, the release marked latest, `master` merged back into
  `development`. The release flow is now seen working end to end.
- Sett wrote of commenting out what the dependabot collision touched.
  No such lines were found: not on `origin/dev/dependabot`, not on any
  local branch, not in a stash or worktree. The drift was resolved from
  what was pushed.
- The "collision" was no git conflict: `development` merged into
  `dev/dependabot` cleanly. It was the drift (two workflows left on v5),
  which a merge does not show. Worth remembering when "it merges" is
  taken for "it is consistent".
- Found while doing it, not asked: the version hook bumped a concluded
  merge, and its merge driver reformatted `src/manifest.json`; the
  vendored turndown could be left behind by a dependabot bump. All three
  fixed with tests and in the almanac.
- `actionlint` is not installed here; `dependabot.yml` was checked as
  YAML only. Its first real run is the push of this batch to
  `development` (the `follow` job).
- One commit message of this batch (`2ae2ab4`) refers to Sett as "him";
  a pronoun was guessed where none was given. It cannot be amended on
  `dev/*`; the files carry none.

## 2026-11-27, Q8-Q11

- Joker's AUTHORS address is the GitHub noreply of the Codex app's bot
  account (`chatgpt-codex-connector[bot]`, id 199175422, looked up through
  the API); P_JOL_ROLL had no Joker line to copy. "gpt6.2" is written as
  Sett named it. Check it against the address Codex's commits really carry.
- `38dbfc3` (build(chats)) holds more than its subject: the removal of
  `src/vendor/` from git and package.json's vendor scripts. Cause: an
  earlier `git rm --cached` left staged, and the hook's `git add` of
  package.json. Fixed in the hook; the commit cannot be amended on `dev/*`.
- With `src/vendor/` out of git a fresh clone runs nothing until
  `npm run vendor` (the test, verify, start and build scripts do it).
  Loading `src/` as a temporary add-on straight from a clone needs it too.

## Live checks reported by Sett (written down by Cleo, as Sett asked on 2026-11-27)

| Date | Reader | Build | What Sett saw | Answer |
| --- | --- | --- | --- | --- |
| 2026-11-26 | google-ai-mode | v0.0.1 | user messages missing from the saved file | selector sets, page order, the address fallback (0.1.0) |
| 2026-11-27 | github-copilot | v0.1.3 | no messages found at `https://github.com/copilot/c/*` | rebuilt from Sett's snippet (0.1.31); waits for the next release to be checked |
| 2026-11-27 | github-copilot | v0.1.53 | works fine | confirmed |
| 2026-11-27 | google-ai-mode | v0.1.53 | pairs swapped, 1,0,3,2,5,4 | messages ordered by where their own text starts (0.1.54); nesting in the popup's report |
| 2026-11-27 | github-copilot | v0.1.58 | report: user 4, assistant 4; `user__` finds 4, only the `' ai__'` form of the assistant set finds anything (4) | as expected |
| 2026-11-27 | google-ai-mode | v0.1.58 | report: user 4, assistant 4; `.ilZyRc` finds 5, `.L4dlbc` 0, `.CKgc1d` 4; `nested: 4 user in assistant` | the nesting confirmed live; the 5th `.ilZyRc` is most likely held in another one and skipped as a duplicate; `.L4dlbc` is a class from an older build. Order not yet confirmed by Sett |
| 2026-11-27 | both | v0.1.59 | the same reports; the order of both confirmed correct by Sett | the swap fixed for good; the report gets an `order:` line and order warnings (0.1.60) |

From the next release on, the popup's "Copy report" (under "What the
reader saw") is the easiest thing to paste into an issue or the chat: it
names the build, the reader, every selector with how many elements it
found, and no text of the conversation.
