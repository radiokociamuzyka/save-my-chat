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

## RR4. The library tried in Firefox

*Why:* the library (PP1) keeps a copy of each saved chat in Firefox's
storage and shows it in the popup and the options; tested with storage
stubbed only. Its form waits for Q12, but what it keeps and says can be
checked now.

*How:* on the release of this pull request:
1. Save a Copilot or AI Mode chat. In the options, **Library**: is it
   there, with its title, messages and date?
2. Ask one more question in that chat, open the popup: does it say
   "Saved on … with N messages: 2 new since."? Save again: is it still one
   entry, "(2 times)"?
3. In the library, **Markdown** and **JSON**: do the files land in your
   downloads? Search a word from the chat: is it found?
4. **Forget** it: is it gone, and does the popup no longer say "Saved on"?

Report what you saw.

---
