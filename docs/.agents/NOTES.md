# NOTES: findings of agents

Findings, newest on top, dated. People answer in `docs/devlog/`, not here.
What waits for a decision or was not verified is kept in
[things-to-check.md](things-to-check.md).

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
