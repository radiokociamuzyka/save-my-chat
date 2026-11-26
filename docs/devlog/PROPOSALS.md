# PROPOSALS: ideas for debate

Ideas anyone may propose, `## PP<n>. <title>`. The owner decides them in
[ORDERS.md](ORDERS.md). Numbers are given once and never reused.

## PP1. Saved chats as a local library, not only loose files

The downloads API can only write files under Downloads. A later phase could
keep an index of saved conversations in `storage.local` (titles, readers,
dates, file names) and show it in the options page: search, re-export as
another format, notice when a conversation saved before has grown. Files stay
the source; the index is only a view of them.

## PP2. More readers after the first two

ChatGPT (`chatgpt.com`), Claude (`claude.ai`), Gemini
(`gemini.google.com`), Microsoft Copilot (`copilot.microsoft.com`),
Perplexity (`www.perplexity.ai`), Mistral Le Chat (`chat.mistral.ai`),
DeepSeek (`chat.deepseek.com`), Hugging Chat. Each one is a file in
`src/readers/` and a line in `src/core/readers.js`; its host goes into
`optional_host_permissions`, asked for when the user turns it on, so the
install prompt stays short.
