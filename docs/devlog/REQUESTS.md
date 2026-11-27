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

---
