# Privacy

save-my-chat reads the page you have open and writes a file on your
machine. That is all it does.

- **No network requests of its own.** It sends nothing anywhere: no
  telemetry, no accounts, no servers. Its manifest declares no data
  collected; the one exception is below, and only on your click.
- **No remote code.** Every reader ships inside the extension.
- **What it reads:** the conversation on a supported page, only when you
  open the popup or save.
- **What it writes:** the file you ask for, through Firefox's downloads,
  and in Firefox's storage for the extension: its settings (readers turned
  off, your selectors, your prototypes) and the **library**, a copy of
  each chat you saved, so you can find and save it again. The library is
  listed in the options, where **Forget** removes a chat; removing the
  extension removes it all. The **Files** tab keeps the same chats as
  files in a git repository in the extension's own storage (IndexedDB),
  so each copy you saved stays in its history.
- **The report** under *What the reader saw* holds selectors and counts,
  never the text of a conversation, and goes to the clipboard only when
  you click **Copy report**.

## Permissions

| Permission | Why |
| --- | --- |
| access to `www.google.com` and `github.com` | the pages its readers read |
| `scripting` | to put a reader into such a page |
| `storage` | its settings, your prototypes, the library |
| `downloads` | to write the file you save |
| `menus` | the toolbar button's own menu entry, **Library and settings** |
| `userScripts` (optional, asked only when you allow it) | your own readers, [prototypes](prototypes.md) |
| access to `api.github.com` (optional, asked on your first gist) | to make a gist, below |

## A chat as a gist: the one thing it sends

In the viewer, **Share as a secret gist** sends the chat you are reading
to GitHub, as a secret gist of your own account: its Markdown and JSON
files. Only when you click **Make a secret gist**, with a token of yours
(the `gist` scope) that you gave it, kept in the extension's storage and
sent to GitHub alone. On the first click Firefox asks you to allow
`api.github.com` and the data it gets, which the manifest declares as
optional: the website's content and your messages in it. A secret gist is
not listed anywhere, but anyone with its link can read it; delete it on
GitHub to take it back. **Forget the token** removes the token.
