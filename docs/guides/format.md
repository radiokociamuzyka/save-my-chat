# The unified format: `save-my-chat/0`

Every reader gives the same shape, whatever webapp it reads. The kit
(`src/core/kit.js`, `conversation()`) stamps it; `validate()` checks it
before anything is written.

## JSON

```json
{
	"format": "save-my-chat/0",
	"source": {
		"reader": "github-copilot",
		"service": "github.com/copilot",
		"url": "https://github.com/copilot/c/…"
	},
	"title": "Fix the build",
	"savedAt": "2026-11-26T10:00:00.000Z",
	"turns": [
		{ "role": "user", "text": "Why does it fail?" },
		{ "role": "assistant", "text": "Missing `await`.", "author": "GPT-5" }
	]
}
```

| Field | Meaning |
| --- | --- |
| `format` | the name and major version of this format; a change that breaks readers of the files bumps it |
| `source.reader` | the id of the reader that read it (a default or a prototype) |
| `source.service` | the webapp, as people say it |
| `source.url` | the page it was read from |
| `title` | the conversation's title in the webapp, or its first question |
| `savedAt` | when it was saved, ISO 8601 in UTC |
| `turns[].role` | `user`, `assistant`, `system` or `tool` |
| `turns[].text` | the message as Markdown |
| `turns[].author` | optional: the model or person named by the webapp |
| `turns[].from` | optional: where a turn came from when not from the page itself, e.g. `"address"` for an AI Mode question taken from `q=` |

A reader may add fields to a turn; tools reading the files ignore what they
do not know.

## Markdown

The same conversation as a `.md` file: YAML front matter with the fields
above, the title as `#`, then one `## User` / `## Assistant` section per
turn (`## Assistant (GPT-5)` when the author is known).

Read back (the viewer, `src/viewer/conversation.js`), a section starts at
such a line after a blank line: a message whose own text holds `## User`
after a blank line reads as two. The JSON has no such limit.

Files go to `Downloads/save-my-chat/<reader>/<YYYY-MM-DD>-<title>.<md|json>`.

## A backup: `save-my-chat/library/0`

**Back up all as .zip** (the library) packs every chat saved into
`Downloads/save-my-chat/backup-<YYYY-MM-DD>.zip`:

```
save-my-chat/
  <reader>/<YYYY-MM-DD>-<title>.md     the day it was first saved, as in the Files tab;
  <reader>/<YYYY-MM-DD>-<title>.json   a second chat of one name and day gets -2, -3...
  library.json                         the index
```

`library.json` is `{ "format": "save-my-chat/library/0", "chats": [...] }`,
one entry per chat, oldest first: `key` (its reader and address), `title`,
`reader`, `service`, `url`, `turns` (how many), `firstSavedAt`, `savedAt`,
`saves` (how many times), and `files` (`md`, `json`: its paths under
`save-my-chat/`).
