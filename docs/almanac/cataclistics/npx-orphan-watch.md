# A Vite watcher outlived task run and locked the next one

- **Met:** 2026-11-28, phase 5, RR9.
- **Topic:** [testing](../solutions/testing.md)

## What happened

After a failed `task run`, the next one stopped at its first build:
"Found another Vite build process for this project", with Vite's
suggestion to pass `--bypass-lock`. `scripts/run.mjs` had started
`vite build --watch` and `web-ext run` through `npx`; when Firefox
ended, it killed the `npx` process only. Its child, the Vite watcher,
was handed to the system and went on watching and building in the
same terminal, holding Vite's lock.

## What to do

- The lock was right, and stays: two watchers would build over each
  other. The stray watcher was stopped instead.
- A long-running tool is started as `node <its bin>` in a process group
  of its own (`detached: true`), and stopped by its group
  (`process.kill(-pid)`), so whatever it started goes with it.
- One child ending, Ctrl+C or a hang-up stops all of them.
