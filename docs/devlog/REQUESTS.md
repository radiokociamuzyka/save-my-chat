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

## RR8. The second try: gathering in its own window, Claude's rows, what the readers see in front of you

*Why:* RR7 found lists seen and chats not read on Claude, ChatGPT and
Gemini, and AI Mode listing nothing. Gathering now opens its chats in a
window of its own, where the tab is shown (a background tab may never
draw a chat), and scrolls lists and chats until they are whole; Claude
reads your `[data-perf-row]` rows. Whether ChatGPT's and Gemini's
selectors were the trouble too can only be seen on a chat in front of
you.

*How:*
1. With this release, gather a few chats on Claude, ChatGPT or Gemini.
   Does each line end *gathered*? On a list of 40 or more, does the
   popup find them all after its scrolling?
2. On one chat of ChatGPT, Gemini and Claude each, in front of you: open
   the toolbar button. If it sees no messages, **Copy report** under
   *What the reader saw* and paste it here (selectors and counts, no
   text of the chat). For Claude: what value does `data-perf-row` hold
   on your messages and on Claude's (F12, any row)?
3. AI Mode: where are your past AI Mode chats listed, and are they
   links? An item's **Copy → Outer HTML**, text replaced, is enough.
