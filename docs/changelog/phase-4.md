# Phase 4: the frontend

Append-only. The owner's words are kept word for word.

## 2026-11-27, the owner after v0.4.6 (the chat, word for word)

> done. also i uploaded latest version to be verified: https://addons.mozilla.org/pl/firefox/addon/save-my-chat/ - v0.4.6 release awaits for being reviewed now

**Decision:** save-my-chat is on addons.mozilla.org, listed, v0.4.6
waiting for review: earlier than ROADMAP planned (the first listed was to
be 1.0.0 in phase 6), so ROADMAP says so. Two things follow. With Q12's
build step, every version uploaded to AMO needs its source uploaded too,
with how to build it: each release attaches a source archive, and the
README says how to build (RR5 asks Sett to add it at each upload).
`release.sh` signs unlisted when AMO keys are set; a version number
exists once on AMO, in either channel, so that signing stays off while
Sett uploads listed versions by hand.

### Q12 (issue #91, word for word)

> - **option b: we want that `.vue` files and build rouitines with vite**

**Decision:** b). Vue single-file components, built by Vite. The
extension's pages (popup, options) are built into `dist/extension/`
with the rest of `src/` copied as it is; `web-ext` runs and packs that
directory, and `task run` rebuilds on change. The build is not minified,
so what AMO reviewers read stays close to the source. Bulma comes in as
a dependency built into the pages.

### Q13 (issue #92, word for word)

> your `Lean` sounds like proper one, let's do it
>
> for now it will fits enought and if it will be needed in future to make displayer we can delegate that viewing mechanics to obsidian deeplinking url handling

**Decision:** as leaned: Astro builds the public site on `github-pages`
(the project page, the popup and options shown with Firefox's APIs
stubbed, a viewer of saved chats needing no extension); the manual stays
on Read the Docs. A richer viewer later may hand a saved chat to
Obsidian by its `obsidian://` links, noted in VISION.

### Q14 (issue #93, word for word)

> hmmmm...
>
> - **option a** - it sounds solid choice

**Decision:** a). Selenium with geckodriver drives the extension in a
real Firefox (a temporary add-on, its pages by their `moz-extension://`
address); Playwright tests the Astro site.

### RR4 (issue #94, word for word)

> looks like it work
>
> before implementing vue i can see interface as-is. saved conversations are stored well. there is issue with accessing that "preferences" of it. 
>
> add that option to context menu of icon at toolbar of addons.

**Decision:** the library works in Firefox. The options page is hard to
reach (`about:addons`, the extension, Preferences): the toolbar button's
context menu gets "Library and settings", opening it, through the
`menus` API (a permission of its own, no host, nothing sent).

### RR5 (issue #101, word for word)

> okidoki
>
> #### DONE
>
> awaits for approval from mozilla now

**Decision:** v0.4.14 is uploaded to AMO with its source archive and
waits for Mozilla's review; the Vue popup is taken as working in Firefox.

## 2026-11-27, the owner asks for AMO in CI/CD (chat, word for word)

> done. check all around the repo and continue. also can we bring into CI/CD that procedures wit AMO? is there needed some kind of API token or ssh key? we need to automatize processes related with updates delivery in near future

**Decision:** yes. AMO's signing API needs an API key and its secret
(a JWT issuer and secret, made on AMO's "Manage API Keys" page), no SSH
key. After each release, a job of `release.yml` (`scripts/release/amo.sh`)
submits the version to AMO's listed channel: the very zip of the GitHub
release, with its source archive, and the release notes. It does not wait
for Mozilla's review, and while the secrets are unset it does nothing.
The owner's merge of the pull request into `master` is the ask of rule 2
for that upload. Setting the secrets is the owner's move: RR6. Once they
are set, versions are no longer uploaded by hand (AMO takes a version
number only once).

## 2026-11-27, the owner sets the AMO secrets and hands over the merges (chat, word for word)

> i added releasing environment for github actions with 2 secrets variables "AMO_JWT_SECRET" and "AMO_JWT_ISSUER". the `.env` file and example of it also has them in our local repo with github PAT for radiokociamuzyka wide access. if we are ready then let's add automatic publication upload when releasing so our work here will be solved by itself where we can handle things by automations. proceede all that you can without me, including PR creation and merging them into master until phase 4 is done or troubles requires my attention - feel free to work on your own for a while right now, i believe i can leave you making these decisions right now. let me know if you met any problem you want to ask about - i'm here for you Cleo. thanks in advance, good luck and have a fun!

**Decision:** the `amo` job of `release.yml` runs in the `releasing`
environment, whose secrets it reads, and submits each release to AMO's
listed channel (`scripts/release/amo.sh`); `release.sh` no longer signs
unlisted. Versions are not uploaded by hand any more. Until phase 4 is
done, Cleo merges the pull requests into `master` as well, each merge
releasing to GitHub and AMO; trouble goes to Sett. AGENTS rule 2 says so.
`.env.example` names the variables of `.env` (which stays ignored).
