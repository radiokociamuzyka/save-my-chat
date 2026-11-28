# task run's profile did not exist for a snap's Firefox

- **Met:** 2026-11-28, phase 5, RR9: Sett's first `task run` of the debug build.
- **Topic:** [testing](../solutions/testing.md)

## What happened

With Firefox closed, `task run` opened a Firefox dialog saying its
profile did not exist. Firefox on Ubuntu is a snap, and a snap has a
`/tmp` of its own; `web-ext run` makes a temporary profile in the
system's `/tmp`, which the snap's Firefox cannot see.

The tests in a real Firefox had met the same `/tmp` already
([webdriver-moz-extension](webdriver-moz-extension.md)), and were fixed
there; `task run` was not looked at again, because Cleo never ran it.

## What to do

- Firefox runs on a profile in the project, `dist/firefox-profile/`
  (`--firefox-profile`, `--profile-create-if-missing`,
  `--keep-profile-changes`): a snap sees it, and it keeps the webapps'
  logins between runs, which the debug gate needs.
- A lesson met by one way of starting Firefox is checked against every
  other way the project starts it (tests, `task run`, the release).
