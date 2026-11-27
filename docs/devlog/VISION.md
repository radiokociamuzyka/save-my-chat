# VISION

## Why it exists

Conversations with AI chat webapps hold real work: answers, code, reasoning
that took time to reach. They live inside each service, in its own layout,
behind its own account, and can vanish with a redesign, a cleared history or
a closed account. save-my-chat takes a conversation out of the page the user
has open and keeps it on the user's own disk, in one format that reads the
same whichever service it came from.

## Principles

1. **The user's machine only.** The extension reads the open page and writes
   a file. No server, no account, no telemetry, nothing sent anywhere.
2. **One reader per webapp, small and replaceable.** Webapps change their
   markup often. A reader is one short file the user can read, copy and fix
   without waiting for a release.
3. **Defaults and prototypes.** The extension ships tested default readers.
   The user can copy any of them into a prototype of their own, change it,
   and run it instead, or write a reader for a webapp the extension does not
   know yet.
4. **One unified format.** Markdown for people, JSON for tools, both carrying
   the same conversation: source, title, time, and turns with their roles.
5. **Plain code AMO can read.** No bundler, no remote code, no `eval`; user
   prototypes run through Firefox's own `userScripts` API.

## The idea of each phase

- **Phase 0, the skeleton.** BOS anatomy, devlog, the reader contract, the
  unified format with Markdown and JSON, two draft readers, checks; then
  the full set of branches and husky hooks automating the standard flow.
- **Phase 1, the first readers for real.** Turndown converts messages, as
  in Sett's proof of work; selectors are sets of candidates, because a
  webapp's generated class names change with each of its builds; Sett's
  snippets kept in `src/readers/drafted-snippets/` and fitted into readers.
- **Phase 2, GitHub integration.** The devlog shown on GitHub: every `Q<n>`
  and `PP<n>` an issue, milestones and phases from the roadmap, a project
  board; discussions for announcements and for almanac Q&A about known
  cases and solutions; workflows for the standard flow.
- **Phase 3, prototypes.** The options page copies a default reader into an
  editor; the user's prototype is stored locally and run through the
  `userScripts` API instead of the default it came from.
- **Phase 4, the frontend.** Astro, Vue and Bulma for the settings page,
  the manuals, and a viewer of saved conversations; Playwright tests in a
  real Firefox. A build step comes with it, if needed (Q6). The saved
  chats become a library (PP1): an index of what was saved, and an
  explorer of the stored files on ZenFS with git in it (isomorphic-git,
  Q8), and a button making a chat a gist (Octokit, Q9).
- **Phase 5, more webapps.** New default readers (PP2), each with a fixture,
  declared first in `resources/data/chats.yaml` with their domains and
  conversation addresses (Q10).
- **Phase 6, release.** Icons, store listing, privacy statement; listed on
  AMO, the first signing with it (until then a temporary add-on).
