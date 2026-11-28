# The checks could not build while task run was running

- **Met:** 2026-11-28, phase 5, pushing while Sett's `task run` held the debug gate open.
- **Topic:** [testing](../solutions/testing.md)

## What happened

The pre-push hook runs `npm run verify`, whose `lint:ext` built the
extension into `dist/extension/` and linted it. Sett's `task run` was
watching the same project: Vite refused the second build, "Found another
Vite build process for this project", and the push stopped. Had it been
let through (`--bypass-lock`), the release build would have overwritten
the debug build Firefox was running from, and taken the gate down.

## What to do

- The checks build the release into a folder of their own, `dist/verify/`
  (`SMC_OUT`, `SMC_DEBUG=0`), with a Vite cache of their own
  (`node_modules/.vite-verify`): Vite locks per cache folder, so both
  builds go on, each into its place. `web-ext lint --source-dir dist/verify`.
- `dist/extension/` stays what `task run`, `task build` and the tests in
  Firefox use.
- Neither the lock nor the hook was bypassed.
