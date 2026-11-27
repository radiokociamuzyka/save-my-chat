# The feed refused an edit of its own note

- **Met:** 2026-11-27, `feed.yml` after v0.2.13.
- **Topic:** [flow](../solutions/flow.md)

## What happened

The second run created the new notes, then tried to update the note
"Phase 2 begun", whose body held a count of ticked steps and so changed
with every release. GitHub answered `Resource not accessible by
integration` to the workflow's token, and the run stopped there, with
the release note and two almanac cases still to come.

It came back after v0.3.18, in Q&A: the case
`linter-userscripts-register` got a line in its solution, and the edit
of its answer comment was refused the same way. The first solution had
kept editing for Ideas and Q&A; no edit by the workflow's token had
ever passed.

## Solution

Nothing the feed posted is edited. A note in Announcements is a notice
of its moment, written once, with nothing in it that changes over time.
A discussion that follows a source (Ideas, Q&A) whose source changed gets
one comment saying what it says now; a changed solution is a new answer
comment, marked as the answer, the old one left. Each is found again by
its text, so it is written once. A refusal of one post is reported at
the end instead of stopping the run.

## Recognise it again

`Resource not accessible by integration` on an `update...` mutation
with a workflow's token, while `create...` passes; a feed or changelog
post that is rewritten on every run; a batch job
that dies on its first refusal and leaves the rest undone.
