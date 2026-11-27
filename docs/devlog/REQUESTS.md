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

## RR1. The checks required before a merge into `master`

*Why:* the last item of phase 2. Today a pull request into `master` can be
merged while its checks still run or fail; a red release would be tagged
and published by `release.yml`.

*How:* your ruleset `master` is made (Settings → Rules → Rulesets), with
*Require a pull request before merging* and *Require status checks to
pass* (`verify`); it waits disabled. No bypass is needed any more: the
release no longer pushes onto `master` (Sett, issue #79, there was no
"GitHub Actions" to add). Leave the bypass list empty, set *Enforcement
status* to **Active** and save. Say "RR1 done", and Cleo checks it through
the API. Turning it on before this release is merged is safe too: the
old hotfix path runs only for a version released already, and this one
is new.

## RR2. Prototypes tried in a real Firefox

*Why:* phase 3's prototypes run through Firefox's `userScripts` API,
which no test here has: jsdom stood in for it, and MDN does not say
everything (whether a user script's message carries its tab). The last
step of phase 3 waits for this check.

*How:* v0.3.11 refused to save any prototype, unchanged ones too (Sett,
issue #80): fixed. In the next release (its pull request says so), open the
extension's options, **Prototypes**:
1. **Allow user scripts**: did Firefox ask, and did the button go away?
2. **Make a prototype of GitHub Copilot**, then in its code find
   `return { title: title === "Copilot" ? "" : title, turns };` and change
   it to `return { title: "proto: " + title, turns };`. **Save**.
3. Reload a Copilot chat and open the popup: does it say
   **(your prototype)**? Save it as Markdown: does the title start with
   `proto: `? Copy the report as before.
4. Turn the prototype off, reload, save again: is the title back to
   normal, and the popup without "(your prototype)"?

Report what you saw, the report pasted, and what the chat page's web
console (F12, the page's own, not the add-on's) said: a prototype now
writes `save-my-chat: prototype loaded, reader github-copilot` there when
it starts.

---
