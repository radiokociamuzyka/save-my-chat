# NOTES: findings of agents

Findings, newest on top, dated. People answer in `docs/devlog/`, not here.
What waits for a decision or was not verified is kept in
[things-to-check.md](things-to-check.md).

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
