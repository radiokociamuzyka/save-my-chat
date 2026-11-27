# BRAINSTORM: open questions

Questions for the owner, `## Q<n>. <title>`, each with a *Lean:* (what the
agent would pick). Answer in [ORDERS.md](ORDERS.md) (or in the chat);
answered questions move word for word into `docs/changelog/phase-<n>.md`
with their **Decision:**.

Q1-Q6 were answered (changelog phase 0), Q7 (changelog phase 1).

## Q8. BrowserFS, or ZenFS which continues it

PP1's explorer asks for BrowserFS. BrowserFS was archived by its authors;
ZenFS is its continuation, by one of them, with the same idea (Node's `fs`
over IndexedDB and other backends in the browser) and the maintenance
BrowserFS no longer has. isomorphic-git works on either.

*Lean:* ZenFS with its IndexedDB backend, and isomorphic-git, both vendored
unchanged into `src/vendor/` like turndown, and used from the extension's
own pages (the viewer, phase 4) only, never from a web page.

## Q9. A gist sends the conversation to GitHub

Octokit making a gist out of a saved chat sends it to `api.github.com`.
Rule 4 says nothing leaves the machine, and the manifest declares
`data_collection_permissions: none`.

*Lean:* allowed as the user's own act: a button in the viewer, nothing
automatic; the user's own token, kept in `storage.local`; `api.github.com`
an optional host permission asked on the first use; the transfer declared
in `data_collection_permissions.optional`, so AMO and the user see it;
private (secret) gists by default. Rule 4 gets this one exception written
in.

## Q10. How chats.yaml reaches the extension

Firefox runs the extension as written and reads no YAML; rule 6 keeps a
bundler out. Today `src/core/readers.js` is written by hand and a test
holds it to `resources/data/chats.yaml`.

*Lean:* `task chats` (a small node script, `scripts/chats.mjs`) writes
`src/core/readers.js` and the manifest's host permissions from the YAML;
the generated file is committed with a header saying so, so the
extension still runs as written and AMO reads plain code; the test then
checks that the committed file is what the script would write.

## Q11. Jarvis and Joker in AUTHORS, and two repository settings

Jarvis (Copilot) and Joker (Codex) take part in dependabot's updates now
(the prompt, the review guidelines), but rule 1 lets them commit only
once Sett writes them into `.github/AUTHORS`. The workflow `dependabot.yml`
opens a pull request with the workflow's token, which GitHub refuses
until the repository allows it.

*Lean:* Sett adds, in the form of Cleo's line,
`Jarvis "GitHub Copilot (GitHub), coding agent"` and
`Joker "Codex (OpenAI), gpt6.2"`, each with the address its commits carry;
and turns on *Settings → Actions → General → Allow GitHub Actions to create
and approve pull requests*. Auto-merge of dependabot's pull requests into
`dev/dependabot` stays off: Joker's review comes first.
