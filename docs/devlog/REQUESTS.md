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

*How:* Settings → Rules → Rulesets → New branch ruleset: name it `master`,
enforcement *Active*, target the default branch, then tick *Require a pull
request before merging* (0 approvals is enough: you merge your own) and
*Require status checks to pass*, adding `verify`. *Block force pushes* and
*Restrict deletions* are on by default; keep them. Under *Bypass list*,
add the app *GitHub Actions* (always allow): when a version was released
already, `release.sh` pushes a hotfix version bump straight onto `master`,
and the ruleset would refuse it. Say "RR1 done", and Cleo checks it
through the API.

## RR2. Prototypes tried in a real Firefox

*Why:* phase 3's prototypes run through Firefox's `userScripts` API,
which no test here has: jsdom stood in for it, and MDN does not say
everything (whether a user script's message carries its tab). The last
step of phase 3 waits for this check.

*How:* in the first release of 0.3.x (its pull request says so), open the
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

Report what you saw, the report pasted, and anything the web console
(F12) said on the chat's page.

---
