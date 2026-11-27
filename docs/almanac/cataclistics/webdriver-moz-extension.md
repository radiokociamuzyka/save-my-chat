# WebDriver may not open the extension's own pages

- **Met:** 2026-11-27, phase 4, the first tests in a real Firefox (Q14).
- **Topic:** [testing](../solutions/testing.md)

## What happened

The Selenium tests load `dist/extension/` as a temporary add-on, fix its
internal address with the preference `extensions.webextensions.uuids`, and
open `moz-extension://<uuid>/options/options.html`. Every `driver.get()` of
such an address failed: `UnsupportedOperationError: Navigation to
"moz-extension://…" is not allowed in this context`. Firefox keeps
WebDriver's navigation to web content; an extension's page is not that.
Asking Firefox for the chrome context then failed too: `Argument
--remote-allow-system-access can't be set via capabilities`.

Two more things a Firefox of a snap (Ubuntu) adds: geckodriver refuses its
wrapper `/usr/bin/firefox` ("binary is not a Firefox executable"), and the
browser does not see the system's `/tmp`, so a file to upload must lie
somewhere it can read.

## Solution

geckodriver itself is started with `--allow-system-access`
(`ServiceBuilder().addArguments(...)`, not the browser's capabilities).
The session switches to the chrome context, where Firefox's own window
opens the page with `openTrustedLinkIn(url, "current")`, and back to the
content context to drive it (`tests/firefox/firefox.js`, `open()`). The
binary of a snap is `/snap/firefox/current/usr/lib/firefox/firefox`, found
when it exists; files for the tests go into `dist/`.

## Recognise it again

A WebDriver test that can reach `about:` or `moz-extension:` pages only by
clicking through the browser's own UI; "not allowed in this context".
