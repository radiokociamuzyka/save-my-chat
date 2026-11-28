# Privacy statement

save-my-chat, a Firefox extension of radiokociamuzyka. In effect from 2026-11-28.

## In one sentence

save-my-chat reads the conversation on the page you have open and saves it on your own
machine; it sends nothing anywhere, unless you click to make a chat a GitHub gist.

## What it reads

- The conversation on a page of a chat webapp it has a reader for, when you open its
  toolbar button, save, or gather the chats a page lists.
- Only the pages of the webapps it reads, each named in the Readers tab: Google Search's
  AI Mode and GitHub Copilot from the start; ChatGPT, Claude, Gemini, DeepSeek, Grok and
  Grok on X only once you allow each one there. On x.com, only Grok's pages.

## What it keeps, and where

Everything stays in Firefox on your machine:

- **the files you save**, Markdown or JSON, written through Firefox's downloads to your
  disk;
- **the library**: a copy of each chat you saved, so you can find and save it again, in
  the extension's storage; the **Files** tab keeps the same chats as files in a git
  repository in the extension's own storage (IndexedDB);
- **its settings**: readers turned off, your selectors, your own readers (prototypes).

You can remove a chat from the library (**Forget**); removing the extension removes all of
it.

## What it sends

**Nothing, by itself.** No telemetry, no analytics, no accounts, no servers of its own; its
readers ship inside it, and it loads no code from anywhere. When it gathers the chats a page
lists, it opens those chats' pages of the same webapp, signed in as you are, as you would.

**The one exception, at your click:** the **gist** button sends one saved chat to GitHub as
a secret gist, with a token you give it, only after you allow access to `api.github.com`.
That transfer is declared in the extension's manifest (`data_collection_permissions`:
website content and personal communications, optional).

## Permissions

| Permission | Why |
| --- | --- |
| access to `www.google.com`, `github.com` | the pages of its first readers |
| access to `chatgpt.com`, `claude.ai`, `gemini.google.com`, `chat.deepseek.com`, `grok.com`, `x.com` (optional) | the pages of those readers, once you allow each |
| `scripting` | to put a reader into such a page |
| `storage` | the library and the settings |
| `downloads` | to write the file you save |
| `menus` | the toolbar button's own menu entry |
| `userScripts` (optional) | your own readers, prototypes |
| access to `api.github.com` (optional) | the gist, at your click |

## For developers

The debug build (`task run`), never what is published, has a Debug tab that connects an
agent of the developer's own to the pages open in that Firefox, through a program on the
same machine; what it reads goes to that agent. The published extension has no such tab.

## Questions, and changes

Ask in the repository's issues: <https://github.com/radiokociamuzyka/save-my-chat/issues>.
A change of this statement is a commit in the repository, its date above changed with it.
