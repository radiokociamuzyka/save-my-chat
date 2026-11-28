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

## RR10. AMO's listing filled in

*Why:* phase 6's listing is written (`docs/statements/listing.md`) and its images made
(`task media`), but AMO's form is filled in by hand, signed in as the add-on's owner.

*How:*
1. On <https://addons.mozilla.org/developers/addon/save-my-chat/edit>, copy in the summary,
   the description, the categories and tags, and the links of `listing.md`.
2. Privacy policy: the text of `docs/statements/privacy.md` (or its page,
   <https://radiokociamuzyka.github.io/save-my-chat/privacy/>, once released).
3. Images: the icon comes with the next release (the manifest names it); screenshots from
   `dist/shots/` (`task test:firefox`) if you want them.
4. Say here when it is done, or what AMO asked.

