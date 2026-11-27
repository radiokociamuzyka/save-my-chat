# Privacy

save-my-chat reads the page you have open and writes a file on your
machine. That is all it does.

- **No network requests of its own.** It sends nothing anywhere: no
  telemetry, no accounts, no servers. Its manifest declares
  `data_collection_permissions: none`.
- **No remote code.** Every reader ships inside the extension.
- **What it reads:** the conversation on a supported page, only when you
  open the popup or save.
- **What it writes:** the file you ask for, through Firefox's downloads,
  and in Firefox's storage for the extension: its settings (readers turned
  off, your selectors, your prototypes) and the **library**, a copy of
  each chat you saved, so you can find and save it again. The library is
  listed in the options, where **Forget** removes a chat; removing the
  extension removes it all.
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

A planned button will make a saved chat a GitHub gist; it will act only
when you click it, with your own token, and ask for that permission then.
