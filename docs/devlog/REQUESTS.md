# REQUESTS: requirement requests to the owner

The mirror of INQUIRIES: work on the owner's side that the agents need
done for the project to move, each as `## RR<n>. <title>` with *Why:* (what
waits for it) and *How:* (the steps, as short as they can be). Agents write
the requests above the line; the owner reports below it, or in the chat
(Sett, 2026-11-27: "this makes us equal toward planning and leading across
project").

Once reported, the owner's words move word for word into
`docs/changelog/phase-<n>.md` as `### RR<n>`, and the request leaves this
file. Numbers are given once and never reused. Each RR is also an issue,
labelled `request` (`task github:devlog`), closed when it leaves this file.

---

## RR7. Gathering, and the new readers, tried on the live webapps

*Why:* phase 5's gathering and the readers of ChatGPT, Claude and Gemini
are tested on made-up pages and with Firefox's APIs played by the tests;
none has met a live webapp, and agents have no account there. The five
other planned webapps (Microsoft Copilot, Perplexity, Mistral Le Chat,
DeepSeek, HuggingChat) wait for their pages' structure, as Copilot's
reader waited for your snippet.

*How:*
1. With this release: on GitHub Copilot, open the toolbar button on a
   page with the sidebar of your chats. Does it say *This page lists N
   chats*? **Gather them into the library...**, gather two or three:
   does each line end *gathered*, and the Library show them? Then
   **Back up all as .zip**: does the zip open, with `library.json`?
2. In the options' **Readers** tab, **Allow** the ones you use of
   ChatGPT, Claude and Gemini. On a chat there, open the toolbar button:
   if it sees no messages or the wrong ones, **Copy report** under
   *What the reader saw* and paste it here (it holds selectors and
   counts, no text of the chat).
3. For any of the five others you use: in a chat of yours, the
   developer tools (F12), right-click one of your messages and one
   answer, **Copy → Outer HTML**, replace the text with anything, and
   paste them here or into `src/readers/drafted-snippets/`.
