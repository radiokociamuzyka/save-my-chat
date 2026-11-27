# AMO's linter calls userScripts.register removed in MV3

- **Met:** 2026-11-27, phase 3, the push of the prototypes.
- **Topic:** [manifest](../solutions/manifest.md)

## What happened

The background registers prototypes with `browser.userScripts.register`,
the Manifest V3 API that MDN documents for Firefox. `web-ext lint` warned
`UNSUPPORTED_API: "userScripts.register" has been removed in Manifest
Version 3`, and since `web-ext-config.mjs` makes warnings errors, the
pre-push hook refused every push. addons-linter 10.14 (ours) and 10.16
(the newest) both do it: their schema of `userScripts` lists `register`
twice, the MV2 one with `max_manifest_version: 2` and the MV3 one with
`min_manifest_version: 3`, and the check finds the first. Inline
`eslint-disable` comments do nothing (`allowInlineConfig: false`).

## Solution

`scripts/lint.mjs` runs `web-ext lint --output json` and names its known
false positives one by one, matched by code, file and message, with the
reason. Everything else still fails: another warning, the same one in
another file or twice, and also a known one that the linter no longer
says, so the entry is removed once the linter is fixed. Turning off
`warningsAsErrors` or the `UNSUPPORTED_API` rule would have hidden real
problems; calling the API through an alias to get past the linter would
have hidden it from AMO's reviewers.

## Recognise it again

A validator that rejects an API the browser's own documentation offers in
that manifest version; a schema with one function name for two manifest
versions.
