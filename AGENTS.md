# save-my-chat — guide for agents

A Firefox extension that reads a conversation out of a chat webapp (Google
Search AI Mode, GitHub Copilot, and others like them) and saves it on the
local machine in one clear, unified format. Part of the `radiokociamuzyka`
scope (`forge/radiokociamuzyka/save-my-chat`). The workshop-level rules in
`~/__WORKSHOP/AGENTS.md` still apply.

Who you work with and how a session goes is written down in the portfolio
repository: `forge/sarverott/github-repos/Sarverott/AGENTS.md` and its
`docs/agents/`. The owner is **Sett** (Sett Sarverott); Claude Code is called
**Cleo**, Codex **Joker**, GitHub Copilot **Jarvis**.

## Rules

1. **Who may commit.** An agent commits once a confirmed member has written
   it into `.github/AUTHORS`; until then it leaves its edits uncommitted
   and says what it changed and why. Cleo (Claude Code) was confirmed by
   Sett on 2026-11-26 (Q4). A confirmed AI signs every commit with its name
   and lineage, the same as its line in `AUTHORS`:
   `Co-Authored-By: Cleo (Claude Opus 5.5) <noreply@anthropic.com>`.
2. **Where edits go: the BOS craft loop.** `master` (canon) →
   `development` → `revision` → `testing` → `releasing` → `master` through a
   pull request (`.github/bos.json`). Each contributor has its own branch
   made from `development`: `dev/Sarverott`, `dev/Cleo`, `dev/Jarvis`
   (GitHub Copilot), `dev/Joker` (Codex), `dev/dependabot`. Never commit on
   `master`. A finished, checked step of `docs/devlog/TODO.md` is one
   conventional commit (`type(scope): subject`) that ticks its box, with a
   body that says why. A troubled step - something broke, the view changed,
   the idea had to be adjusted - is split into commits of its conclusions,
   with the almanac case and new `Q<n>` in their own commits (Q4). Never
   `--no-verify`. When a batch is done, `dev/<name>` is merged into
   `development` with `--no-ff`; members push `development` and their own
   `dev/<name>`. `master`, tags, releases, AMO uploads and repository
   settings are always asked for first.
   **The owner's edits** found in the working tree go first, as they are,
   one commit per change on `dev/Sarverott`, with a message saying how the
   agent understood them; then that branch is merged into `development`.
3. **Tasks arrive as `// NOTE: ` comments** (in READMEs and Taskfiles too).
   Build what is concrete, keep the NOTE in place, add `ANSWER:` when the
   note asked a question, and report the notes left with the question that
   blocks them.
4. **Nothing leaves the machine.** The extension reads the page the user
   has open and writes files through the downloads API. No telemetry, no
   remote code, no network requests of its own
   (`data_collection_permissions: none`). A change that would send anything
   anywhere is a question for Sett first.
5. **No remote or evaluated code.** AMO rejects it. Default readers ship as
   files of the extension; the user's own prototypes run only through the
   `userScripts` API (an optional permission the user grants), never through
   `eval`, `new Function` or `<script>` injected into the page.
6. **No bundler unless decided.** The extension is plain JavaScript that
   Firefox runs as written, so AMO review needs no source-code submission.
   Adding a build step is a question (see `docs/devlog/BRAINSTORM.md`).

## Questions and plans

`docs/devlog/README.md` says how a batch moves. In short:

| It is | It goes to |
| ----- | ---------- |
| the owner's words | `docs/devlog/INQUIRIES.md` / `ORDERS.md` (or the chat), then `docs/changelog/phase-<n>.md`, word for word |
| a plan | `docs/devlog/VISION.md`, `ROADMAP.md`, `TODO.md` |
| a question for the owner | `docs/devlog/BRAINSTORM.md` as `## Q<n>. <title>` with a *Lean:*; never settled in code before the answer |
| an idea for debate | `docs/devlog/PROPOSALS.md` as `PP<n>` |
| an agent's findings and what was not verified | `docs/.agents/` (`NOTES.md`, `things-to-check.md`); humans read it and do not write there |
| a problem met and solved | `docs/almanac/`: its case in `cataclistics/`, a line in its topic in `solutions/` |
| work for another repository | `~/__WORKSHOP/forge/NOTES-for-repositories.md`, never the other repository itself |

## Layout

```
src/                     the extension itself, loaded by Firefox as written (web-ext sourceDir)
  manifest.json          Manifest V3, gecko id, data_collection_permissions
  core/                  shared by every context, classic scripts on globalThis.SaveMyChat
    kit.js               the unified format, DOM-to-markdown, reader registration
    markdown.js          conversation -> .md file
    readers.js           the list of default readers: id, name, matches, file
  readers/               one default reader per chat webapp, each calls SaveMyChat.reader({...})
    drafted-snippets/    Sett's snippets as written, the sources readers are fitted from; not packaged
  vendor/                third-party libraries copied unchanged from npm (task vendor), for AMO to compare
  background/main.js     event page: registers enabled readers, answers "save" from the popup, downloads
  popup/                 the toolbar button: which reader sees this tab, save as md / json
  options/               readers on/off; later the prototypes editor (userScripts)
tests/                   vitest + jsdom; fixtures/ are saved HTML of real chats, anonymised
docs/devlog/             the BOS devlog: VISION, ROADMAP, TODO, BRAINSTORM, PROPOSALS, ORDERS, INQUIRIES
docs/changelog/          what happened per phase, the owner's words word for word, append-only
docs/guides/             how to write a reader, the unified format
docs/almanac/            what was learnt the hard way: cataclistics/ (a case per page), solutions/ (a topic each)
docs/.agents/            agents' own domain
.github/                 AUTHORS, bos.json, community files, workflows
```

## The reader contract

A reader is one file in `src/readers/<id>.js`, listed in `src/core/readers.js`:

```js
SaveMyChat.reader({
	id: "github-copilot",
	name: "GitHub Copilot",
	service: "github.com/copilot",
	detect: (doc, url) => boolean, // is there a conversation on this page
	read: (doc, url) => ({ title, turns: [{ role, text }] }), // text is markdown
});
```

`SaveMyChat.turn(role, element)` turns an element into a turn with markdown
text; `SaveMyChat.conversation(...)` (called by the kit, not the reader)
stamps the format, source and time. The format is described in
`docs/guides/format.md`; change it only with a version bump there.

## Commands

| Command | What it does |
| --- | --- |
| `task install` | `npm ci` |
| `task run` | Firefox with the extension loaded, reloads on save (`web-ext run`) |
| `task check` | Biome, changes nothing |
| `task format` | Biome with safe fixes |
| `task lint:ext` | `web-ext lint` (AMO's validator) |
| `task test` | vitest |
| `task verify` | check, lint:ext, test — run before a step is reported done |
| `task build` | the `.zip` for AMO into `dist/` |
| `task devlog:scrapnote` | a new scrapnote in `docs/devlog/` |

## Conventions

- Tabs for indentation (Biome), except `package.json`. Double quotes.
- Short file names. Selectors of a webapp stay inside its reader.
- A reader that has not been checked against the live webapp says so at its
  top (`// NOTE: unverified`) and in `docs/.agents/things-to-check.md`.
- Test fixtures are real pages saved and stripped of personal content; never
  commit a conversation that is not meant to be public.
