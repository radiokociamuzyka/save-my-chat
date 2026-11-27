# BRAINSTORM: open questions

Questions for the owner, `## Q<n>. <title>`, each with a *Lean:* (what the
agent would pick). Answer in [ORDERS.md](ORDERS.md) (or in the chat);
answered questions move word for word into `docs/changelog/phase-<n>.md`
with their **Decision:**.

Q1-Q6 were answered (changelog phase 0), Q7-Q11 (changelog phase 1). Open: Q12-Q14 (phase 4).

## Q12. Vue in the extension's pages: render functions, or a build step

Phase 4 brings Vue and Bulma to the options page and the popup (Q6 left
the build step to this moment). Firefox runs extension pages under a CSP
that forbids `eval`, and Vue's full build compiles templates in the page
with `Function("Vue", code)` (seen in `vue.esm-browser.prod.js` 3.5.46);
the runtime-only build (`vue.runtime.esm-browser.prod.js`) has no such
call, but then templates must come already compiled. Bulma is plain CSS
and needs nothing either way.

- **a) No build step.** `vue.runtime.esm-browser.prod.js` and Bulma's CSS
  gathered unchanged into `src/vendor/` (Q10), components written as
  render functions (`h("button", { onClick }, "Save")`) instead of
  templates. AMO reads the extension as written (VISION 5); the
  components are wordier than templates.
- **b) A build step.** Single-file components (`.vue`) compiled by Vite
  into the extension's pages. Templates read well, but the packed
  extension is no longer its source: every listed version on AMO then
  needs the source uploaded with build instructions, and `web-ext run`
  waits for the build.

*Lean:* a). It keeps the rule the project started with, and the pages
are small (popup, options, the library and the viewer); b) can still
come later without throwing the components away.

## Q13. Astro's place: the project's site, or the extension's pages

Astro makes websites; it does not make an extension's pages (they would
come out as files of a site, with its scripts and paths). The TODO says
"Astro site for previewing the settings page and the manuals".

*Lean:* Astro builds the public site on `github-pages`, replacing
`resources/pages/`: the project page, the extension's popup and options
shown live with Firefox's APIs stubbed (the same Vue components, Q12),
and a viewer of saved chats that works with no extension (a file
dropped onto the page, read in the browser, sent nowhere). The manual
stays on Read the Docs (MkDocs), where it already is.

## Q14. Tests in a real Firefox: Playwright cannot load an extension there

Playwright's docs: "Extensions only work in Chromium when launched with a
persistent context." Puppeteer drives Firefox over WebDriver BiDi and has
`browser.installExtension()`, but its docs show it for Chrome only, and
list the toolbar button's popup (`triggerExtensionAction`) among what
BiDi does not support.

- **a) Selenium with geckodriver**: `installAddon(path, true)` loads a
  temporary add-on, long supported; the extension's pages are opened by
  their `moz-extension://` address, its id fixed by the
  `extensions.webextensions.uuids` preference. The popup is tested as a
  page, not through the toolbar.
- **b) Puppeteer over BiDi**: the same in shape, newer, its Firefox
  extension support undocumented.

*Lean:* a) for the extension in Firefox (the readers against saved
fixtures in real pages, the popup and options as pages, prototypes
through userScripts); Playwright kept for what it does well, the Astro
site (Q13) in Firefox and Chromium.
