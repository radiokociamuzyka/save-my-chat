# Save a conversation

1. Open a conversation in a supported webapp.
2. Click the save-my-chat button in the toolbar. The popup names the
   reader that sees the page and how many messages it sees, for example
   *Reader: GitHub Copilot - sees 4 user, 4 assistant*.
3. Choose **Save as Markdown** or **Save as JSON**.

The file is written into your downloads folder:

```
save-my-chat/<reader>/<YYYY-MM-DD>-<title>.md
```

for example `save-my-chat/github-copilot/2026-11-27-fix-the-build.md`.

## The formats

**Markdown** is for reading: front matter (source, address, time saved)
and the conversation as sections, `## User` and `## Assistant`, with code
blocks, tables and links kept.

**JSON** is for tools: the same conversation as data, in the unified
format `save-my-chat/0`, described in [the unified format](../guides/format.md).

Both hold the same messages; one service's chat reads like another's.

## Warnings

After saving, and already in the popup, save-my-chat warns when the
conversation does not look whole: more answers than questions, a chat
that starts with an answer or ends with a question, two messages of one
role in a row. The file is saved anyway; see
[when a reader misses something](troubleshooting.md).

## Readers on and off

The extension's options (right-click the toolbar button → **Library and
settings**, or **about:addons** → save-my-chat → *Preferences*) list every reader with the addresses it works on. Turn off the ones you do
not want injected into those pages.

## The library

Every chat you save is also kept in the extension's library: open the
extension's options, **Library**. There you can search titles and
messages, save a chat again as Markdown or JSON (the copy from when you
last saved it), or **Forget** it.

When you open the popup on a chat you saved before, it says when, and how
many messages it gained since, so you know when to save it again.
