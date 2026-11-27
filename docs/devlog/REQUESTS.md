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

## RR5. The next AMO upload with its source; the Vue popup tried

*Why:* from this release on, the popup is built by Vite (Q12), so AMO
asks every new version for its source code. v0.4.6, already waiting, was
plain and needs none. And the popup is rebuilt in Vue and Bulma: tested
mounted in jsdom and seen in Chromium with Firefox's APIs stubbed, never
in Firefox.

*How:*
1. In Firefox, with this release: open the popup on a Copilot or AI Mode
   chat. Does it look right (light and dark), name the reader, save both
   formats, show "What the reader saw" and copy it? Right-click the
   toolbar button: does **Library and settings** open the options?
2. When you upload this version to AMO: to "Do you need to submit source
   code?" answer **Yes**, and upload `save-my-chat-<version>-source.zip`
   from the release's assets; in the notes to the reviewer you can point
   to the README's "Building from source". (If AMO later signs the listed
   versions through its API, `release.sh` could do this by itself: say
   so, and Cleo asks how in a Q.)

Report what you saw, and whether AMO took the source.

---
